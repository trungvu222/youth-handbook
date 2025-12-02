const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// @desc    Get all users with points for leaderboard
// @route   GET /api/points/leaderboard
// @access  Private (Admin/Leader)
const getLeaderboard = async (req, res, next) => {
  try {
    const { unitId, search, sortBy = 'points', sortOrder = 'desc' } = req.query;
    const currentUser = req.user;

    let whereClause = { isActive: true };

    // Leader can only see users in their unit
    if (currentUser.role === 'LEADER') {
      whereClause.unitId = currentUser.unitId;
    } else if (unitId && unitId !== 'all') {
      whereClause.unitId = unitId;
    }

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        unit: true
      },
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    // Calculate rank based on points
    const usersWithRank = users.map(user => {
      let rank = 'YEU';
      if (user.points >= 800) rank = 'XUAT_SAC';
      else if (user.points >= 600) rank = 'KHA';
      else if (user.points >= 400) rank = 'TRUNG_BINH';

      const { passwordHash, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        rank,
        unitName: user.unit?.name || 'Chưa phân chi đoàn'
      };
    });

    // Calculate stats
    const totalPoints = users.reduce((sum, u) => sum + u.points, 0);
    const avgPoints = users.length > 0 ? Math.round(totalPoints / users.length) : 0;
    const maxPoints = users.length > 0 ? Math.max(...users.map(u => u.points)) : 0;
    const excellentCount = usersWithRank.filter(u => u.rank === 'XUAT_SAC').length;

    res.status(200).json({
      success: true,
      data: usersWithRank,
      stats: {
        totalPoints,
        avgPoints,
        maxPoints,
        excellentCount,
        totalMembers: users.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add points to user
// @route   POST /api/points/add
// @access  Private (Admin/Leader)
const addPoints = async (req, res, next) => {
  try {
    const { userId, points, reason, category } = req.body;
    const currentUser = req.user;

    if (!userId || !points || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp userId, points và reason'
      });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { unit: true }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy đoàn viên'
      });
    }

    // Leader can only modify users in their unit
    if (currentUser.role === 'LEADER' && targetUser.unitId !== currentUser.unitId) {
      return res.status(403).json({
        success: false,
        error: 'Bạn chỉ có thể thay đổi điểm của đoàn viên trong chi đoàn của mình'
      });
    }

    // Update user points and create history
    const [updatedUser, pointsHistory] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          points: { increment: parseInt(points) }
        },
        include: { unit: true }
      }),
      prisma.pointsHistory.create({
        data: {
          userId,
          points: parseInt(points),
          reason,
          type: 'EARN'
        }
      })
    ]);

    const { passwordHash, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      success: true,
      message: `Đã cộng ${points} điểm cho ${updatedUser.fullName}`,
      data: {
        user: userWithoutPassword,
        history: pointsHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Subtract points from user
// @route   POST /api/points/subtract
// @access  Private (Admin/Leader)
const subtractPoints = async (req, res, next) => {
  try {
    const { userId, points, reason, category } = req.body;
    const currentUser = req.user;

    if (!userId || !points || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp userId, points và reason'
      });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { unit: true }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy đoàn viên'
      });
    }

    // Leader can only modify users in their unit
    if (currentUser.role === 'LEADER' && targetUser.unitId !== currentUser.unitId) {
      return res.status(403).json({
        success: false,
        error: 'Bạn chỉ có thể thay đổi điểm của đoàn viên trong chi đoàn của mình'
      });
    }

    // Update user points and create history
    const [updatedUser, pointsHistory] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          points: { decrement: parseInt(points) }
        },
        include: { unit: true }
      }),
      prisma.pointsHistory.create({
        data: {
          userId,
          points: -parseInt(points),
          reason,
          type: 'DEDUCT'
        }
      })
    ]);

    const { passwordHash, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      success: true,
      message: `Đã trừ ${points} điểm của ${updatedUser.fullName}`,
      data: {
        user: userWithoutPassword,
        history: pointsHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get points history
// @route   GET /api/points/history
// @access  Private (Admin/Leader)
const getPointsHistory = async (req, res, next) => {
  try {
    const { userId, page = 1, limit = 20 } = req.query;
    const currentUser = req.user;

    let whereClause = {};

    if (userId) {
      whereClause.userId = userId;
    }

    // Leader can only see history of users in their unit
    if (currentUser.role === 'LEADER') {
      const unitUsers = await prisma.user.findMany({
        where: { unitId: currentUser.unitId },
        select: { id: true }
      });
      whereClause.userId = { in: unitUsers.map(u => u.id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [history, total] = await Promise.all([
      prisma.pointsHistory.findMany({
        where: whereClause,
        include: {
          user: {
            include: { unit: true }
          },
          activity: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.pointsHistory.count({ where: whereClause })
    ]);

    const formattedHistory = history.map(h => ({
      id: h.id,
      memberName: h.user.fullName,
      memberUnit: h.user.unit?.name || 'Chưa có chi đoàn',
      action: h.points > 0 ? 'add' : 'subtract',
      points: Math.abs(h.points),
      reason: h.reason,
      type: h.type,
      date: h.createdAt,
      activityName: h.activity?.title
    }));

    res.status(200).json({
      success: true,
      data: formattedHistory,
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

// @desc    Get units list
// @route   GET /api/points/units
// @access  Private
const getUnits = async (req, res, next) => {
  try {
    const units = await prisma.unit.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    res.status(200).json({
      success: true,
      data: units
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeaderboard,
  addPoints,
  subtractPoints,
  getPointsHistory,
  getUnits
};
