const dns = require('dns');
// Force IPv4 globally — Render's free tier does not support IPv6 routing
dns.setDefaultResultOrder('ipv4first');

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const url = require('url');

// Parse DATABASE_URL to inject family:4 into the pool config
const dbUrl = new URL(process.env.DATABASE_URL);

const pool = new Pool({ 
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port) || 5432,
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.slice(1), // remove leading '/'
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ 
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = prisma;
