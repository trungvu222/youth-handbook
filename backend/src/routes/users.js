const express = require('express');
const {
  getUserProfile,
  getUsers,
  updateUserProfile,
  assignUserToUnit,
  changeUserRole,
  changePassword
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// @route   GET /api/users
// @desc    Get all users with filters (Admin/Leader)
// @access  Private
router.get('/', getUsers);

// @route   GET /api/users/:id
// @desc    Get user profile by ID (Admin/Leader)
// @access  Private
router.get('/:id', getUserProfile);

// @route   PUT /api/users/:id
// @desc    Update user profile (Admin/Leader)
// @access  Private
router.put('/:id', updateUserProfile);

// @route   DELETE /api/users/:id
// @desc    Soft delete user (Admin only) - marks as inactive
// @access  Private
router.delete('/:id', async (req, res) => {
  console.log('=== INLINE SOFT DELETE CALLED ===');
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
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // SOFT DELETE: Mark as inactive
    const timestamp = Date.now();
    await prisma.user.update({
      where: { id },
      data: { 
        isActive: false,
        email: `deleted_${timestamp}_${id.slice(0,8)}@deleted.local`,
        username: `deleted_${timestamp}_${user.username}`,
        phone: null
      }
    });

    console.log('[Soft Delete] User deactivated:', id);
    res.status(200).json({
      success: true,
      message: 'Đoàn viên đã được vô hiệu hóa thành công'
    });
  } catch (error) {
    console.error('[Delete Error]:', error.message);
    res.status(500).json({
      success: false,
      error: 'Không thể xóa đoàn viên: ' + error.message
    });
  }
});

// @route   PUT /api/users/:id/password
// @desc    Change user password
// @access  Private
router.put('/:id/password', changePassword);

// @route   PUT /api/users/:id/unit
// @desc    Assign user to unit (Admin only)
// @access  Private
router.put('/:id/unit', assignUserToUnit);

// @route   PUT /api/users/:id/role
// @desc    Change user role (Admin only)
// @access  Private
router.put('/:id/role', changeUserRole);

module.exports = router;