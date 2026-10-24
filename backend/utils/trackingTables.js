const prisma = require('../config/db');

// Creates the sales-tracking tables if they are missing, so a deploy needs no
// migration step. Only ever adds; never touches existing tables.
// Must match the CheckoutSession and DailyStat models in prisma/schema.prisma.
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "CheckoutSession" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "items" JSONB NOT NULL DEFAULT '[]',
    "cartValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contactedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckoutSession_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CheckoutSession_visitorId_key" ON "CheckoutSession"("visitorId")`,
  `CREATE INDEX IF NOT EXISTS "CheckoutSession_updatedAt_idx" ON "CheckoutSession"("updatedAt")`,
  `CREATE TABLE IF NOT EXISTS "DailyStat" (
    "date" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DailyStat_pkey" PRIMARY KEY ("date","event","key")
  )`,
];

let readyPromise = null;

function ensureTrackingTables() {
  if (!readyPromise) {
    readyPromise = (async () => {
      for (const sql of STATEMENTS) {
        await prisma.$executeRawUnsafe(sql);
      }
    })().catch((err) => {
      readyPromise = null; // try again on the next call
      throw err;
    });
  }
  return readyPromise;
}

module.exports = { ensureTrackingTables };
