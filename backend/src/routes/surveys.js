const express = require('express');
const {
  getSurveys,
  getSurvey,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  getSurveyStats,
  getSurveyResponses,
  submitSurveyResponse
} = require('../controllers/surveyController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Admin routes (must be before /:id routes)
router.get('/admin/stats', authorize('ADMIN', 'LEADER'), getSurveyStats);

// Public routes
router.route('/')
  .get(getSurveys)
  .post(authorize('ADMIN', 'LEADER'), createSurvey);

router.route('/:id')
  .get(getSurvey)
  .put(authorize('ADMIN', 'LEADER'), updateSurvey)
  .delete(authorize('ADMIN'), deleteSurvey);

router.get('/:id/responses', authorize('ADMIN', 'LEADER'), getSurveyResponses);

// Submit survey response (all users)
router.post('/:id/submit', submitSurveyResponse);

module.exports = router;

