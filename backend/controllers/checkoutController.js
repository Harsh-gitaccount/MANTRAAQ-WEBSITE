const crypto = require('crypto');
const { validationResult } = require('express-validator');
const prisma = require('../config/db');
const { sendOrderConfirmationEmail } = require('../utils/mailer');

// ─── PayU configuration ──────────────────────────────────────────────────────
const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY;
const PAYU_MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT;
const PAYU_SANDBOX = process.env.PAYU_SANDBOX === 'true';

if (!PAYU_MERCHANT_KEY || PAYU_MERCHANT_KEY === 'YOUR_LIVE_MERCHANT_KEY') {
  console.error('⛔ FATAL: PAYU_MERCHANT_KEY is not set in .env — online payments will fail.');
}
if (!PAYU_MERCHANT_SALT || PAYU_MERCHANT_SALT === 'YOUR_LIVE_MERCHANT_SALT_V1') {
  console.error('⛔ FATAL: PAYU_MERCHANT_SALT is not set in .env — online payments will fail.');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Validate a coupon record against the given order amount.
 * Returns { valid, reason?, coupon?, discountAmount? }
 */
function applyCoupon(coupon, orderAmount) {
  if (!coupon) {
    return { valid: false, reason: 'Coupon not found.' };
  }
  if (!coupon.isActive) {
    return { valid: false, reason: 'Coupon is no longer active.' };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, reason: 'Coupon has expired.' };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, reason: 'Coupon usage limit has been reached.' };
  }
  if (coupon.minOrderAmount !== null && orderAmount < coupon.minOrderAmount) {
    return {
      valid: false,
      reason: `Minimum order amount of ₹${coupon.minOrderAmount} is required for this coupon.`,
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discountAmount = (coupon.discountValue / 100) * orderAmount;
    // Cap percentage discount at the order amount (cannot go negative)
    discountAmount = Math.min(discountAmount, orderAmount);
  } else {
    // FIXED
    discountAmount = Math.min(coupon.discountValue, orderAmount);
  }

  // Round to 2 decimal places
  discountAmount = Math.round(discountAmount * 100) / 100;

  return { valid: true, coupon, discountAmount };
}

// ─── createPaymentOrder ──────────────────────────────────────────────────────

/**
 * Initiate checkout: validate stock with row-level locking, reserve stock
 * immediately, apply optional coupon, create PayU order details.
 *
 * POST /api/checkout/create-payment-order
 */
