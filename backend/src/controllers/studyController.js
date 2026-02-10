const prisma = require('../lib/prisma');

// Study System Controllers for Module 3.4

// @desc    Get all study topics
// @route   GET /api/study/topics
// @access  Private
const getStudyTopics = async (req, res, next) => {
  try {
    
    const { category, isActive = 'true' } = req.query;
    const userId = req.user.id;

    let whereClause = {};
    
    if (category && category !== 'all') {
      whereClause.category = category;
    }
    
    if (isActive !== 'all') {
      whereClause.isActive = isActive === 'true';
    }

    // Filter by validity period
    const now = new Date();
    whereClause.validFrom = { lte: now };
    whereClause.OR = [
      { validTo: null },
      { validTo: { gte: now } }
    ];

    // Query study topics
    const topics = await prisma.studyTopic.findMany({
      where: whereClause,
      include: {
        materials: {
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const topicsWithProgress = topics.map(topic => ({
      ...topic,
      userProgress: null, // Will be added later with progress tracking
      totalMaterials: topic.materials.length,
      hasQuiz: false // Will be added later with quiz integration
    }));

    res.status(200).json({
      success: true,
      data: topicsWithProgress
    });

  } catch (error) {
    console.error('Get study topics error:', error);
    next(error);
  }
};

// @desc    Get specific study topic details
// @route   GET /api/study/topics/:id
// @access  Private
const getStudyTopic = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const topic = await prisma.studyTopic.findUnique({
      where: { id },
      include: {
        materials: {
          orderBy: { orderIndex: 'asc' },
          include: {
            quiz: {
              select: { 
                id: true, 
                title: true, 
                instructions: true,
                timeLimit: true, 
                maxAttempts: true, 
                passingScore: true,
                showAnswers: true
              }
            },
            progress: {
              where: { userId },
              select: { 
                status: true, 
                viewedDuration: true,
                completedAt: true, 
                lastAccessedAt: true 
              }
            }
          }
        },
        progress: {
          where: { userId },
          select: { 
            status: true, 
            completedAt: true, 
            lastAccessedAt: true 
          }
        }
      }
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        error: 'Chuyên đề không tồn tại'
      });
    }

    // Check validity
    const now = new Date();
    if (topic.validFrom > now || (topic.validTo && topic.validTo < now)) {
      return res.status(400).json({
        success: false,
        error: 'Chuyên đề không còn hiệu lực'
      });
    }

    const materialsWithProgress = topic.materials.map(material => ({
      ...material,
      userProgress: material.progress[0] || null,
      canAccess: material.isRequired ? 
        (material.progress[0]?.status === 'COMPLETED' || material.orderIndex === 1) : 
        true
    }));

    res.status(200).json({
      success: true,
      data: {
        ...topic,
        materials: materialsWithProgress,
        userProgress: topic.progress[0] || null
      }
    });

  } catch (error) {
    console.error('Get study topic error:', error);
    next(error);
  }
};

// @desc    Start studying a material
// @route   POST /api/study/materials/:materialId/start
// @access  Private
const startStudyMaterial = async (req, res, next) => {
  try {
    const { materialId } = req.params;
    const userId = req.user.id;

    const material = await prisma.studyTopicMaterial.findUnique({
      where: { id: materialId },
      include: { topic: true }
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Tài liệu không tồn tại'
      });
    }

    // Check topic validity
    const now = new Date();
    if (material.topic.validFrom > now || (material.topic.validTo && material.topic.validTo < now)) {
      return res.status(400).json({
        success: false,
        error: 'Chuyên đề không còn hiệu lực'
      });
    }

    // Create or update material progress
    const progress = await prisma.userMaterialProgress.upsert({
      where: {
        userId_materialId: {
          userId,
          materialId
        }
      },
      update: {
        status: 'IN_PROGRESS',
        lastAccessedAt: now
      },
      create: {
        userId,
        materialId,
        status: 'IN_PROGRESS',
        lastAccessedAt: now
      }
    });

    // Create or update topic progress
    await prisma.userStudyProgress.upsert({
      where: {
        userId_topicId: {
          userId,
          topicId: material.topicId
        }
      },
      update: {
        status: 'IN_PROGRESS',
        lastAccessedAt: now
      },
      create: {
        userId,
        topicId: material.topicId,
        status: 'IN_PROGRESS',
        lastAccessedAt: now
      }
    });

    res.status(200).json({
      success: true,
      data: progress
    });

  } catch (error) {
    console.error('Start study material error:', error);
    next(error);
  }
};

