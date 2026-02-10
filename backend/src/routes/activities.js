const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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
  getEnhancedActivityStats,
  // Attendance management
  getAttendanceList,
  reportAbsent,
  updateAttendanceStatus,
  batchCheckIn
} = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for activity attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/activities/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'activity-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  }
});

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

// Attendance management
router.get('/:id/attendance', authorize('ADMIN', 'LEADER'), getAttendanceList);
router.post('/:id/report-absent', reportAbsent);
router.put('/:id/attendance/:participantId', authorize('ADMIN', 'LEADER'), updateAttendanceStatus);
router.post('/:id/batch-checkin', authorize('ADMIN', 'LEADER'), batchCheckIn);

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

// File upload for activity attachments (conclusion documents)
router.post('/upload-attachment', authorize('ADMIN', 'LEADER'), upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const fileUrls = req.files.map(file => `/uploads/activities/${file.filename}`);
    
    res.status(200).json({
      success: true,
      data: {
        files: req.files.map((file, index) => ({
          url: fileUrls[index],
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype
        }))
      },
      message: 'Files uploaded successfully'
    });
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload files'
    });
  }
});

module.exports = router;

