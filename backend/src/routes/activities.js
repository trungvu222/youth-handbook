const express = require('express');
const {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  joinActivity,
  checkInActivity,
  getActivityStats,
  submitFeedback,
  respondToFeedback,
  // Enhanced Module 3.3 methods
  checkInWithGPS,
  getActivitySurveys,
  submitSurveyResponse,
  getEnhancedActivityStats
} = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Activity CRUD
router.route('/')
  .get(getActivities)
  .post(authorize('ADMIN', 'LEADER'), createActivity);

router.route('/:id')
  .get(getActivity)
  .put(authorize('ADMIN', 'LEADER'), updateActivity)
  .delete(authorize('ADMIN', 'LEADER'), deleteActivity);

// Activity participation
router.post('/:id/join', joinActivity);
router.post('/:id/checkin', checkInActivity);

// Activity statistics (Admin/Leader only)
router.get('/:id/stats', authorize('ADMIN', 'LEADER'), getActivityStats);

// Activity feedback
router.post('/:id/feedback', submitFeedback);
router.put('/feedback/:feedbackId', authorize('ADMIN', 'LEADER'), respondToFeedback);

// Enhanced Module 3.3 - Advanced Activity Management
router.post('/:id/checkin-gps', checkInWithGPS);
router.get('/:id/surveys', getActivitySurveys);
router.post('/:id/surveys/:surveyId/responses', submitSurveyResponse);
router.get('/:id/enhanced-stats', authorize('ADMIN', 'LEADER'), getEnhancedActivityStats);

module.exports = router;