exports.createPaymentOrder = async (req, res) => {
  try {
    // Express-validator check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { items, shippingAddress, couponCode, paymentMethod = 'ONLINE' } = req.body;

    // Authentication is REQUIRED for checkout
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to place an order.',
      });
    }
    const userId = req.user.id;

    // Transactional stock reservation with row-level locks
    const txResult = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const verifiedItems = [];

      for (const item of items) {
        // Row-level lock: SELECT … FOR UPDATE
        const rows = await tx.$queryRaw`
          SELECT * FROM "Variant" WHERE id = ${item.variantId} FOR UPDATE
        `;

        const variant = rows[0];
        if (!variant) {
          throw new Error(`Variant ${item.variantId} not found.`);
        }

        // Fetch product name
        const product = await tx.product.findUnique({
          where: { id: variant.productId },
        });

        if (!product) {
          throw new Error(`Product for variant ${item.variantId} not found.`);
        }

        if (!product.isActive) {
          throw new Error(`Product "${product.name}" is currently unavailable/hidden and cannot be purchased.`);
        }

        if (variant.stockQuantity < item.quantity) {
          throw new Error(
            `Out of stock: Only ${variant.stockQuantity} remaining for ${product.name} (${variant.title}).`,
          );
        }

        totalAmount += variant.price * item.quantity;
        verifiedItems.push({
          variantId: variant.id,
          title: variant.title,
          productName: product.name,
          price: variant.price,
          quantity: item.quantity,
        });

        // IMMEDIATELY reserve stock by decrementing
        await tx.variant.update({
          where: { id: variant.id },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      // ── Coupon validation (inside transaction) ──
      let couponCode_ = null;
      let discountAmount = 0;

      if (couponCode) {
        let coupon = await tx.coupon.findFirst({
          where: { code: { equals: couponCode, mode: 'insensitive' } },
        });

        // Fallback mock for WELCOME75 coupon
        if (couponCode.toUpperCase() === 'WELCOME75' && !coupon) {
          coupon = {
            code: 'WELCOME75',
            discountType: 'FIXED',
            discountValue: 75,
            minOrderAmount: 599,
            isActive: true,
            expiresAt: null,
            maxUses: null,
            usedCount: 0
          };
        }

        if (couponCode.toUpperCase() === 'WELCOME75') {
          // Check if there are any existing paid/completed orders in DB for this customer
          const existingOrder = await tx.order.findFirst({
            where: {
              AND: [
                {
                  OR: [
                    userId ? { userId } : null,
                    {
                      shippingAddress: {
                        path: ['email'],
                        equals: shippingAddress.email
                      }
                    },
                    {
                      shippingAddress: {
                        path: ['phone'],
                        equals: shippingAddress.phone
                      }
                    }
                  ].filter(Boolean),
                },
                {
                  OR: [
                    { status: { in: ['PAID', 'DISPATCHED', 'DELIVERED'] } },
                    { status: 'PENDING', paymentId: { startsWith: 'cod' } }
                  ]
                }
              ]
            }
          });
          if (existingOrder) {
            throw new Error('Coupon WELCOME75 is only valid for first-time customers.');
          }
        }

        const result = applyCoupon(coupon, totalAmount);
        if (!result.valid) {
          throw new Error(result.reason);
        }
        couponCode_ = coupon.code; // normalized (DB casing)
        discountAmount = result.discountAmount;
      }

      // Calculate Shipping Charge & COD Fee
      const shippingCharge = totalAmount < 499 ? 49 : 0;
      const codFee = (paymentMethod === 'COD' && totalAmount < 299) ? 40 : 0;
      const finalAmount = Math.max(0, totalAmount - discountAmount + shippingCharge + codFee);

      // Embed additional pricing metadata inside shippingAddress JSON
      const enrichedShippingAddress = {
        ...shippingAddress,
        paymentMethod,
        shippingCharge,
        codFee,
        subtotal: totalAmount,
        finalAmount,
      };

      // Generate a unique PayU TxnId
      const payuTxnId = paymentMethod === 'COD'
        ? `cod_${crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex')}`
        : `txn_${crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex')}`;

      // ── Create Order with PENDING status ──
      const dbOrder = await tx.order.create({
        data: {
          userId,
          payuTxnId,
          status: 'PENDING',
          totalAmount: finalAmount,
          discountAmount,
          couponCode: couponCode_,
          shippingAddress: enrichedShippingAddress,
          orderLineItems: {
            create: verifiedItems.map((v) => ({
              variantId: v.variantId,
              productName: v.productName,
              variantTitle: v.title,
              priceAtPurchase: v.price,
              quantity: v.quantity,
            })),
          },
        },
        include: { orderLineItems: true },
      });

      return { dbOrder, totalAmount, discountAmount };
    }, {
      timeout: 20000,
    });

    // Handle Cash on Delivery (COD) Checkout Completion
    if (paymentMethod === 'COD') {
      // Mark COD order as PAID immediately (confirmed, pending delivery)
      const confirmedOrder = await prisma.order.update({
        where: { id: txResult.dbOrder.id },
        data: {
          status: 'PAID',
          paymentId: `cod_${txResult.dbOrder.id}`,
        },
        include: {
          orderLineItems: {
            include: { variant: { include: { product: true } } },
          },
        },
      });

      // Increment coupon usage if applicable
      if (confirmedOrder.couponCode) {
        await prisma.coupon.updateMany({
          where: { code: confirmedOrder.couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Send confirmation email asynchronously
      sendOrderConfirmationEmail(confirmedOrder).catch((err) =>
        console.error('COD confirmation email error:', err),
      );

      return res.status(201).json({
        success: true,
        cod: true,
        orderId: confirmedOrder.id,
      });
    }

    // ── Generate PayU configuration and signature hash ──
    const amount = Number(txResult.dbOrder.totalAmount).toFixed(2);
    const txnid = txResult.dbOrder.payuTxnId;
    const productinfo = 'MantraAQ Products';
    const firstname = req.user.name || (shippingAddress && shippingAddress.name) || 'Customer';
    const email = req.user.email || (shippingAddress && shippingAddress.email) || 'customer@example.com';
    
    // Sanitize and resolve phone number (must be digits only, exactly 10 digits)
    let phone = req.user.phone || (shippingAddress && shippingAddress.phone) || '';
    phone = phone.replace(/\D/g, ''); // Remove non-numeric characters
    if (phone.length > 10) {
      phone = phone.slice(-10); // Extract last 10 digits
    }

    // Pass db order ID in udf1
    const udf1 = txResult.dbOrder.id;
    const udf2 = '';
    const udf3 = '';
    const udf4 = '';
    const udf5 = '';

    const hashString = `${PAYU_MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${PAYU_MERCHANT_SALT}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Build absolute callback URLs
    const host = req.get('host');
    const protocol = req.protocol;
    const surl = `${protocol}://${host}/api/checkout/payu-success`;
    const furl = `${protocol}://${host}/api/checkout/payu-failure`;

    res.status(201).json({
      success: true,
      payuConfig: {
        key: PAYU_MERCHANT_KEY,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone,
        udf1,
        udf2,
        udf3,
        udf4,
        udf5,
        surl,
        furl,
        hash,
        service_provider: 'payu_paisa',
        sandbox: PAYU_SANDBOX,
      },
      orderId: txResult.dbOrder.id,
    });
  } catch (error) {
    console.error('Create Payment Order Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to initialize checkout.',
    });
  }
};

// ─── verifyPayment ───────────────────────────────────────────────────────────

/**
 * Client-side callback verification: verify PayU reverse hash signature,
 * mark order PAID, increment coupon usage.
 *
 * POST /api/checkout/verify-payment
 */
exports.verifyPayment = async (req, res) => {
  try {
    const {
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      udf6,
      udf7,
      udf8,
      udf9,
      udf10,
      status,
      hash,
      mihpayid,
    } = req.body;

    if (!txnid || !status || !hash) {
      return res
        .status(400)
        .json({ success: false, message: 'Payment credentials missing.' });
    }

    // Verify reverse hash signature
    const reverseHashString = `${PAYU_MERCHANT_SALT}|${status}|${udf10 || ''}|${udf9 || ''}|${udf8 || ''}|${udf7 || ''}|${udf6 || ''}|${udf5 || ''}|${udf4 || ''}|${udf3 || ''}|${udf2 || ''}|${udf1 || ''}|${email || ''}|${firstname || ''}|${productinfo || ''}|${amount}|${txnid}|${key || PAYU_MERCHANT_KEY}`;
    const generatedSignature = crypto.createHash('sha512').update(reverseHashString).digest('hex');

    if (generatedSignature !== hash) {
      return res
        .status(400)
        .json({ success: false, message: 'Payment signature verification failed.' });
    }

    // Handle payment failures / cancellations
    if (status !== 'success') {
      const order = await prisma.order.findUnique({
        where: { payuTxnId: txnid },
        include: { orderLineItems: true },
      });

      if (order && order.status === 'PENDING') {
        await prisma.$transaction(async (tx) => {
          for (const item of order.orderLineItems) {
            await tx.variant.update({
              where: { id: item.variantId },
              data: { stockQuantity: { increment: item.quantity } },
            });
          }

          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'CANCELLED',
              cancelledAt: new Date(),
              notes: `Payment failed/cancelled by user (client overlay). Status: ${status}`,
            },
          });
        });
      }

      return res.status(400).json({
        success: false,
        message: `Payment status: ${status}`,
        orderId: order ? order.id : null,
      });
    }

    // Fetch order
    const order = await prisma.order.findUnique({
      where: { payuTxnId: txnid },
      include: {
        orderLineItems: {
          include: { variant: { include: { product: true } } },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Idempotent: if already PAID, return success
    if (order.status === 'PAID') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified.',
        orderId: order.id,
      });
    }

    // Update order to PAID
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paymentId: mihpayid || 'payu_online',
      },
      include: {
        orderLineItems: {
          include: { variant: { include: { product: true } } },
        },
      },
    });

    // If a coupon was used, increment its usedCount
    if (updatedOrder.couponCode) {
      await prisma.coupon.updateMany({
        where: { code: updatedOrder.couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Send confirmation email asynchronously
    sendOrderConfirmationEmail(updatedOrder).catch((err) =>
      console.error('Confirmation email error:', err),
    );

    res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed.',
      orderId: updatedOrder.id,
    });
  } catch (error) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed.',
    });
  }
};

