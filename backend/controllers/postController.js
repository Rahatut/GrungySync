const Post = require('../models/Post');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;

    const hasContent = content && content.trim().length > 0;
    const mediaUrls = req.mediaUrls || [];
    const hasMedia = mediaUrls.length > 0;

    if (!hasContent && !hasMedia) {
      return res
        .status(400)
        .json({ message: 'Add some text or attach at least one media file' });
    }

    const post = new Post({
      author: req.user.id,
      content,
    });

    // Handle media from cloudinaryUpload middleware
    if (mediaUrls.length > 0) {
      post.media = mediaUrls.map((url) => ({
        url,
        type: url.includes('/video/') ? 'video' : 'image',
        public_id: url.split('/').slice(-2).join('/'),
      }));
    }

    await post.save();
    await post.populate('author', 'username avatar displayName');

    res.status(201).json({ message: 'Post created', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all posts
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username avatar bio')
      .populate('reactedBy', 'username')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get feed posts: posts from users the current user follows
exports.getFeedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('following');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.following || user.following.length === 0) {
      return res.json([]);
    }

    const posts = await Post.find({ author: { $in: user.following } })
      .populate('author', 'username avatar bio')
      .populate('reactedBy', 'username')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's posts
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ author: userId })
      .populate('author', 'username avatar bio')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// React to a post (like/react)
exports.reactPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userIndex = post.reactedBy.indexOf(req.user.id);
    if (userIndex > -1) {
      // User already reacted, remove reaction
      post.reactedBy.splice(userIndex, 1);
      post.reactions = Math.max(0, post.reactions - 1);
    } else {
      // Add reaction
      post.reactedBy.push(req.user.id);
      post.reactions += 1;
    }

    await post.save();
    res.json({ message: 'Reaction updated', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this post' });
    }

    // Delete media from Cloudinary
    if (post.media && post.media.length > 0) {
      const deletePromises = post.media.map((media) =>
        cloudinary.uploader.destroy(media.public_id, {
          resource_type: media.type === 'video' ? 'video' : 'image',
        })
      );
      await Promise.all(deletePromises);
    }

    await Post.findByIdAndDelete(postId);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
