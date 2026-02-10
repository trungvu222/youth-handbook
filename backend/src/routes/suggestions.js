const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { protect: auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/suggestions/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'), false);
    }
  }
});

// Get suggestions
router.get('/', auth, async (req, res) => {
  try {
    const { category, status, search, myOnly, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { tags: { contains: search } }
      ];
    }
    
    if (myOnly === 'true') {
      where.userId = req.user.id;
    }

    const [suggestions, total] = await Promise.all([
      prisma.suggestion.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              unit: {
                select: {
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              responses: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        take: parseInt(limit),
        skip: offset
      }),
      prisma.suggestion.count({ where })
    ]);

    // Transform data
    const transformedSuggestions = suggestions.map(suggestion => ({
      ...suggestion,
      user: suggestion.user ? {
        ...suggestion.user,
        unitName: suggestion.user.unit?.name
      } : null,
      responses: suggestion._count.responses
    }));

    res.json({
      success: true,
      data: {
        data: transformedSuggestions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tải danh sách kiến nghị'
    });
  }
});

// Get specific suggestion
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const suggestion = await prisma.suggestion.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            unit: {
              select: {
                name: true
              }
            }
          }
        },
        responses: {
          include: {
            responder: {
              select: {
                id: true,
                fullName: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy kiến nghị'
      });
    }

    // Update view count
    await prisma.suggestion.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });

    // Transform data
    const transformedSuggestion = {
      ...suggestion,
      user: suggestion.user ? {
        ...suggestion.user,
        unitName: suggestion.user.unit?.name
      } : null,
      viewCount: suggestion.viewCount + 1
    };

    res.json({
      success: true,
      data: transformedSuggestion
    });
  } catch (error) {
    console.error('Get suggestion error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tải kiến nghị'
    });
  }
});

// Create suggestion
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, category, priority, isAnonymous, fileUrls, tags } = req.body;

    const suggestion = await prisma.suggestion.create({
      data: {
        title,
        content,
        category,
        priority: priority || 'MEDIUM',
        isAnonymous: isAnonymous || false,
        userId: isAnonymous ? null : req.user.id,
        fileUrls,
        tags,
        status: 'SUBMITTED'
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            unit: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        ...suggestion,
        user: suggestion.user ? {
          ...suggestion.user,
          unitName: suggestion.user.unit?.name
        } : null
      }
    });
  } catch (error) {
    console.error('Create suggestion error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tạo kiến nghị'
    });
  }
});

// Update suggestion
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, priority, tags } = req.body;

    // Check if user owns this suggestion or is admin
    const existingSuggestion = await prisma.suggestion.findUnique({
      where: { id }
    });

    if (!existingSuggestion) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy kiến nghị'
      });
    }

    if (existingSuggestion.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền chỉnh sửa'
      });
    }

    const suggestion = await prisma.suggestion.update({
      where: { id },
      data: {
        title,
        content,
        category,
        priority,
        tags,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            unit: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        ...suggestion,
        user: suggestion.user ? {
          ...suggestion.user,
          unitName: suggestion.user.unit?.name
        } : null
      }
    });
  } catch (error) {
    console.error('Update suggestion error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể cập nhật kiến nghị'
    });
  }
});

// Delete suggestion
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user owns this suggestion or is admin
    const existingSuggestion = await prisma.suggestion.findUnique({
      where: { id }
    });

    if (!existingSuggestion) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy kiến nghị'
      });
    }

    if (existingSuggestion.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền xóa'
      });
    }

    await prisma.suggestion.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Đã xóa kiến nghị'
    });
  } catch (error) {
    console.error('Delete suggestion error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể xóa kiến nghị'
    });
  }
});

// Get my suggestions
router.get('/my-suggestions', auth, async (req, res) => {
  try {
    const suggestions = await prisma.suggestion.findMany({
      where: { userId: req.user.id },
      include: {
        _count: {
          select: {
            responses: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    const transformedSuggestions = suggestions.map(suggestion => ({
      ...suggestion,
      responses: suggestion._count.responses
    }));

    res.json({
      success: true,
      data: transformedSuggestions
    });
  } catch (error) {
    console.error('Get my suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tải kiến nghị của bạn'
    });
  }
});

// Admin APIs

// Get all suggestions (admin)
router.get('/admin/all', auth, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'ADMIN' && role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền truy cập'
      });
    }

    const { category, status, priority, search, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (priority && priority !== 'all') {
      where.priority = priority;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { tags: { contains: search } }
      ];
    }
    
    if (dateFrom || dateTo) {
      where.submittedAt = {};
      if (dateFrom) {
        where.submittedAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.submittedAt.lte = new Date(dateTo);
      }
    }

    const [suggestions, total] = await Promise.all([
      prisma.suggestion.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              unit: {
                select: {
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              responses: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        take: parseInt(limit),
        skip: offset
      }),
      prisma.suggestion.count({ where })
    ]);

    // Transform data
    const transformedSuggestions = suggestions.map(suggestion => ({
      ...suggestion,
      user: suggestion.user ? {
        ...suggestion.user,
        unitName: suggestion.user.unit?.name
      } : null,
      responses: suggestion._count.responses
    }));

    res.json({
      success: true,
      data: {
        data: transformedSuggestions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tải danh sách kiến nghị'
    });
  }
});

