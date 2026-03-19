const User = require('../models/User');
const Action = require('../models/Action');
const PointRecord = require('../models/PointRecord');
const HobbySpace = require('../models/HobbySpace');

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
 * Centralized point awarding function
 */
exports.awardPoints = async (userId, points, type, description, relatedAction = null, relatedHobbySpace = null) => {
  try {
    if (points === 0) return 0;

    const user = await User.findById(userId);
    if (!user) return 0;

    // Update user total points
    user.totalPoints = (user.totalPoints || 0) + points;

    // Update hobby space specific points if applicable
    if (relatedHobbySpace) {
      const spaceId = relatedHobbySpace.toString();
      const currentSpacePoints = user.pointsByHobbySpace.get(spaceId) || 0;
      user.pointsByHobbySpace.set(spaceId, currentSpacePoints + points);
    }

    await user.save();

    // Create the record for analytics
    await PointRecord.create({
      user: userId,
      points,
      type,
      description,
      relatedAction,
      relatedHobbySpace,
    });

    console.log(`[PROGRESS] Awarded ${points} points to ${user.username} for ${type}`);
    return points;
  } catch (error) {
    console.error('Error in awardPoints:', error);
    return 0;
  }
};

/**
 * Award bonus points for consistency improvement
 */
exports.awardConsistencyBonus = async (userId, hobbySpaceId, actionCount) => {
  try {
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

    if (bonus > 0) {
      await this.awardPoints(
        userId, 
        bonus, 
        'streak_bonus', 
        `Consistency bonus for ${actionCount} actions`, 
        null, 
        hobbySpaceId
      );
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
      totalPoints: user.totalPoints || 0,
      totalActions: await Action.countDocuments({ user: userId }),
      activeHobbySpaces: user.hobbySpaces.length,
      averageEffortPerAction: 0,
      baseline: user.baseline,
      badges: user.badges.length,
    };

    // Calculate average effort
    const actions = await Action.find({ user: userId });
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
 * Backfill point records from existing actions for a user
 */
const backfillPointRecords = async (userId) => {
  try {
    const existingActions = await Action.find({ user: userId });
    for (const action of existingActions) {
      const exists = await PointRecord.findOne({ relatedAction: action._id, user: userId });
      if (!exists && action.pointsAwarded > 0) {
        await PointRecord.create({
          user: userId,
          points: action.pointsAwarded,
          type: action.isRevision ? 'improvement_bonus' : 'action',
          description: `Backfilled: ${action.actionType} in space`,
          relatedAction: action._id,
          relatedHobbySpace: action.hobbySpace,
          createdAt: action.createdAt
        });
      }
    }
    console.log(`[BACKFILL] Completed for user ${userId}`);
  } catch (err) {
    console.error('[BACKFILL] Error:', err);
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

    // 1. Backfill if no records exist but actions do
    const recordCount = await PointRecord.countDocuments({ user: userId });
    if (recordCount === 0) {
      const actionCount = await Action.countDocuments({ user: userId });
      if (actionCount > 0) {
        await backfillPointRecords(userId);
      }
    }

    // Get all point records sorted by date
    const pointRecords = await PointRecord.find({ user: userId }).sort({ createdAt: 1 });

    // Calculate total points
    const totalPoints = user.totalPoints || 0;

    // Calculate this week's points
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); 
    weekStart.setHours(0, 0, 0, 0);

    const thisWeekRecords = pointRecords.filter(r => r.createdAt >= weekStart);
    const thisWeekTotal = thisWeekRecords.reduce((sum, r) => sum + r.points, 0);

    // Calculate this month's points and highest
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const thisMonthRecords = pointRecords.filter(r => r.createdAt >= monthStart);
    const thisMonthTotal = thisMonthRecords.reduce((sum, r) => sum + r.points, 0);

    // Calculate highest day this month
    const dailyPointsThisMonth = {};
    thisMonthRecords.forEach((record) => {
      const dateKey = record.createdAt.toISOString().split('T')[0];
      dailyPointsThisMonth[dateKey] = (dailyPointsThisMonth[dateKey] || 0) + record.points;
    });

    const highestDayThisMonth = Math.max(...Object.values(dailyPointsThisMonth), 0);

    // Calculate point streak (consecutive days with points)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    let checkDate = new Date(today);

    // Group records by date
    const recordsByDate = {};
    pointRecords.forEach((record) => {
      const dateKey = record.createdAt.toISOString().split('T')[0];
      if (!recordsByDate[dateKey]) {
        recordsByDate[dateKey] = [];
      }
      recordsByDate[dateKey].push(record);
    });

    // Calculate current streak
    while (true) {
      const dateKey = checkDate.toISOString().split('T')[0];
      if (recordsByDate[dateKey] && recordsByDate[dateKey].length > 0) {
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

    const dailyPointsMap = {};
    // Initialize all days with 0
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dailyPointsMap[dateKey] = 0;
    }

    // Fill in actual points
    pointRecords.forEach((record) => {
      const dateKey = record.createdAt.toISOString().split('T')[0];
      if (dailyPointsMap[dateKey] !== undefined) {
        dailyPointsMap[dateKey] += record.points;
      }
    });

    // Convert to array format
    const pointsOverTime = Object.keys(dailyPointsMap)
      .sort()
      .map((date) => ({
        date,
        points: dailyPointsMap[date],
      }));

    // Calculate points by hobby space
    const pointsByHobbySpace = {};
    const pointsByTypeBreakdown = {};
    
    pointRecords.forEach((record) => {
      // By hobby space
      if (record.relatedHobbySpace) {
        const spaceId = record.relatedHobbySpace.toString();
        pointsByHobbySpace[spaceId] = (pointsByHobbySpace[spaceId] || 0) + record.points;
      }

      // By type
      pointsByTypeBreakdown[record.type] = (pointsByTypeBreakdown[record.type] || 0) + record.points;
    });

    // Get hobby space details
    const hobbySpaceBreakdown = await Promise.all(
      Object.keys(pointsByHobbySpace).map(async (spaceId) => {
        try {
          if (!spaceId || spaceId === 'undefined' || spaceId === 'null') {
            return { hobbySpaceId: spaceId, hobbySpaceName: 'Other/Bonus', points: pointsByHobbySpace[spaceId] };
          }
          const space = await HobbySpace.findById(spaceId);
          return {
            hobbySpaceId: spaceId,
            hobbySpaceName: space ? space.name : 'Unknown Space',
            points: pointsByHobbySpace[spaceId],
          };
        } catch (e) {
          return { hobbySpaceId: spaceId, hobbySpaceName: 'Other/Bonus', points: pointsByHobbySpace[spaceId] };
        }
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
      pointsByType: pointsByTypeBreakdown,
      totalActions: pointRecords.filter(r => r.type === 'action').length,
      averagePointsPerAction: (totalPoints / (pointRecords.filter(r => r.type === 'action').length || 1)).toFixed(1),
      recentActionsWithMedia,
    };
  } catch (error) {
    console.error('Error getting points analytics:', error);
    throw error;
  }
};
