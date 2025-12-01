const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect: auth } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get rating periods
router.get('/periods', auth, async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = {};
    if (status) {
      where.status = status;
    }

    const periods = await prisma.ratingPeriod.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        },
        _count: {
          select: {
            selfRatings: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add computed fields
    const periodsWithStats = periods.map(period => ({
      ...period,
      author: period.creator,
      totalSubmissions: period._count.selfRatings,
      pendingApprovals: 0 // TODO: Calculate pending approvals
    }));

    res.json({
      success: true,
      data: periodsWithStats
    });
  } catch (error) {
    console.error('Get rating periods error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tải danh sách kỳ xếp loại'
    });
  }
});

// Get specific rating period
router.get('/periods/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const period = await prisma.ratingPeriod.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        }
      }
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy kỳ xếp loại'
      });
    }

    res.json({
      success: true,
      data: {
        ...period,
        author: period.creator
      }
    });
  } catch (error) {
    console.error('Get rating period error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tải kỳ xếp loại'
    });
  }
});

// Get my rating for a period
router.get('/periods/:periodId/my-rating', auth, async (req, res) => {
  try {
    const { periodId } = req.params;
    const userId = req.user.id;

    const rating = await prisma.selfRating.findUnique({
      where: {
        periodId_userId: {
          periodId,
          userId
        }
      },
      include: {
        period: {
          select: {
            id: true,
            title: true
          }
        },
        reviewer: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy đánh giá'
      });
    }

    res.json({
      success: true,
      data: rating
    });
  } catch (error) {
    console.error('Get my rating error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tải đánh giá của bạn'
    });
  }
});

// Submit rating
router.post('/submit', auth, async (req, res) => {
  try {
    const { periodId, criteriaResponses, selfAssessment } = req.body;
    const userId = req.user.id;

    // Check if period exists and is active
    const period = await prisma.ratingPeriod.findUnique({
      where: { id: periodId }
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy kỳ xếp loại'
      });
    }

    if (period.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Kỳ xếp loại không còn mở'
      });
    }

    // Calculate suggested rating based on criteria responses
    const totalCriteria = period.criteria.length;
    const metCriteria = criteriaResponses.filter(r => r.value).length;
    const percentage = (metCriteria / totalCriteria) * 100;

    let suggestedRating;
    if (percentage >= 90) {
      suggestedRating = 'EXCELLENT';
    } else if (percentage >= 75) {
      suggestedRating = 'GOOD';
    } else if (percentage >= 60) {
      suggestedRating = 'AVERAGE';
    } else {
      suggestedRating = 'POOR';
    }

    const rating = await prisma.selfRating.upsert({
      where: {
        periodId_userId: {
          periodId,
          userId
        }
      },
      update: {
        criteriaResponses,
        suggestedRating,
        selfAssessment,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        periodId,
        userId,
        criteriaResponses,
        suggestedRating,
        selfAssessment,
        status: 'SUBMITTED',
        submittedAt: new Date()
      },
      include: {
        period: {
          select: {
            id: true,
            title: true
          }
        },
        user: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: rating
    });
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể gửi đánh giá'
    });
  }
});

// Get my rating history
router.get('/my-history', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const ratings = await prisma.selfRating.findMany({
      where: { userId },
      include: {
        period: {
          select: {
            id: true,
            title: true
          }
        },
        reviewer: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: ratings
    });
  } catch (error) {
    console.error('Get rating history error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tải lịch sử xếp loại'
    });
  }
});

// Admin APIs

// Create rating period
router.post('/periods', auth, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'ADMIN' && role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền truy cập'
      });
    }

    const { title, description, startDate, endDate, criteria, targetAudience, unitIds, roles } = req.body;

    const period = await prisma.ratingPeriod.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        criteria,
        targetAudience: targetAudience || 'ALL',
        unitIds,
        roles,
        createdBy: req.user.id,
        status: 'DRAFT'
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        ...period,
        author: period.creator
      }
    });
  } catch (error) {
    console.error('Create rating period error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tạo kỳ xếp loại'
    });
  }
});

// Get pending ratings
router.get('/pending', auth, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'ADMIN' && role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền truy cập'
      });
    }

    const { periodId } = req.query;

    const where = {
      status: 'SUBMITTED'
    };

    if (periodId) {
      where.periodId = periodId;
    }

    const ratings = await prisma.selfRating.findMany({
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
        period: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Transform data
    const transformedRatings = ratings.map(rating => ({
      ...rating,
      user: {
        ...rating.user,
        unitName: rating.user.unit?.name
      }
    }));

    res.json({
      success: true,
      data: transformedRatings
    });
  } catch (error) {
    console.error('Get pending ratings error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tải danh sách chờ duyệt'
    });
  }
});

// Approve rating
router.post('/:id/approve', auth, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'ADMIN' && role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền truy cập'
      });
    }

    const { id } = req.params;
    const { finalRating, adminNotes, pointsAwarded } = req.body;

    const rating = await prisma.selfRating.update({
      where: { id },
      data: {
        status: 'APPROVED',
        finalRating,
        adminNotes,
        pointsAwarded: pointsAwarded || 0,
        reviewedAt: new Date(),
        reviewedBy: req.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true
          }
        },
        period: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Award points to user if specified
    if (pointsAwarded && pointsAwarded > 0) {
      await prisma.user.update({
        where: { id: rating.userId },
        data: {
          points: {
            increment: pointsAwarded
          }
        }
      });
    }

    res.json({
      success: true,
      data: rating
    });
  } catch (error) {
    console.error('Approve rating error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể duyệt đánh giá'
    });
  }
});

// Reject rating
router.post('/:id/reject', auth, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'ADMIN' && role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền truy cập'
      });
    }

    const { id } = req.params;
    const { adminNotes } = req.body;

    const rating = await prisma.selfRating.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminNotes,
        reviewedAt: new Date(),
        reviewedBy: req.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true
          }
        },
        period: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: rating
    });
  } catch (error) {
    console.error('Reject rating error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể từ chối đánh giá'
    });
  }
});

// Get rating stats
router.get('/admin/stats', auth, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'ADMIN' && role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền truy cập'
      });
    }

    const totalPeriods = await prisma.ratingPeriod.count();
    const totalSubmissions = await prisma.selfRating.count();
    const pendingApprovals = await prisma.selfRating.count({
      where: { status: 'SUBMITTED' }
    });

    const avgRatingResult = await prisma.selfRating.aggregate({
      _avg: {
        pointsAwarded: true
      },
      where: {
        status: 'APPROVED',
        pointsAwarded: {
          not: null
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalPeriods,
        totalSubmissions,
        pendingApprovals,
        avgRating: avgRatingResult._avg.pointsAwarded || 0
      }
    });
  } catch (error) {
    console.error('Get rating stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tải thống kê'
    });
  }
});

// Send reminder
router.post('/periods/:periodId/remind', auth, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'ADMIN' && role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền truy cập'
      });
    }

    // TODO: Implement reminder logic (send notifications, emails, etc.)
    
    res.json({
      success: true,
      message: 'Đã gửi thông báo nhắc nhở'
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể gửi thông báo'
    });
  }
});

module.exports = router;