// Respond to suggestion
router.post('/:id/respond', auth, async (req, res) => {
  try {
    const { role } = req.user;
    
    console.log('📝 [Backend] Received respond request:', {
      suggestionId: req.params.id,
      userId: req.user.id,
      userRole: role,
      body: req.body
    });
    
    if (role !== 'ADMIN' && role !== 'LEADER') {
      console.log('❌ [Backend] Access denied - role:', role);
      return res.status(403).json({
        success: false,
        error: 'Không có quyền phản hồi'
      });
    }

    const { id } = req.params;
    const { content, isPublic, newStatus, sendNotification } = req.body;

    // Create response
    const response = await prisma.suggestionResponse.create({
      data: {
        suggestionId: id,
        content,
        isPublic: isPublic !== false,
        responderId: req.user.id
      },
      include: {
        responder: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        }
      }
    });

    console.log('✅ [Backend] Response created:', response.id);

    // Update suggestion status if provided
    if (newStatus) {
      await prisma.suggestion.update({
        where: { id },
        data: {
          status: newStatus,
          resolvedAt: newStatus === 'RESOLVED' ? new Date() : null
        }
      });
      console.log('✅ [Backend] Suggestion status updated to:', newStatus);
    }

    // Send notification to user if sendNotification is true
    let notificationSent = 0;
    if (sendNotification) {
      try {
        // Get the suggestion to find the user
        const suggestion = await prisma.suggestion.findUnique({
          where: { id },
          select: { userId: true, title: true }
        });
        
        if (suggestion?.userId) {
          // Get status label for notification
          const statusLabels = {
            'UNDER_REVIEW': 'Đang xem xét',
            'IN_PROGRESS': 'Đang xử lý',
            'RESOLVED': 'Đã giải quyết',
            'REJECTED': 'Bị từ chối'
          };
          const statusLabel = statusLabels[newStatus] || newStatus;
          
          await prisma.notification.create({
            data: {
              userId: suggestion.userId,
              title: '📝 Phản hồi kiến nghị',
              message: `Kiến nghị "${suggestion.title}" của bạn đã được phản hồi. Trạng thái: ${statusLabel}`,
              type: 'SUGGESTION',
              relatedId: id
            }
          });
          notificationSent = 1;
          console.log('📧 [Backend] Notification sent to user:', suggestion.userId);
        }
      } catch (notifError) {
        console.error('❌ [Backend] Error sending notification:', notifError);
      }
    }

    console.log('📤 [Backend] Sending success response');

    res.json({
      success: true,
      data: response,
      newStatus: newStatus,
      notificationSent: notificationSent
    });
  } catch (error) {
    console.error('Respond to suggestion error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể gửi phản hồi'
    });
  }
});

// Update suggestion status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'ADMIN' && role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền cập nhật trạng thái'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const suggestion = await prisma.suggestion.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === 'RESOLVED' ? new Date() : null
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            unit: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Send notification to user about status change
    let notificationSent = 0;
    if (suggestion.user?.id) {
      try {
        const statusLabels = {
          'SUBMITTED': 'Đã gửi',
          'UNDER_REVIEW': 'Đang xem xét',
          'IN_PROGRESS': 'Đang xử lý',
          'RESOLVED': 'Đã giải quyết',
          'REJECTED': 'Bị từ chối'
        };
        const statusLabel = statusLabels[status] || status;
        
        await prisma.notification.create({
          data: {
            userId: suggestion.user.id,
            title: '📝 Cập nhật trạng thái kiến nghị',
            message: `Kiến nghị "${suggestion.title}" của bạn đã chuyển sang trạng thái: ${statusLabel}`,
            type: 'SUGGESTION',
            relatedId: id
          }
        });
        notificationSent = 1;
        console.log('📧 [Backend] Status notification sent to user:', suggestion.user.id);
      } catch (notifError) {
        console.error('❌ [Backend] Error sending status notification:', notifError);
      }
    }

    res.json({
      success: true,
      data: {
        ...suggestion,
        user: suggestion.user ? {
          ...suggestion.user,
          unitName: suggestion.user.unit?.name
        } : null
      },
      notificationSent: notificationSent
    });
  } catch (error) {
    console.error('Update suggestion status error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể cập nhật trạng thái'
    });
  }
});

// Get suggestion stats
router.get('/admin/stats', auth, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'ADMIN' && role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền truy cập'
      });
    }

    const total = await prisma.suggestion.count();
    const pending = await prisma.suggestion.count({
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } }
    });
    const inProgress = await prisma.suggestion.count({
      where: { status: 'IN_PROGRESS' }
    });
    const resolved = await prisma.suggestion.count({
      where: { status: 'RESOLVED' }
    });

    res.json({
      success: true,
      data: {
        total,
        pending,
        inProgress,
        resolved
      }
    });
  } catch (error) {
    console.error('Get suggestion stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tải thống kê'
    });
  }
});

// File upload endpoint
router.post('/upload', auth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Không có file được tải lên'
      });
    }

    const fileUrl = `/uploads/suggestions/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tải lên file'
    });
  }
});

module.exports = router;
