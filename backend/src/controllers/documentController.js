const prisma = require('../lib/prisma');

// Document System Controllers for Module 3.5

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private
const getDocuments = async (req, res, next) => {
  try {
    const { documentType, status, search, limit = 20 } = req.query;
    const userId = req.user.id;

    let whereClause = {
      status: { not: 'DRAFT' } // Don't show drafts to regular users
    };

    // Admin/Leader can see all documents including drafts
    if (req.user.role === 'ADMIN' || req.user.role === 'LEADER') {
      delete whereClause.status;
    }

    if (documentType && documentType !== 'all') {
      whereClause.documentType = documentType;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { documentNumber: { contains: search, mode: 'insensitive' } },
        { issuer: { contains: search, mode: 'insensitive' } }
      ];
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        },
        unit: {
          select: {
            id: true,
            name: true
          }
        },
        favorites: {
          where: { userId },
          select: { id: true }
        }
      },
      orderBy: { issuedDate: 'desc' },
      take: parseInt(limit)
    });

    const documentsWithFavorites = documents.map(doc => ({
      ...doc,
      isFavorited: doc.favorites.length > 0,
      favorites: undefined
    }));

    res.status(200).json({
      success: true,
      data: documentsWithFavorites
    });

  } catch (error) {
    console.error('Get documents error:', error);
    next(error);
  }
};

// @desc    Get single document details
// @route   GET /api/documents/:id
// @access  Private
const getDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        },
        unit: {
          select: {
            id: true,
            name: true
          }
        },
        favorites: {
          where: { userId },
          select: { id: true }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check if user can view this document
    if (document.status === 'DRAFT' && 
        document.authorId !== userId && 
        req.user.role !== 'ADMIN' && 
        req.user.role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this document'
      });
    }

    // Record view
    await prisma.documentView.create({
      data: {
        documentId: id,
        userId: userId
      }
    });

    // Increment view count
    await prisma.document.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    const documentWithFavorite = {
      ...document,
      isFavorited: document.favorites.length > 0,
      favorites: undefined
    };

    res.status(200).json({
      success: true,
      data: documentWithFavorite
    });

  } catch (error) {
    console.error('Get document error:', error);
    next(error);
  }
};

// @desc    Download document file
// @route   GET /api/documents/:id/download
// @access  Private
const downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        fileName: true,
        fileUrl: true,
        status: true,
        authorId: true
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check permissions
    if (document.status === 'DRAFT' && 
        document.authorId !== req.user.id && 
        req.user.role !== 'ADMIN' && 
        req.user.role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to download this document'
      });
    }

    // Increment download count
    await prisma.document.update({
      where: { id },
      data: { downloadCount: { increment: 1 } }
    });

    res.status(200).json({
      success: true,
      data: {
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        title: document.title
      }
    });

  } catch (error) {
    console.error('Download document error:', error);
    next(error);
  }
};

// @desc    Toggle document favorite
// @route   POST /api/documents/:id/favorite
// @access  Private
const toggleDocumentFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check if already favorited
    const existingFavorite = await prisma.userDocumentFavorite.findUnique({
      where: {
        userId_documentId: {
          userId,
          documentId: id
        }
      }
    });

    if (existingFavorite) {
      // Remove from favorites
      await prisma.userDocumentFavorite.delete({
        where: { id: existingFavorite.id }
      });

      res.status(200).json({
        success: true,
        data: { isFavorited: false }
      });
    } else {
      // Add to favorites
      await prisma.userDocumentFavorite.create({
        data: {
          userId,
          documentId: id
        }
      });

      res.status(201).json({
        success: true,
        data: { isFavorited: true }
      });
    }

  } catch (error) {
    console.error('Toggle document favorite error:', error);
    next(error);
  }
};

// @desc    Get user's favorite documents
// @route   GET /api/documents/favorites
// @access  Private
const getFavoriteDocuments = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const favorites = await prisma.userDocumentFavorite.findMany({
      where: { userId },
      include: {
        document: {
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                role: true
              }
            },
            unit: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const documents = favorites.map(fav => ({
      ...fav.document,
      isFavorited: true
    }));

    res.status(200).json({
      success: true,
      data: documents
    });

  } catch (error) {
    console.error('Get favorite documents error:', error);
    next(error);
  }
};

