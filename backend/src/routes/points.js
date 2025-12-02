const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getLeaderboard,
  addPoints,
  subtractPoints,
  getPointsHistory,
  getUnits
} = require('../controllers/pointsController');

const router = express.Router();

router.use(protect);

// Get leaderboard with stats
router.get('/leaderboard', getLeaderboard);

// Get points history
router.get('/history', getPointsHistory);

// Get units list
router.get('/units', getUnits);

// Add points (Admin/Leader only)
router.post('/add', addPoints);

// Subtract points (Admin/Leader only)
router.post('/subtract', subtractPoints);

module.exports = router;


