const express = require('express');
const {
  // User functions
  getStudyTopics,
  getStudyTopic,
  startStudyMaterial,
  updateMaterialProgress,
  getQuiz,
  submitQuizAttempt,
  getMyStudyProgress,
  getStudyLeaderboard,
  
  // Admin functions
  createStudyTopic,
  getStudyStats
} = require('../controllers/studyController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);


// Study topics - back to controller
router.route('/topics')
  .get(getStudyTopics)
  .post(authorize('ADMIN'), createStudyTopic);

router.route('/topics/:id')
  .get(getStudyTopic);

// Study materials
router.post('/materials/:materialId/start', startStudyMaterial);
router.put('/materials/:materialId/progress', updateMaterialProgress);

// Quiz system
router.get('/materials/:materialId/quiz', getQuiz);
router.post('/quiz/:quizId/submit', submitQuizAttempt);

// User progress and statistics
router.get('/my-progress', getMyStudyProgress);
router.get('/leaderboard', getStudyLeaderboard);

// Admin routes
router.get('/admin/stats', authorize('ADMIN'), getStudyStats);

module.exports = router;