const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { protect: auth } = require('../middleware/auth');

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

// Get all ratings in a period with full user info (Admin only)
router.get('/periods/:periodId/all-ratings', auth, async (req, res) => {
  try {
    const { periodId } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        error: 'Chỉ admin/lãnh đạo mới có quyền xem toàn bộ danh sách'
      });
    }

    // Get period info
    const period = await prisma.ratingPeriod.findUnique({
      where: { id: periodId }
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy kỳ xếp loại'
      });
    }

    // Get all ratings for this period with full user info
    const ratings = await prisma.selfRating.findMany({
      where: { 
        periodId: periodId,
        // Only show submitted and approved ratings
        status: {
          in: ['SUBMITTED', 'APPROVED', 'REJECTED']
        }
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            militaryRank: true,
            youthPosition: true,
            unit: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: 'asc'
      }
    });

    // Format response for table display
    const formattedRatings = ratings.map((rating, index) => ({
      stt: index + 1,
      id: rating.id,
      userId: rating.user.id,
      fullName: rating.user.fullName,
      militaryRank: rating.user.militaryRank || 'Chưa cập nhật',
      youthPosition: rating.user.youthPosition || 'Đoàn viên',
      unitName: rating.user.unit?.name || 'Chưa có chi đoàn',
      periodTitle: period.title,
      startDate: period.startDate,
      rating: rating.finalRating || rating.suggestedRating,
      status: rating.status,
      submittedAt: rating.submittedAt,
      criteriaResponses: rating.criteriaResponses,
      selfAssessment: rating.selfAssessment
    }));

    res.json({
      success: true,
      data: {
        period: {
          id: period.id,
          title: period.title,
          startDate: period.startDate,
          endDate: period.endDate
        },
        ratings: formattedRatings,
        total: formattedRatings.length
      }
    });
  } catch (error) {
    console.error('Get all ratings error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tải danh sách xếp loại'
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

// Delete my rating (only DRAFT status)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if rating exists and belongs to user
    const rating = await prisma.selfRating.findUnique({
      where: { id }
    });

    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy đánh giá'
      });
    }

    if (rating.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền xóa đánh giá này'
      });
    }

    if (rating.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: 'Chỉ có thể xóa bản nháp'
      });
    }

    await prisma.selfRating.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Đã xóa đánh giá'
    });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể xóa đánh giá'
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

    const { title, description, startDate, endDate, criteria, targetRating, targetAudience, unitIds, roles } = req.body;

    const period = await prisma.ratingPeriod.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        criteria,
        targetRating: targetRating || 'GOOD',
        targetAudience: targetAudience || 'ALL',
        unitIds,
        roles,
        createdBy: req.user.id,
        status: 'ACTIVE' // Auto-activate period to enable notifications
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

// Update rating period (Admin/Leader only)
router.put('/periods/:id', auth, async (req, res) => {
  try {
    const { role } = req.user;
    const { id } = req.params;
    
    if (role !== 'ADMIN' && role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền truy cập'
      });
    }

    const { title, description, startDate, endDate, criteria, targetRating, targetAudience, unitIds, roles } = req.body;

    // Check if period exists
    const existingPeriod = await prisma.ratingPeriod.findUnique({
      where: { id }
    });

    if (!existingPeriod) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy kỳ xếp loại'
      });
    }

    const period = await prisma.ratingPeriod.update({
      where: { id },
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        criteria,
        targetRating: targetRating || 'GOOD',
        targetAudience: targetAudience || 'ALL',
        unitIds,
        roles
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
      },
      message: 'Đã cập nhật kỳ xếp loại'
    });
  } catch (error) {
    console.error('Update rating period error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể cập nhật kỳ xếp loại'
    });
  }
});

// Delete rating period (Admin only)
router.delete('/periods/:id', auth, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'ADMIN' && role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền xóa kỳ xếp loại'
      });
    }

    const { id } = req.params;

    // Check if period exists
    const period = await prisma.ratingPeriod.findUnique({
      where: { id },
      include: {
        selfRatings: true
      }
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy kỳ xếp loại'
      });
    }

    // Delete all related self ratings first
    if (period.selfRatings && period.selfRatings.length > 0) {
      await prisma.selfRating.deleteMany({
        where: { periodId: id }
      });
    }

    // Delete the period
    await prisma.ratingPeriod.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Đã xóa kỳ xếp loại thành công'
    });
  } catch (error) {
    console.error('Delete rating period error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể xóa kỳ xếp loại'
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

// Get my personal rating stats
router.get('/my-stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Total periods participated
    const totalParticipated = await prisma.selfRating.count({
      where: { 
        userId,
        status: { not: 'DRAFT' }
      }
    });

    // Total submitted
    const totalSubmitted = await prisma.selfRating.count({
      where: { 
        userId,
        status: { in: ['SUBMITTED', 'APPROVED', 'REJECTED'] }
      }
    });

    // Total approved
    const totalApproved = await prisma.selfRating.count({
      where: { 
        userId,
        status: 'APPROVED'
      }
    });

    // Average points
    const avgPointsResult = await prisma.selfRating.aggregate({
      _avg: {
        pointsAwarded: true
      },
      where: {
        userId,
        status: 'APPROVED',
        pointsAwarded: { not: null }
      }
    });

    // Total points earned
    const totalPointsResult = await prisma.selfRating.aggregate({
      _sum: {
        pointsAwarded: true
      },
      where: {
        userId,
        status: 'APPROVED',
        pointsAwarded: { not: null }
      }
    });

    // Rating distribution
    const ratingsByLevel = await prisma.selfRating.groupBy({
      by: ['finalRating'],
      where: {
        userId,
        status: 'APPROVED',
        finalRating: { not: null }
      },
      _count: true
    });

    const distribution = {
      EXCELLENT: 0,
      GOOD: 0,
      AVERAGE: 0,
      POOR: 0
    };
    ratingsByLevel.forEach(item => {
      if (item.finalRating) {
        distribution[item.finalRating] = item._count;
      }
    });

    // Recent approved ratings for trend
    const recentRatings = await prisma.selfRating.findMany({
      where: {
        userId,
        status: 'APPROVED'
      },
      include: {
        period: {
          select: {
            id: true,
            title: true,
            endDate: true
          }
        }
      },
      orderBy: { reviewedAt: 'desc' },
      take: 5
    });

    res.json({
      success: true,
      data: {
        totalParticipated,
        totalSubmitted,
        totalApproved,
        avgPoints: avgPointsResult._avg.pointsAwarded || 0,
        totalPoints: totalPointsResult._sum.pointsAwarded || 0,
        distribution,
        recentRatings
      }
    });
  } catch (error) {
    console.error('Get my stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tải thống kê'
    });
  }
});

