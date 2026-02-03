const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// @desc    Get all activities
// @route   GET /api/activities
// @access  Private
const getActivities = async (req, res, next) => {
  try {
    const { 
      unitId, 
      status, 
      type,
      startDate,
      endDate,
      page = 1, 
      limit = 20 
    } = req.query;

    const currentUser = req.user;
    let whereClause = {};

    // Filter by user permissions
    if (currentUser.role === 'MEMBER') {
      // Members can only see activities in their unit or public activities
      whereClause.OR = [
        { unitId: currentUser.unitId },
        { unitId: null } // Public activities
      ];
    } else if (currentUser.role === 'LEADER') {
      // Leaders can see activities in their unit
      whereClause.unitId = currentUser.unitId;
    }
    // Admin can see all activities

    // Apply additional filters
    if (unitId && currentUser.role === 'ADMIN') {
      whereClause.unitId = unitId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.type = type;
    }

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) {
        whereClause.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.startTime.lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: whereClause,
        include: {
          organizer: {
            select: { id: true, fullName: true, email: true }
          },
          unit: {
            select: { id: true, name: true }
          },
          participants: {
            include: {
              user: {
                select: { id: true, fullName: true }
              }
            }
          },
          _count: {
            select: { 
              participants: true,
              feedbacks: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { startTime: 'desc' }
      }),
      prisma.activity.count({ where: whereClause })
    ]);

    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single activity
// @route   GET /api/activities/:id
// @access  Private
const getActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, fullName: true, email: true, role: true }
        },
        unit: {
          select: { id: true, name: true }
        },
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, youthPosition: true }
            }
          },
          orderBy: { checkInTime: 'asc' }
        },
        feedbacks: {
          include: {
            user: {
              select: { id: true, fullName: true }
            },
            responder: {
              select: { id: true, fullName: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    // Check permissions
    const canView = currentUser.role === 'ADMIN' || 
                   activity.unitId === currentUser.unitId ||
                   activity.unitId === null; // Public activity

    if (!canView) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check if current user is registered
    const userParticipation = activity.participants.find(
      p => p.userId === currentUser.id
    );

    res.status(200).json({
      success: true,
      data: {
        ...activity,
        userParticipation
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new activity
// @route   POST /api/activities
// @access  Private (Admin/Leader)
const createActivity = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const {
      title,
      description,
      type,
      unitId,
      startTime,
      endTime,
      location,
      maxParticipants,
      checkInStartTime,
      checkInEndTime,
      requiresLocation,
      allowFeedback,
      onTimePoints,
      latePoints,
      missedPoints,
      feedbackPoints,
      pointsReward,
      // New fields
      hostUnit,
      managerId,
      materials,
      attendeeIds,
      sendNotification,
      notifyAll,
      notifyUserIds
    } = req.body;

    // Validate permissions
    if (currentUser.role === 'LEADER' && unitId !== currentUser.unitId) {
      return res.status(403).json({
        success: false,
        error: 'Leaders can only create activities for their own unit'
      });
    }

    // Generate QR code for check-in
    const qrCode = crypto.randomUUID();

    const activity = await prisma.activity.create({
      data: {
        title,
        description,
        type,
        organizerId: currentUser.id,
        unitId: unitId || null,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        location,
        maxParticipants,
        checkInStartTime: checkInStartTime ? new Date(checkInStartTime) : new Date(startTime),
        checkInEndTime: checkInEndTime ? new Date(checkInEndTime) : null,
        requiresLocation: requiresLocation || false,
        allowFeedback: allowFeedback !== false,
        onTimePoints: onTimePoints || 15,
        latePoints: latePoints || 5,
        missedPoints: missedPoints || -10,
        feedbackPoints: feedbackPoints || 5,
        pointsReward: pointsReward || 10,
        qrCode,
        status: 'ACTIVE',
        // New fields
        hostUnit: hostUnit || null,
        managerId: managerId || null,
        materials: materials || null
      },
      include: {
        organizer: {
          select: { id: true, fullName: true, email: true }
        },
        unit: {
          select: { id: true, name: true }
        },
        manager: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    // Auto-register attendees if provided
    if (attendeeIds && attendeeIds.length > 0) {
      await prisma.activityParticipant.createMany({
        data: attendeeIds.map(userId => ({
          activityId: activity.id,
          userId,
          status: 'REGISTERED'
        })),
        skipDuplicates: true
      });
    }

    // Send notifications if requested
    if (sendNotification) {
      let usersToNotify = [];
      
      if (notifyAll) {
        // Get all users
        usersToNotify = await prisma.user.findMany({
          select: { id: true }
        });
      } else if (notifyUserIds && notifyUserIds.length > 0) {
        usersToNotify = notifyUserIds.map(id => ({ id }));
      }

      // Create notifications
      if (usersToNotify.length > 0) {
        await prisma.notification.createMany({
          data: usersToNotify.map(user => ({
            userId: user.id,
            title: `Thông báo mời họp: ${title}`,
            content: `Bạn được mời tham dự hoạt động "${title}" vào lúc ${new Date(startTime).toLocaleString('vi-VN')}${location ? ` tại ${location}` : ''}.`,
            type: 'ACTIVITY'
          })),
          skipDuplicates: true
        });
      }
    }

    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join activity
// @route   POST /api/activities/:id/join
// @access  Private
const joinActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        participants: true
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    // Check if activity is joinable
    if (activity.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Activity is not available for registration'
      });
    }

    // Check if already joined
    const existingParticipation = await prisma.activityParticipant.findUnique({
      where: {
        activityId_userId: {
          activityId: id,
          userId: currentUser.id
        }
      }
    });

    if (existingParticipation) {
      return res.status(400).json({
        success: false,
        error: 'Already registered for this activity'
      });
    }

    // Check max participants
    if (activity.maxParticipants && activity.participants.length >= activity.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: 'Activity is full'
      });
    }

    const participation = await prisma.activityParticipant.create({
      data: {
        activityId: id,
        userId: currentUser.id,
        status: 'REGISTERED'
      }
    });

    // Create notification for reminder (to be sent 1 day before)
    const reminderTime = new Date(activity.startTime);
    reminderTime.setDate(reminderTime.getDate() - 1);

    await prisma.activityNotification.create({
      data: {
        activityId: id,
        userId: currentUser.id,
        type: 'REMINDER',
        title: 'Nhắc lịch sinh hoạt',
        message: `Bạn có lịch sinh hoạt "${activity.title}" vào ngày mai lúc ${activity.startTime.toLocaleString('vi-VN')}`,
        scheduledAt: reminderTime
      }
    });

    res.status(201).json({
      success: true,
      data: participation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check in to activity using QR code
// @route   POST /api/activities/:id/checkin
// @access  Private
const checkInActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { qrCode, latitude, longitude } = req.body;
    const currentUser = req.user;

    const activity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    // Verify QR code
    if (activity.qrCode !== qrCode) {
      return res.status(400).json({
        success: false,
        error: 'Invalid QR code'
      });
    }

    // Check if user is registered
    const participation = await prisma.activityParticipant.findUnique({
      where: {
        activityId_userId: {
          activityId: id,
          userId: currentUser.id
        }
      }
    });

    if (!participation) {
      return res.status(400).json({
        success: false,
        error: 'You must register for this activity first'
      });
    }

    if (participation.status === 'CHECKED_IN') {
      return res.status(400).json({
        success: false,
        error: 'Already checked in'
      });
    }

    // Check check-in time window
    const now = new Date();
    const checkInStart = activity.checkInStartTime || activity.startTime;
    const checkInEnd = activity.checkInEndTime;

    if (now < checkInStart) {
      return res.status(400).json({
        success: false,
        error: 'Check-in has not started yet'
      });
    }

    if (checkInEnd && now > checkInEnd) {
      return res.status(400).json({
        success: false,
        error: 'Check-in period has ended'
      });
    }

    // Calculate points based on timing
    let pointsEarned = activity.onTimePoints; // Default on-time points
    const activityStart = new Date(activity.startTime);
    const lateThreshold = new Date(activityStart.getTime() + 15 * 60000); // 15 minutes

    if (now > lateThreshold) {
      pointsEarned = activity.latePoints; // Late points
    }

    // Update participation
    const updatedParticipation = await prisma.activityParticipant.update({
      where: {
        activityId_userId: {
          activityId: id,
          userId: currentUser.id
        }
      },
      data: {
        status: 'CHECKED_IN',
        checkInTime: now,
        qrData: qrCode,
        latitude: activity.requiresLocation ? latitude : null,
        longitude: activity.requiresLocation ? longitude : null,
        pointsEarned
      }
    });

    // Add points to user's total
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        points: {
          increment: pointsEarned
        }
      }
    });

    // Create points history
    await prisma.pointsHistory.create({
      data: {
        userId: currentUser.id,
        activityId: id,
        points: pointsEarned,
        reason: `Điểm danh sinh hoạt: ${activity.title}`,
        type: 'EARN'
      }
    });

    res.status(200).json({
      success: true,
      data: {
        ...updatedParticipation,
        pointsEarned
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activity statistics (Admin/Leader)
// @route   GET /api/activities/:id/stats
// @access  Private (Admin/Leader)
const getActivityStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true }
            }
          }
        },
        feedbacks: true,
        unit: true
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    // Check permissions
    const canViewStats = currentUser.role === 'ADMIN' ||
                        (currentUser.role === 'LEADER' && activity.unitId === currentUser.unitId) ||
                        activity.organizerId === currentUser.id;

    if (!canViewStats) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Calculate statistics
    const totalRegistered = activity.participants.length;
    const checkedIn = activity.participants.filter(p => p.status === 'CHECKED_IN').length;
    const onTime = activity.participants.filter(p => {
      if (!p.checkInTime) return false;
      const lateThreshold = new Date(activity.startTime.getTime() + 15 * 60000);
      return p.checkInTime <= lateThreshold;
    }).length;
    const late = checkedIn - onTime;
    const absent = totalRegistered - checkedIn;
    const feedbackCount = activity.feedbacks.length;

    // Get unit members who haven't registered
    let nonParticipants = [];
    if (activity.unitId) {
      const unitMembers = await prisma.user.findMany({
        where: { unitId: activity.unitId },
        select: { id: true, fullName: true, email: true }
      });
      
      const participantIds = activity.participants.map(p => p.userId);
      nonParticipants = unitMembers.filter(member => !participantIds.includes(member.id));
    }

    const stats = {
      totalRegistered,
      checkedIn,
      onTime,
      late,
      absent,
      feedbackCount,
      attendanceRate: totalRegistered > 0 ? (checkedIn / totalRegistered * 100).toFixed(1) : 0,
      onTimeRate: checkedIn > 0 ? (onTime / checkedIn * 100).toFixed(1) : 0,
      participants: activity.participants,
      nonParticipants,
      feedbacks: activity.feedbacks
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit feedback for activity
// @route   POST /api/activities/:id/feedback
// @access  Private
const submitFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, type, isAnonymous } = req.body;
    const currentUser = req.user;

    const activity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    if (!activity.allowFeedback) {
      return res.status(400).json({
        success: false,
        error: 'Feedback is not allowed for this activity'
      });
    }

    const feedback = await prisma.activityFeedback.create({
      data: {
        activityId: id,
        userId: currentUser.id,
        content,
        type: type || 'SUGGESTION',
        isAnonymous: isAnonymous || false
      }
    });

    // Award feedback points
    const feedbackPoints = activity.feedbackPoints;
    if (feedbackPoints > 0) {
      await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          points: {
            increment: feedbackPoints
          }
        }
      });

      await prisma.pointsHistory.create({
        data: {
          userId: currentUser.id,
          activityId: id,
          points: feedbackPoints,
          reason: `Góp ý cho sinh hoạt: ${activity.title}`,
          type: 'EARN'
        }
      });
    }

    res.status(201).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to feedback (Admin/Leader)
// @route   PUT /api/activities/feedback/:feedbackId
// @access  Private (Admin/Leader)
const respondToFeedback = async (req, res, next) => {
  try {
    const { feedbackId } = req.params;
    const { response, status } = req.body;
    const currentUser = req.user;

    const feedback = await prisma.activityFeedback.findUnique({
      where: { id: feedbackId },
      include: {
        activity: {
          include: { unit: true }
        },
        user: true
      }
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }

    // Check permissions
    const canRespond = currentUser.role === 'ADMIN' ||
                      (currentUser.role === 'LEADER' && feedback.activity.unitId === currentUser.unitId) ||
                      feedback.activity.organizerId === currentUser.id;

    if (!canRespond) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const updatedFeedback = await prisma.activityFeedback.update({
      where: { id: feedbackId },
      data: {
        response,
        status: status || 'RESPONDED',
        responderId: currentUser.id,
        respondedAt: new Date()
      }
    });

    // Create notification for feedback submitter
    await prisma.activityNotification.create({
      data: {
        activityId: feedback.activityId,
        userId: feedback.userId,
        type: 'FEEDBACK',
        title: 'Phản hồi ý kiến của bạn',
        message: `Ý kiến của bạn về "${feedback.activity.title}" đã được phản hồi`
      }
    });

    res.status(200).json({
      success: true,
      data: updatedFeedback
    });
  } catch (error) {
    next(error);
  }
};

// Enhanced Activity Management for Module 3.3

// @desc    Create QR code check-in with GPS validation
// @route   POST /api/activities/:id/checkin-gps
// @access  Private
const checkInWithGPS = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, qrData } = req.body;
    const userId = req.user.id;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: { participants: true }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Hoạt động không tồn tại'
      });
    }

    // Validate QR code
    if (qrData !== activity.qrCode) {
      return res.status(400).json({
        success: false,
        error: 'Mã QR không hợp lệ'
      });
    }

    // Check time window
    const now = new Date();
    if (activity.checkInStartTime && now < activity.checkInStartTime) {
      return res.status(400).json({
        success: false,
        error: 'Chưa đến thời gian điểm danh'
      });
    }

    if (activity.checkInEndTime && now > activity.checkInEndTime) {
      return res.status(400).json({
        success: false,
        error: 'Đã hết thời gian điểm danh'
      });
    }

    // Validate GPS if required
    if (activity.requiresLocation && (!latitude || !longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Hoạt động này yêu cầu xác định vị trí GPS'
      });
    }

    // Find participant
    const participant = activity.participants.find(p => p.userId === userId);
    if (!participant) {
      return res.status(400).json({
        success: false,
        error: 'Bạn chưa đăng ký tham gia hoạt động này'
      });
    }

    if (participant.status === 'CHECKED_IN') {
      return res.status(400).json({
        success: false,
        error: 'Bạn đã điểm danh rồi'
      });
    }

    // Determine check-in status (on-time, late)
    const isLate = activity.checkInEndTime && now > new Date(activity.checkInStartTime.getTime() + 15 * 60000); // 15 minutes grace period
    const newStatus = 'CHECKED_IN';

    // Update participant
    const updatedParticipant = await prisma.activityParticipant.update({
      where: { id: participant.id },
      data: {
        status: newStatus,
        checkInAt: now,
        checkInLocation: latitude && longitude ? `${latitude},${longitude}` : null,
        isLate
      }
    });

    // Award points
    const points = isLate ? activity.latePoints : activity.onTimePoints;
    if (points > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { points: { increment: points } }
      });

      await prisma.pointsHistory.create({
        data: {
          userId,
          activityId: id,
          changeType: 'EARN',
          amount: points,
          description: `Điểm danh hoạt động: ${activity.title} ${isLate ? '(trễ)' : '(đúng giờ)'}`
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        participant: updatedParticipant,
        pointsAwarded: points,
        isLate,
        message: isLate ? 'Điểm danh thành công (trễ)' : 'Điểm danh thành công'
      }
    });

  } catch (error) {
    console.error('Check-in GPS error:', error);
    next(error);
  }
};

