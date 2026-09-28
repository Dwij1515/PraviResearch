const mongoose = require('mongoose');
const { DepartmentZone } = require('../constants/enums');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    zone: {
      type: String,
      required: [true, 'Department zone is required'],
      enum: {
        values: DepartmentZone,
        message: '{VALUE} is not a valid DepartmentZone'
      }
    },
    headUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    annualBudgetInr: {
      type: Number,
      required: [true, 'Annual budget in INR is required'],
      default: 0,
      min: [0, 'Budget cannot be negative']
    },
    allocatedSpendInr: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Allocated spend cannot be negative']
    }
  },
  {
    timestamps: true,
    collection: 'departments'
  }
);

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;
