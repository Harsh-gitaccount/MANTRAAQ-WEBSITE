const crypto = require('crypto');
const prisma = require('../config/db');
const { ensureTrackingTables } = require('../utils/trackingTables');

// Funnel steps the storefront may report (each counted once per browser per day)
const EVENTS = ['visit', 'product_view', 'add_to_cart', 'checkout_start', 'checkout_details'];
// Orders that count as a sale: paid online, or COD placed
const SOLD_WHERE = `("status" IN ('PAID','DISPATCHED','DELIVERED') OR ("status" = 'PENDING' AND "paymentId" LIKE 'cod%'))`;
const KEEP_CHECKOUTS_DAYS = 90;
const KEEP_STATS_DAYS = 400;
const ABANDONED_AFTER_MIN = 30;

const clean = (value, max) => {
  if (value === undefined || value === null) return null;
  const s = String(value).trim().slice(0, max);
  return s || null;
};
const isVisitorId = (v) => typeof v === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(v);

// Calendar date in India, so "today" matches the shop's day
function istDate(offsetDays = 0) {
  return new Date(Date.now() + 5.5 * 3600 * 1000 + offsetDays * 86400000).toISOString().slice(0, 10);
}

// Old rows are removed at most once a day, piggybacking on tracking calls
let lastPurge = 0;
function purgeOldRows() {
  if (Date.now() - lastPurge < 24 * 3600 * 1000) return;
  lastPurge = Date.now();
  prisma.$executeRawUnsafe(
    `DELETE FROM "CheckoutSession" WHERE "updatedAt" < NOW() - INTERVAL '${KEEP_CHECKOUTS_DAYS} days'`,
  ).catch((err) => console.error('Tracking purge (checkouts) failed:', err.message));
  prisma.$executeRaw`DELETE FROM "DailyStat" WHERE "date" < ${istDate(-KEEP_STATS_DAYS)}`
    .catch((err) => console.error('Tracking purge (stats) failed:', err.message));
}

/**
 * Count one funnel step for today.
 * POST /api/track/event { event, key? }
 */
exports.trackEvent = async (req, res) => {
  try {
    const { event } = req.body || {};
    if (!EVENTS.includes(event)) {
      return res.status(400).json({ success: false, message: 'Unknown event.' });
    }
    const key = event === 'product_view' || event === 'add_to_cart'
      ? (clean(req.body.key, 80) || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
      : '';

    await ensureTrackingTables();
    await prisma.$executeRaw`
      INSERT INTO "DailyStat" ("date", "event", "key", "count")
      VALUES (${istDate()}, ${event}, ${key}, 1)
      ON CONFLICT ("date", "event", "key") DO UPDATE SET "count" = "DailyStat"."count" + 1
    `;
    purgeOldRows();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({ success: false });
  }
};

/**
 * Save what a shopper has typed at checkout, so an unfinished checkout can be
 * followed up. Called once they have entered a valid email or phone.
 * POST /api/track/checkout { visitorId, name, email, phone, city, postalCode, items }
 */
exports.trackCheckout = async (req, res) => {
  try {
    const body = req.body || {};
    if (!isVisitorId(body.visitorId)) {
      return res.status(400).json({ success: false, message: 'Invalid visitor.' });
    }

    let email = clean(body.email, 120);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) email = null;
    let phone = clean(body.phone, 20);
    if (phone) phone = phone.replace(/\D/g, '').slice(-10);
    if (phone && phone.length !== 10) phone = null;
    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email or phone is required.' });
    }

    const items = (Array.isArray(body.items) ? body.items : []).slice(0, 30).map((item) => ({
      name: clean(item.name, 120) || 'Item',
      title: clean(item.title, 60) || '',
      price: Math.max(0, Number(item.price) || 0),
      quantity: Math.max(1, Math.min(100, parseInt(item.quantity, 10) || 1)),
      handle: clean(item.handle, 80),
    }));
    const cartValue = Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;

    await ensureTrackingTables();
    await prisma.$executeRaw`
      INSERT INTO "CheckoutSession"
        ("id", "visitorId", "name", "email", "phone", "city", "postalCode", "items", "cartValue", "createdAt", "updatedAt")
      VALUES
        (${crypto.randomUUID()}, ${body.visitorId}, ${clean(body.name, 100)}, ${email ? email.toLowerCase() : null}, ${phone},
         ${clean(body.city, 80)}, ${clean(body.postalCode, 10)}, ${JSON.stringify(items)}::jsonb, ${cartValue}, NOW(), NOW())
      ON CONFLICT ("visitorId") DO UPDATE SET
        "name" = COALESCE(EXCLUDED."name", "CheckoutSession"."name"),
        "email" = COALESCE(EXCLUDED."email", "CheckoutSession"."email"),
        "phone" = COALESCE(EXCLUDED."phone", "CheckoutSession"."phone"),
        "city" = COALESCE(EXCLUDED."city", "CheckoutSession"."city"),
        "postalCode" = COALESCE(EXCLUDED."postalCode", "CheckoutSession"."postalCode"),
        "items" = EXCLUDED."items",
        "cartValue" = EXCLUDED."cartValue",
        "updatedAt" = NOW()
    `;
    purgeOldRows();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Track checkout error:', error);
    res.status(500).json({ success: false });
  }
};

