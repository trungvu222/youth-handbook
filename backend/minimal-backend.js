// Minimal backend test
console.log('🚀 Starting backend...');

try {
  const express = require('express');
  const app = express();
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
  });
  
  const PORT = process.env.PORT || 3001;
  
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅✅✅ BACKEND RUNNING ON PORT ${PORT} ✅✅✅`);
    console.log(`Test URL: http://localhost:${PORT}/api/health`);
    console.log(`Server address:`, server.address());
  });
  
  server.on('error', (err) => {
    console.error(`❌ SERVER ERROR:`, err);
    process.exit(1);
  });
  
  console.log('✅ Script executed successfully');
  
} catch (error) {
  console.error('❌ FATAL ERROR:', error);
  process.exit(1);
}
