const { PrismaClient } = require('@prisma/client');

// Singleton PrismaClient to avoid exhausting Neon connection pool (limit ~9)
// Before: every controller created its own new PrismaClient() = 13+ connection pools
// After: single shared instance with optimized pool settings

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

// Keep connection alive - ping every 2 minutes to prevent Neon from closing idle connections
const KEEP_ALIVE_INTERVAL = 2 * 60 * 1000; // 2 minutes
let keepAliveTimer = null;

const startKeepAlive = () => {
  if (keepAliveTimer) return;
  keepAliveTimer = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      console.warn('⚠️ Prisma keep-alive ping failed, reconnecting...');
      try {
        await prisma.$disconnect();
        await prisma.$connect();
        console.log('✅ Prisma reconnected successfully');
      } catch (reconnectErr) {
        console.error('❌ Prisma reconnect failed:', reconnectErr.message);
      }
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
  });

// Handle graceful shutdown
process.on('beforeExit', async () => {
  if (keepAliveTimer) clearInterval(keepAliveTimer);
  await prisma.$disconnect();
});

module.exports = prisma;
