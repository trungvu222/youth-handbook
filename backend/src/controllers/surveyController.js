const prisma = require('../lib/prisma');

// @desc    Get all surveys
// @route   GET /api/surveys
// @access  Private
const getSurveys = async (req, res, next) => {
  try {
    const { status, limit = 20 } = req.query;
    const userId = req.user.id;

    let whereClause = {};

    // Admin/Leader can see all surveys
    if (req.user.role !== 'ADMIN' && req.user.role !== 'LEADER') {
      whereClause.status = 'ACTIVE';
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const surveys = await prisma.survey.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        },
        responses: {
          where: { userId },
          select: {
            id: true,
            submittedAt: true
          }
        },
        _count: {
          select: {
            responses: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    const surveysWithStatus = surveys.map(survey => {
      const userResponses = survey.responses || [];
      const hasResponded = userResponses.length > 0;
      
      // Parse questions from JSON string
      let parsedQuestions = [];
      try {
        parsedQuestions = survey.questions ? JSON.parse(survey.questions) : [];
      } catch (e) {
        console.error('Error parsing questions:', e);
      }
      
      return {
        ...survey,
        questions: parsedQuestions,
        _count: {
          ...survey._count,
          questions: parsedQuestions.length
        },
        userResponses: userResponses.length,
        hasResponded,
        responses: undefined
      };
    });

    res.status(200).json({
      success: true,
      data: surveysWithStatus
    });

  } catch (error) {
    console.error('Get surveys error:', error);
    next(error);
  }
};

// @desc    Get single survey
// @route   GET /api/surveys/:id
// @access  Private
const getSurvey = async (req, res, next) => {
  try {
    const { id } = req.params;

    const survey = await prisma.survey.findUnique({
      where: { id },
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
            responses: true
          }
        }
      }
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
    }

    // Parse questions from JSON string
    let parsedQuestions = [];
    try {
      parsedQuestions = survey.questions ? JSON.parse(survey.questions) : [];
    } catch (e) {
      console.error('Error parsing questions:', e);
    }

    res.status(200).json({
      success: true,
      data: {
        ...survey,
        questions: parsedQuestions,
        _count: {
          ...survey._count,
          questions: parsedQuestions.length
        }
      }
    });

  } catch (error) {
    console.error('Get survey error:', error);
    next(error);
  }
};

// @desc    Create survey
// @route   POST /api/surveys
// @access  Private/Admin/Leader
const createSurvey = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      isAnonymous,
      isPublic,
      startDate,
      endDate,
      pointsReward,
      status,
      questions
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Tiêu đề khảo sát là bắt buộc'
      });
    }

    if (!questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Phải có ít nhất 1 câu hỏi'
      });
    }

    const survey = await prisma.survey.create({
      data: {
        title,
        description,
        isAnonymous: isAnonymous || false,
        status: status || 'DRAFT',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
        pointsReward: pointsReward || 10,
        questions: JSON.stringify(questions), // Store as JSON string
        creatorId: req.user.id
      }
    });

    // Parse questions back for response
    const surveyResponse = {
      ...survey,
      questions: JSON.parse(survey.questions),
      _count: {
        questions: questions.length,
        responses: 0
      }
    };

    res.status(201).json({
      success: true,
      data: surveyResponse
    });

  } catch (error) {
    console.error('Create survey error:', error);
    next(error);
  }
};

// @desc    Update survey
// @route   PUT /api/surveys/:id
// @access  Private/Admin/Leader
const updateSurvey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const survey = await prisma.survey.findUnique({
      where: { id }
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
    }

    if (req.user.role !== 'ADMIN' && req.user.role !== 'LEADER' && survey.creatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    const updatedSurvey = await prisma.survey.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
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

    res.status(200).json({
      success: true,
      data: updatedSurvey
    });

  } catch (error) {
    console.error('Update survey error:', error);
    next(error);
  }
};

