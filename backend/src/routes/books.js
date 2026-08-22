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
  getBookByQR,
  getMyBorrowings,
  createManualBorrowings,
  updateBorrowing,
  deleteBorrowing
} = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Admin stats route (must be before /:id to avoid conflict)
router.get('/admin/stats', authorize('ADMIN', 'LEADER'), getBorrowingStats);

// Admin manual borrowing routes
router.post('/admin/borrowings', authorize('ADMIN', 'LEADER'), createManualBorrowings);
router.put('/admin/borrowings/:id', authorize('ADMIN', 'LEADER'), updateBorrowing);
router.delete('/admin/borrowings/:id', authorize('ADMIN', 'LEADER'), deleteBorrowing);

// My borrowings route
router.get('/my-borrows', getMyBorrowings);

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
