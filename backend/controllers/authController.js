const User = require('../models/User');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');
const fs = require('fs');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Refill feedback tokens weekly
const checkRefillTokens = async (user) => {
  const now = new Date();
  const lastRefill = user.feedbackTokens?.lastRefillDate || user.createdAt;
  const daysSinceRefill = Math.floor((now - new Date(lastRefill)) / (1000 * 60 * 60 * 24));

  if (daysSinceRefill >= 7 || !user.feedbackTokens?.lastRefillDate) {
    user.feedbackTokens = {
      current: 5,
      maxPerWeek: 5,
      lastRefillDate: now
    };
    await user.save();
    return true;
  }
  return false;
};

// Sign Up
exports.signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ 
      username, 
      email, 
      password,
      feedbackTokens: {
        current: 5,
        maxPerWeek: 5,
        lastRefillDate: new Date()
      }
    });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check for weekly token refill
    await checkRefillTokens(user);

    const token = generateToken(user._id);
    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('followers')
      .populate('following')
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { bio, location, website, pronouns, theme, username } = req.body;
    const updateData = {};

    // Only update fields that are provided
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (pronouns !== undefined) updateData.pronouns = pronouns;
    if (theme !== undefined) updateData.theme = theme;
    
    // Handle username update with validation
    if (username !== undefined && username !== '') {
      const existingUser = await User.findOne({ username, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      updateData.username = username;
    }

    // Handle avatar upload
    if (req.files && req.files.avatar && req.files.avatar[0]) {
      try {
        const avatarFile = req.files.avatar[0];
        const fs = require('fs');
        const fileBuffer = fs.readFileSync(avatarFile.path);
        const stream = Readable.from(fileBuffer);

        const cloudinaryUpload = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'grungy/avatars', resource_type: 'auto' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.pipe(uploadStream);
        });

        updateData.avatar = cloudinaryUpload.secure_url;

        // Clean up temp file
        fs.unlink(avatarFile.path, (err) => {
          if (err) console.error('Error deleting temp avatar file:', err);
        });
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return res.status(500).json({ message: 'Error uploading avatar', error: uploadError.message });
      }
    }

    // Handle banner upload
    if (req.files && req.files.banner && req.files.banner[0]) {
      try {
        const bannerFile = req.files.banner[0];
        const fs = require('fs');
        const fileBuffer = fs.readFileSync(bannerFile.path);
        const stream = Readable.from(fileBuffer);

        const cloudinaryUpload = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'grungy/banners', resource_type: 'auto' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.pipe(uploadStream);
        });

        updateData.banner = cloudinaryUpload.secure_url;

        // Clean up temp file
        fs.unlink(bannerFile.path, (err) => {
          if (err) console.error('Error deleting temp banner file:', err);
        });
      } catch (uploadError) {
        console.error('Banner upload error:', uploadError);
        return res.status(500).json({ message: 'Error uploading banner', error: uploadError.message });
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    }).select('-password');

    // Normalize response to include id field
    const userResponse = user.toObject ? user.toObject() : user;
    userResponse.id = user._id;

    res.json({ message: 'Profile updated successfully', user: userResponse });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Search users by username
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      username: { $regex: query, $options: 'i' },
    })
      .select('-password')
      .limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching user with ID:', userId);
    
    if (!userId || userId === 'undefined') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await User.findById(userId)
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar')
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('getUserById error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Follow a user
exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);

    // Check if already following
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Add to following list
    currentUser.following.push(userId);
    userToFollow.followers.push(currentUserId);

    await currentUser.save();
    await userToFollow.save();

    // Create notification
    await Notification.create({
      recipient: userToFollow._id,
      sender: currentUser._id,
      type: 'follow',
      message: `${currentUser.username} started following you.`,
    });

    res.json({ message: 'User followed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({ message: 'Cannot unfollow yourself' });
    }

    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);

    // Check if not following
    if (!currentUser.following.includes(userId)) {
      return res.status(400).json({ message: 'Not following this user' });
    }

    // Remove from following list
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== userId
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== currentUserId
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
