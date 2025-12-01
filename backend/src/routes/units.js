const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Get units
router.get('/', (req, res) => {
  res.json({ message: 'Get units - TODO' });
});

// Create unit (Admin only)
router.post('/', authorize('ADMIN'), (req, res) => {
  res.json({ message: 'Create unit - TODO' });
});

module.exports = router;

