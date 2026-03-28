const express = require('express');
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  borrowBook,
  returnBook,
  getBorrowingStats,
  getBookByQR
} = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Admin stats route (must be before /:id to avoid conflict)
router.get('/admin/stats', authorize('ADMIN', 'LEADER'), getBorrowingStats);

// Scan QR route
router.get('/scan/:qrCode', getBookByQR);

// CRUD routes
router.route('/')
  .get(getBooks)
  .post(authorize('ADMIN', 'LEADER'), createBook);

router.route('/:id')
  .get(getBook)
  .put(authorize('ADMIN', 'LEADER'), updateBook)
  .delete(authorize('ADMIN'), deleteBook);

// Borrow book
router.post('/:id/borrow', borrowBook);

// Return book
router.post('/borrowings/:borrowingId/return', returnBook);

module.exports = router;
