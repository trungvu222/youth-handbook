const express = require('express');
const {
  register,
  login,
  adminLogin,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { forgotPassword, verifyOTP, resetPassword } = require('../controllers/forgotPasswordController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Forgot password routes (public)
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

// Private routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

module.exports = router;