// ─── Direct Browser Redirect Callbacks ───────────────────────────────────────

/**
 * Handle success redirect callback from PayU
 */
exports.payuSuccess = async (req, res) => {
  let clientUrl = process.env.CLIENT_URL || 'http://localhost:5500';
  try {
    const {
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      udf6,
      udf7,
      udf8,
      udf9,
      udf10,
      status,
      hash,
      mihpayid,
    } = req.body;

    // Fetch and update order
    const order = await prisma.order.findUnique({
      where: { payuTxnId: txnid },
      include: {
        orderLineItems: {
          include: { variant: { include: { product: true } } },
        },
      },
    });

    if (order && order.shippingAddress && typeof order.shippingAddress === 'object') {
      const address = order.shippingAddress;
      if (address.clientUrl) {
        clientUrl = address.clientUrl;
      }
    }

    // Verify hash first
    const reverseHashString = `${PAYU_MERCHANT_SALT}|${status}|${udf10 || ''}|${udf9 || ''}|${udf8 || ''}|${udf7 || ''}|${udf6 || ''}|${udf5 || ''}|${udf4 || ''}|${udf3 || ''}|${udf2 || ''}|${udf1 || ''}|${email || ''}|${firstname || ''}|${productinfo || ''}|${amount}|${txnid}|${key || PAYU_MERCHANT_KEY}`;
    const generatedSignature = crypto.createHash('sha512').update(reverseHashString).digest('hex');

    if (generatedSignature !== hash || status !== 'success') {
      return res.redirect(`${clientUrl}/index.html?order=failed&reason=signature_failed`);
    }

    if (!order) {
      return res.redirect(`${clientUrl}/index.html?order=failed&reason=order_not_found`);
    }

    if (order.status !== 'PAID') {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paymentId: mihpayid || 'payu_online',
        },
        include: {
          orderLineItems: {
            include: { variant: { include: { product: true } } },
          },
        },
      });

      if (updatedOrder.couponCode) {
        await prisma.coupon.updateMany({
          where: { code: updatedOrder.couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      sendOrderConfirmationEmail(updatedOrder).catch((err) =>
        console.error('Confirmation email error:', err),
      );
    }

    res.redirect(`${clientUrl}/index.html?order=success&id=${order.id}`);
  } catch (error) {
    console.error('PayU Success Redirect Error:', error);
    res.redirect(`${clientUrl}/index.html?order=failed`);
  }
};

/**
 * Handle failure redirect callback from PayU
 */
exports.payuFailure = async (req, res) => {
  let clientUrl = process.env.CLIENT_URL || 'http://localhost:5500';
  try {
    const { txnid, status } = req.body;

    const order = await prisma.order.findUnique({
      where: { payuTxnId: txnid },
      include: { orderLineItems: true },
    });

    if (order && order.shippingAddress && typeof order.shippingAddress === 'object') {
      const address = order.shippingAddress;
      if (address.clientUrl) {
        clientUrl = address.clientUrl;
      }
    }

    if (order && order.status === 'PENDING') {
      await prisma.$transaction(async (tx) => {
        for (const item of order.orderLineItems) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            notes: `Payment failed callback. Status: ${status || 'failed'}`,
          },
        });
      });
    }

    res.redirect(`${clientUrl}/index.html?order=failed`);
  } catch (error) {
    console.error('PayU Failure Redirect Error:', error);
    res.redirect(`${clientUrl}/index.html?order=failed`);
  }
};