// Get rating stats (Admin only)
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

// Get stats for a specific period (Admin only)
router.get('/periods/:periodId/stats', auth, async (req, res) => {
  try {
    const { periodId } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        error: 'Chỉ admin/lãnh đạo mới có quyền xem thống kê'
      });
    }

    // Check if period exists
    const period = await prisma.ratingPeriod.findUnique({
      where: { id: periodId }
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy kỳ xếp loại'
      });
    }

    // Count all ratings in this period by status
    const ratingsByStatus = await prisma.selfRating.groupBy({
      by: ['status'],
      where: { periodId },
      _count: true
    });

    const statusCounts = {
      DRAFT: 0,
      SUBMITTED: 0,
      APPROVED: 0,
      REJECTED: 0,
      NEEDS_REVISION: 0
    };
    ratingsByStatus.forEach(item => {
      statusCounts[item.status] = item._count;
    });

    // Count ratings by final rating level (only approved)
    const ratingsByLevel = await prisma.selfRating.groupBy({
      by: ['finalRating'],
      where: {
        periodId,
        status: 'APPROVED',
        finalRating: { not: null }
      },
      _count: true
    });

    const distribution = {
      EXCELLENT: 0,
      GOOD: 0,
      AVERAGE: 0,
      POOR: 0
    };
    ratingsByLevel.forEach(item => {
      if (item.finalRating) {
        distribution[item.finalRating] = item._count;
      }
    });

    // Calculate average points awarded
    const pointsStats = await prisma.selfRating.aggregate({
      where: {
        periodId,
        status: 'APPROVED',
        pointsAwarded: { not: null }
      },
      _avg: { pointsAwarded: true },
      _sum: { pointsAwarded: true },
      _count: true
    });

    // Total submissions (submitted + approved + rejected + needs_revision)
    const totalSubmissions = statusCounts.SUBMITTED + statusCounts.APPROVED + statusCounts.REJECTED + statusCounts.NEEDS_REVISION;
    
    // Pending approvals (submitted + needs_revision)
    const pendingApprovals = statusCounts.SUBMITTED + statusCounts.NEEDS_REVISION;

    res.json({
      success: true,
      data: {
        period: {
          id: period.id,
          title: period.title,
          startDate: period.startDate,
          endDate: period.endDate,
          status: period.status
        },
        totalSubmissions,
        pendingApprovals,
        statusCounts,
        distribution,
        avgPoints: pointsStats._avg.pointsAwarded || 0,
        totalPoints: pointsStats._sum.pointsAwarded || 0,
        totalApproved: statusCounts.APPROVED
      }
    });
  } catch (error) {
    console.error('Get period stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tải thống kê'
    });
  }
});

// Get detailed ratings list for a specific period (Admin only)
router.get('/periods/:periodId/ratings', auth, async (req, res) => {
  try {
    const { periodId } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        error: 'Chỉ admin/lãnh đạo mới có quyền xem danh sách'
      });
    }

    // Check if period exists
    const period = await prisma.ratingPeriod.findUnique({
      where: { id: periodId },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        status: true,
        targetRating: true
      }
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy kỳ xếp loại'
      });
    }

    // Get all approved ratings for this period with user details
    const ratings = await prisma.selfRating.findMany({
      where: {
        periodId,
        status: 'APPROVED'
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            militaryRank: true,
            youthPosition: true,
            unit: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        reviewedAt: 'desc'
      }
    });

    // Format response data
    const formattedRatings = ratings.map(rating => ({
      id: rating.id,
      userId: rating.user.id,
      fullName: rating.user.fullName,
      militaryRank: rating.user.militaryRank || '',
      youthPosition: rating.user.youthPosition || '',
      unitName: rating.user.unit?.name || '',
      finalRating: rating.finalRating,
      pointsAwarded: rating.pointsAwarded,
      submittedAt: rating.submittedAt,
      reviewedAt: rating.reviewedAt
    }));

    res.json({
      success: true,
      data: {
        period,
        ratings: formattedRatings,
        total: formattedRatings.length
      }
    });
  } catch (error) {
    console.error('Get period ratings error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tải danh sách xếp loại'
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