// @desc    Get activity surveys
// @route   GET /api/activities/:id/surveys
// @access  Private
const getActivitySurveys = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const surveys = await prisma.activitySurvey.findMany({
      where: { 
        activityId: id,
        isActive: true
      },
      include: {
        responses: {
          where: { userId },
          select: { id: true, createdAt: true }
        }
      }
    });

    const surveysWithStatus = surveys.map(survey => ({
      ...survey,
      hasResponded: survey.responses.length > 0,
      respondedAt: survey.responses[0]?.createdAt || null
    }));

    res.status(200).json({
      success: true,
      data: surveysWithStatus
    });

  } catch (error) {
    console.error('Get activity surveys error:', error);
    next(error);
  }
};

// @desc    Submit activity survey response
// @route   POST /api/activities/:id/surveys/:surveyId/responses
// @access  Private
const submitSurveyResponse = async (req, res, next) => {
  try {
    const { id, surveyId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    // Check if user has already responded
    const existingResponse = await prisma.activitySurveyResponse.findUnique({
      where: {
        surveyId_userId: {
          surveyId,
          userId
        }
      }
    });

    if (existingResponse) {
      return res.status(400).json({
        success: false,
        error: 'Bạn đã trả lời khảo sát này rồi'
      });
    }

    // Verify user participated in activity
    const participant = await prisma.activityParticipant.findFirst({
      where: {
        activityId: id,
        userId,
        status: 'CHECKED_IN'
      }
    });

    if (!participant) {
      return res.status(400).json({
        success: false,
        error: 'Bạn cần tham gia hoạt động để được khảo sát'
      });
    }

    const response = await prisma.activitySurveyResponse.create({
      data: {
        surveyId,
        userId,
        answers
      }
    });

    // Award points for survey completion
    const activity = await prisma.activity.findUnique({
      where: { id },
      select: { feedbackPoints: true }
    });

    if (activity?.feedbackPoints > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { points: { increment: activity.feedbackPoints } }
      });

      await prisma.pointsHistory.create({
        data: {
          userId,
          activityId: id,
          changeType: 'EARN',
          amount: activity.feedbackPoints,
          description: `Hoàn thành khảo sát hoạt động`
        }
      });
    }

    res.status(201).json({
      success: true,
      data: response,
      pointsAwarded: activity?.feedbackPoints || 0
    });

  } catch (error) {
    console.error('Submit survey response error:', error);
    next(error);
  }
};

