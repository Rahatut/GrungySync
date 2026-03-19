const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: ['follow', 'feedback', 'streak_warning', 'badge_earned'],
      required: true,
    },
    message: {
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
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
