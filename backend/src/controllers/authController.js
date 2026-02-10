const prisma = require('../lib/prisma');
const { hashPassword, comparePassword, sendTokenResponse, verifyRefreshToken, generateToken } = require('../utils/auth');
const { isValidEmail } = require('../utils/helpers');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { 
      username, email, password, fullName, phone, unitId, role,
      // New fields for Slide 4
      dateOfBirth, gender, birthPlace, permanentAddress,
      militaryRank, governmentPosition, youthPosition,
      dateJoined, partyJoinDate, ethnicity, religion,
      educationLevel, majorLevel, itLevel, languageLevel, politicsLevel
    } = req.body;

    // Flexible validation - allow registration with phone OR email
    // At minimum: need identifier (username/email/phone), password, and fullName
    const effectiveUsername = username || email || phone;
    const effectiveEmail = email || (phone ? `${phone}@phone.local` : null);

    if (!effectiveUsername || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp tên đăng nhập (hoặc email/số điện thoại), mật khẩu và họ tên'
      });
    }

    // Email validation - only if a real email is provided (not phone-generated)
    if (email && !email.endsWith('@phone.local') && !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email không hợp lệ'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    // Check if user exists (by username, email, or phone)
    const orConditions = [{ username: effectiveUsername }];
    if (effectiveEmail) orConditions.push({ email: effectiveEmail });
    if (phone) orConditions.push({ phone });
    if (email && email !== effectiveEmail) orConditions.push({ email });

    const existingUser = await prisma.user.findFirst({
      where: { OR: orConditions }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Tài khoản với thông tin này đã tồn tại'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: effectiveUsername,
        email: effectiveEmail || `${effectiveUsername}@user.local`,
        passwordHash,
        fullName,
        phone,
        unitId,
        role: role || 'MEMBER',
        // New fields for Slide 4
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        birthPlace,
        permanentAddress,
        militaryRank,
        governmentPosition,
        youthPosition,
        dateJoined: dateJoined ? new Date(dateJoined) : undefined,
        partyJoinDate: partyJoinDate ? new Date(partyJoinDate) : undefined,
        ethnicity,
        religion,
        educationLevel,
        majorLevel,
        itLevel,
        languageLevel,
        politicsLevel
      },
      include: {
        unit: true
      }
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide username and password'
      });
    }

    // Check for user (can login with username, email, or phone)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
          { phone: username }
        ],
        isActive: true
      },
      include: {
        unit: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await comparePassword(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        unit: true,
        pointsHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    const { passwordHash, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const updateData = req.body;

    // Check if email is already taken by another user
    if (updateData.email && updateData.email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: updateData.email }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email is already taken'
        });
      }
    }

    // Convert date strings to Date objects
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.dateJoined) {
      updateData.dateJoined = new Date(updateData.dateJoined);
    }

    // Users cannot change their own role or unit
    delete updateData.role;
    delete updateData.unitId;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      include: {
        unit: true
      }
    });

    const { passwordHash, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide current password and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters'
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Check current password
    const isMatch = await comparePassword(currentPassword, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash }
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin login
// @route   POST /api/auth/admin/login
// @access  Public
const adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide username and password'
      });
    }

    // Check for user (can login with username or email)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ],
        isActive: true,
        role: 'ADMIN' // Only ADMIN role can login to admin panel
      },
      include: {
        unit: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials or insufficient permissions'
      });
    }

    // Check if password matches
    const isMatch = await comparePassword(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (but requires valid refresh token)
const refreshToken = async (req, res, next) => {
  try {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'No refresh token provided'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }

    // Get user from token
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        unit: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    // Generate new access token
    const accessToken = generateToken(user.id, user.role);

    // Remove password from output
    const { passwordHash, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      accessToken,
      user: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout (clear refresh token cookie)
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res, next) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword
};