// @desc    Get enhanced activity statistics (for admin/leader)
// @route   GET /api/activities/:id/enhanced-stats
// @access  Private (Admin/Leader)
const getEnhancedActivityStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, fullName: true, role: true } },
        host: { select: { id: true, fullName: true, role: true } },
        manager: { select: { id: true, fullName: true, role: true } },
        unit: { select: { id: true, name: true } },
        participants: {
          include: {
            user: { select: { id: true, fullName: true, unitId: true } }
          }
        },
        feedbacks: {
          include: {
            user: { select: { id: true, fullName: true } }
          }
        },
        surveys: {
          include: {
            responses: {
              include: {
                user: { select: { id: true, fullName: true } }
              }
            }
          }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Hoạt động không tồn tại'
      });
    }

    // Check permissions
    const canView = currentUser.role === 'ADMIN' || 
                   currentUser.id === activity.organizerId ||
                   currentUser.id === activity.hostId ||
                   currentUser.id === activity.managerId ||
                   (currentUser.role === 'LEADER' && currentUser.unitId === activity.unitId);

    if (!canView) {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền xem thống kê hoạt động này'
      });
    }

    // Calculate statistics
    const stats = {
      basic: {
        totalRegistered: activity.participants.length,
        checkedIn: activity.participants.filter(p => p.status === 'CHECKED_IN').length,
        onTime: activity.participants.filter(p => p.status === 'CHECKED_IN' && !p.isLate).length,
        late: activity.participants.filter(p => p.status === 'CHECKED_IN' && p.isLate).length,
        absent: activity.participants.filter(p => p.status === 'REGISTERED').length,
        feedbackCount: activity.feedbacks.length
      },
      financial: {
        budget: activity.budget,
        materialCosts: activity.materials ? 
          activity.materials.reduce((sum, item) => sum + (item.cost || 0), 0) : 0
      },
      tasks: activity.tasks || [],
      materials: activity.materials || [],
      surveys: activity.surveys.map(survey => ({
        id: survey.id,
        title: survey.title,
        responseCount: survey.responses.length,
        responses: survey.responses
      })),
      participants: activity.participants.map(p => ({
        user: p.user,
        status: p.status,
        registeredAt: p.registeredAt,
        checkInAt: p.checkInAt,
        isLate: p.isLate,
        checkInLocation: p.checkInLocation
      }))
    };

    res.status(200).json({
      success: true,
      data: {
        activity: {
          id: activity.id,
          title: activity.title,
          description: activity.description,
          activityCode: activity.activityCode,
          organizer: activity.organizer,
          host: activity.host,
          manager: activity.manager,
          unit: activity.unit,
          location: activity.location,
          startTime: activity.startTime,
          endTime: activity.endTime,
          status: activity.status
        },
        stats
      }
    });

  } catch (error) {
    console.error('Get enhanced activity stats error:', error);
    next(error);
  }
};