// @desc    Update material progress (for videos)
// @route   PUT /api/study/materials/:materialId/progress
// @access  Private
const updateMaterialProgress = async (req, res, next) => {
  try {
    const { materialId } = req.params;
    const { viewedDuration, completed = false } = req.body;
    const userId = req.user.id;

    const material = await prisma.studyTopicMaterial.findUnique({
      where: { id: materialId }
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Tài liệu không tồn tại'
      });
    }

    const updateData = {
      viewedDuration: viewedDuration || 0,
      lastAccessedAt: new Date()
    };

    if (completed) {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();
    }

    const progress = await prisma.userMaterialProgress.update({
      where: {
        userId_materialId: {
          userId,
          materialId
        }
      },
      data: updateData
    });

    // Check if all required materials are completed to update topic progress
    const allMaterials = await prisma.studyTopicMaterial.findMany({
      where: { topicId: material.topicId },
      include: {
        progress: {
          where: { userId },
          select: { status: true }
        }
      }
    });

    const requiredMaterials = allMaterials.filter(m => m.isRequired);
    const completedRequired = requiredMaterials.filter(m => 
      m.progress[0]?.status === 'COMPLETED'
    );

    if (completedRequired.length === requiredMaterials.length) {
      await prisma.userStudyProgress.update({
        where: {
          userId_topicId: {
            userId,
            topicId: material.topicId
          }
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
    }

    res.status(200).json({
      success: true,
      data: progress
    });

  } catch (error) {
    console.error('Update material progress error:', error);
    next(error);
  }
};

// @desc    Get quiz for a material
// @route   GET /api/study/materials/:materialId/quiz
// @access  Private
const getQuiz = async (req, res, next) => {
  try {
    const { materialId } = req.params;
    const userId = req.user.id;

    const material = await prisma.studyTopicMaterial.findUnique({
      where: { id: materialId },
      include: {
        quiz: true,
        topic: true,
        progress: {
          where: { userId },
          select: { status: true }
        }
      }
    });

    if (!material || !material.quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz không tồn tại'
      });
    }

    // Check if user can access quiz (must complete required materials first)
    if (material.isRequired && material.progress[0]?.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'Bạn cần hoàn thành tài liệu trước khi làm quiz'
      });
    }

    // Get user's previous attempts
    const attempts = await prisma.userQuizAttempt.findMany({
      where: {
        userId,
        quizId: material.quiz.id
      },
      orderBy: { attemptNumber: 'desc' }
    });

    const canTakeQuiz = attempts.length < material.quiz.maxAttempts;
    const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0;
    const hasPassed = attempts.some(a => a.passed);

    res.status(200).json({
      success: true,
      data: {
        quiz: {
          id: material.quiz.id,
          title: material.quiz.title,
          instructions: material.quiz.instructions,
          timeLimit: material.quiz.timeLimit,
          maxAttempts: material.quiz.maxAttempts,
          passingScore: material.quiz.passingScore,
          questions: material.quiz.questions.map(q => ({
            ...q,
            correctAnswer: undefined // Don't send correct answers
          }))
        },
        userStats: {
          attemptCount: attempts.length,
          canTakeQuiz,
          bestScore,
          hasPassed,
          nextAttemptNumber: attempts.length + 1
        }
      }
    });

  } catch (error) {
    console.error('Get quiz error:', error);
    next(error);
  }
};

