const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { UserRole } = require('../constants/enums');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: UserRole,
        message: '{VALUE} is not a valid UserRole'
      }
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      validate: {
        validator: function (val) {
          // Department required for operational departmental roles; ADMIN and AUDITOR may omit
          if (['DIRECTOR', 'ASSET_MANAGER', 'INSPECTOR', 'CONTRACTOR'].includes(this.role)) {
            return val != null;
          }
          return true;
        },
        message: 'Department is required for operational departmental roles'
      }
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian phone number']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

// Indexes
userSchema.index({ departmentId: 1, role: 1 });

// Password comparison helper method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Never expose passwordHash in toJSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