// @desc    Update activity (including conclusion)
// @route   PUT /api/activities/:id
// @access  Private (Admin/Leader)
const updateActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      title, description, type, startTime, endTime, location, 
      pointsReward, status, conclusion, hostUnit, managerId, materials 
    } = req.body;

    const activity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = new Date(endTime);
    if (location !== undefined) updateData.location = location;
    if (pointsReward !== undefined) updateData.pointsReward = parseInt(pointsReward);
    if (status !== undefined) updateData.status = status;
    if (conclusion !== undefined) updateData.conclusion = conclusion;
    if (hostUnit !== undefined) updateData.hostUnit = hostUnit;
    if (managerId !== undefined) updateData.managerId = managerId;
    if (materials !== undefined) updateData.materials = materials;

    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: updateData,
      include: {
        organizer: { select: { id: true, fullName: true, email: true } },
        unit: { select: { id: true, name: true } },
        manager: { select: { id: true, fullName: true, email: true } },
        _count: { select: { participants: true } }
      }
    });

    res.status(200).json({
      success: true,
      data: updatedActivity,
      message: 'Activity updated successfully'
    });
  } catch (error) {
    console.error('Update activity error:', error);
    next(error);
  }
};

// @desc    Delete activity
// @route   DELETE /api/activities/:id
// @access  Private (Admin/Leader)
const deleteActivity = async (req, res, next) => {
  try {
    const { id } = req.params;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: { _count: { select: { participants: true } } }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    // Delete related records first
    await prisma.activityParticipant.deleteMany({ where: { activityId: id } });
    await prisma.activityFeedback.deleteMany({ where: { activityId: id } });
    await prisma.pointsHistory.deleteMany({ where: { activityId: id } });
    
    // Delete the activity
    await prisma.activity.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Delete activity error:', error);
    next(error);
  }
};