// @desc    Submit quiz attempt
// @route   POST /api/study/quiz/:quizId/submit
// @access  Private
const submitQuizAttempt = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { answers, timeSpent } = req.body;
    const userId = req.user.id;

    const quiz = await prisma.studyQuiz.findUnique({
      where: { id: quizId },
      include: { material: true }
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz không tồn tại'
      });
    }

    // Check attempts limit
    const attempts = await prisma.userQuizAttempt.findMany({
      where: { userId, quizId }
    });

    if (attempts.length >= quiz.maxAttempts) {
      return res.status(400).json({
        success: false,
        error: 'Bạn đã hết lượt làm quiz'
      });
    }

    // Calculate score
    const questions = quiz.questions;
    let correctAnswers = 0;
    let totalPoints = 0;

    const resultsWithCorrect = questions.map((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        correctAnswers++;
        totalPoints += question.points || 10;
      }

      return {
        questionId: question.id,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: isCorrect ? (question.points || 10) : 0
      };
    });

    const maxPoints = questions.reduce((sum, q) => sum + (q.points || 10), 0);
    const scorePercentage = Math.round((totalPoints / maxPoints) * 100);
    const passed = scorePercentage >= quiz.passingScore;

    // Save attempt
    const attempt = await prisma.userQuizAttempt.create({
      data: {
        userId,
        quizId,
        attemptNumber: attempts.length + 1,
        answers,
        score: scorePercentage,
        passed,
        timeSpent: timeSpent || 0,
        completedAt: new Date()
      }
    });

    // Award points for passing quiz
    if (passed) {
      const pointsToAward = Math.floor(scorePercentage / 10) * 5; // 5 points per 10% score
      
      await prisma.user.update({
        where: { id: userId },
        data: { points: { increment: pointsToAward } }
      });

      await prisma.pointsHistory.create({
        data: {
          userId,
          changeType: 'EARN',
          amount: pointsToAward,
          description: `Hoàn thành quiz: ${quiz.title} (${scorePercentage}%)`
        }
      });
    }

    res.status(201).json({
      success: true,
      data: {
        attempt,
        results: quiz.showAnswers ? resultsWithCorrect : {
          score: scorePercentage,
          passed,
          correctAnswers,
          totalQuestions: questions.length
        },
        pointsAwarded: passed ? Math.floor(scorePercentage / 10) * 5 : 0
      }
    });

  } catch (error) {
    console.error('Submit quiz attempt error:', error);
    next(error);
  }
};

// @desc    Get user's study progress overview
// @route   GET /api/study/my-progress
// @access  Private
const getMyStudyProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const topicProgress = await prisma.userStudyProgress.findMany({
      where: { userId },
      include: {
        topic: {
          select: {
            id: true,
            title: true,
            category: true,
            validTo: true
          }
        }
      },
      orderBy: { lastAccessedAt: 'desc' }
    });

    const quizAttempts = await prisma.userQuizAttempt.findMany({
      where: { userId },
      include: {
        quiz: {
          include: {
            material: {
              include: {
                topic: {
                  select: { title: true, category: true }
                }
              }
            }
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    // Calculate statistics
    const stats = {
      totalTopics: topicProgress.length,
      completedTopics: topicProgress.filter(p => p.status === 'COMPLETED').length,
      inProgressTopics: topicProgress.filter(p => p.status === 'IN_PROGRESS').length,
      totalQuizzes: quizAttempts.length,
      passedQuizzes: quizAttempts.filter(a => a.passed).length,
      averageScore: quizAttempts.length > 0 ? 
        Math.round(quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length) : 0
    };

    res.status(200).json({
      success: true,
      data: {
        stats,
        recentTopics: topicProgress.slice(0, 5),
        recentQuizzes: quizAttempts.slice(0, 5)
      }
    });

  } catch (error) {
    console.error('Get my study progress error:', error);
    next(error);
  }
};

// @desc    Get study leaderboard
// @route   GET /api/study/leaderboard
// @access  Private
const getStudyLeaderboard = async (req, res, next) => {
  try {
    const { category, timeRange = 'all' } = req.query;
    const currentUser = req.user;

    let dateFilter = {};
    if (timeRange === 'month') {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      dateFilter.completedAt = { gte: lastMonth };
    } else if (timeRange === 'week') {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      dateFilter.completedAt = { gte: lastWeek };
    }

    // Get quiz attempts with filters
    const quizAttemptsQuery = {
      where: {
        passed: true,
        ...dateFilter
      },
      include: {
        user: {
          select: { id: true, fullName: true, unitId: true }
        },
        quiz: {
          include: {
            material: {
              include: {
                topic: {
                  select: { category: true }
                }
              }
            }
          }
        }
      }
    };

    if (category && category !== 'all') {
      quizAttemptsQuery.where.quiz = {
        material: {
          topic: {
            category
          }
        }
      };
    }

    const quizAttempts = await prisma.userQuizAttempt.findMany(quizAttemptsQuery);

    // Calculate user scores
    const userScores = {};
    quizAttempts.forEach(attempt => {
      const userId = attempt.userId;
      if (!userScores[userId]) {
        userScores[userId] = {
          user: attempt.user,
          totalScore: 0,
          quizCount: 0,
          categories: new Set()
        };
      }
      
      userScores[userId].totalScore += attempt.score;
      userScores[userId].quizCount += 1;
      userScores[userId].categories.add(attempt.quiz.material.topic.category);
    });

    // Convert to array and sort
    const leaderboard = Object.values(userScores)
      .map(user => ({
        ...user,
        averageScore: Math.round(user.totalScore / user.quizCount),
        categoriesCount: user.categories.size,
        categories: Array.from(user.categories)
      }))
      .sort((a, b) => {
        // Sort by average score, then by quiz count
        if (b.averageScore === a.averageScore) {
          return b.quizCount - a.quizCount;
        }
        return b.averageScore - a.averageScore;
      })
      .slice(0, 20); // Top 20

    // Find current user's position
    const currentUserPosition = leaderboard.findIndex(u => u.user.id === currentUser.id) + 1;

    res.status(200).json({
      success: true,
      data: {
        leaderboard,
        currentUserPosition,
        currentUserStats: leaderboard.find(u => u.user.id === currentUser.id) || null
      }
    });

  } catch (error) {
    console.error('Get study leaderboard error:', error);
    next(error);
  }
};

// Admin functions for Module 3.4

// @desc    Create study topic (Admin only)
// @route   POST /api/study/admin/topics
// @access  Private (Admin)
const createStudyTopic = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      validFrom,
      validTo,
      materials
    } = req.body;

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Chỉ Admin mới có quyền tạo chuyên đề'
      });
    }

    const topic = await prisma.studyTopic.create({
      data: {
        title,
        description,
        category,
        validFrom: new Date(validFrom),
        validTo: validTo ? new Date(validTo) : null
      }
    });

    // Create materials if provided
    if (materials && materials.length > 0) {
      for (const materialData of materials) {
        await prisma.studyTopicMaterial.create({
          data: {
            topicId: topic.id,
            title: materialData.title,
            type: materialData.type,
            fileUrl: materialData.fileUrl,
            content: materialData.content,
            duration: materialData.duration,
            fileSize: materialData.fileSize,
            orderIndex: materialData.orderIndex,
            isRequired: materialData.isRequired || true
          }
        });
      }
    }

    res.status(201).json({
      success: true,
      data: topic
    });

  } catch (error) {
    console.error('Create study topic error:', error);
    next(error);
  }
};

