const prisma = require('../lib/prisma');
const crypto = require('crypto');

// Helper: Generate unique QR code for book
const generateBookQRCode = (bookId) => {
  const data = `BOOK-${bookId}-${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16).toUpperCase();
};

// @desc    Get all books
// @route   GET /api/books
// @access  Private
const getBooks = async (req, res, next) => {
  try {
    const { search, limit = 50 } = req.query;

    let whereClause = {};

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { publisher: { contains: search, mode: 'insensitive' } }
      ];
    }

    const books = await prisma.book.findMany({
      where: whereClause,
      include: {
        borrowings: {
          where: { returnedAt: null },
          include: {
            user: {
              select: { id: true, fullName: true }
            }
          },
          orderBy: { borrowedAt: 'desc' },
          take: 1
        },
        _count: {
          select: { borrowings: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    const booksWithStatus = books.map(book => ({
      ...book,
      isBorrowed: book.borrowings.length > 0,
      currentBorrower: book.borrowings[0]?.user || null,
      borrowedAt: book.borrowings[0]?.borrowedAt || null,
      totalBorrowings: book._count?.borrowings || 0,
      borrowings: undefined,
      _count: undefined
    }));

    res.status(200).json({
      success: true,
      data: booksWithStatus
    });

  } catch (error) {
    console.error('Get books error:', error);
    next(error);
  }
};

// @desc    Get single book by ID or QR code
// @route   GET /api/books/:id
// @access  Private
const getBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try to find by ID first, then by QR code
    let book = await prisma.book.findUnique({
      where: { id },
      include: {
        borrowings: {
          include: {
            user: {
              select: { id: true, fullName: true, unit: { select: { name: true } } }
            }
          },
          orderBy: { borrowedAt: 'desc' },
          take: 10
        }
      }
    });

    // If not found by ID, try QR code
    if (!book) {
      book = await prisma.book.findUnique({
        where: { qrCode: id },
        include: {
          borrowings: {
            include: {
              user: {
                select: { id: true, fullName: true, unit: { select: { name: true } } }
              }
            },
            orderBy: { borrowedAt: 'desc' },
            take: 10
          }
        }
      });
    }

    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy sách'
      });
    }

    const currentBorrowing = book.borrowings.find(b => !b.returnedAt);

    res.status(200).json({
      success: true,
      data: {
        ...book,
        isBorrowed: !!currentBorrowing,
        currentBorrower: currentBorrowing?.user || null,
        currentBorrowedAt: currentBorrowing?.borrowedAt || null
      }
    });

  } catch (error) {
    console.error('Get book error:', error);
    next(error);
  }
};

// @desc    Create new book
// @route   POST /api/books
// @access  Private (Admin/Leader)
const createBook = async (req, res, next) => {
  try {
    const { title, author, publisher } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập tên sách'
      });
    }

    // Create book first to get ID
    const tempId = crypto.randomBytes(8).toString('hex');
    const qrCode = generateBookQRCode(tempId);

    const book = await prisma.book.create({
      data: {
        title,
        author,
        publisher,
        qrCode
      }
    });

    console.log('📚 Created book:', { id: book.id, title: book.title, qrCode: book.qrCode });

    res.status(201).json({
      success: true,
      data: book
    });

  } catch (error) {
    console.error('Create book error:', error);
    next(error);
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Admin/Leader)
const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, author, publisher } = req.body;

    const book = await prisma.book.findUnique({
      where: { id }
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy sách'
      });
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        title: title !== undefined ? title : book.title,
        author: author !== undefined ? author : book.author,
        publisher: publisher !== undefined ? publisher : book.publisher
      }
    });

    res.status(200).json({
      success: true,
      data: updatedBook
    });

  } catch (error) {
    console.error('Update book error:', error);
    next(error);
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Admin)
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        borrowings: {
          where: { returnedAt: null }
        }
      }
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy sách'
      });
    }

    if (book.borrowings.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Không thể xóa sách đang được mượn'
      });
    }

    // Delete borrowings first, then book
    await prisma.$transaction([
      prisma.bookBorrowing.deleteMany({ where: { bookId: id } }),
      prisma.book.delete({ where: { id } })
    ]);

    res.status(200).json({
      success: true,
      message: 'Đã xóa sách thành công'
    });

  } catch (error) {
    console.error('Delete book error:', error);
    next(error);
  }
};

// @desc    Borrow book (User scans QR)
// @route   POST /api/books/:id/borrow
// @access  Private
const borrowBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { qrCode, returnDate } = req.body;
    const userId = req.user.id;

    // Find book by ID or QR code
    let book = await prisma.book.findUnique({
      where: { id },
      include: {
        borrowings: {
          where: { returnedAt: null }
        }
      }
    });

    // Try QR code if not found by ID
    if (!book && qrCode) {
      book = await prisma.book.findUnique({
        where: { qrCode },
        include: {
          borrowings: {
            where: { returnedAt: null }
          }
        }
      });
    }

    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy sách'
      });
    }

    // Check if book is already borrowed
    if (book.borrowings.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Sách đã được mượn bởi người khác'
      });
    }

    // Create borrowing record
    const borrowing = await prisma.bookBorrowing.create({
      data: {
        bookId: book.id,
        userId,
        borrowedAt: new Date(),
        returnedAt: returnDate ? new Date(returnDate) : null
      },
      include: {
        book: true,
        user: {
          select: { id: true, fullName: true }
        }
      }
    });

    console.log('📖 Book borrowed:', {
      bookTitle: book.title,
      borrower: borrowing.user.fullName,
      borrowedAt: borrowing.borrowedAt
    });

    res.status(201).json({
      success: true,
      data: borrowing,
      message: `Đã mượn sách "${book.title}" thành công`
    });

  } catch (error) {
    console.error('Borrow book error:', error);
    next(error);
  }
};

// @desc    Return book
// @route   POST /api/books/borrowings/:borrowingId/return
// @access  Private
const returnBook = async (req, res, next) => {
  try {
    const { borrowingId } = req.params;
    const userId = req.user.id;

    const borrowing = await prisma.bookBorrowing.findUnique({
      where: { id: borrowingId },
      include: {
        book: true,
        user: true
      }
    });

    if (!borrowing) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bản ghi mượn sách'
      });
    }

    // Only the borrower or admin can return the book
    if (borrowing.userId !== userId && req.user.role !== 'ADMIN' && req.user.role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền trả sách này'
      });
    }

    if (borrowing.returnedAt) {
      return res.status(400).json({
        success: false,
        error: 'Sách đã được trả trước đó'
      });
    }

    const updatedBorrowing = await prisma.bookBorrowing.update({
      where: { id: borrowingId },
      data: {
        returnedAt: new Date()
      },
      include: {
        book: true,
        user: {
          select: { id: true, fullName: true }
        }
      }
    });

    console.log('📗 Book returned:', {
      bookTitle: borrowing.book.title,
      borrower: borrowing.user.fullName,
      returnedAt: updatedBorrowing.returnedAt
    });

    res.status(200).json({
      success: true,
      data: updatedBorrowing,
      message: `Đã trả sách "${borrowing.book.title}" thành công`
    });

  } catch (error) {
    console.error('Return book error:', error);
    next(error);
  }
};

// @desc    Get borrowing statistics (Admin)
// @route   GET /api/books/admin/stats
// @access  Private (Admin/Leader)
const getBorrowingStats = async (req, res, next) => {
  try {
    const { status } = req.query;

    let whereClause = {};

    if (status === 'borrowed') {
      whereClause.returnedAt = null;
    } else if (status === 'returned') {
      whereClause.returnedAt = { not: null };
    }

    const [
      totalBooks,
      totalBorrowings,
      currentlyBorrowed,
      borrowings
    ] = await Promise.all([
      prisma.book.count(),
      prisma.bookBorrowing.count(),
      prisma.bookBorrowing.count({ where: { returnedAt: null } }),
      prisma.bookBorrowing.findMany({
        where: whereClause,
        include: {
          book: {
            select: { id: true, title: true, author: true, publisher: true }
          },
          user: {
            select: { id: true, fullName: true, unit: { select: { name: true } } }
          }
        },
        orderBy: { borrowedAt: 'desc' },
        take: 100
      })
    ]);

    const formattedBorrowings = borrowings.map((b, index) => ({
      stt: index + 1,
      id: b.id,
      borrower: b.user.fullName,
      borrowerUnit: b.user.unit?.name || '',
      bookTitle: b.book.title,
      author: b.book.author || '',
      publisher: b.book.publisher || '',
      borrowedAt: b.borrowedAt,
      returnedAt: b.returnedAt,
      status: b.returnedAt ? 'Đã trả' : 'Đang mượn'
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalBooks,
          totalBorrowings,
          currentlyBorrowed,
          returned: totalBorrowings - currentlyBorrowed
        },
        borrowings: formattedBorrowings
      }
    });

  } catch (error) {
    console.error('Get borrowing stats error:', error);
    next(error);
  }
};

// @desc    Get book by QR code (for scanning)
// @route   GET /api/books/scan/:qrCode
// @access  Private
const getBookByQR = async (req, res, next) => {
  try {
    const { qrCode } = req.params;

    const book = await prisma.book.findUnique({
      where: { qrCode },
      include: {
        borrowings: {
          where: { returnedAt: null },
          include: {
            user: {
              select: { id: true, fullName: true }
            }
          }
        }
      }
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy sách với mã QR này'
      });
    }

    const currentBorrowing = book.borrowings[0];

    res.status(200).json({
      success: true,
      data: {
        id: book.id,
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        qrCode: book.qrCode,
        isBorrowed: !!currentBorrowing,
        currentBorrower: currentBorrowing?.user || null,
        currentBorrowedAt: currentBorrowing?.borrowedAt || null
      }
    });

  } catch (error) {
    console.error('Get book by QR error:', error);
    next(error);
  }
};

module.exports = {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  borrowBook,
  returnBook,
  getBorrowingStats,
  getBookByQR
};
