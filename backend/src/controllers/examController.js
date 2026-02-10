const prisma = require('../lib/prisma');

// Exam System Controllers for Module 3.6

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
const getExams = async (req, res, next) => {
  try {
    const { status, limit = 20 } = req.query;
    const userId = req.user.id;

    let whereClause = {
      status: { in: ['PUBLISHED', 'ACTIVE'] } // Only show published/active exams
    };

    // Admin/Leader can see all exams including drafts
    if (req.user.role === 'ADMIN' || req.user.role === 'LEADER') {
      delete whereClause.status;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Check time-based status
    const now = new Date();
    if (whereClause.status?.in) {
      whereClause.AND = [
        {
          OR: [
            { startTime: null },
            { startTime: { lte: now } }
          ]
        },
        {
          OR: [
            { endTime: null },
            { endTime: { gte: now } }
          ]
        }
      ];
    }

    const exams = await prisma.exam.findMany({
      where: whereClause,
      include: {
        creator: {
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
        attempts: {
          where: { userId },
          select: {
            id: true,
            attemptNumber: true,
            status: true,
            score: true,
            isPassed: true,
            submittedAt: true
          },
          orderBy: { attemptNumber: 'desc' }
        },
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    // Get average scores for all exams
    const examIds = exams.map(e => e.id);
    const avgScores = await prisma.examAttempt.groupBy({
      by: ['examId'],
      where: {
        examId: { in: examIds },
        status: 'SUBMITTED'
      },
      _avg: {
        score: true
      }
    });

    const avgScoreMap = avgScores.reduce((acc, item) => {
      acc[item.examId] = item._avg.score || 0;
      return acc;
    }, {});

    const examsWithAttempts = exams.map(exam => {
      const userAttempts = exam.attempts || [];
      const lastAttempt = userAttempts[0] || null;
      const canTakeExam = userAttempts.length < exam.maxAttempts;
      
      return {
        ...exam,
        totalAttempts: exam._count?.attempts || 0,
        totalQuestions: exam._count?.questions || 0,
        avgScore: avgScoreMap[exam.id] || 0,
        userAttempts: userAttempts.length,
        lastAttempt,
        canTakeExam,
        attempts: undefined,
        _count: undefined
      };
    });

    res.status(200).json({
      success: true,
      data: examsWithAttempts
    });

  } catch (error) {
    console.error('Get exams error:', error);
    next(error);
  }
};

// @desc    Get single exam details
// @route   GET /api/exams/:id
// @access  Private
const getExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        creator: {
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
        attempts: {
          where: { userId },
          select: {
            id: true,
            attemptNumber: true,
            status: true,
            score: true,
            isPassed: true,
            pointsEarned: true,
            timeSpent: true,
            submittedAt: true
          },
          orderBy: { attemptNumber: 'desc' }
        },
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }

    // Check if user can view this exam
    if (exam.status === 'DRAFT' && 
        exam.creatorId !== userId && 
        req.user.role !== 'ADMIN' && 
        req.user.role !== 'LEADER') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this exam'
      });
    }

    const userAttempts = exam.attempts || [];
    const lastAttempt = userAttempts[0] || null;
    const canTakeExam = userAttempts.length < exam.maxAttempts;

    const examWithAttempts = {
      ...exam,
      userAttempts: userAttempts.length,
      lastAttempt,
      canTakeExam,
      attempts: undefined
    };

    res.status(200).json({
      success: true,
      data: examWithAttempts
    });

  } catch (error) {
    console.error('Get exam error:', error);
    next(error);
  }
};