// @desc    Get study statistics (Admin only)
// @route   GET /api/study/admin/stats
// @access  Private (Admin)
const getStudyStats = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Chỉ Admin mới có quyền xem thống kê'
      });
    }

    const { timeRange = 'month' } = req.query;
    
    let dateFilter = {};
    if (timeRange === 'month') {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      dateFilter = { gte: lastMonth };
    } else if (timeRange === 'week') {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      dateFilter = { gte: lastWeek };
    }

    // General statistics
    const totalTopics = await prisma.studyTopic.count();
    const activeTopics = await prisma.studyTopic.count({
      where: { isActive: true }
    });
    
    const totalUsers = await prisma.user.count();
    const activeStudents = await prisma.userStudyProgress.groupBy({
      by: ['userId'],
      where: {
        lastAccessedAt: dateFilter
      }
    });

    const quizStats = await prisma.userQuizAttempt.aggregate({
      where: {
        completedAt: dateFilter
      },
      _count: { id: true },
      _avg: { score: true }
    });

    // Category breakdown
    const categoryStats = await prisma.studyTopic.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { isActive: true }
    });

    // Progress by category
    const progressByCategory = await prisma.userStudyProgress.findMany({
      where: {
        lastAccessedAt: dateFilter
      },
      include: {
        topic: { select: { category: true } }
      }
    });

    const categoryProgress = {};
    progressByCategory.forEach(progress => {
      const category = progress.topic.category;
      if (!categoryProgress[category]) {
        categoryProgress[category] = { total: 0, completed: 0 };
      }
      categoryProgress[category].total++;
      if (progress.status === 'COMPLETED') {
        categoryProgress[category].completed++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalTopics,
          activeTopics,
          totalUsers,
          activeStudents: activeStudents.length,
          totalQuizAttempts: quizStats._count.id,
          averageScore: Math.round(quizStats._avg.score || 0)
        },
        categories: categoryStats,
        categoryProgress
      }
    });

  } catch (error) {
    console.error('Get study stats error:', error);
    next(error);
  }
};

module.exports = {
  // User functions
  getStudyTopics,
  getStudyTopic,
  startStudyMaterial,
  updateMaterialProgress,
  getQuiz,
  submitQuizAttempt,
  getMyStudyProgress,
  getStudyLeaderboard,
  
  // Admin functions
  createStudyTopic,
  getStudyStats
};
