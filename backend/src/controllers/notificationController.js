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
      // Get all active users (including ADMIN so they can receive their own broadcasts)
      const users = await prisma.user.findMany({
        where: { isActive: true },
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

// Normalize notification message timestamps to Vietnam Time (Asia/Ho_Chi_Minh - UTC+7)
const normalizeNotificationMessage = (msg) => {
  if (!msg || typeof msg !== 'string') return msg;
  // Match patterns like "vào lúc 02:00:00 16/8/2026" or "vào lúc 00:00:00 25/8/2026"
  return msg.replace(/vào lúc\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/gi, (match, hourStr, minStr, secStr, dayStr, monthStr, yearStr) => {
    if (secStr !== undefined) {
      // Server formatted with seconds in UTC without timezone offset -> Convert to Vietnam UTC+7
      const h = parseInt(hourStr, 10);
      const m = parseInt(minStr, 10);
      const d = parseInt(dayStr, 10);
      const mo = parseInt(monthStr, 10) - 1;
      const y = parseInt(yearStr, 10);
      const utcDate = new Date(Date.UTC(y, mo, d, h, m));
      const vnDate = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
      const localH = String(vnDate.getUTCHours()).padStart(2, '0');
      const localM = String(vnDate.getUTCMinutes()).padStart(2, '0');
      const localD = String(vnDate.getUTCDate()).padStart(2, '0');
      const localMo = String(vnDate.getUTCMonth() + 1).padStart(2, '0');
      const localY = vnDate.getUTCFullYear();
      return `vào lúc ${localH}:${localM} ${localD}/${localMo}/${localY}`;
    }
    return `vào lúc ${hourStr.padStart(2, '0')}:${minStr} ${dayStr.padStart(2, '0')}/${monthStr.padStart(2, '0')}/${yearStr}`;
  });
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

    const formattedNotifications = notifications.map(n => ({
      ...n,
      message: normalizeNotificationMessage(n.message)
    }));

    res.status(200).json({
      success: true,
      data: formattedNotifications
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