// @desc    Delete survey
// @route   DELETE /api/surveys/:id
// @access  Private/Admin
const deleteSurvey = async (req, res, next) => {
  try {
    const { id } = req.params;

    const survey = await prisma.survey.findUnique({
      where: { id }
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
    }

    // Delete all related responses first, then delete the survey
    // Questions are stored as JSON in the survey itself, not in a separate table
    await prisma.$transaction([
      prisma.surveyResponse.deleteMany({
        where: { surveyId: id }
      }),
      prisma.survey.delete({
        where: { id }
      })
    ]);

    res.status(200).json({
      success: true,
      message: 'Survey deleted successfully'
    });

  } catch (error) {
    console.error('Delete survey error:', error);
    next(error);
  }
};

// @desc    Get survey stats
// @route   GET /api/surveys/admin/stats
// @access  Private/Admin/Leader
const getSurveyStats = async (req, res, next) => {
  try {
    // Get basic counts
    const [
      totalSurveys,
      activeSurveys,
      draftSurveys,
      closedSurveys,
      totalResponses,
      totalUsers
    ] = await Promise.all([
      prisma.survey.count(),
      prisma.survey.count({ where: { status: 'ACTIVE' } }),
      prisma.survey.count({ where: { status: 'DRAFT' } }),
      prisma.survey.count({ where: { status: 'CLOSED' } }),
      prisma.surveyResponse.count(),
      prisma.user.count({ where: { role: 'MEMBER' } })
    ]);

    // Calculate completion rate - responses / (active surveys * total members)
    let completionRate = 0;
    if (activeSurveys > 0 && totalUsers > 0) {
      // Get responses for active surveys
      const activeResponses = await prisma.surveyResponse.count({
        where: {
          survey: { status: 'ACTIVE' }
        }
      });
      completionRate = (activeResponses / (activeSurveys * totalUsers)) * 100;
    }

    // Calculate average response time (estimated - using surveys with responses)
    let avgResponseTime = 5; // Default 5 minutes
    const surveysWithResponses = await prisma.survey.findMany({
      where: { 
        status: { in: ['ACTIVE', 'CLOSED'] },
        responses: { some: {} }
      },
      select: {
        questions: true // questions is a JSON string field, not a relation
      }
    });

    if (surveysWithResponses.length > 0) {
      // Estimate average time based on number of questions (1.5 minutes per question on average)
      let totalQuestions = 0;
      for (const survey of surveysWithResponses) {
        try {
          const questionsArray = JSON.parse(survey.questions || '[]');
          totalQuestions += questionsArray.length;
        } catch (e) {
          totalQuestions += 5; // Default assumption if JSON parse fails
        }
      }
      const avgQuestions = totalQuestions / surveysWithResponses.length;
      avgResponseTime = Math.max(3, Math.round(avgQuestions * 1.5)); // Minimum 3 minutes
    }

    res.status(200).json({
      success: true,
      data: {
        totalSurveys,
        activeSurveys,
        draftSurveys,
        closedSurveys,
        totalResponses,
        completionRate: Math.min(completionRate, 100), // Cap at 100%
        avgResponseTime
      }
    });

  } catch (error) {
    console.error('Get survey stats error:', error);
    next(error);
  }
};

// @desc    Get survey responses
// @route   GET /api/surveys/:id/responses
// @access  Private/Admin/Leader
const getSurveyResponses = async (req, res, next) => {
  try {
    const { id } = req.params;

    const survey = await prisma.survey.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        isAnonymous: true
      }
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
    }

    const responses = await prisma.surveyResponse.findMany({
      where: { surveyId: id },
      include: {
        user: survey.isAnonymous ? false : {
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
      orderBy: { submittedAt: 'desc' }
    });

    const formattedResponses = responses.map(response => ({
      id: response.id,
      userId: survey.isAnonymous ? null : response.user?.id,
      fullName: survey.isAnonymous ? 'Ẩn danh' : response.user?.fullName,
      militaryRank: survey.isAnonymous ? null : response.user?.militaryRank,
      youthPosition: survey.isAnonymous ? null : response.user?.youthPosition,
      unitName: survey.isAnonymous ? null : response.user?.unit?.name,
      surveyTitle: survey.title,
      answers: response.answers,
      submittedAt: response.submittedAt
    }));

    res.status(200).json({
      success: true,
      data: formattedResponses
    });

  } catch (error) {
    console.error('Get survey responses error:', error);
    next(error);
  }
};

// @desc    Submit survey response (user)
// @route   POST /api/surveys/:id/submit
// @access  Private
const submitSurveyResponse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { answers } = req.body;

    // Check survey exists and is active
    const survey = await prisma.survey.findUnique({ where: { id } });
    if (!survey) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khảo sát' });
    }
    if (survey.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, error: 'Khảo sát không còn hoạt động' });
    }

    // Check if already responded
    const existing = await prisma.surveyResponse.findUnique({
      where: { surveyId_userId: { surveyId: id, userId } }
    });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Bạn đã trả lời khảo sát này rồi' });
    }

    const response = await prisma.surveyResponse.create({
      data: {
        surveyId: id,
        userId,
        answers: JSON.stringify(answers)
      }
    });

    res.status(201).json({ success: true, data: response });
  } catch (error) {
    console.error('Submit survey response error:', error);
    next(error);
  }
};

module.exports = {
  getSurveys,
  getSurvey,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  getSurveyStats,
  getSurveyResponses,
  submitSurveyResponse
};
