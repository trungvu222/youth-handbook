const { PrismaClient } = require('@prisma/client');

// Singleton PrismaClient to avoid exhausting Neon connection pool (limit ~9)

// Add Neon-specific connection params to prevent idle disconnects
let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl && !dbUrl.includes('connection_limit')) {
  const separator = dbUrl.includes('?') ? '&' : '?';
  dbUrl += `${separator}connection_limit=5&pool_timeout=20&connect_timeout=15`;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Keep connection alive - ping every 30 seconds to prevent Neon from closing idle connections
// (Neon can close idle connections after ~60s of inactivity on the free tier)
const KEEP_ALIVE_INTERVAL = 30 * 1000; // 30 seconds
let keepAliveTimer = null;
let isReconnecting = false;

const reconnect = async () => {
  if (isReconnecting) return;
  isReconnecting = true;
  console.warn('⚠️ Prisma keep-alive ping failed, reconnecting...');
  try {
    // Must $disconnect() first to flush ALL broken connections from the pool.
    // When Neon resets connections (error 10054 / scale-to-zero), the pool still
    // tracks stale connections as "available". New queries then wait the full
    // pool_timeout (20s) for a slot that never frees up. $disconnect() clears
    // the broken pool state so $connect() can build fresh connections.
    await prisma.$disconnect().catch(() => {});
    await prisma.$connect();
    console.log('✅ Prisma reconnected successfully');
  } catch (reconnectErr) {
    console.error('❌ Prisma reconnect failed:', reconnectErr.message);
  } finally {
    isReconnecting = false;
  }
};

const startKeepAlive = () => {
  if (keepAliveTimer) return;
  keepAliveTimer = setInterval(async () => {
    if (isReconnecting) return; // skip ping while reconnect is in progress
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      await reconnect();
    }
  }, KEEP_ALIVE_INTERVAL);
  // Don't prevent Node.js from exiting
  keepAliveTimer.unref();
};

// Connect eagerly and start keep-alive
prisma.$connect()
  .then(() => {
    console.log('✅ Prisma connected to database');
    startKeepAlive();
  })
  .catch((err) => {
    console.error('❌ Prisma initial connection failed:', err.message);
    // Start keep-alive anyway so we keep retrying
    startKeepAlive();
  });

// Handle graceful shutdown
process.on('beforeExit', async () => {
  if (keepAliveTimer) clearInterval(keepAliveTimer);
  await prisma.$disconnect();
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
    msg.includes('connection pool') ||     // catches "Timed out fetching a new connection from the connection pool"
    err?.code === 'P1001' ||
    err?.code === 'P1002' ||
    err?.code === 'P2024'                  // Prisma pool timeout error code
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
        // Trigger a reconnect in background
        reconnect().catch(() => {});
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
