const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getLeaderboard,
  addPoints,
  subtractPoints,
  getPointsHistory,
  getUnits,
  getPointsConfig,
  updatePointsConfig
} = require('../controllers/pointsController');

const router = express.Router();

router.use(protect);

// Get leaderboard with stats
router.get('/leaderboard', getLeaderboard);

// Get points history
router.get('/history', getPointsHistory);

// Get units list
router.get('/units', getUnits);

// Get points config (Admin only)
router.get('/config', authorize('ADMIN'), getPointsConfig);

// Update points config (Admin only)
router.put('/config', authorize('ADMIN'), updatePointsConfig);

// Add points (Admin/Leader only)
router.post('/add', addPoints);

// Subtract points (Admin/Leader only)
router.post('/subtract', subtractPoints);

module.exports = router;


