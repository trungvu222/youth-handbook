const prisma = require('../lib/prisma');

// @desc    Send notification to users
// @route   POST /api/notifications/send
// @access  Private/Admin/Leader
const sendNotification = async (req, res, next) => {
  try {
    const { title, message, type, relatedId, recipients } = req.body;

    // Validate
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required'
      });
    }

    // Get target users based on recipients
    let targetUserIds = [];
    
    if (recipients === 'all') {
      // Get all active users
      const users = await prisma.user.findMany({
        where: { 
          isActive: true,
          role: { in: ['MEMBER', 'LEADER'] } // Don't send to ADMINs
        },
        select: { id: true }
      });
      targetUserIds = users.map(u => u.id);
    } else if (Array.isArray(recipients)) {
      targetUserIds = recipients;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipients format'
      });
    }

    // Create notifications for each user
    const notifications = await Promise.all(
      targetUserIds.map(userId =>
        prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type: type || 'GENERAL',
            relatedId,
            isRead: false
          }
        })
      )
    );

    res.status(200).json({
      success: true,
      data: {
        sent: notifications.length,
        message: `Đã gửi thông báo đến ${notifications.length} đoàn viên`
      }
    });

  } catch (error) {
    console.error('Send notification error:', error);
    next(error);
  }
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to 50 most recent
    });

    res.status(200).json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.status(200).json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    next(error);
  }
};

module.exports = {
  sendNotification,
  getNotifications,
  markAsRead
};
