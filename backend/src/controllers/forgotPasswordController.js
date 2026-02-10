const prisma = require('../lib/prisma');
const { hashPassword } = require('../utils/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// In-memory OTP store (in production, use Redis or DB)
const otpStore = new Map();

// Helper: Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: Generate reset token
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Helper: Create email transporter
function createTransporter() {
  // Use environment variables for email config
  // Fallback to a test/demo configuration
  const emailUser = process.env.EMAIL_USER || '';
  const emailPass = process.env.EMAIL_PASS || '';
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');

  if (!emailUser || !emailPass) {
    console.log('[ForgotPassword] Email not configured, OTP will be logged to console');
    return null;
  }

  return nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
}

// @desc    Request password reset (via email or phone)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { method, contact, identifier } = req.body;

    if (!method || !contact) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp phương thức và thông tin liên hệ',
      });
    }

    // Find user
    let user;
    if (method === 'email') {
      // Email method: find user by the email they entered
      user = await prisma.user.findFirst({
        where: {
          email: contact.toLowerCase().trim(),
          isActive: true,
        },
      });
    } else if (method === 'phone') {
      // Phone method: find user by identifier (username/email), send OTP to ANY phone number
      if (!identifier) {
        return res.status(400).json({
          success: false,
          error: 'Vui lòng cung cấp tên đăng nhập hoặc email',
        });
      }
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: identifier.trim() },
            { email: identifier.toLowerCase().trim() },
          ],
          isActive: true,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Phương thức không hợp lệ. Sử dụng "email" hoặc "phone"',
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: method === 'email'
          ? 'Không tìm thấy tài khoản với email này'
          : 'Không tìm thấy tài khoản với tên đăng nhập/email này',
      });
    }

    // Generate OTP and reset token
    const otp = generateOTP();
    const resetToken = generateResetToken();

    // Store OTP with expiry (5 minutes)
    otpStore.set(resetToken, {
      userId: user.id,
      otp,
      method,
      contact,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      verified: false,
    });

    // Clean up expired OTPs periodically
    for (const [key, value] of otpStore.entries()) {
      if (value.expiresAt < Date.now()) {
        otpStore.delete(key);
      }
    }

    // Send OTP
    if (method === 'email') {
      const transporter = createTransporter();
      
      if (transporter) {
        try {
          await transporter.sendMail({
            from: `"Youth Handbook" <${process.env.EMAIL_USER}>`,
            to: contact,
            subject: 'Mã OTP đặt lại mật khẩu - Youth Handbook',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: linear-gradient(135deg, #1e293b 0%, #1e40af 100%); border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Youth Handbook</h1>
                  <p style="color: #93c5fd; font-size: 14px; margin: 8px 0 0;">Hệ thống quản lý đoàn viên Trung đoàn 196</p>
                </div>
                <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; text-align: center;">
                  <p style="color: #e2e8f0; margin: 0 0 16px;">Mã OTP của bạn là:</p>
                  <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 16px; margin: 0 auto; max-width: 200px;">
                    <span style="font-size: 32px; font-weight: bold; color: #ffffff; letter-spacing: 8px;">${otp}</span>
                  </div>
                  <p style="color: #94a3b8; font-size: 12px; margin: 16px 0 0;">Mã có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.</p>
                </div>
              </div>
            `,
          });
          console.log(`[ForgotPassword] OTP email sent to ${contact}`);
        } catch (emailError) {
          console.error('[ForgotPassword] Email send failed:', emailError.message);
          // Still continue - OTP is logged to console for development
          console.log(`[ForgotPassword] OTP for ${contact}: ${otp}`);
        }
      } else {
        // No email configured - log OTP for development
        console.log(`[ForgotPassword] 📧 OTP for ${contact}: ${otp}`);
      }
    } else {
      // SMS sending - log for development (integrate SMS provider for production)
      console.log(`[ForgotPassword] 📱 SMS OTP for ${contact}: ${otp}`);
      // In production, integrate with SMS provider like Twilio, VNPT, etc.
    }

    // Always log OTP in development for testing
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ForgotPassword] 🔑 OTP: ${otp} | Token: ${resetToken.substring(0, 8)}...`);
    }

    res.status(200).json({
      success: true,
      message: method === 'email'
        ? `Mã OTP đã được gửi đến ${contact}`
        : `Mã OTP đã được gửi đến số ${contact}`,
      resetToken,
      // In development, also send OTP in response for easy testing
      ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
    });
  } catch (error) {
    console.error('[ForgotPassword] Error:', error);
    next(error);
  }
};

// @desc    Verify OTP code
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res, next) => {
  try {
    const { otp, resetToken } = req.body;

    if (!otp || !resetToken) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp mã OTP và token',
      });
    }

    const otpData = otpStore.get(resetToken);

    if (!otpData) {
      return res.status(400).json({
        success: false,
        error: 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
      });
    }

    if (otpData.expiresAt < Date.now()) {
      otpStore.delete(resetToken);
      return res.status(400).json({
        success: false,
        error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới',
      });
    }

    if (otpData.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Mã OTP không đúng',
      });
    }

    // Mark as verified and extend expiry for password reset (10 more minutes)
    otpData.verified = true;
    otpData.expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(resetToken, otpData);

    res.status(200).json({
      success: true,
      message: 'Xác thực OTP thành công',
      resetToken,
    });
  } catch (error) {
    console.error('[VerifyOTP] Error:', error);
    next(error);
  }
};

// @desc    Reset password with verified token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp token và mật khẩu mới',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
    }

    const otpData = otpStore.get(resetToken);

    if (!otpData) {
      return res.status(400).json({
        success: false,
        error: 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
      });
    }

    if (!otpData.verified) {
      return res.status(400).json({
        success: false,
        error: 'OTP chưa được xác thực',
      });
    }

    if (otpData.expiresAt < Date.now()) {
      otpStore.delete(resetToken);
      return res.status(400).json({
        success: false,
        error: 'Phiên đặt lại mật khẩu đã hết hạn',
      });
    }

    // Hash new password and update
    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: otpData.userId },
      data: { passwordHash },
    });

    // Clean up used token
    otpStore.delete(resetToken);

    console.log(`[ResetPassword] Password reset successful for user ${otpData.userId}`);

    res.status(200).json({
      success: true,
      message: 'Mật khẩu đã được cập nhật thành công',
    });
  } catch (error) {
    console.error('[ResetPassword] Error:', error);
    next(error);
  }
};

module.exports = {
  forgotPassword,
  verifyOTP,
  resetPassword,
};
