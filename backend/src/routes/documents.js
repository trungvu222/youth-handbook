const express = require('express');
const {
  getDocuments,
  getDocument,
  downloadDocument,
  toggleDocumentFavorite,
  getFavoriteDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentStats,
  sendDocumentNotification,
  uploadDocumentFile
} = require('../controllers/documentController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('[Documents] Created upload directory:', uploadDir);
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    // Allowed extensions
    const allowedExtensions = /\.(pdf|doc|docx|xls|xlsx)$/i;
    const extValid = allowedExtensions.test(file.originalname);
    
    // Allowed mimetypes
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const mimeValid = allowedMimes.includes(file.mimetype);
    
    console.log('[Upload] File:', file.originalname, 'Mimetype:', file.mimetype, 'ExtValid:', extValid, 'MimeValid:', mimeValid);
    
    if (extValid || mimeValid) {
      return cb(null, true);
    }
    cb(new Error('Chỉ hỗ trợ file PDF, Word và Excel'));
  }
});

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public routes (for authenticated users)
router.route('/')
  .get(getDocuments)
  .post(authorize('ADMIN', 'LEADER'), createDocument);

router.get('/favorites', getFavoriteDocuments);

router.route('/:id')
  .get(getDocument)
  .put(authorize('ADMIN', 'LEADER'), updateDocument)
  .delete(authorize('ADMIN'), deleteDocument);

router.get('/:id/download', downloadDocument);
router.post('/:id/favorite', toggleDocumentFavorite);
router.post('/:id/notify', authorize('ADMIN', 'LEADER'), sendDocumentNotification);

// Admin routes
router.get('/admin/stats', authorize('ADMIN', 'LEADER'), getDocumentStats);
router.post('/upload/document', authorize('ADMIN', 'LEADER'), upload.single('file'), uploadDocumentFile);

module.exports = router;