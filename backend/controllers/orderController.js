const crypto = require('crypto');
const prisma = require('../config/db');
const { sendOrderDispatchedEmail, sendDeliveryConfirmationEmail, sendOrderCancellationEmail } = require('../utils/mailer');

const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY;
const PAYU_MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT;
const PAYU_SANDBOX = process.env.PAYU_SANDBOX === 'true';

// ─── Helper: restore stock for order line items ─────────────
async function restoreStock(tx, orderLineItems) {
  for (const item of orderLineItems) {
    await tx.variant.update({
      where: { id: item.variantId },
      data: { stockQuantity: { increment: item.quantity } },
    });
  }
}

// ─── Helper: process PayU refund ────────────────────────────
async function processRefund(paymentId, amountInRupees, txnId) {
  if (!paymentId) return null;

  try {
    const key = PAYU_MERCHANT_KEY;
    const salt = PAYU_MERCHANT_SALT;
    const command = 'cancel_refund_transaction';
    const var1 = paymentId;
    const var2 = txnId; // unique request token
    const var3 = Number(amountInRupees).toFixed(2); // amount in rupees
    
    // Hash sequence: key|command|var1|salt
    const hashString = `${key}|${command}|${var1}|${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    const params = new URLSearchParams();
    params.append('key', key);
    params.append('command', command);
    params.append('var1', var1);
    params.append('var2', var2);
    params.append('var3', var3);
    params.append('hash', hash);

    const endpoint = 'https://info.payu.in/merchant/postservice.php?form=2';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`PayU postservice API responded with status ${response.status}`);
    }

    const data = await response.json();
    console.log('PayU Refund Response:', data);

    if (data && data.status === 1) {
      return data.request_id || `ref_${crypto.randomBytes(8).toString('hex')}`;
    } else {
      console.error('PayU Refund request failed:', data ? data.msg : 'Unknown error');
      return null;
    }
  } catch (err) {
    console.error('PayU Refund failed:', err.message || err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
//  CUSTOMER ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * Get logged-in user's orders (excludes PENDING)
 * GET /api/orders/my-orders?page=&limit=
 */
exports.getMyOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const where = {
      userId: req.user.id,
      paymentId: { not: null },
    };

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { orderLineItems: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      data: orders,
    });
  } catch (error) {
    console.error('Fetch user orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch your orders.' });
  }
};

/**
 * Get single order by ID (customer – ownership check)
 * GET /api/orders/my-orders/:id
 */
exports.getMyOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderLineItems: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Fetch order by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order details.' });
  }
};

/**
 * Cancel a PAID order (customer – ownership check)
 * POST /api/orders/my-orders/:id/cancel
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderLineItems: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (order.status !== 'PAID' && order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only paid/confirmed orders that have not been dispatched can be self-cancelled.',
      });
    }

    // Transaction: restore stock + update order status
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Restore stock for each line item
      await restoreStock(tx, order.orderLineItems);

      // Default to CANCELLED
      let newStatus = 'CANCELLED';
      let refundId = null;

      // Attempt PayU refund if paymentId exists and is not COD (only if it was PAID)
      if (order.status === 'PAID' && order.paymentId && !order.paymentId.startsWith('cod')) {
        refundId = await processRefund(order.paymentId, order.totalAmount, order.payuTxnId);
        if (refundId) {
          newStatus = 'REFUNDED';
        }
      }

      return tx.order.update({
        where: { id },
        data: {
          status: newStatus,
          cancelledAt: new Date(),
          refundId,
        },
        include: { orderLineItems: true },
      });
    });

    // Send cancellation email asynchronously (only for PAID orders)
    if (order.status === 'PAID' && typeof sendOrderCancellationEmail === 'function') {
      sendOrderCancellationEmail(updatedOrder).catch((err) =>
        console.error('Cancellation email error:', err)
      );
    }

    res.status(200).json({
      success: true,
      message: updatedOrder.status === 'REFUNDED'
        ? 'Order cancelled and refund initiated.'
        : 'Order cancelled successfully.',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order.' });
  }
};

// ═══════════════════════════════════════════════════════════════
//  ADMIN – ORDER MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * List all orders (Admin)
 * GET /api/admin/orders?page=&limit=&status=&search=
 */
exports.getAdminOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const where = {
      paymentId: { not: null },
    };

    if (status) {
      if (status === 'PAID') {
        where.OR = [
          { status: 'PAID' },
          { status: 'DELIVERED' },
          {
            status: 'DISPATCHED',
            NOT: { paymentId: { startsWith: 'cod' } }
          }
        ];
      } else {
        where.status = status;
      }
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { email: true } },
          _count: { select: { orderLineItems: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      data: orders,
    });
  } catch (error) {
    console.error('Admin fetch orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
};

/**
 * Get full order detail by ID (Admin)
 * GET /api/admin/orders/:id
 */
exports.getAdminOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, phone: true } },
        orderLineItems: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Admin fetch order by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order details.' });
  }
};

/**
 * Dispatch a PAID order (Admin)
 * PUT /api/admin/orders/:id/dispatch
 */
exports.dispatchOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, trackingCarrier } = req.body;

    if (!trackingNumber) {
      return res.status(400).json({ success: false, message: 'Tracking number is required.' });
    }

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const isEligible = order.status === 'PAID' || (order.status === 'PENDING' && order.paymentId && order.paymentId.startsWith('cod'));
    if (!isEligible) {
      return res.status(400).json({
        success: false,
        message: `Only paid or confirmed COD orders can be dispatched. Current status is ${order.status}.`,
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'DISPATCHED',
        trackingNumber,
        ...(trackingCarrier && { trackingCarrier }),
      },
      include: { orderLineItems: true },
    });

    // Send dispatch email asynchronously
    if (typeof sendOrderDispatchedEmail === 'function') {
      sendOrderDispatchedEmail(updatedOrder, trackingNumber).catch((err) =>
        console.error('Dispatch email notification error:', err)
      );
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated to Dispatched and email notification triggered.',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Dispatch order error:', error);
    res.status(500).json({ success: false, message: 'Failed to dispatch order.' });
  }
};

/**
 * Mark a DISPATCHED order as DELIVERED (Admin)
 * PUT /api/admin/orders/:id/deliver
 */
exports.deliverOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.status !== 'DISPATCHED') {
      return res.status(400).json({
        success: false,
        message: `Only dispatched orders can be marked as delivered. Current status is ${order.status}.`,
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'DELIVERED' },
    });

    // Send delivery confirmation email asynchronously
    if (typeof sendDeliveryConfirmationEmail === 'function') {
      sendDeliveryConfirmationEmail(updatedOrder).catch((err) =>
        console.error('Delivery email notification error:', err)
      );
    }

    res.status(200).json({
      success: true,
      message: 'Order marked as Delivered.',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Deliver order error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
};

/**
 * Admin cancel order (PAID or DISPATCHED). Restores stock + refund.
 * PUT /api/admin/orders/:id/cancel
 */
exports.adminCancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderLineItems: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const isEligible = ['PAID', 'DISPATCHED', 'DELIVERED'].includes(order.status) || (order.status === 'PENDING' && order.paymentId && order.paymentId.startsWith('cod'));
    if (!isEligible) {
      return res.status(400).json({
        success: false,
        message: `Only paid, dispatched, delivered, or confirmed COD orders can be cancelled. Current status is ${order.status}.`,
      });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Restore stock
      await restoreStock(tx, order.orderLineItems);

      let newStatus = 'CANCELLED';
      let refundId = null;

      // Attempt PayU refund
      if (order.paymentId && !order.paymentId.startsWith('cod')) {
        refundId = await processRefund(order.paymentId, order.totalAmount, order.payuTxnId);
        if (refundId) {
          newStatus = 'REFUNDED';
        }
      }

      return tx.order.update({
        where: { id },
        data: {
          status: newStatus,
          cancelledAt: new Date(),
          refundId,
        },
        include: { orderLineItems: true },
      });
    });

    // Send cancellation email asynchronously
    if (typeof sendOrderCancellationEmail === 'function') {
      sendOrderCancellationEmail(updatedOrder).catch((err) =>
        console.error('Admin cancellation email error:', err)
      );
    }

    res.status(200).json({
      success: true,
      message: updatedOrder.status === 'REFUNDED'
        ? 'Order cancelled and refund initiated.'
        : 'Order cancelled successfully.',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Admin cancel order error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order.' });
  }
};

// ═══════════════════════════════════════════════════════════════
//  ADMIN – DASHBOARD METRICS
// ═══════════════════════════════════════════════════════════════

/**
 * Enhanced dashboard metrics
 * GET /api/admin/metrics
 */
exports.getDashboardMetrics = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const salesFilter = {
      OR: [
        { status: 'PAID' },
        { status: 'DELIVERED' },
        {
          status: 'DISPATCHED',
          NOT: { paymentId: { startsWith: 'cod' } }
        }
      ]
    };

    // Run all queries in parallel
    const [
      revenueAgg,
      totalOrders,
      activeCustomers,
      productCount,
      todayRevenueAgg,
      todayOrders,
      ordersByStatusRaw,
      lowStockVariants,
      recentOrders,
      topProductsRaw,
      monthlySalesRaw,
    ] = await Promise.all([
      // 1. Total revenue
      prisma.order.aggregate({
        where: salesFilter,
        _sum: { totalAmount: true },
      }),

      // 2. Total orders
      prisma.order.count({
        where: salesFilter,
      }),

      // 3. Active customers
      prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),

      // 4. Product count
      prisma.product.count(),

      // 5. Today's revenue
      prisma.order.aggregate({
        where: {
          ...salesFilter,
          createdAt: { gte: todayStart },
        },
        _sum: { totalAmount: true },
      }),

      // 6. Today's orders
      prisma.order.count({
        where: {
          ...salesFilter,
          createdAt: { gte: todayStart },
        },
      }),

      // 7. Orders grouped by status (excluding abandoned/failed checkouts)
      prisma.order.groupBy({
        where: {
          paymentId: { not: null },
        },
        by: ['status'],
        _count: { _all: true },
      }),

      // 8. Low stock variants (stockQuantity <= 5)
      prisma.variant.findMany({
        where: { stockQuantity: { lte: 5 } },
        include: { product: { select: { name: true } } },
        orderBy: { stockQuantity: 'asc' },
      }),

      // 9. Recent orders (last 10, excluding abandoned/failed checkouts)
      prisma.order.findMany({
        where: {
          paymentId: { not: null },
        },
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // 10. Top 5 most ordered products by quantity
      prisma.orderLineItem.groupBy({
        by: ['productName'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),

      // 11. Last 6 months monthly sales
      prisma.order.findMany({
        where: {
          ...salesFilter,
          createdAt: { gte: sixMonthsAgo },
        },
        select: {
          totalAmount: true,
          createdAt: true,
        },
      }),
    ]);

    // Transform ordersByStatus into a clean object
    const ordersByStatus = {};
    for (const row of ordersByStatusRaw) {
      ordersByStatus[row.status] = row._count._all;
    }

    // Calculate 6 months sales trend
    const salesTrend = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('en-US', { month: 'short' });
      salesTrend[monthName] = 0;
    }

    for (const order of monthlySalesRaw) {
      const monthName = new Date(order.createdAt).toLocaleString('en-US', { month: 'short' });
      if (salesTrend[monthName] !== undefined) {
        salesTrend[monthName] += order.totalAmount;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: revenueAgg._sum.totalAmount || 0,
        totalOrders,
        activeCustomers,
        productCount,
        todayRevenue: todayRevenueAgg._sum.totalAmount || 0,
        todayOrders,
        ordersByStatus,
        lowStockVariants,
        recentOrders,
        salesTrend,
        topProducts: topProductsRaw.map((p) => ({
          productName: p.productName,
          totalQuantity: p._sum.quantity,
        })),
      },
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ success: false, message: 'Failed to compile dashboard metrics.' });
  }
};

// ═══════════════════════════════════════════════════════════════
//  ADMIN – CUSTOMER MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * List all customers with order count and total spend (Admin)
 * GET /api/admin/customers?page=&limit=&search=
 */
exports.getCustomers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const { search } = req.query;

    const where = { role: 'CUSTOMER' };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          _count: { select: { orders: true } },
          orders: {
            where: { status: { in: ['PAID', 'DISPATCHED', 'DELIVERED'] } },
            select: { totalAmount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate total spend per customer
    const data = customers.map((c) => {
      const totalSpend = c.orders.reduce((sum, o) => sum + o.totalAmount, 0);
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        isActive: c.isActive,
        createdAt: c.createdAt,
        orderCount: c._count.orders,
        totalSpend,
      };
    });

    res.status(200).json({
      success: true,
      count: data.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      data,
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customers.' });
  }
};

/**
 * Get single customer with their orders (Admin)
 * GET /api/admin/customers/:id
 */
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        orders: {
          where: { status: { not: 'PENDING' } },
          include: { orderLineItems: true },
          orderBy: { createdAt: 'desc' },
        },
        addresses: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error('Get customer by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customer details.' });
  }
};

/**
 * Update delivery address of an order
 * PUT /api/admin/orders/:id/address
 */
exports.updateOrderAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, street, city, state, postalCode } = req.body;

    if (!name || !email || !phone || !street || !city || !state || !postalCode) {
      return res.status(400).json({ success: false, message: 'All address fields are required.' });
    }

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.status !== 'PAID' && order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot update address for order with status: ${order.status}.`,
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        shippingAddress: {
          name,
          email,
          phone,
          street,
          city,
          state,
          postalCode,
        },
      },
      include: { orderLineItems: true },
    });

    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('Update order address error:', error);
    res.status(500).json({ success: false, message: 'Failed to update delivery address.' });
  }
};
