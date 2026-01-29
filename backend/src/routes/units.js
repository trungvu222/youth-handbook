const express = require('express');
const {
  getUnits,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit,
  getUnitStats
} = require('../controllers/unitController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Get units stats (Admin only)
router.get('/stats', authorize('ADMIN'), getUnitStats);

// Get all units
router.get('/', getUnits);

// Get single unit
router.get('/:id', getUnit);

// Create unit (Admin only)
router.post('/', authorize('ADMIN'), createUnit);

// Update unit (Admin only)
router.put('/:id', authorize('ADMIN'), updateUnit);

// Delete unit (Admin only)
router.delete('/:id', authorize('ADMIN'), deleteUnit);

module.exports = router;

