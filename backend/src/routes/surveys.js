const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', (req, res) => {
  res.json({ message: 'Get surveys - TODO' });
});

router.post('/', authorize('ADMIN', 'LEADER'), (req, res) => {
  res.json({ message: 'Create survey - TODO' });
});

module.exports = router;

