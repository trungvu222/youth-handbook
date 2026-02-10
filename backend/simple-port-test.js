const http = require('http');

console.log('Testing port 3001...');

const req = http.get('http://localhost:3001/api/health', (res) => {
  console.log(`✅ CONNECTED! Status: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', data));
}).on('error', (err) => {
  console.log(`❌ CANNOT CONNECT: ${err.message}`);
  console.log('Error code:', err.code);
  
  // Try checking if anything is on port 3001
  const net = require('net');
  const socket = new net.Socket();
  
  socket.setTimeout(2000);
  socket.on('connect', () => {
    console.log('⚠️ Port 3001 IS open but HTTP request failed!');
    socket.destroy();
  });
  socket.on('timeout', () => {
    console.log('⚠️ Port 3001 timeout');
     socket.destroy();
  });
  socket.on('error', (e) => {
    console.log(`⚠️ Port 3001 socket error: ${e.code}`);
  });
  
  socket.connect(3001, 'localhost');
});

setTimeout(() => {
  console.log('\n--- Checking netstat ---');
  require('child_process').exec('netstat -ano | findstr :3001', (error, stdout) => {
    if (stdout) {
      console.log('Netstat output:');
      console.log(stdout);
    } else {
      console.log('⚠️ No process listening on port 3001!');
    }
    process.exit(0);
  });
}, 5000);
