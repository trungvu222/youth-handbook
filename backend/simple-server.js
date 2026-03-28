const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username, password });
  
  // Mock authentication
  if (username === 'admin' && password === 'admin123') {
    res.json({
      success: true,
      token: 'mock-jwt-token-admin',
      user: {
        id: '1',
        username: 'admin',
        fullName: 'Quản trị viên hệ thống',
        role: 'ADMIN',
        email: 'admin@youth-handbook.com'
      }
    });
  } else if (username === 'member_001' && password === 'member123') {
    res.json({
      success: true,
      token: 'mock-jwt-token-member',
      user: {
        id: '2',
        username: 'member_001',
        fullName: 'Lê Văn Cường',
        role: 'MEMBER',
        email: 'member001@youth-handbook.com'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Thông tin tài khoản hoặc mật khẩu không đúng. Vui lòng thử lại'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Simple Backend Server Running',
    timestamp: new Date().toISOString()
  });
});

// Get current user (mock)
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (token === 'mock-jwt-token-admin') {
    res.json({
      success: true,
      data: {
        id: '1',
        username: 'admin',
        fullName: 'Quản trị viên hệ thống',
        role: 'ADMIN',
        email: 'admin@youth-handbook.com',
        points: 1000
      }
    });
  } else if (token === 'mock-jwt-token-member') {
    res.json({
      success: true,
      data: {
        id: '2',
        username: 'member_001',
        fullName: 'Lê Văn Cường',
        role: 'MEMBER',
        email: 'member001@youth-handbook.com',
        points: 780
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Simple Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Login endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log('');
  console.log('Test credentials:');
  console.log('Admin: admin / admin123');
  console.log('Member: member_001 / member123');
});


