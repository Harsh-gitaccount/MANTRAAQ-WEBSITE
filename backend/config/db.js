const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Create pg connection pool
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Adjust connection limits for scaling
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ 
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = prisma;
