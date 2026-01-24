const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  bio: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,
    default: 'https://via.placeholder.com/150',
  },
  banner: {
    type: String,
    default: null,
  },
  displayName: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: '',
  },
  website: {
    type: String,
    default: '',
  },
  pronouns: {
    type: String,
    default: '',
  },
  theme: {
    type: String,
    default: 'light',
    enum: ['light', 'dark'],
  },
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  // GrungySync: Hobby Spaces & Points
  hobbySpaces: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HobbySpace',
    },
  ],
  totalPoints: {
    type: Number,
    default: 0,
  },
  pointsByHobbySpace: {
    type: Map,
    of: Number,
    default: new Map(),
  },
  // Personal baseline for self-improvement scoring
  baseline: {
    avgActivityFrequency: {
      type: Number,
      default: 0, // actions per week
    },
    avgEffortLevel: {
      type: Number,
      default: 0, // average effort score
    },
    lastBaselineUpdate: Date,
    updateFrequency: {
      type: Number,
      default: 30, // recalculate every 30 days
    },
  },
  // Badges earned
  badges: [
    {
      badgeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badge',
      },
      hobbySpace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HobbySpace',
      },
      earnedAt: Date,
    },
  ],
  // Feedback tokens (limited per week)
  feedbackTokens: {
    current: {
      type: Number,
      default: 5,
    },
    maxPerWeek: {
      type: Number,
      default: 5,
    },
    lastRefillDate: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
