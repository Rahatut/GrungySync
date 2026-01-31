const User = require('../models/User');
const Action = require('../models/Action');
const progressService = require('../services/progressService');
const badgeService = require('../services/badgeService');
const streakService = require('../services/streakService');

/**
 * Get user's complete progress dashboard
 */
exports.getProgressDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const analytics = await progressService.getUserProgressAnalytics(userId);
    const badges = await badgeService.getUserBadges(userId);
    const streaks = await streakService.getUserStreaks(userId);

    res.json({
      analytics,
      badges,
      streaks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching progress dashboard', error: error.message });
  }
};

/**
 * Get analytics for a specific hobby space
 */
exports.getHobbySpaceAnalytics = async (req, res) => {
  try {
    const { hobbySpaceId } = req.params;
    const userId = req.user.id;

    const actions = await Action.find({
      user: userId,
      hobbySpace: hobbySpaceId,
    });

    const totalActions = actions.length;
    const totalEffort = actions.reduce((sum, a) => sum + a.effortScore, 0);
    const totalPoints = actions.reduce((sum, a) => sum + a.pointsAwarded, 0);

    // Calculate actions by type
    const actionsByType = {};
    actions.forEach((action) => {
      actionsByType[action.actionType] = (actionsByType[action.actionType] || 0) + 1;
    });

    // Get streak info
    const streak = await streakService.getStreakForSpace(userId, hobbySpaceId);

    // Get badges earned in this space
    const badges = await badgeService.getUserBadges(userId);
    const spaceBadges = badges.filter((b) => b.hobbySpace?.toString() === hobbySpaceId);

    res.json({
      hobbySpaceId,
      totalActions,
      totalEffort: Math.round(totalEffort),
      averageEffort: totalActions > 0 ? (totalEffort / totalActions).toFixed(2) : 0,
      totalPoints,
      actionsByType,
      streak,
      badges: spaceBadges,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching hobby space analytics', error: error.message });
  }
};

/**
 * Recalculate user's baseline
 */
exports.updateBaseline = async (req, res) => {
  try {
    const userId = req.user.id;

    const baseline = await progressService.calculateBaseline(userId);

    res.json({
      message: 'Baseline recalculated',
      baseline,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating baseline', error: error.message });
  }
};

/**
 * Get improvement score for a user
 * Shows how they're improving relative to their baseline
 */
exports.getImprovementScore = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    const lastNinetyDays = new Date();
    lastNinetyDays.setDate(lastNinetyDays.getDate() - 90);

    const actions = await Action.find({
      user: userId,
      createdAt: { $gte: lastNinetyDays },
    });

    const baseline = user.baseline;

    if (!baseline || actions.length === 0) {
      return res.json({
        improvementScore: 1.0,
        message: 'Not enough data to calculate improvement score',
        actionsAnalyzed: actions.length,
      });
    }

    // Count actions above baseline
    const aboveBaseline = actions.filter((a) => a.effortScore > baseline.avgEffortLevel).length;
    const improvementPercentage = ((aboveBaseline / actions.length) * 100).toFixed(2);

    // Calculate average effort trend (first 30 days vs last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActions = actions.filter((a) => a.createdAt >= thirtyDaysAgo);
    const olderActions = actions.filter((a) => a.createdAt < thirtyDaysAgo);

    const recentAvgEffort =
      recentActions.length > 0 ? recentActions.reduce((s, a) => s + a.effortScore, 0) / recentActions.length : 0;
    const olderAvgEffort =
      olderActions.length > 0 ? olderActions.reduce((s, a) => s + a.effortScore, 0) / olderActions.length : 0;

    const effortTrend = olderAvgEffort > 0 ? ((recentAvgEffort - olderAvgEffort) / olderAvgEffort) * 100 : 0;

    res.json({
      improvementPercentage: parseFloat(improvementPercentage),
      actionsAboveBaseline: aboveBaseline,
      totalActionsAnalyzed: actions.length,
      baseline: baseline.avgEffortLevel,
      effortTrend: parseFloat(effortTrend.toFixed(2)),
      recentAvgEffort: parseFloat(recentAvgEffort.toFixed(2)),
      olderAvgEffort: parseFloat(olderAvgEffort.toFixed(2)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error calculating improvement score', error: error.message });
  }
};

/**
 * Get leaderboard for a hobby space
 */
exports.getHobbySpaceLeaderboard = async (req, res) => {
  try {
    const { hobbySpaceId } = req.params;
    const { limit = 10 } = req.query;

    // Get all actions in the hobby space from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const actions = await Action.find({
      hobbySpace: hobbySpaceId,
      createdAt: { $gte: thirtyDaysAgo },
    }).populate('user', 'username displayName avatar');

    // Group by user and calculate stats
    const userStats = {};
    actions.forEach((action) => {
      const userId = action.user._id.toString();
      if (!userStats[userId]) {
        userStats[userId] = {
          user: action.user,
          actions: 0,
          points: 0,
          effort: 0,
        };
      }
      userStats[userId].actions += 1;
      userStats[userId].points += action.pointsAwarded;
      userStats[userId].effort += action.effortScore;
    });

    // Sort by points and return top
    const leaderboard = Object.values(userStats)
      .sort((a, b) => b.points - a.points)
      .slice(0, parseInt(limit));

    res.json({
      period: 'last-30-days',
      hobbySpaceId,
      leaderboard,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
  }
};
