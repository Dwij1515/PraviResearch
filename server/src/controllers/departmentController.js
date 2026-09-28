const Department = require('../models/Department');

/**
 * List all municipal departments
 * GET /api/v1/departments
 */
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find()
      .populate('headUserId', 'name email role phone')
      .sort({ code: 1 });

    res.status(200).json({
      success: true,
      data: departments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get department by ID
 * GET /api/v1/departments/:id
 */
const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('headUserId', 'name email role phone');

    if (!department) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DEPARTMENT_NOT_FOUND',
          message: 'The requested department was not found.'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartmentById
};
