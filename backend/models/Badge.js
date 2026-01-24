const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    icon: String, // emoji or icon identifier
    category: {
      type: String,
      enum: ['consistency', 'effort', 'growth', 'learning', 'milestone'],
      required: true,
    },
    // Criteria for earning badge
    criteria: {
      type: {
        type: String,
        enum: ['streak', 'total_actions', 'feedback_received', 'revision_count', 'reflection_posts', 'time_based'],
        required: true,
      },
      value: Number, // e.g., streak of 30 days
      timeframe: String, // 'weekly', 'monthly', 'all-time'
    },
    // Badge instances per user
    awardedTo: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        hobbySpace: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'HobbySpace',
        },
        awardedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Badge', BadgeSchema);
