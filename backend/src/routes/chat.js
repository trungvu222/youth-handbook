const express = require('express');
const { chatWithAI } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// POST /api/chat - Send message to AI and get response
router.post('/', chatWithAI);

module.exports = router;
