const mongoose = require('mongoose');
const Action = require('../models/Action');
const HobbySpace = require('../models/HobbySpace');
const User = require('../models/User');
const Streak = require('../models/Streak');
const badgeService = require('../services/badgeService');
const progressService = require('../services/progressService');

// Calculate effort score based on content
const calculateEffortScore = (action, config) => {
  let score = 0;

  // Text content (10 points per 100 chars, min 10)
  if (action.content) {
    score += Math.max(10, Math.floor(action.content.length / 10));
  }

  // Media uploads (25 points each)
  if (action.mediaCount > 0) {
    score += action.mediaCount * 25;
  }

  // Learning/reflection posts (20 bonus points)
  if (action.actionType === 'reflect') {
    score += 20;
    if (action.learningPoints?.length > 0) {
      score += action.learningPoints.length * 5;
    }
  }

  // Revision/iteration (15 bonus points)
  if (action.isRevision) {
    score += 15;
  }

  return Math.min(score, config.dailyPointCap); // respect daily cap
};

// Create a new action
exports.createAction = async (req, res) => {
  try {
    // hobbySpaceId can come from body (FormData) or params
    let { hobbySpaceId, actionType, content, learningPoints, challenges, visibility = 'public' } = req.body;
    const userId = req.user.id;
    const files = req.files?.media || [];

    console.log('=== Create action request ===');
    console.log('Request body:', req.body);
    console.log('Request files object keys:', Object.keys(req.files || {}));
    console.log('Request media files:', files.map(f => ({ name: f.originalname, size: f.size, mimetype: f.mimetype })));
    console.log('Params:', req.params);
    console.log('Query:', req.query);
    console.log('Headers:', Object.keys(req.headers));

    if (!hobbySpaceId) {
      console.log('ERROR: Missing hobbySpaceId');
      return res.status(400).json({
        message: 'Missing hobbySpaceId',
        receivedBody: req.body,
        receivedParams: req.params,
        receivedQuery: req.query,
      });
    }

    console.log('Creating action for hobbySpace:', hobbySpaceId);

    // Validate HobbySpace
    const hobbySpace = await HobbySpace.findById(hobbySpaceId);
    console.log('HobbySpace query result:', hobbySpace ? 'Found' : 'Not found');
    
    if (!hobbySpace) {
      return res.status(404).json({
        message: 'HobbySpace not found',
        hobbySpaceId,
        receivedBody: req.body,
      });
    }

    // Check if user is member
    if (!hobbySpace.members.includes(userId)) {
      return res.status(403).json({ message: 'Must be a member of the HobbySpace' });
    }

    // Validate action type
    if (!hobbySpace.actionConfig.validActions.includes(actionType)) {
      return res.status(400).json({ message: `Action type ${actionType} not allowed in this space` });
    }

    // Validate minimum effort
    const contentLength = content?.length || 0;
    if (contentLength < hobbySpace.actionConfig.minEffortThreshold && files.length === 0) {
      return res.status(400).json({
        message: `Content must be at least ${hobbySpace.actionConfig.minEffortThreshold} characters or include media`,
      });
    }

    // Upload files to Cloudinary
    let mediaUrls = [];
    
    // Use mediaUrls from cloudinaryUpload middleware if available
    if (req.mediaUrls && req.mediaUrls.length > 0) {
      mediaUrls = req.mediaUrls;
      console.log('[CONTROLLER] Media URLs from middleware:', mediaUrls);
    } else if (files.length > 0) {
      // Fallback to direct upload (shouldn't happen with new middleware)
      const cloudinary = require('../config/cloudinary');
      
      for (const file of files) {
        try {
          console.log('Uploading file:', file.originalname, 'Size:', file.size);
          
          const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                resource_type: 'auto',
                folder: 'grungy/actions',
                timeout: 60000,
              },
              (error, result) => {
                if (error) {
                  console.error('Cloudinary upload error:', error);
                  reject(error);
                } else {
                  console.log('Cloudinary upload success:', result.secure_url);
                  resolve(result);
                }
              }
            );
            
            // Handle stream errors
            uploadStream.on('error', (err) => {
              console.error('Upload stream error:', err);
              reject(err);
            });
            
            uploadStream.end(file.buffer);
          });
          
          mediaUrls.push(result.secure_url);
          console.log('✓ File uploaded:', result.secure_url);
        } catch (uploadError) {
          console.error('✗ Error uploading to Cloudinary:', uploadError.message);
          return res.status(500).json({ 
            message: 'Error uploading media files', 
            error: uploadError.message,
            file: file.originalname 
          });
        }
      }
    }
    
    console.log('Total media URLs to save:', mediaUrls);

    const action = new Action({
      user: userId,
      hobbySpace: hobbySpaceId,
      actionType,
      content,
      mediaCount: mediaUrls.length,
      mediaUrls,
      learningPoints,
      challenges,
      visibility,
    });

    // Calculate effort score
    action.effortScore = calculateEffortScore(action, hobbySpace.actionConfig);

    // Calculate points (respect caps)
    const dailyActions = await Action.find({
      user: userId,
      hobbySpace: hobbySpaceId,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });

    const dailyPoints = dailyActions.reduce((sum, a) => sum + a.pointsAwarded, 0);
    action.pointsAwarded = Math.min(action.effortScore, hobbySpace.actionConfig.dailyPointCap - dailyPoints);

    console.log('Saving action with mediaUrls:', mediaUrls);
    console.log('Action object before save:', {
      mediaCount: action.mediaCount,
      mediaUrls: action.mediaUrls,
      effortScore: action.effortScore,
      pointsAwarded: action.pointsAwarded,
    });

    await action.save();
    console.log('✓ Action saved successfully with ID:', action._id);
    
    await action.populate('user', 'username displayName avatar');
    await action.populate('hobbySpace', 'name slug');

    // Update user points
    await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          totalPoints: action.pointsAwarded,
          [`pointsByHobbySpace.${hobbySpaceId}`]: action.pointsAwarded,
        },
      },
      { new: true }
    );

    console.log('✓ User points updated');

    // Update or create streak
    await updateStreak(userId, hobbySpaceId);

    // Check and award badges
    await badgeService.checkAndAwardBadges(userId, hobbySpaceId);

    // Calculate personal improvement multiplier for next action
    const improvementMultiplier = await progressService.calculatePersonalImprovementMultiplier(
      userId,
      action.effortScore
    );

    console.log('✓ Action creation complete');
    res.status(201).json({
      message: 'Action created successfully',
      action,
      improvementMultiplier,
    });
  } catch (error) {
    console.error('✗ Error in createAction:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Error creating action', error: error.message });
  }
};