// ==================== ATTENDANCE MANAGEMENT ====================

// @desc    Get attendance list for an activity (Admin/Leader)
// @route   GET /api/activities/:id/attendance
// @access  Private (Admin/Leader)
const getAttendanceList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, search } = req.query;
    const currentUser = req.user;

    // Check permission
    if (currentUser.role === 'MEMBER') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only Admin and Leader can view attendance.'
      });
    }

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        unit: true,
        organizer: {
          select: { id: true, fullName: true }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    // Leader can only view attendance for their unit's activities
    if (currentUser.role === 'LEADER' && activity.unitId !== currentUser.unitId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view attendance for your unit.'
      });
    }

    // Build where clause for participants
    let participantWhere = { activityId: id };
    
    if (status) {
      participantWhere.status = status;
    }

    // Get all participants with user info
    const participants = await prisma.activityParticipant.findMany({
      where: participantWhere,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            avatarUrl: true,
            youthPosition: true,
            unit: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { user: { fullName: 'asc' } }
      ]
    });

    // Filter by search if provided
    let filteredParticipants = participants;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredParticipants = participants.filter(p => 
        p.user.fullName.toLowerCase().includes(searchLower) ||
        p.user.phone?.includes(search) ||
        p.user.email?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate statistics
    const checkedInParticipants = participants.filter(p => p.status === 'CHECKED_IN');
    const lateThreshold = new Date(activity.startTime.getTime() + 15 * 60000); // 15 minutes after start
    
    const onTime = checkedInParticipants.filter(p => {
      return p.checkInTime && p.checkInTime <= lateThreshold;
    }).length;
    
    const late = checkedInParticipants.filter(p => {
      return p.checkInTime && p.checkInTime > lateThreshold;
    }).length;
    
    const stats = {
      total: participants.length,
      checkedIn: checkedInParticipants.length,
      onTime,
      late,
      registered: participants.filter(p => p.status === 'REGISTERED').length,
      absent: participants.filter(p => p.status === 'ABSENT').length,
      completed: participants.filter(p => p.status === 'COMPLETED').length,
      attendanceRate: participants.length > 0 ? ((checkedInParticipants.length / participants.length) * 100).toFixed(1) : '0.0',
      onTimeRate: checkedInParticipants.length > 0 ? ((onTime / checkedInParticipants.length) * 100).toFixed(1) : '0.0'
    };

    res.status(200).json({
      success: true,
      data: {
        activity: {
          id: activity.id,
          title: activity.title,
          type: activity.type,
          status: activity.status,
          startTime: activity.startTime,
          endTime: activity.endTime,
          unit: activity.unit,
          organizer: activity.organizer
        },
        participants: filteredParticipants,
        stats
      }
    });
  } catch (error) {
    console.error('Get attendance list error:', error);
    next(error);
  }
};