// ─── cleanupAbandonedOrders ──────────────────────────────────────────────────

/**
 * Finds all PENDING orders older than 30 minutes, restores reserved stock,
 * and marks them CANCELLED. Intended to be called periodically from server.js
 * via setInterval.
 */
exports.cleanupAbandonedOrders = async () => {
  try {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

    const abandonedOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        NOT: { paymentId: { startsWith: 'cod' } },
        createdAt: { lt: cutoff },
      },
      include: { orderLineItems: true },
    });

    if (abandonedOrders.length === 0) return;

    console.log(`[Cleanup] Found ${abandonedOrders.length} abandoned order(s).`);

    for (const order of abandonedOrders) {
      await prisma.$transaction(async (tx) => {
        // Restore stock for each line item
        for (const item of order.orderLineItems) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }

        // Mark order as CANCELLED
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            notes: `Auto-cancelled: Abandoned PENDING order (payment not completed within 30 min). PayUTxnId: ${order.payuTxnId || 'N/A'}`,
          },
        });
      });

      console.log(`[Cleanup] Order #${order.id} (${order.payuTxnId || 'unknown'}) cancelled, stock restored.`);
    }

    console.log(`[Cleanup] Processed ${abandonedOrders.length} abandoned order(s).`);
  } catch (error) {
    console.error('[Cleanup] Error cleaning up abandoned orders:', error);
  }
};

