const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
const getPosts = async (req, res, next) => {
  try {
    const { 
      postType, 
      status,
      search,
      page = 1, 
      limit = 20 
    } = req.query;

    const currentUser = req.user;
    let whereClause = {};

    // Filter by user permissions
    if (currentUser.role === 'MEMBER') {
      // Members can only see approved posts in their unit or public posts
      whereClause.AND = [
        { status: 'APPROVED' },
        {
          OR: [
            { unitId: currentUser.unitId },
            { unitId: null } // Public posts
          ]
        }
      ];
    } else if (currentUser.role === 'LEADER') {
      // Leaders can see posts in their unit (all statuses) + approved public posts
      whereClause.OR = [
        { unitId: currentUser.unitId },
        { 
          AND: [
            { unitId: null },
            { status: 'APPROVED' }
          ]
        }
      ];
    }
    // Admin can see all posts

    // Apply additional filters
    if (postType) {
      whereClause.postType = postType;
    }

    if (status && currentUser.role !== 'MEMBER') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          content: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        include: {
          author: {
            select: { id: true, fullName: true, email: true, role: true }
          },
          unit: {
            select: { id: true, name: true }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.post.count({ where: whereClause })
    ]);

    res.status(200).json({
      success: true,
      data: posts,
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

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Private
const getPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, fullName: true, email: true, role: true }
        },
        unit: {
          select: { id: true, name: true }
        }
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check permissions
    const canView = currentUser.role === 'ADMIN' || 
                   post.unitId === currentUser.unitId ||
                   (post.unitId === null && post.status === 'APPROVED') ||
                   post.authorId === currentUser.id;

    if (!canView) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new post
// @route   POST /api/posts
// @access  Private (All roles)
const createPost = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const {
      title,
      content,
      postType,
      unitId
    } = req.body;

    // Validate permissions
    if (currentUser.role === 'MEMBER' && unitId !== currentUser.unitId) {
      return res.status(403).json({
        success: false,
        error: 'Members can only create posts for their own unit'
      });
    }

    // Members' posts start as PENDING, Admin/Leader posts can be APPROVED
    const status = currentUser.role === 'MEMBER' ? 'PENDING' : 'APPROVED';

    const post = await prisma.post.create({
      data: {
        title,
        content,
        postType,
        authorId: currentUser.id,
        unitId: unitId || null,
        status,
        publishedAt: status === 'APPROVED' ? new Date() : null
      },
      include: {
        author: {
          select: { id: true, fullName: true, email: true, role: true }
        },
        unit: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private (Author, Admin, Leader)
const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const {
      title,
      content,
      postType,
      status
    } = req.body;

    const post = await prisma.post.findUnique({
      where: { id }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check permissions
    const canEdit = currentUser.role === 'ADMIN' ||
                   (currentUser.role === 'LEADER' && post.unitId === currentUser.unitId) ||
                   post.authorId === currentUser.id;

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Only Admin/Leader can change status
    const updateData = {
      title,
      content,
      postType
    };

    if ((currentUser.role === 'ADMIN' || currentUser.role === 'LEADER') && status) {
      updateData.status = status;
      if (status === 'APPROVED' && !post.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, fullName: true, email: true, role: true }
        },
        unit: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: updatedPost
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private (Author, Admin, Leader)
const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const post = await prisma.post.findUnique({
      where: { id }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check permissions
    const canDelete = currentUser.role === 'ADMIN' ||
                     (currentUser.role === 'LEADER' && post.unitId === currentUser.unitId) ||
                     post.authorId === currentUser.id;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await prisma.post.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost
};

