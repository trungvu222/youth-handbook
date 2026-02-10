const http = require('http');

console.log('[TEST] Testing backend on port 3001...');

setTimeout(() => {
  const req = http.get('http://localhost:3001/api/health', (res) => {
    console.log(`✅ BACKEND RESPONDS! Status: ${res.statusCode}`);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Response:', data);
      process.exit(0);
    });
  });
  
  req.on('error', (err) => {
    console.error(`❌ CANNOT CONNECT: ${err.message}`);
    process.exit(1);
  });
}, 1000);
