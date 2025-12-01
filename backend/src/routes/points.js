const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/leaderboard', (req, res) => {
  res.json({ message: 'Get leaderboard - TODO' });
});

router.get('/history', (req, res) => {
  res.json({ message: 'Get points history - TODO' });
});

module.exports = router;