// @desc    Start exam attempt
// @route   POST /api/exams/:id/start
// @access  Private
const startExamAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            questionText: true,
            questionType: true,
            answers: true, // This will include all answers with isCorrect flags
            points: true,
            orderIndex: true
          }
        },
        attempts: {
          where: { userId },
          select: { attemptNumber: true }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Exam not found'
      });
    }

    // Check if exam is available
    const now = new Date();
    if (exam.status !== 'ACTIVE' && exam.status !== 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        error: 'Exam is not available'
      });
    }

    if (exam.startTime && exam.startTime > now) {
      return res.status(400).json({
        success: false,
        error: 'Exam has not started yet'
      });
    }

    if (exam.endTime && exam.endTime < now) {
      return res.status(400).json({
        success: false,
        error: 'Exam has ended'
      });
    }

    // Check attempt limit
    const userAttempts = exam.attempts.length;
    if (userAttempts >= exam.maxAttempts) {
      return res.status(400).json({
        success: false,
        error: 'Maximum attempts reached'
      });
    }

    // Check for existing in-progress attempt
    const existingAttempt = await prisma.examAttempt.findFirst({
      where: {
        examId: id,
        userId,
        status: 'IN_PROGRESS'
      }
    });

    if (existingAttempt) {
      return res.status(400).json({
        success: false,
        error: 'You have an exam in progress',
        attemptId: existingAttempt.id
      });
    }

    // Prepare questions (remove correct answers from client response)
    let questions = exam.questions;
    
    if (exam.shuffleQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    const clientQuestions = questions.map(q => {
      let answers = q.answers;
      
      if (exam.shuffleAnswers && Array.isArray(answers)) {
        answers = answers.sort(() => Math.random() - 0.5);
      }
      
      // Remove isCorrect flags from answers for client
      const clientAnswers = Array.isArray(answers) 
        ? answers.map(a => ({ id: a.id, text: a.text }))
        : answers;

      return {
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        answers: clientAnswers,
        points: q.points
      };
    });

    // Create attempt
    const attempt = await prisma.examAttempt.create({
      data: {
        examId: id,
        userId,
        attemptNumber: userAttempts + 1,
        status: 'IN_PROGRESS'
      }
    });

    res.status(201).json({
      success: true,
      data: {
        attemptId: attempt.id,
        exam: {
          id: exam.id,
          title: exam.title,
          instructions: exam.instructions,
          duration: exam.duration,
          totalQuestions: questions.length,
          passingScore: exam.passingScore,
          showResults: exam.showResults,
          showAnswers: exam.showAnswers
        },
        questions: clientQuestions,
        startedAt: attempt.startedAt
      }
    });

  } catch (error) {
    console.error('Start exam attempt error:', error);
    next(error);
  }
};

// @desc    Submit exam attempt
// @route   POST /api/exams/attempts/:attemptId/submit
// @access  Private
const submitExamAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'Exam attempt not found'
      });
    }

    if (attempt.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        error: 'Exam attempt is not in progress'
      });
    }

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    const questionResults = [];

    for (const question of attempt.exam.questions) {
      totalPoints += question.points;
      
      const userAnswer = answers.find(a => a.questionId === question.id);
      if (!userAnswer) continue;

      const correctAnswers = Array.isArray(question.answers) 
        ? question.answers.filter(a => a.isCorrect).map(a => a.id)
        : [];

      let isCorrect = false;
      
      if (question.questionType === 'SINGLE_CHOICE' || question.questionType === 'TRUE_FALSE') {
        isCorrect = correctAnswers.includes(userAnswer.answerId);
      } else if (question.questionType === 'MULTIPLE_CHOICE') {
        const userAnswerIds = Array.isArray(userAnswer.answerIds) ? userAnswer.answerIds : [];
        isCorrect = userAnswerIds.length === correctAnswers.length && 
                   userAnswerIds.every(id => correctAnswers.includes(id));
      }

      if (isCorrect) {
        earnedPoints += question.points;
      }

      questionResults.push({
        questionId: question.id,
        userAnswer: userAnswer,
        isCorrect,
        correctAnswers,
        points: isCorrect ? question.points : 0
      });
    }

    const scorePercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const isPassed = scorePercentage >= attempt.exam.passingScore;
    const pointsEarned = isPassed ? attempt.exam.pointsAwarded : 0;

    // Calculate time spent
    const timeSpent = Math.floor((new Date() - new Date(attempt.startedAt)) / 1000);

    // Update attempt
    const submittedAttempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        timeSpent,
        answers,
        score: scorePercentage,
        isPassed,
        pointsEarned
      }
    });

    // Add points to user if passed
    if (isPassed && pointsEarned > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { points: { increment: pointsEarned } }
      });

      // Record points history
      await prisma.pointsHistory.create({
        data: {
          userId,
          points: pointsEarned,
          reason: `Passed exam: ${attempt.exam.title}`,
          type: 'EXAM_PASSED'
        }
      });
    }

    const result = {
      attemptId: submittedAttempt.id,
      score: scorePercentage,
      isPassed,
      pointsEarned,
      timeSpent,
      totalQuestions: questionResults.length,
      correctAnswers: questionResults.filter(q => q.isCorrect).length
    };

    // Include detailed results if exam allows
    if (attempt.exam.showResults) {
      result.questionResults = questionResults;
    }

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Submit exam attempt error:', error);
    next(error);
  }
};

