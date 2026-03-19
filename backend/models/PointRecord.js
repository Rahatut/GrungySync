const mongoose = require('mongoose');

const pointRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['action', 'improvement_bonus', 'feedback_given', 'feedback_received', 'streak_bonus', 'badge_earn'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  relatedAction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Action',
  },
  relatedHobbySpace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HobbySpace',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('PointRecord', pointRecordSchema);