// ─── Admin ───────────────────────────────────────────────────

/**
 * Checkouts where the shopper left details. A checkout counts as recovered
 * when a sale exists with the same email or phone placed after it started.
 * GET /api/admin/abandoned-checkouts?status=abandoned|recovered|all&page=&limit=
 */
exports.getAbandonedCheckouts = async (req, res) => {
  try {
    await ensureTrackingTables();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const status = ['abandoned', 'recovered', 'all'].includes(req.query.status) ? req.query.status : 'abandoned';

    // Latest matching sale for each checkout (by email or phone, after it started)
    const base = `
      SELECT cs.*, sale."id" AS "orderId", sale."totalAmount" AS "orderTotal", sale."createdAt" AS "orderedAt"
      FROM "CheckoutSession" cs
      LEFT JOIN LATERAL (
        SELECT o."id", o."totalAmount", o."createdAt" FROM "Order" o
        WHERE ${SOLD_WHERE.replace(/"status"/g, 'o."status"').replace(/"paymentId"/g, 'o."paymentId"')}
          AND o."createdAt" >= cs."createdAt" - INTERVAL '5 minutes'
          AND (
            (cs."email" IS NOT NULL AND lower(o."shippingAddress"->>'email') = cs."email")
            OR (cs."phone" IS NOT NULL AND right(regexp_replace(COALESCE(o."shippingAddress"->>'phone', ''), '\\D', '', 'g'), 10) = cs."phone")
          )
        ORDER BY o."createdAt" DESC LIMIT 1
      ) sale ON TRUE
    `;
    const filter = status === 'recovered'
      ? `WHERE "orderId" IS NOT NULL`
      : status === 'abandoned'
        ? `WHERE "orderId" IS NULL AND "updatedAt" < NOW() - INTERVAL '${ABANDONED_AFTER_MIN} minutes'`
        : '';

    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM (${base}) t ${filter} ORDER BY "updatedAt" DESC LIMIT $1 OFFSET $2`,
      limit, (page - 1) * limit,
    );
    const counts = await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*) FILTER (WHERE "orderId" IS NULL AND "updatedAt" < NOW() - INTERVAL '${ABANDONED_AFTER_MIN} minutes')::int AS abandoned,
        COUNT(*) FILTER (WHERE "orderId" IS NOT NULL)::int AS recovered,
        COUNT(*)::int AS "all",
        COALESCE(SUM("cartValue") FILTER (WHERE "orderId" IS NULL AND "updatedAt" < NOW() - INTERVAL '${ABANDONED_AFTER_MIN} minutes'), 0)::float AS "abandonedValue"
      FROM (${base}) t
    `);

    res.status(200).json({ success: true, data: rows, counts: counts[0], page, limit });
  } catch (error) {
    console.error('Abandoned checkouts error:', error);
    res.status(500).json({ success: false, message: 'Failed to load abandoned checkouts.' });
  }
};

