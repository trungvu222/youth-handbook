const express = require('express');
const {
  getExams,
  getExam,
  startExamAttempt,
  submitExamAttempt,
  getExamLeaderboard,
  createExam,
  getExamStats
} = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public routes (for authenticated users)
router.route('/')
  .get(getExams)
  .post(authorize('ADMIN', 'LEADER'), createExam);

router.route('/:id')
  .get(getExam);

router.post('/:id/start', startExamAttempt);
router.get('/:id/leaderboard', getExamLeaderboard);

// Exam attempt routes
router.post('/attempts/:attemptId/submit', submitExamAttempt);

// Admin routes
router.get('/admin/stats', authorize('ADMIN', 'LEADER'), getExamStats);

module.exports = router;


