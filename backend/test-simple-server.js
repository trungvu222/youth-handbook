// Simple test server
const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

const PORT = 3002;

console.log(`Attempting to start server on port ${PORT}...`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test server listening on http://localhost:${PORT}`);
  console.log(`✅ Test URL: http://localhost:${PORT}/test`);
});

server.on('error', (err) => {
  console.log(`❌ Server error: ${err.message}`);
  console.log(` Error code: ${err.code}`);
  process.exit(1);
});

// Keep alive
setInterval(() => {
  console.log('Server still running...');
}, 5000);
