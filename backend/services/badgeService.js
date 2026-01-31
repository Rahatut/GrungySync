const Badge = require('../models/Badge');
const User = require('../models/User');
const Streak = require('../models/Streak');
const Action = require('../models/Action');

/**
 * Check and award badges based on criteria
 */
exports.checkAndAwardBadges = async (userId, hobbySpaceId) => {
  try {
    const user = await User.findById(userId);
    const badges = await Badge.find(); // Get all possible badges

    for (const badgeTemplate of badges) {
      const hasBadge = user.badges.some(
        (b) => b.badgeId.toString() === badgeTemplate._id.toString() && b.hobbySpace.toString() === hobbySpaceId
      );

      if (hasBadge) continue; // Already has badge

      let shouldAward = false;

      switch (badgeTemplate.criteria.type) {
        case 'streak':
          // Check if user has the required streak
          const streak = await Streak.findOne({ user: userId, hobbySpace: hobbySpaceId });
          if (streak && streak.currentStreak >= badgeTemplate.criteria.value) {
            shouldAward = true;
          }
          break;

        case 'total_actions':
          // Check total actions in space
          const actionCount = await Action.countDocuments({
            user: userId,
            hobbySpace: hobbySpaceId,
          });
          if (actionCount >= badgeTemplate.criteria.value) {
            shouldAward = true;
          }
          break;

        case 'feedback_received':
          // Check feedback count
          const actions = await Action.find({ user: userId, hobbySpace: hobbySpaceId });
          const totalFeedback = actions.reduce((sum, a) => sum + a.feedbackReceived.length, 0);
          if (totalFeedback >= badgeTemplate.criteria.value) {
            shouldAward = true;
          }
          break;

        case 'revision_count':
          // Check revisions
          const revisionCount = await Action.countDocuments({
            user: userId,
            hobbySpace: hobbySpaceId,
            isRevision: true,
          });
          if (revisionCount >= badgeTemplate.criteria.value) {
            shouldAward = true;
          }
          break;

        case 'reflection_posts':
          // Check reflection posts
          const reflectionCount = await Action.countDocuments({
            user: userId,
            hobbySpace: hobbySpaceId,
            actionType: 'reflect',
          });
          if (reflectionCount >= badgeTemplate.criteria.value) {
            shouldAward = true;
          }
          break;

        case 'time_based':
          // Check if user has been active for required time
          const userActions = await Action.find({ user: userId, hobbySpace: hobbySpaceId }).sort({ createdAt: 1 });
          if (userActions.length > 0) {
            const firstAction = userActions[0].createdAt;
            const daysSinceStart = Math.floor((new Date() - firstAction) / (1000 * 60 * 60 * 24));
            if (daysSinceStart >= badgeTemplate.criteria.value) {
              shouldAward = true;
            }
          }
          break;
      }

      // Award badge if criteria met
      if (shouldAward) {
        user.badges.push({
          badgeId: badgeTemplate._id,
          hobbySpace: hobbySpaceId,
          earnedAt: new Date(),
        });
        await user.save();
      }
    }

    return user.badges;
  } catch (error) {
    console.error('Error checking and awarding badges:', error);
    throw error;
  }
};

/**
 * Initialize default badges for a new HobbySpace
 */
exports.initializeDefaultBadges = async (hobbySpaceId) => {
  try {
    const defaultBadges = [
      {
        name: 'Consistent Creator',
        description: 'Maintained a 7-day streak in this space',
        icon: '🔥',
        category: 'consistency',
        criteria: {
          type: 'streak',
          value: 7,
        },
      },
      {
        name: 'Learning Loop',
        description: 'Posted 5 reflection posts in this space',
        icon: '🎓',
        category: 'learning',
        criteria: {
          type: 'reflection_posts',
          value: 5,
        },
      },
      {
        name: 'Iterative Improver',
        description: 'Created 3 revisions of previous work',
        icon: '🔄',
        category: 'growth',
        criteria: {
          type: 'revision_count',
          value: 3,
        },
      },
      {
        name: 'Community Contributor',
        description: 'Received feedback on 5 posts',
        icon: '🤝',
        category: 'effort',
        criteria: {
          type: 'feedback_received',
          value: 5,
        },
      },
      {
        name: 'Monthly Commitment',
        description: 'Active for 30+ days in this space',
        icon: '📅',
        category: 'milestone',
        criteria: {
          type: 'time_based',
          value: 30,
        },
      },
    ];

    // Check if badges already exist for this space
    // (In a real app, you'd associate badges with spaces)
    for (const badgeData of defaultBadges) {
      const exists = await Badge.findOne({ name: badgeData.name });
      if (!exists) {
        const badge = new Badge(badgeData);
        await badge.save();
      }
    }

    console.log(`Default badges initialized for space ${hobbySpaceId}`);
  } catch (error) {
    console.error('Error initializing default badges:', error);
  }
};

/**
 * Get all badges for a user
 */
exports.getUserBadges = async (userId) => {
  try {
    const user = await User.findById(userId)
      .populate({
        path: 'badges.badgeId',
        select: 'name description icon category',
      })
      .populate('badges.hobbySpace', 'name slug');

    return user.badges;
  } catch (error) {
    console.error('Error fetching user badges:', error);
    throw error;
  }
};
