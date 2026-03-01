const express = require('express');
const {
  getExams,
  getExam,
  startExamAttempt,
  submitExamAttempt,
  getExamLeaderboard,
  createExam,
  updateExam,
  deleteExam,
  getExamStats,
  getExamAttempts,
  getPendingGrading,
  gradeExamAttempt
} = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Admin routes (must be before /:id routes to avoid conflicts)
router.get('/admin/stats', authorize('ADMIN', 'LEADER'), getExamStats);
router.get('/admin/pending-grading', authorize('ADMIN', 'LEADER'), getPendingGrading);

// Public routes (for authenticated users)
router.route('/')
  .get(getExams)
  .post(authorize('ADMIN', 'LEADER'), createExam);

router.route('/:id')
  .get(getExam)
  .put(authorize('ADMIN', 'LEADER'), updateExam)
  .delete(authorize('ADMIN'), deleteExam);

router.post('/:id/start', startExamAttempt);
router.get('/:id/leaderboard', getExamLeaderboard);
router.get('/:id/attempts', authorize('ADMIN', 'LEADER'), getExamAttempts);

// Exam attempt routes
router.post('/attempts/:attemptId/submit', submitExamAttempt);
router.post('/attempts/:attemptId/grade', authorize('ADMIN', 'LEADER'), gradeExamAttempt);

module.exports = router;


