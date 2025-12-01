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
  getDocumentStats
} = require('../controllers/documentController');
const { protect, authorize } = require('../middleware/auth');

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

// Admin routes
router.get('/admin/stats', authorize('ADMIN', 'LEADER'), getDocumentStats);

module.exports = router;