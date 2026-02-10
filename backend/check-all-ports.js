const http = require('http');

function testEndpoint(port, path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`\n✅ ${path} (port ${port}):`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Body: ${data}`);
        resolve(true);
      });
    });

    req.on('error', (error) => {
      console.log(`\n❌ ${path} (port ${port}): ${error.message}`);
      resolve(false);
    });

    req.end();
  });
}

async function checkAll() {
  console.log('🔍 KIỂM TRA CÁC PORT:\n');
  
  await testEndpoint(3000, '/');
  await testEndpoint(3001, '/api/health');
  
  console.log('\n\n🔍 KIỂM TRA ATTENDANCE API:\n');
  
  // Test với axios
  try {
    const axios = require('axios');
    const loginRes = await axios.post('http://localhost:3001/api/auth/admin/login', {
      password: '123456'
    });
    console.log('✅ Login OK, token:', loginRes.data.token.substring(0, 20) + '...');
    
    const attendanceRes = await axios.get('http://localhost:3001/api/activities/1/attendance', {
      headers: { 'Authorization': `Bearer ${loginRes.data.token}` }
    });
    console.log('\n✅ ATTENDANCE API RESPONSE:');
    console.log(JSON.stringify(attendanceRes.data, null, 2));
  } catch (error) {
    console.log('❌ Axios error:', error.code, error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

checkAll();
