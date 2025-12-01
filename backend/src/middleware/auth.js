const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Protect routes - require authentication
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          unit: true
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'No user found with this token'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'User account is deactivated'
        });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user can access unit data
const checkUnitAccess = async (req, res, next) => {
  try {
    const { unitId } = req.params;
    const user = req.user;

    // Admin can access all units
    if (user.role === 'ADMIN') {
      return next();
    }

    // Leaders can access their own unit
    if (user.role === 'LEADER') {
      const unit = await prisma.unit.findUnique({
        where: { id: unitId }
      });

      if (!unit || unit.leaderId !== user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this unit'
        });
      }
    }

    // Members can only access their own unit
    if (user.role === 'MEMBER' && user.unitId !== unitId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this unit'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
  authorize,
  checkUnitAccess
};

