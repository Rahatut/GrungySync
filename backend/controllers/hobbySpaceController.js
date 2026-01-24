const HobbySpace = require('../models/HobbySpace');
const User = require('../models/User');
const Action = require('../models/Action');

// Create a new HobbySpace
exports.createHobbySpace = async (req, res) => {
  try {
    const { name, slug, description, category, actionConfig } = req.body;

    // Validate required fields
    if (!name || !slug || !description || !category) {
      return res.status(400).json({ message: 'Name, slug, description, and category are required' });
    }

    // Check if HobbySpace already exists
    const existing = await HobbySpace.findOne({ $or: [{ name }, { slug }] });
    if (existing) {
      return res.status(400).json({ message: 'HobbySpace already exists' });
    }

    // Set default action config if not provided
    const defaultConfig = {
      validActions: actionConfig?.validActions || ['post', 'log', 'upload', 'reflect'],
      minEffortThreshold: actionConfig?.minEffortThreshold || 50,
      dailyPointCap: actionConfig?.dailyPointCap || 50,
      weeklyPointCap: actionConfig?.weeklyPointCap || 300,
      consistencyWindow: actionConfig?.consistencyWindow || 7,
    };

    const hobbySpace = new HobbySpace({
      name,
      slug,
      description,
      category,
      actionConfig: defaultConfig,
      createdBy: req.user.id,
      moderators: [req.user.id],
      members: [req.user.id],
      memberCount: 1,
    });

    await hobbySpace.save();

    // Add to user's hobby spaces
    await User.findByIdAndUpdate(req.user.id, { $push: { hobbySpaces: hobbySpace._id } });

    res.status(201).json({ message: 'HobbySpace created successfully', hobbySpace });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating HobbySpace', error: error.message });
  }
};

// Get all HobbySpaces
exports.getAllHobbySpaces = async (req, res) => {
  try {
    const hobbySpaces = await HobbySpace.find({ isPublic: true })
      .populate('moderators', 'username displayName')
      .populate('createdBy', 'username displayName');

    res.json(hobbySpaces);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching HobbySpaces', error: error.message });
  }
};

// Get HobbySpace by ID
exports.getHobbySpace = async (req, res) => {
  try {
    const { id } = req.params;

    const hobbySpace = await HobbySpace.findById(id)
      .populate('moderators', 'username displayName')
      .populate('createdBy', 'username displayName')
      .populate('members', 'username displayName avatar');

    if (!hobbySpace) {
      return res.status(404).json({ message: 'HobbySpace not found' });
    }

    res.json(hobbySpace);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching HobbySpace', error: error.message });
  }
};

// Join a HobbySpace
exports.joinHobbySpace = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const hobbySpace = await HobbySpace.findById(id);
    if (!hobbySpace) {
      return res.status(404).json({ message: 'HobbySpace not found' });
    }

    // Check if already a member
    if (hobbySpace.members.includes(userId)) {
      return res.status(400).json({ message: 'Already a member of this HobbySpace' });
    }

    hobbySpace.members.push(userId);
    hobbySpace.memberCount += 1;
    await hobbySpace.save();

    // Add to user's hobby spaces
    await User.findByIdAndUpdate(userId, { $push: { hobbySpaces: id } });

    res.json({ message: 'Joined HobbySpace successfully', hobbySpace });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error joining HobbySpace', error: error.message });
  }
};

// Leave a HobbySpace
exports.leaveHobbySpace = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const hobbySpace = await HobbySpace.findById(id);
    if (!hobbySpace) {
      return res.status(404).json({ message: 'HobbySpace not found' });
    }

    // Remove from members
    hobbySpace.members = hobbySpace.members.filter((memberId) => memberId.toString() !== userId);
    hobbySpace.memberCount = Math.max(0, hobbySpace.memberCount - 1);
    await hobbySpace.save();

    // Remove from user's hobby spaces
    await User.findByIdAndUpdate(userId, { $pull: { hobbySpaces: id } });

    res.json({ message: 'Left HobbySpace successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error leaving HobbySpace', error: error.message });
  }
};

// Get user's HobbySpaces
exports.getUserHobbySpaces = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('hobbySpaces');
    res.json(user.hobbySpaces);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching user hobby spaces', error: error.message });
  }
};

// Get user's HobbySpaces with latest post (actionType 'post')
exports.getUserHobbySpacesSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('hobbySpaces');
    const spaces = user?.hobbySpaces || [];

    const summaries = await Promise.all(
      spaces.map(async (space) => {
        const latestAction = await Action.findOne({
          hobbySpace: space._id,
          visibility: 'public',
        })
          .populate('user', 'username displayName avatar')
          .sort({ createdAt: -1 });

        return {
          space,
          latestAction: latestAction || null,
        };
      })
    );

    res.json(summaries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching hobby space summaries', error: error.message });
  }
};

// Update HobbySpace (moderators only)
exports.updateHobbySpace = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, guidelines, actionConfig } = req.body;

    const hobbySpace = await HobbySpace.findById(id);
    if (!hobbySpace) {
      return res.status(404).json({ message: 'HobbySpace not found' });
    }

    // Check if user is moderator
    if (!hobbySpace.moderators.includes(req.user.id)) {
      return res.status(403).json({ message: 'Only moderators can update HobbySpace' });
    }

    if (description) hobbySpace.description = description;
    if (guidelines) hobbySpace.guidelines = guidelines;
    if (actionConfig) {
      hobbySpace.actionConfig = { ...hobbySpace.actionConfig, ...actionConfig };
    }

    await hobbySpace.save();
    res.json({ message: 'HobbySpace updated successfully', hobbySpace });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating HobbySpace', error: error.message });
  }
};

// Delete HobbySpace (creator only)
exports.deleteHobbySpace = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    console.log(`[DELETE] Attempting to delete space ${id} by user ${userId}`);

    const hobbySpace = await HobbySpace.findById(id);
    if (!hobbySpace) {
      console.log(`[DELETE] Space ${id} not found`);
      return res.status(404).json({ message: 'HobbySpace not found' });
    }

    console.log(`[DELETE] Space creator: ${hobbySpace.createdBy}, requesting user: ${userId}`);

    // Check if user is the creator
    const createdById = hobbySpace.createdBy.toString();
    if (createdById !== userId && createdById !== userId?.toString()) {
      console.log(`[DELETE] Authorization failed: ${createdById} !== ${userId}`);
      return res.status(403).json({ message: 'Only the creator can delete this HobbySpace' });
    }

    console.log(`[DELETE] Authorization passed, deleting space ${id}`);

    // Remove hobby space from all members' hobby spaces
    await User.updateMany(
      { hobbySpaces: id },
      { $pull: { hobbySpaces: id } }
    );

    // Delete all actions in this hobby space
    await Action.deleteMany({ hobbySpace: id });

    // Delete the hobby space
    await HobbySpace.findByIdAndDelete(id);

    console.log(`[DELETE] Space ${id} deleted successfully`);
    res.json({ message: 'HobbySpace deleted successfully' });
  } catch (error) {
    console.error('[DELETE] Error:', error);
    res.status(500).json({ message: 'Error deleting HobbySpace', error: error.message });
  }
};
