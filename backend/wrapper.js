// Backend wrapper with keep-alive
console.log('[WRAPPER] Starting backend with keep-alive...');

process.on('uncaughtException', (err) => {
  console.error('[WRAPPER] Uncaught Exception:', err);
  console.error('[WRAPPER] Stack:', err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[WRAPPER] Unhandled Rejection at:', promise);
  console.error('[WRAPPER] Reason:', reason);
});

try {
  require('./src/index.js');
  console.log('[WRAPPER] Backend module loaded successfully');
  
  // Keep alive
  setInterval(() => {
    console.log(`[WRAPPER] Backend still alive at ${new Date().toISOString()}`);
  }, 10000);
  
} catch (error) {
  console.error('[WRAPPER] Fatal error loading backend:', error);
  console.error('[WRAPPER] Stack:', error.stack);
  process.exit(1);
}
