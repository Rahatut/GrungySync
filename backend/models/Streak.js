const mongoose = require('mongoose');

const StreakSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hobbySpace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HobbySpace',
      required: true,
    },
    // Current streak
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    // Grace window tracking
    lastActionDate: Date,
    graceUsedCount: {
      type: Number,
      default: 0,
    },
    maxGraceAllowance: {
      type: Number,
      default: 2, // can miss 2 days in a row before streak breaks
    },
    // Time window criteria (e.g., 3 actions in 7 days)
    actionWindow: {
      type: Number, // days
      default: 7,
    },
    requiredActionsInWindow: {
      type: Number,
      default: 3,
    },
    // Actions in current window
    actionsInCurrentWindow: [
      {
        actionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Action',
        },
        date: Date,
      },
    ],
    // Streak metadata
    streakStartDate: Date,
    isActive: {
      type: Boolean,
      default: false,
    },
    breakDate: Date, // when streak was broken
  },
  { timestamps: true }
);

// Index for efficient querying
StreakSchema.index({ user: 1, hobbySpace: 1 });

module.exports = mongoose.model('Streak', StreakSchema);