// @desc    Create new document (Admin/Leader only)
// @route   POST /api/documents
// @access  Private (Admin/Leader)
const createDocument = async (req, res, next) => {
  try {
    const {
      title,
      documentNumber,
      documentType,
      issuer,
      description,
      content,
      fileUrl,
      fileName,
      fileSize,
      issuedDate,
      effectiveDate,
      expiryDate,
      unitId,
      tags,
      sendNotification = false
    } = req.body;

    const document = await prisma.document.create({
      data: {
        title,
        documentNumber,
        documentType,
        issuer,
        description,
        content,
        fileUrl,
        fileName,
        fileSize,
        issuedDate: issuedDate ? new Date(issuedDate) : null,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        authorId: req.user.id,
        unitId,
        tags,
        status: 'PUBLISHED',
        isNotificationSent: sendNotification
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        },
        unit: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // TODO: Send notification if requested
    if (sendNotification) {
      // Implementation for sending notifications would go here
    }

    res.status(201).json({
      success: true,
      data: document
    });

  } catch (error) {
    console.error('Create document error:', error);
    next(error);
  }
};

// @desc    Update document (Admin/Leader only)
// @route   PUT /api/documents/:id
// @access  Private (Admin/Leader)
const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingDocument = await prisma.document.findUnique({
      where: { id }
    });

    if (!existingDocument) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check permissions
    if (existingDocument.authorId !== userId && 
        req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this document'
      });
    }

    const {
      title,
      documentNumber,
      documentType,
      issuer,
      description,
      content,
      fileUrl,
      fileName,
      fileSize,
      issuedDate,
      effectiveDate,
      expiryDate,
      unitId,
      tags,
      status,
      sendNotification = false
    } = req.body;

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        title,
        documentNumber,
        documentType,
        issuer,
        description,
        content,
        fileUrl,
        fileName,
        fileSize,
        issuedDate: issuedDate ? new Date(issuedDate) : undefined,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        unitId,
        tags,
        status,
        isNotificationSent: sendNotification ? true : undefined
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        },
        unit: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: updatedDocument
    });

  } catch (error) {
    console.error('Update document error:', error);
    next(error);
  }
};

// @desc    Delete document (Admin only)
// @route   DELETE /api/documents/:id
// @access  Private (Admin)
const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Delete related records first
    await prisma.documentView.deleteMany({
      where: { documentId: id }
    });

    await prisma.userDocumentFavorite.deleteMany({
      where: { documentId: id }
    });

    // Delete document
    await prisma.document.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      data: { message: 'Document deleted successfully' }
    });

  } catch (error) {
    console.error('Delete document error:', error);
    next(error);
  }
};

// @desc    Get document statistics (Admin/Leader only)
// @route   GET /api/documents/admin/stats
// @access  Private (Admin/Leader)
const getDocumentStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    }

    const [
      totalDocuments,
      publishedDocuments,
      draftDocuments,
      totalViews,
      totalDownloads,
      documentsByType,
      topViewedDocuments
    ] = await Promise.all([
      prisma.document.count({ where: dateFilter }),
      prisma.document.count({ 
        where: { ...dateFilter, status: 'PUBLISHED' } 
      }),
      prisma.document.count({ 
        where: { ...dateFilter, status: 'DRAFT' } 
      }),
      prisma.document.aggregate({
        where: dateFilter,
        _sum: { viewCount: true }
      }),
      prisma.document.aggregate({
        where: dateFilter,
        _sum: { downloadCount: true }
      }),
      prisma.document.groupBy({
        by: ['documentType'],
        where: dateFilter,
        _count: { id: true }
      }),
      prisma.document.findMany({
        where: dateFilter,
        select: {
          id: true,
          title: true,
          viewCount: true,
          downloadCount: true
        },
        orderBy: { viewCount: 'desc' },
        take: 10
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalDocuments,
        publishedDocuments,
        draftDocuments,
        totalViews: totalViews._sum.viewCount || 0,
        totalDownloads: totalDownloads._sum.downloadCount || 0,
        documentsByType,
        topViewedDocuments
      }
    });

  } catch (error) {
    console.error('Get document stats error:', error);
    next(error);
  }
};

// @desc    Upload document file
// @route   POST /api/documents/upload/document
// @access  Admin/Leader
const uploadDocumentFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const fileUrl = `/uploads/documents/${req.file.filename}`;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;

    res.status(200).json({
      success: true,
      data: {
        fileUrl,
        fileName,
        fileSize
      }
    });

  } catch (error) {
    console.error('Upload document file error:', error);
    next(error);
  }
};

// @desc    Send document notification
// @route   POST /api/documents/:id/notify
// @access  Admin/Leader  
const sendDocumentNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type = 'all', userIds = [] } = req.body;

    // Get document
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    let recipients = [];

    if (type === 'all') {
      // Get all members
      recipients = await prisma.user.findMany({
        where: {
          role: 'MEMBER',
          isActive: true
        },
        select: {
          id: true,
          fullName: true,
          email: true
        }
      });
    } else if (type === 'specific' && userIds.length > 0) {
      // Get specific users
      recipients = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          isActive: true
        },
        select: {
          id: true,
          fullName: true,
          email: true
        }
      });
    }

    // Create notifications using generic Notification model
    const notificationPromises = recipients.map(user => 
      prisma.notification.create({
        data: {
          userId: user.id,
          title: `Văn bản mới: ${document.title}`,
          message: `${document.author.fullName} đã chia sẻ văn bản "${document.title}". Số hiệu: ${document.documentNumber || 'N/A'}`,
          type: 'DOCUMENT',
          relatedId: document.id,
          isRead: false
        }
      })
    );

    await Promise.all(notificationPromises);

    // Update document notification status
    await prisma.document.update({
      where: { id },
      data: {
        isNotificationSent: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        message: `Đã gửi thông báo đến ${recipients.length} đoàn viên`,
        recipientCount: recipients.length,
        sentCount: recipients.length,
        recipients: recipients.map(r => ({ id: r.id, fullName: r.fullName }))
      }
    });

  } catch (error) {
    console.error('Send document notification error:', error);
    next(error);
  }
};

module.exports = {
  getDocuments,
  getDocument,
  downloadDocument,
  toggleDocumentFavorite,
  getFavoriteDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentStats,
  uploadDocumentFile,
  sendDocumentNotification
};