// Delete an action (owner only)
exports.deleteAction = async (req, res) => {
  try {
    const { actionId } = req.params;
    const userId = req.user.id;

    const action = await Action.findById(actionId);
    if (!action) {
      return res.status(404).json({ message: 'Action not found' });
    }

    if (action.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this action' });
    }

    // Deduct points from user
    const pointsToDeduct = action.pointsAwarded || 0;
    if (pointsToDeduct > 0) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(
        userId,
        { $inc: { totalPoints: -pointsToDeduct } },
        { new: true }
      );
    }

    await Action.findByIdAndDelete(actionId);
    res.json({ message: 'Action deleted', pointsDeducted: pointsToDeduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting action', error: error.message });
  }
};

// Get actions for a HobbySpace
exports.getHobbySpaceActions = async (req, res) => {
  try {
    const { hobbySpaceId } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(hobbySpaceId)) {
      return res.status(400).json({ message: 'Invalid hobby space id' });
    }

    const actions = await Action.find({ hobbySpace: hobbySpaceId, visibility: 'public' })
      .populate('user', 'username displayName avatar')
      .populate('hobbySpace', 'name slug')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Action.countDocuments({ hobbySpace: hobbySpaceId, visibility: 'public' });

    res.json({ actions, total, limit, skip });
  } catch (error) {
    console.error('getHobbySpaceActions error:', error);
    res.status(500).json({ message: 'Error fetching actions', error: error.message });
  }
};

// Get user's actions
exports.getUserActions = async (req, res) => {
  try {
    const { limit = 20, skip = 0, hobbySpaceId } = req.query;

    let query = { user: req.user.id };
    if (hobbySpaceId) query.hobbySpace = hobbySpaceId;

    const actions = await Action.find(query)
      .populate('hobbySpace', 'name slug')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json(actions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching user actions', error: error.message });
  }
};

// Get feed actions from followed users (respecting visibility)
exports.getFeedActions = async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const currentUserId = req.user.id;

    const user = await User.findById(currentUserId).select('following');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // No follows means empty feed
    if (!user.following || user.following.length === 0) {
      return res.json({ actions: [], total: 0, limit: parseInt(limit), skip: parseInt(skip) });
    }

    // Hobby spaces where the current user is a member (for hobbyspace-only visibility)
    const memberSpaces = await HobbySpace.find({ members: currentUserId }).select('_id');
    const memberSpaceIds = memberSpaces.map((space) => space._id);

    const visibilityFilter = {
      $or: [
        { visibility: 'public' },
        { visibility: 'hobbyspace-only', hobbySpace: { $in: memberSpaceIds } },
      ],
    };

    const query = {
      user: { $in: user.following },
      ...visibilityFilter,
    };

    const actions = await Action.find(query)
      .populate('user', 'username displayName avatar')
      .populate('hobbySpace', 'name slug')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Action.countDocuments(query);

    res.json({ actions, total, limit: parseInt(limit), skip: parseInt(skip) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching feed actions', error: error.message });
  }
};

// Get actions by a specific user (public or own)
exports.getUserActionsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, skip = 0 } = req.query;
    const currentUserId = req.user?.id;

    if (!userId || userId === 'undefined') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    let query = { user: userId };
    
    // If viewing own profile, show all actions; otherwise only public
    if (currentUserId !== userId) {
      query.visibility = 'public';
    }

    const actions = await Action.find(query)
      .populate('user', 'username displayName avatar')
      .populate('hobbySpace', 'name slug')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json(actions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching user actions', error: error.message });
  }
};