// @desc    Get exam leaderboard
// @route   GET /api/exams/:id/leaderboard
// @access  Private
const getExamLeaderboard = async (req, res, next) => {
  try {
    const { id } = req.params;

    const leaderboard = await prisma.examAttempt.findMany({
      where: {
        examId: id,
        status: 'SUBMITTED',
        isPassed: true
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            unit: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { score: 'desc' },
        { timeSpent: 'asc' },
        { submittedAt: 'asc' }
      ],
      take: 50
    });

    const leaderboardData = leaderboard.map((attempt, index) => ({
      rank: index + 1,
      user: attempt.user,
      score: attempt.score,
      timeSpent: attempt.timeSpent,
      pointsEarned: attempt.pointsEarned,
      submittedAt: attempt.submittedAt
    }));

    res.status(200).json({
      success: true,
      data: leaderboardData
    });

  } catch (error) {
    console.error('Get exam leaderboard error:', error);
    next(error);
  }
};

// @desc    Create new exam (Admin/Leader only)
// @route   POST /api/exams
// @access  Private (Admin/Leader)
const createExam = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      instructions,
      duration,
      passingScore,
      maxAttempts,
      pointsAwarded,
      startTime,
      endTime,
      showResults,
      showAnswers,
      shuffleQuestions,
      shuffleAnswers,
      unitId,
      questions
    } = req.body;

    console.log('📝 Creating exam:', { title, category, questionsCount: questions?.length })

    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        category,
        instructions,
        duration,
        totalQuestions: questions?.length || 0,
        passingScore,
        maxAttempts,
        pointsAwarded,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        showResults,
        showAnswers,
        shuffleQuestions,
        shuffleAnswers,
        creatorId: req.user.id,
        unitId,
        status: 'DRAFT'
      }
    });

    console.log('✅ Exam created:', exam.id)

    // Create questions if provided
    if (questions && Array.isArray(questions)) {
      const questionData = questions.map((q, index) => ({
        examId: exam.id,
        questionText: q.questionText,
        questionType: q.questionType,
        answers: q.answers,
        explanation: q.explanation,
        points: q.points || 1,
        orderIndex: index + 1
      }));

      await prisma.examQuestion.createMany({
        data: questionData
      });

      console.log(`✅ Created ${questionData.length} questions`)
    }

    res.status(201).json({
      success: true,
      data: exam
    });

  } catch (error) {
    console.error('❌ Create exam error:', error);
    next(error);
  }
};

// @desc    Get exam statistics (Admin/Leader only)
// @route   GET /api/exams/admin/stats
// @access  Private (Admin/Leader)
const getExamStats = async (req, res, next) => {
  try {
    const { examId, startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    }

    let examFilter = {};
    if (examId) {
      examFilter.examId = examId;
    }

    const [
      totalExams,
      publishedExams,
      draftExams,
      totalAttempts,
      passedAttempts,
      averageScore,
      examResults
    ] = await Promise.all([
      prisma.exam.count({ where: dateFilter }),
      prisma.exam.count({ 
        where: { ...dateFilter, status: 'PUBLISHED' } 
      }),
      prisma.exam.count({ 
        where: { ...dateFilter, status: 'DRAFT' } 
      }),
      prisma.examAttempt.count({ 
        where: { ...examFilter, status: 'SUBMITTED' } 
      }),
      prisma.examAttempt.count({ 
        where: { ...examFilter, status: 'SUBMITTED', isPassed: true } 
      }),
      prisma.examAttempt.aggregate({
        where: { ...examFilter, status: 'SUBMITTED' },
        _avg: { score: true }
      }),
      prisma.examAttempt.groupBy({
        by: ['examId'],
        where: { ...examFilter, status: 'SUBMITTED' },
        _count: { id: true },
        _avg: { score: true }
      })
    ]);

    const avgPassRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        totalExams,
        publishedExams,
        draftExams,
        totalAttempts,
        passedAttempts,
        avgPassRate: Math.round(avgPassRate * 10) / 10, // Round to 1 decimal
        averageScore: Math.round(averageScore._avg.score || 0),
        examResults
      }
    });

  } catch (error) {
    console.error('Get exam stats error:', error);
    next(error);
  }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private/Admin/Leader
const updateExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      instructions,
      duration,
      passingScore,
      maxAttempts,
      pointsAwarded,
      startTime,
      endTime,
      showResults,
      showAnswers,
      shuffleQuestions,
      shuffleAnswers,
      unitId,
      status,
      questions
    } = req.body;

    // Check if exam exists
    const exam = await prisma.exam.findUnique({
      where: { id }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy kỳ thi'
      });
    }

    // Only creator, admin, or leader can update
    if (req.user.role !== 'ADMIN' && req.user.role !== 'LEADER' && exam.creatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền cập nhật kỳ thi này'
      });
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (duration !== undefined) updateData.duration = duration;
    if (passingScore !== undefined) updateData.passingScore = passingScore;
    if (maxAttempts !== undefined) updateData.maxAttempts = maxAttempts;
    if (pointsAwarded !== undefined) updateData.pointsAwarded = pointsAwarded;
    if (startTime !== undefined) updateData.startTime = startTime ? new Date(startTime) : null;
    if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : null;
    if (showResults !== undefined) updateData.showResults = showResults;
    if (showAnswers !== undefined) updateData.showAnswers = showAnswers;
    if (shuffleQuestions !== undefined) updateData.shuffleQuestions = shuffleQuestions;
    if (shuffleAnswers !== undefined) updateData.shuffleAnswers = shuffleAnswers;
    if (unitId !== undefined) updateData.unitId = unitId;
    if (status !== undefined) updateData.status = status;

    // Update questions if provided
    if (questions !== undefined) {
      updateData.totalQuestions = questions.length;
    }

    // Update exam and questions in transaction
    const updatedExam = await prisma.$transaction(async (tx) => {
      // Update exam
      const exam = await tx.exam.update({
        where: { id },
        data: updateData
      });

      // Update questions if provided
      if (questions && Array.isArray(questions)) {
        // Delete existing questions
        await tx.examQuestion.deleteMany({
          where: { examId: id }
        });

        // Create new questions
        if (questions.length > 0) {
          const questionData = questions.map((q, index) => ({
            examId: id,
            questionText: q.questionText,
            questionType: q.questionType || 'SINGLE_CHOICE',
            answers: q.answers,
            explanation: q.explanation,
            points: q.points || 1,
            orderIndex: index + 1
          }));

          await tx.examQuestion.createMany({
            data: questionData
          });
        }
      }

      // Return exam with questions
      return await tx.exam.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              fullName: true
            }
          },
          questions: true
        }
      });
    });

    res.status(200).json({
      success: true,
      data: updatedExam
    });

  } catch (error) {
    console.error('Update exam error:', error);
    next(error);
  }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private/Admin
const deleteExam = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if exam exists
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attempts: true
          }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy kỳ thi'
      });
    }

    // Delete related records first (cascade)
    // Note: ExamAnswer model doesn't exist - answers are stored as JSON in ExamAttempt
    await prisma.$transaction([
      // Delete exam attempts (contains answers as JSON)
      prisma.examAttempt.deleteMany({
        where: { examId: id }
      }),
      // Delete exam questions
      prisma.examQuestion.deleteMany({
        where: { examId: id }
      }),
      // Delete the exam
      prisma.exam.delete({
        where: { id }
      })
    ]);

    res.status(200).json({
      success: true,
      message: 'Đã xóa kỳ thi thành công'
    });

  } catch (error) {
    console.error('Delete exam error:', error);
    next(error);
  }
};

// @desc    Get exam attempts (for statistics)
// @route   GET /api/exams/:id/attempts
// @access  Private/Admin/Leader
const getExamAttempts = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if exam exists
    const exam = await prisma.exam.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        passingScore: true
      }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy kỳ thi'
      });
    }

    // Get all attempts for this exam
    const attempts = await prisma.examAttempt.findMany({
      where: {
        examId: id,
        status: 'SUBMITTED'
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
      orderBy: [
        { score: 'desc' },
        { submittedAt: 'asc' }
      ]
    });

    // Format response
    const formattedAttempts = attempts.map(attempt => ({
      id: attempt.id,
      userId: attempt.user.id,
      fullName: attempt.user.fullName,
      militaryRank: attempt.user.militaryRank,
      youthPosition: attempt.user.youthPosition,
      unitName: attempt.user.unit?.name || 'N/A',
      examTitle: exam.title,
      score: attempt.score,
      isPassed: attempt.isPassed,
      timeSpent: attempt.timeSpent,
      submittedAt: attempt.submittedAt,
      attemptNumber: attempt.attemptNumber
    }));

    res.status(200).json({
      success: true,
      data: formattedAttempts
    });

  } catch (error) {
    console.error('Get exam attempts error:', error);
    next(error);
  }
};

module.exports = {
  getExams,
  getExam,
  startExamAttempt,
  submitExamAttempt,
  getExamLeaderboard,
  createExam,
  updateExam,
  deleteExam,
  getExamStats,
  getExamAttempts
};


