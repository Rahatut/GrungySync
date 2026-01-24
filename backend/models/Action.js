const mongoose = require('mongoose');

const ActionSchema = new mongoose.Schema(
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
    actionType: {
      type: String,
      enum: ['post', 'log', 'upload', 'reflect'],
      required: true,
    },
    // Effort metrics
    effortScore: {
      type: Number,
      default: 0, // calculated based on content length, media, etc.
    },
    description: String,
    content: String, // for text posts/logs
    mediaCount: {
      type: Number,
      default: 0,
    },
    // For versioned tracking
    relatedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Action', // links to previous version if revision
    },
    isRevision: {
      type: Boolean,
      default: false,
    },
    revisionOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Action',
    },
    // For reflection posts
    learningPoints: [String],
    challenges: [String],
    // Points awarded
    pointsAwarded: {
      type: Number,
      default: 0,
    },
    // Reactions (hearts)
    reactions: {
      type: Number,
      default: 0,
    },
    reactedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Feedback received
    feedbackReceived: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        feedback: String,
        pointsForFeedback: Number,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    visibility: {
      type: String,
      enum: ['public', 'private', 'hobbyspace-only'],
      default: 'public',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Action', ActionSchema);