// Create a revision/iteration of an action
exports.createRevision = async (req, res) => {
  try {
    const { actionId } = req.params;
    const { hobbySpaceId, content, mediaCount = 0, learningPoints } = req.body;
    const userId = req.user.id;

    // Get original action
    const originalAction = await Action.findById(actionId);
    if (!originalAction) {
      return res.status(404).json({ message: 'Original action not found' });
    }

    // Verify ownership
    if (originalAction.user.toString() !== userId) {
      return res.status(403).json({ message: 'Can only revise your own actions' });
    }

    const hobbySpace = await HobbySpace.findById(hobbySpaceId);

    const revision = new Action({
      user: userId,
      hobbySpace: hobbySpaceId,
      actionType: originalAction.actionType,
      content,
      mediaCount,
      learningPoints,
      isRevision: true,
      revisionOf: actionId,
      visibility: originalAction.visibility,
    });

    revision.effortScore = calculateEffortScore(revision, hobbySpace.actionConfig);
    revision.pointsAwarded = revision.effortScore * 0.8; // revisions get 80% of points

    await revision.save();

    // Update user points
    await User.findByIdAndUpdate(userId, { $inc: { totalPoints: revision.pointsAwarded } });

    res.status(201).json({ message: 'Revision created successfully', revision });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating revision', error: error.message });
  }
};

// Give feedback on action (uses feedback tokens)
exports.giveFeedback = async (req, res) => {
  try {
    const { actionId } = req.params;
    const { feedback } = req.body;
    const userId = req.user.id;

    // Get action
    const action = await Action.findById(actionId);
    if (!action) {
      return res.status(404).json({ message: 'Action not found' });
    }

    // Check feedback tokens
    const user = await User.findById(userId);
    if (user.feedbackTokens.current <= 0) {
      return res.status(400).json({ message: 'No feedback tokens remaining this week' });
    }

    // Validate feedback length
    if (!feedback || feedback.length < 20) {
      return res.status(400).json({ message: 'Feedback must be at least 20 characters' });
    }

    // Add feedback
    action.feedbackReceived.push({
      from: userId,
      feedback,
      pointsForFeedback: 5,
    });

    await action.save();

    // Deduct feedback token from giver
    await User.findByIdAndUpdate(userId, { $inc: { 'feedbackTokens.current': -1 } });

    // Award points to receiver
    await User.findByIdAndUpdate(action.user, { $inc: { totalPoints: 5 } });

    res.json({ message: 'Feedback given successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error giving feedback', error: error.message });
  }
};

// React to an action (toggle heart)
exports.reactAction = async (req, res) => {
  try {
    const { actionId } = req.params;
    const userId = req.user.id;

    const action = await Action.findById(actionId);
    if (!action) {
      return res.status(404).json({ message: 'Action not found' });
    }

    const userIndex = action.reactedBy.indexOf(userId);
    if (userIndex > -1) {
      // Remove reaction
      action.reactedBy.splice(userIndex, 1);
      action.reactions = Math.max(0, (action.reactions || 0) - 1);
    } else {
      // Add reaction
      action.reactedBy.push(userId);
      action.reactions = (action.reactions || 0) + 1;
    }

    await action.save();
    await action.populate('user', 'username displayName avatar');
    await action.populate('hobbySpace', 'name slug');

    res.json({ message: 'Reaction updated', action });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating reaction', error: error.message });
  }
};

// Helper: Update streak
async function updateStreak(userId, hobbySpaceId) {
  try {
    let streak = await Streak.findOne({ user: userId, hobbySpace: hobbySpaceId });

    if (!streak) {
      streak = new Streak({
        user: userId,
        hobbySpace: hobbySpaceId,
        streakStartDate: new Date(),
        isActive: true,
      });
    }

    // Add action to current window
    streak.actionsInCurrentWindow.push({
      actionId: null, // we'd set this in a real scenario
      date: new Date(),
    });

    // Clean old actions outside window
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - streak.actionWindow);
    streak.actionsInCurrentWindow = streak.actionsInCurrentWindow.filter((action) => action.date >= windowStart);

    // Check if streak criteria met
    if (streak.actionsInCurrentWindow.length >= streak.requiredActionsInWindow) {
      streak.currentStreak += 1;
      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
      }
    }

    streak.lastActionDate = new Date();
    await streak.save();
  } catch (error) {
    console.error('Error updating streak:', error);
  }
}
