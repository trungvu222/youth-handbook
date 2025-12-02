const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// @desc    Get user profile by ID (Admin/Leader access)
// @route   GET /api/users/:id
// @access  Private (Admin/Leader)
const getUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Check permissions
    if (currentUser.role === 'MEMBER') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only Admin and Leader can view other profiles.'
      });
    }

    // Leader can only view users in their unit
    if (currentUser.role === 'LEADER') {
      const targetUser = await prisma.user.findUnique({
        where: { id },
        include: { unit: true }
      });

      if (!targetUser || targetUser.unitId !== currentUser.unitId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Leaders can only view users in their unit.'
        });
      }
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        unit: true,
        pointsHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const { passwordHash, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with filters (Admin/Leader access)
// @route   GET /api/users
// @access  Private (Admin/Leader)
const getUsers = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const { 
      unitId, 
      role, 
      search, 
      page = 1, 
      limit = 20,
      sortBy = 'fullName',
      sortOrder = 'asc'
    } = req.query;

    // Check permissions
    if (currentUser.role === 'MEMBER') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only Admin and Leader can view user lists.'
      });
    }

    let whereClause = {};

    // Leader can only see users in their unit
    if (currentUser.role === 'LEADER') {
      whereClause.unitId = currentUser.unitId;
    } else if (unitId) {
      // Admin can filter by unit
      whereClause.unitId = unitId;
    }

    // Add filters
    if (role) {
      whereClause.role = role;
    }

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          unit: true
        },
        skip,
        take: parseInt(limit),
        orderBy: {
          [sortBy]: sortOrder
        }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    // Remove password hashes
    const usersWithoutPasswords = users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.status(200).json({
      success: true,
      users: usersWithoutPasswords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile (Admin/Leader access)
// @route   PUT /api/users/:id
// @access  Private (Admin/Leader)
const updateUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const updateData = req.body;

    // Check permissions
    if (currentUser.role === 'MEMBER') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only Admin and Leader can update other profiles.'
      });
    }

    // Leader can only update users in their unit
    if (currentUser.role === 'LEADER') {
      const targetUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!targetUser || targetUser.unitId !== currentUser.unitId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Leaders can only update users in their unit.'
        });
      }

      // Leaders cannot change roles or assign to different units
      delete updateData.role;
      delete updateData.unitId;
    }

    // Validate email uniqueness if changing
    if (updateData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          NOT: { id }
        }
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

    const updatedUser = await prisma.user.update({
      where: { id },
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

// @desc    Assign user to unit (Admin only)
// @route   PUT /api/users/:id/unit
// @access  Private (Admin only)
const assignUserToUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { unitId } = req.body;
    const currentUser = req.user;

    // Only admin can assign units
    if (currentUser.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only Admin can assign users to units.'
      });
    }

    // Verify unit exists
    if (unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: unitId }
      });

      if (!unit) {
        return res.status(404).json({
          success: false,
          error: 'Unit not found'
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { unitId },
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

// @desc    Change user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private (Admin only)
const changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const currentUser = req.user;

    // Only admin can change roles
    if (currentUser.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only Admin can change user roles.'
      });
    }

    // Validate role
    if (!['ADMIN', 'LEADER', 'MEMBER'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be ADMIN, LEADER, or MEMBER.'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
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

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Only admin can delete users
    if (currentUser.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only Admin can delete users.'
      });
    }

    // Cannot delete yourself
    if (id === currentUser.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account.'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user password
// @route   PUT /api/users/:id/password
// @access  Private (User can change own password, Admin can change any)
const changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    const currentUser = req.user;

    // Check if user can change this password
    const isSelf = currentUser.id === parseInt(id);
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only change your own password.'
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // If changing own password, verify current password
    if (isSelf) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { passwordHash }
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  getUsers,
  updateUserProfile,
  assignUserToUnit,
  changeUserRole,
  deleteUser,
  changePassword
};