// @desc    Report absence for an activity (User)
// @route   POST /api/activities/:id/report-absent
// @access  Private
const reportAbsent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const currentUser = req.user;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Absence reason is required'
      });
    }

    const activity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    // Check if user has participation record
    const participation = await prisma.activityParticipant.findUnique({
      where: {
        activityId_userId: {
          activityId: id,
          userId: currentUser.id
        }
      }
    });

    if (!participation) {
      return res.status(400).json({
        success: false,
        error: 'You are not registered for this activity'
      });
    }

    if (participation.status === 'CHECKED_IN') {
      return res.status(400).json({
        success: false,
        error: 'Cannot report absence after checking in'
      });
    }

    if (participation.status === 'ABSENT') {
      return res.status(400).json({
        success: false,
        error: 'You have already reported absence'
      });
    }

    // Update participation to ABSENT
    const updated = await prisma.activityParticipant.update({
      where: {
        activityId_userId: {
          activityId: id,
          userId: currentUser.id
        }
      },
      data: {
        status: 'ABSENT',
        absentReason: reason.trim()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Đã báo vắng thành công',
      data: updated
    });
  } catch (error) {
    console.error('Report absent error:', error);
    next(error);
  }
};

// @desc    Update attendance status (Admin/Leader)
// @route   PUT /api/activities/:id/attendance/:participantId
// @access  Private (Admin/Leader)
const updateAttendanceStatus = async (req, res, next) => {
  try {
    const { id, participantId } = req.params;
    const { status, absentReason, checkInTime } = req.body;
    const currentUser = req.user;

    // Check permission
    if (currentUser.role === 'MEMBER') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only Admin and Leader can update attendance.'
      });
    }

    const validStatuses = ['REGISTERED', 'CHECKED_IN', 'ABSENT', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: REGISTERED, CHECKED_IN, ABSENT, COMPLETED'
      });
    }

    const activity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    // Leader can only update attendance for their unit's activities
    if (currentUser.role === 'LEADER' && activity.unitId !== currentUser.unitId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only update attendance for your unit.'
      });
    }

    const participant = await prisma.activityParticipant.findUnique({
      where: { id: participantId },
      include: { user: true }
    });

    if (!participant || participant.activityId !== id) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }

    // Prepare update data
    const updateData = { status };
    
    if (status === 'ABSENT' && absentReason) {
      updateData.absentReason = absentReason;
    }
    
    if (status === 'CHECKED_IN' && !participant.checkInTime) {
      updateData.checkInTime = checkInTime ? new Date(checkInTime) : new Date();
      
      // Calculate points based on check-in time
      const actualCheckInTime = updateData.checkInTime;
      const lateThreshold = new Date(activity.startTime.getTime() + 15 * 60000);
      updateData.pointsEarned = actualCheckInTime <= lateThreshold ? activity.onTimePoints : activity.latePoints;
      
      // Add points to user
      await prisma.user.update({
        where: { id: participant.userId },
        data: { points: { increment: updateData.pointsEarned } }
      });
      
      // Create points history
      await prisma.pointsHistory.create({
        data: {
          userId: participant.userId,
          activityId: id,
          points: updateData.pointsEarned,
          reason: `Điểm danh ${actualCheckInTime <= lateThreshold ? 'đúng giờ' : 'trễ'}: ${activity.title}`,
          type: 'EARN'
        }
      });
    }

    const updated = await prisma.activityParticipant.update({
      where: { id: participantId },
      data: updateData,
      include: {
        user: {
          select: { id: true, fullName: true, phone: true, email: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Update attendance status error:', error);
    next(error);
  }
};

// @desc    Admin batch check-in multiple users
// @route   POST /api/activities/:id/batch-checkin
// @access  Private (Admin/Leader)
const batchCheckIn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;
    const currentUser = req.user;

    if (currentUser.role === 'MEMBER') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'userIds array is required'
      });
    }

    const activity = await prisma.activity.findUnique({ where: { id } });
    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    const results = [];
    for (const userId of userIds) {
      try {
        const participant = await prisma.activityParticipant.findUnique({
          where: {
            activityId_userId: { activityId: id, userId }
          }
        });

        if (participant && participant.status !== 'CHECKED_IN') {
          await prisma.activityParticipant.update({
            where: { activityId_userId: { activityId: id, userId } },
            data: {
              status: 'CHECKED_IN',
              checkInTime: new Date(),
              pointsEarned: activity.onTimePoints
            }
          });

          await prisma.user.update({
            where: { id: userId },
            data: { points: { increment: activity.onTimePoints } }
          });

          results.push({ userId, success: true });
        } else {
          results.push({ userId, success: false, reason: 'Not found or already checked in' });
        }
      } catch (err) {
        results.push({ userId, success: false, reason: err.message });
      }
    }

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Batch check-in error:', error);
    next(error);
  }
};

module.exports = {
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
};