/**
 * Mark (or unmark) a checkout as followed up.
 * PATCH /api/admin/abandoned-checkouts/:id/contacted { contacted }
 */
exports.markCheckoutContacted = async (req, res) => {
  try {
    await ensureTrackingTables();
    const contacted = req.body && req.body.contacted !== false;
    const updated = contacted
      ? await prisma.$executeRaw`UPDATE "CheckoutSession" SET "contactedAt" = NOW() WHERE "id" = ${req.params.id}`
      : await prisma.$executeRaw`UPDATE "CheckoutSession" SET "contactedAt" = NULL WHERE "id" = ${req.params.id}`;
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Checkout not found.' });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Mark contacted error:', error);
    res.status(500).json({ success: false, message: 'Failed to update checkout.' });
  }
};

/**
 * Funnel for the last N days: browsers at each step, sales from real orders,
 * a day-by-day table and the products most added to cart.
 * GET /api/admin/funnel?days=7
 */
exports.getFunnel = async (req, res) => {
  try {
    await ensureTrackingTables();
    const days = Math.max(1, Math.min(90, parseInt(req.query.days, 10) || 7));
    const from = istDate(-(days - 1));

    const stats = await prisma.$queryRaw`
      SELECT "date", "event", "key", "count" FROM "DailyStat" WHERE "date" >= ${from}
    `;
    // Sales per Indian calendar day, from orders (the source of truth)
    const sales = await prisma.$queryRawUnsafe(`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS "date",
             COUNT(*)::int AS "orders", COALESCE(SUM("totalAmount"), 0)::float AS "revenue"
      FROM "Order"
      WHERE ${SOLD_WHERE} AND ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata' >= $1::date
      GROUP BY 1
    `, from);
    const soldItems = await prisma.$queryRawUnsafe(`
      SELECT li."productName" AS "name", SUM(li."quantity")::int AS "quantity"
      FROM "OrderLineItem" li JOIN "Order" o ON o."id" = li."orderId"
      WHERE ${SOLD_WHERE.replace(/"status"/g, 'o."status"').replace(/"paymentId"/g, 'o."paymentId"')}
        AND (o."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata' >= $1::date
      GROUP BY 1
    `, from);

    const dates = [];
    for (let i = days - 1; i >= 0; i--) dates.push(istDate(-i));
    const byDay = Object.fromEntries(dates.map((d) => [d, {
      date: d, visit: 0, product_view: 0, add_to_cart: 0, checkout_start: 0, checkout_details: 0, orders: 0, revenue: 0,
    }]));
    const totals = { visit: 0, product_view: 0, add_to_cart: 0, checkout_start: 0, checkout_details: 0, orders: 0, revenue: 0 };
    const products = {};

    for (const row of stats) {
      const day = byDay[row.date];
      if (day && day[row.event] !== undefined) day[row.event] += row.count;
      if (totals[row.event] !== undefined) totals[row.event] += row.count;
      if (row.key && (row.event === 'product_view' || row.event === 'add_to_cart')) {
        products[row.key] = products[row.key] || { handle: row.key, views: 0, addedToCart: 0 };
        products[row.key][row.event === 'product_view' ? 'views' : 'addedToCart'] += row.count;
      }
    }
    for (const row of sales) {
      if (byDay[row.date]) {
        byDay[row.date].orders = row.orders;
        byDay[row.date].revenue = row.revenue;
      }
      totals.orders += row.orders;
      totals.revenue += row.revenue;
    }

    res.status(200).json({
      success: true,
      data: {
        days,
        from,
        totals,
        daily: Object.values(byDay),
        products: Object.values(products).sort((a, b) => b.addedToCart - a.addedToCart || b.views - a.views).slice(0, 15),
        soldItems,
      },
    });
  } catch (error) {
    console.error('Funnel error:', error);
    res.status(500).json({ success: false, message: 'Failed to load funnel.' });
  }
};
