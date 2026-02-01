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

/**
 * Get comprehensive points analytics for user
 * Includes daily streak, weekly, monthly totals, and point trends
 */
exports.getPointsAnalytics = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Get all actions sorted by date
    const actions = await Action.find({ user: userId }).sort({ createdAt: 1 });

    // Calculate total points
    const totalPoints = user.totalPoints || 0;

    // Calculate this week's points
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const thisWeekActions = await Action.find({
      user: userId,
      createdAt: { $gte: weekStart },
    });

    const thisWeekTotal = thisWeekActions.reduce((sum, a) => sum + a.pointsAwarded, 0);

    // Calculate this month's points and highest
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const thisMonthActions = await Action.find({
      user: userId,
      createdAt: { $gte: monthStart },
    });

    const thisMonthTotal = thisMonthActions.reduce((sum, a) => sum + a.pointsAwarded, 0);

    // Calculate highest day this month
    const dailyPointsThisMonth = {};
    thisMonthActions.forEach((action) => {
      const dateKey = action.createdAt.toISOString().split('T')[0];
      dailyPointsThisMonth[dateKey] = (dailyPointsThisMonth[dateKey] || 0) + action.pointsAwarded;
    });

    const highestDayThisMonth = Math.max(...Object.values(dailyPointsThisMonth), 0);

    // Calculate point streak (consecutive days with points)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    let checkDate = new Date(today);

    // Get last 365 days of actions grouped by date
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    const recentActions = await Action.find({
      user: userId,
      createdAt: { $gte: yearAgo },
    });

    // Group actions by date
    const actionsByDate = {};
    recentActions.forEach((action) => {
      const dateKey = action.createdAt.toISOString().split('T')[0];
      if (!actionsByDate[dateKey]) {
        actionsByDate[dateKey] = [];
      }
      actionsByDate[dateKey].push(action);
    });

    // Calculate current streak
    while (true) {
      const dateKey = checkDate.toISOString().split('T')[0];
      if (actionsByDate[dateKey] && actionsByDate[dateKey].length > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate points over time for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const last30DaysActions = await Action.find({
      user: userId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    const dailyPoints = {};
    // Initialize all days with 0
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dailyPoints[dateKey] = 0;
    }

    // Fill in actual points
    last30DaysActions.forEach((action) => {
      const dateKey = action.createdAt.toISOString().split('T')[0];
      if (dailyPoints[dateKey] !== undefined) {
        dailyPoints[dateKey] += action.pointsAwarded;
      }
    });

    // Convert to array format
    const pointsOverTime = Object.keys(dailyPoints)
      .sort()
      .map((date) => ({
        date,
        points: dailyPoints[date],
      }));

    // Calculate points by hobby space
    const pointsByHobbySpace = {};
    actions.forEach((action) => {
      if (action.hobbySpace) {
        const spaceId = action.hobbySpace.toString();
        pointsByHobbySpace[spaceId] = (pointsByHobbySpace[spaceId] || 0) + action.pointsAwarded;
      }
    });

    // Get hobby space details
    const HobbySpace = require('../models/HobbySpace');
    const hobbySpaceBreakdown = await Promise.all(
      Object.keys(pointsByHobbySpace).map(async (spaceId) => {
        const space = await HobbySpace.findById(spaceId);
        return {
          hobbySpaceId: spaceId,
          hobbySpaceName: space ? space.name : 'Unknown',
          points: pointsByHobbySpace[spaceId],
        };
      })
    );

    // Get recent actions with images (last 10 actions with media)
    const recentActionsWithMedia = await Action.find({
      user: userId,
      mediaUrls: { $exists: true, $ne: [] },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('content mediaUrls pointsAwarded createdAt hobbySpace')
      .populate('hobbySpace', 'name');

    return {
      totalPoints,
      thisWeekTotal,
      thisMonthTotal,
      highestDayThisMonth,
      currentStreak,
      pointsOverTime,
      hobbySpaceBreakdown: hobbySpaceBreakdown.sort((a, b) => b.points - a.points),
      totalActions: actions.length,
      averagePointsPerAction: actions.length > 0 ? (totalPoints / actions.length).toFixed(2) : 0,
      recentActionsWithMedia,
    };
  } catch (error) {
    console.error('Error getting points analytics:', error);
    throw error;
  }
};