// ─── validateCoupon ──────────────────────────────────────────────────────────

/**
 * Validate a coupon code and return discount details.
 *
 * POST /api/checkout/validate-coupon
 */
exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!code || orderAmount === undefined || orderAmount === null) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code and orderAmount are required.',
      });
    }

    let coupon = await prisma.coupon.findFirst({
      where: { code: { equals: code, mode: 'insensitive' } },
    });

    // Fallback mock for WELCOME75 coupon
    if (code.toUpperCase() === 'WELCOME75' && !coupon) {
      coupon = {
        code: 'WELCOME75',
        discountType: 'FIXED',
        discountValue: 75,
        minOrderAmount: 599,
        isActive: true,
        expiresAt: null,
        maxUses: null,
        usedCount: 0
      };
    }

    if (code.toUpperCase() === 'WELCOME75' && userId) {
      // Validate logged-in user isn't repeat customer
      const existingOrder = await prisma.order.findFirst({
        where: {
          userId,
          OR: [
            { status: { in: ['PAID', 'DISPATCHED', 'DELIVERED'] } },
            { status: 'PENDING', paymentId: { startsWith: 'cod' } }
          ]
        }
      });
      if (existingOrder) {
        return res.status(400).json({
          success: false,
          message: 'Coupon WELCOME75 is only valid for first-time customers.',
        });
      }
    }

    const result = applyCoupon(coupon, orderAmount);

    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.reason });
    }

    res.status(200).json({
      success: true,
      coupon: {
        code: result.coupon.code,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
      },
      discountAmount: result.discountAmount,
      finalAmount: Math.max(orderAmount - result.discountAmount, 0),
    });
  } catch (error) {
    console.error('Validate Coupon Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to validate coupon.',
    });
  }
};

/**
 * Retrieve all active coupons.
 * GET /api/checkout/active-coupons
 */
exports.getActiveCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    const activeCoupons = coupons.filter(c => {
      return c.maxUses === null || c.usedCount < c.maxUses;
    });

    // Ensure WELCOME75 fallback is present
    const hasWelcome = activeCoupons.some(c => c.code.toUpperCase() === 'WELCOME75');
    if (!hasWelcome) {
      activeCoupons.push({
        code: 'WELCOME75',
        discountType: 'FIXED',
        discountValue: 75,
        minOrderAmount: 599,
        isActive: true,
        expiresAt: null,
        maxUses: null,
        usedCount: 0
      });
    }

    res.status(200).json({
      success: true,
      coupons: activeCoupons
    });
  } catch (error) {
    console.error('Get Active Coupons Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch active coupons.'
    });
  }
};
