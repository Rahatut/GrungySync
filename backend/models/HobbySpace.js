const mongoose = require('mongoose');

const HobbySpaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: String, // emoji or icon identifier
    category: {
      type: String,
      enum: ['Art', 'Music', 'Fitness', 'Writing', 'Tech', 'Learning', 'Crafts', 'Other'],
      required: true,
    },
    guidelines: {
      type: String,
      default: '',
    },
    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    memberCount: {
      type: Number,
      default: 0,
    },
    // Configuration for actions in this space
    actionConfig: {
      validActions: {
        type: [String],
        enum: ['post', 'log', 'upload', 'reflect'],
        default: ['post', 'log', 'upload', 'reflect'],
      },
      minEffortThreshold: {
        type: Number,
        default: 100, // minimum chars/effort points
      },
      consistencyWindow: {
        type: Number,
        default: 7, // days (e.g., 3 actions in 7 days)
      },
      requiredActionsPerWindow: {
        type: Number,
        default: 3,
      },
      dailyPointCap: {
        type: Number,
        default: 50,
      },
      weeklyPointCap: {
        type: Number,
        default: 300,
      },
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HobbySpace', HobbySpaceSchema);
