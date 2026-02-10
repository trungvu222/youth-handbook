const prisma = require('../lib/prisma');

// @desc    Get all units
// @route   GET /api/units
// @access  Private
const getUnits = async (req, res, next) => {
  try {
    const units = await prisma.unit.findMany({
      include: {
        leader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        members: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        _count: {
          select: {
            members: true,
            activities: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      units: units.map(unit => ({
        ...unit,
        memberCount: unit._count.members,
        activityCount: unit._count.activities
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single unit
// @route   GET /api/units/:id
// @access  Private
const getUnit = async (req, res, next) => {
  try {
    const { id } = req.params;

    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        leader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        members: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            points: true,
            isActive: true
          }
        },
        _count: {
          select: {
            members: true,
            activities: true
          }
        }
      }
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        error: 'Unit not found'
      });
    }

    res.status(200).json({
      success: true,
      unit: {
        ...unit,
        memberCount: unit._count.members,
        activityCount: unit._count.activities
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create unit
// @route   POST /api/units
// @access  Private (Admin only)
const createUnit = async (req, res, next) => {
  try {
    const { name, leaderId, parentUnitId } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Please provide unit name'
      });
    }

    // Check if unit name already exists
    const existingUnit = await prisma.unit.findFirst({
      where: { name }
    });

    if (existingUnit) {
      return res.status(400).json({
        success: false,
        error: 'Unit with this name already exists'
      });
    }

    // Verify leader exists if provided
    if (leaderId) {
      const leader = await prisma.user.findUnique({
        where: { id: leaderId }
      });

      if (!leader) {
        return res.status(404).json({
          success: false,
          error: 'Leader not found'
        });
      }
    }

    // Verify parent unit exists if provided
    if (parentUnitId) {
      const parentUnit = await prisma.unit.findUnique({
        where: { id: parentUnitId }
      });

      if (!parentUnit) {
        return res.status(404).json({
          success: false,
          error: 'Parent unit not found'
        });
      }
    }

    const unit = await prisma.unit.create({
      data: {
        name,
        leaderId,
        parentUnitId
      },
      include: {
        leader: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      unit
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update unit
// @route   PUT /api/units/:id
// @access  Private (Admin only)
const updateUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, leaderId, parentUnitId, isActive } = req.body;

    // Check if unit exists
    const unit = await prisma.unit.findUnique({
      where: { id }
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        error: 'Unit not found'
      });
    }

    // Check if new name already exists (if name is being changed)
    if (name && name !== unit.name) {
      const existingUnit = await prisma.unit.findFirst({
        where: { name }
      });

      if (existingUnit) {
        return res.status(400).json({
          success: false,
          error: 'Unit with this name already exists'
        });
      }
    }

    // Verify leader exists if provided
    if (leaderId) {
      const leader = await prisma.user.findUnique({
        where: { id: leaderId }
      });

      if (!leader) {
        return res.status(404).json({
          success: false,
          error: 'Leader not found'
        });
      }
    }

    const updatedUnit = await prisma.unit.update({
      where: { id },
      data: {
        name: name || undefined,
        leaderId: leaderId !== undefined ? leaderId : undefined,
        parentUnitId: parentUnitId !== undefined ? parentUnitId : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      },
      include: {
        leader: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        _count: {
          select: {
            members: true,
            activities: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      unit: {
        ...updatedUnit,
        memberCount: updatedUnit._count.members,
        activityCount: updatedUnit._count.activities
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete unit
// @route   DELETE /api/units/:id
// @access  Private (Admin only)
const deleteUnit = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if unit exists
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        error: 'Unit not found'
      });
    }

    // Check if unit has members
    if (unit._count.members > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete unit with ${unit._count.members} members. Please reassign or remove members first.`
      });
    }

    await prisma.unit.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Unit deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unit stats
// @route   GET /api/units/stats
// @access  Private (Admin only)
const getUnitStats = async (req, res, next) => {
  try {
    const [totalUnits, activeUnits, totalMembers, unitsWithLeaders] = await Promise.all([
      prisma.unit.count(),
      prisma.unit.count({ where: { isActive: true } }),
      prisma.user.count({ where: { unitId: { not: null } } }),
      prisma.unit.count({ where: { leaderId: { not: null } } })
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUnits,
        activeUnits,
        inactiveUnits: totalUnits - activeUnits,
        totalMembers,
        unitsWithLeaders,
        unitsWithoutLeaders: totalUnits - unitsWithLeaders
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUnits,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit,
  getUnitStats
};
