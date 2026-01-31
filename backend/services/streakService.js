const Streak = require('../models/Streak');
const Action = require('../models/Action');
const HobbySpace = require('../models/HobbySpace');
const User = require('../models/User');

/**
 * Calculate or update streak for a user in a hobby space
 * Handles grace periods and time-window based logic
 */
exports.updateStreak = async (userId, hobbySpaceId, actionId = null) => {
  try {
    let streak = await Streak.findOne({ user: userId, hobbySpace: hobbySpaceId });
    const hobbySpace = await HobbySpace.findById(hobbySpaceId);

    if (!hobbySpace) {
      throw new Error('HobbySpace not found');
    }

    // Create new streak if none exists
    if (!streak) {
      streak = new Streak({
        user: userId,
        hobbySpace: hobbySpaceId,
        streakStartDate: new Date(),
        isActive: true,
        actionWindow: hobbySpace.actionConfig.consistencyWindow,
        requiredActionsInWindow: hobbySpace.actionConfig.requiredActionsPerWindow,
      });
    }

    // Add action to current window
    if (actionId) {
      streak.actionsInCurrentWindow.push({
        actionId,
        date: new Date(),
      });
    }

    // Clean old actions outside the window
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - streak.actionWindow);
    streak.actionsInCurrentWindow = streak.actionsInCurrentWindow.filter((action) => action.date >= windowStart);

    // Check if streak should break (with grace period)
    const lastAction = streak.actionsInCurrentWindow[streak.actionsInCurrentWindow.length - 1];
    if (lastAction) {
      const daysSinceAction = Math.floor((new Date() - lastAction.date) / (1000 * 60 * 60 * 24));

      // If more than maxGraceAllowance days have passed, consider using grace or breaking
      if (daysSinceAction > 1) {
        if (streak.graceUsedCount < streak.maxGraceAllowance) {
          // Use grace period
          streak.graceUsedCount += 1;
        } else {
          // Streak breaks
          streak.isActive = false;
          streak.breakDate = new Date();
          streak.currentStreak = 0;
          streak.graceUsedCount = 0;
          await streak.save();
          return streak;
        }
      }
    }

    // Evaluate if streak criteria are met
    if (streak.actionsInCurrentWindow.length >= streak.requiredActionsInWindow) {
      if (!streak.isActive) {
        // Restart streak
        streak.isActive = true;
        streak.streakStartDate = new Date();
        streak.graceUsedCount = 0;
      }
      streak.currentStreak += 1;
      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
      }
    }

    streak.lastActionDate = new Date();
    await streak.save();

    return streak;
  } catch (error) {
    console.error('Error updating streak:', error);
    throw error;
  }
};

/**
 * Get all streaks for a user
 */
exports.getUserStreaks = async (userId) => {
  try {
    const streaks = await Streak.find({ user: userId })
      .populate('hobbySpace', 'name slug icon')
      .sort({ currentStreak: -1 });

    return streaks;
  } catch (error) {
    console.error('Error fetching user streaks:', error);
    throw error;
  }
};

/**
 * Get streak for specific hobby space
 */
exports.getStreakForSpace = async (userId, hobbySpaceId) => {
  try {
    const streak = await Streak.findOne({ user: userId, hobbySpace: hobbySpaceId })
      .populate('hobbySpace', 'name slug');

    return streak || null;
  } catch (error) {
    console.error('Error fetching streak:', error);
    throw error;
  }
};

/**
 * Check and reset weekly streaks (to be called daily)
 */
exports.dailyStreakCheckup = async () => {
  try {
    const allStreaks = await Streak.find({ isActive: true });

    for (const streak of allStreaks) {
      if (streak.lastActionDate) {
        const daysSinceAction = Math.floor((new Date() - streak.lastActionDate) / (1000 * 60 * 60 * 24));

        // If 2+ days without action and grace exhausted
        if (daysSinceAction > 1 && streak.graceUsedCount >= streak.maxGraceAllowance) {
          streak.isActive = false;
          streak.breakDate = new Date();
          streak.currentStreak = 0;
          streak.graceUsedCount = 0;
          await streak.save();

          // Notify user (could send notification here)
        }
      }
    }

    console.log('Daily streak checkup completed');
  } catch (error) {
    console.error('Error in daily streak checkup:', error);
  }
};
