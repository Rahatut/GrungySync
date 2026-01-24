const User = require('../models/User');
const Action = require('../models/Action');

/**
 * Calculate user's baseline (average activity frequency and effort level)
 * Used for self-improvement scoring
 */
exports.calculateBaseline = async (userId) => {
  try {
    const user = await User.findById(userId);

    // Get all actions from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const actions = await Action.find({
      user: userId,
      createdAt: { $gte: ninetyDaysAgo },
    });

    if (actions.length === 0) {
      return user.baseline; // No data to calculate
    }

    // Calculate days active
    const daysActive = Math.ceil((new Date() - ninetyDaysAgo) / (1000 * 60 * 60 * 24));
    const avgActivityFrequency = (actions.length / daysActive) * 7; // per week

    // Calculate average effort
    const totalEffort = actions.reduce((sum, a) => sum + a.effortScore, 0);
    const avgEffortLevel = totalEffort / actions.length;

    // Update user baseline
    user.baseline = {
      avgActivityFrequency,
      avgEffortLevel,
      lastBaselineUpdate: new Date(),
      updateFrequency: user.baseline.updateFrequency || 30,
    };

    await user.save();
    return user.baseline;
  } catch (error) {
    console.error('Error calculating baseline:', error);
    throw error;
  }
};

/**
 * Calculate personal improvement score for an action
 * Compares action effort to user's baseline
 * Returns bonus multiplier for points (1.0 = baseline, 1.5 = 50% above baseline)
 */
exports.calculatePersonalImprovementMultiplier = async (userId, effortScore) => {
  try {
    const user = await User.findById(userId);
    const baseline = user.baseline;

    // If no baseline, use 1.0x
    if (!baseline || baseline.avgEffortLevel === 0) {
      return 1.0;
    }

    // Calculate how much above/below baseline this action is
    const improvementRatio = effortScore / baseline.avgEffortLevel;

    // Bonus multiplier (capped at 2.0x)
    let multiplier = 1.0;
    if (improvementRatio > 1) {
      // Bonus for exceeding baseline
      multiplier = Math.min(2.0, 1.0 + (improvementRatio - 1) * 0.5);
    }

    return multiplier;
  } catch (error) {
    console.error('Error calculating improvement multiplier:', error);
    return 1.0;
  }
};

/**
 * Award bonus points for consistency improvement
 */
exports.awardConsistencyBonus = async (userId, hobbySpaceId, actionCount) => {
  try {
    const user = await User.findById(userId);
    let bonus = 0;

    // Weekly bonus: 10 points if 3+ actions in a week
    if (actionCount % 3 === 0 && actionCount > 0) {
      bonus += 10;
    }

    // Monthly milestone: 50 points if 12+ actions in a month
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyActions = await Action.countDocuments({
      user: userId,
      hobbySpace: hobbySpaceId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    if (monthlyActions >= 12) {
      bonus += 50;
    }

    return bonus;
  } catch (error) {
    console.error('Error calculating consistency bonus:', error);
    return 0;
  }
};

/**
 * Get user's progress analytics
 */
exports.getUserProgressAnalytics = async (userId) => {
  try {
    const user = await User.findById(userId);

    const analytics = {
      totalPoints: user.totalPoints,
      totalActions: 0,
      activeHobbySpaces: user.hobbySpaces.length,
      averageEffortPerAction: 0,
      baseline: user.baseline,
      badges: user.badges.length,
    };

    // Calculate total actions and average effort
    const actions = await Action.find({ user: userId });
    analytics.totalActions = actions.length;

    if (actions.length > 0) {
      const totalEffort = actions.reduce((sum, a) => sum + a.effortScore, 0);
      analytics.averageEffortPerAction = (totalEffort / actions.length).toFixed(2);
    }

    return analytics;
  } catch (error) {
    console.error('Error getting progress analytics:', error);
    throw error;
  }
};
