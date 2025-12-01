const express = require('express');
const {
  getUserProfile,
  getUsers,
  updateUserProfile,
  assignUserToUnit,
  changeUserRole
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

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

// @route   PUT /api/users/:id/unit
// @desc    Assign user to unit (Admin only)
// @access  Private
router.put('/:id/unit', assignUserToUnit);

// @route   PUT /api/users/:id/role
// @desc    Change user role (Admin only)
// @access  Private
router.put('/:id/role', changeUserRole);

module.exports = router;