// Keep-alive backend wrapper
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  console.error(err.stack);
  // DON'T EXIT - keep running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection:',  reason);
  console.error('Promise:', promise);
  // DON'T EXIT - keep running
});

process.on('exit', (code) => {
  console.error(`\n[WRAPPER]  PROCESS EXITING WITH CODE: ${code}`);
});

process.on('SIGINT', () => {
  console.log('\n[WRAPPER] SIGINT received - but keeping alive...');
  // Don't exit
});

console.log('[WRAPPER] Starting backend with crash protection...\n');

try {
  require('./src/index.js');
} catch (error) {
  console.error('[WRAPPER] Error loading backend:', error);
  console.error(error.stack);
}

// Keep alive forever
setInterval(() => {
  const mem = process.memoryUsage();
  console.log(`[WRAPPER ${new Date().toLocaleTimeString()}] Alive | Memory: ${Math.round(mem.heapUsed/1024/1024)}MB`);
}, 30000);

console.log('[WRAPPER] Backend loaded, entering keep-alive mode\n');
