const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// Singleton PrismaClient using @prisma/adapter-pg for rock-solid Neon cloud connectivity
const dbUrl = process.env.DATABASE_URL || '';

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

pool.on('error', (err) => {
  console.error('⚠️ Unexpected PG pool error:', err.message);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Keep connection alive - ping every 30 seconds to prevent Neon from closing idle connections
const KEEP_ALIVE_INTERVAL = 30 * 1000;
let keepAliveTimer = null;

const startKeepAlive = () => {
  if (keepAliveTimer) return;
  keepAliveTimer = setInterval(async () => {
    try {
      await pool.query('SELECT 1');
    } catch (e) {
      console.warn('⚠️ Keep-alive ping error:', e.message);
    }
  }, KEEP_ALIVE_INTERVAL);
  keepAliveTimer.unref();
};

// Initial connection check
prisma.$connect()
  .then(() => {
    console.log('✅ Prisma connected to database successfully via PG adapter');
    startKeepAlive();
  })
  .catch((err) => {
    console.error('❌ Prisma initial connection failed:', err.message);
    startKeepAlive();
  });

// Handle graceful shutdown
process.on('beforeExit', async () => {
  if (keepAliveTimer) clearInterval(keepAliveTimer);
  await prisma.$disconnect();
  await pool.end();
});

/**
 * Retry a Prisma operation up to `maxRetries` times on transient connection errors.
 * Usage: await withRetry(() => prisma.user.findFirst(...))
 */
const isConnectionError = (err) => {
  const msg = err?.message || '';
  return (
    msg.includes('Engine is not yet connected') ||
    msg.includes("Can't reach database server") ||
    msg.includes('Connection reset') ||
    msg.includes('ECONNRESET') ||
    msg.includes('connect_timeout') ||
    msg.includes('connection pool') ||
    err?.code === 'P1001' ||
    err?.code === 'P1002' ||
    err?.code === 'P2024'
  );
};

const withRetry = async (fn, maxRetries = 3, delayMs = 500) => {
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (isConnectionError(err) && attempt < maxRetries) {
        console.warn(`⚠️ DB connection error on attempt ${attempt}/${maxRetries}, retrying in ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs * attempt));
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
};

module.exports = prisma;
module.exports.withRetry = withRetry;
module.exports.pool = pool;
