const express = require('express');
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Create post (requires auth)
router.post(
  '/',
  authMiddleware,
  upload.array('media', 10),
  postController.createPost
);

// Get all posts
router.get('/', postController.getAllPosts);

// Get feed posts (requires auth)
router.get('/feed', authMiddleware, postController.getFeedPosts);

// Get user's posts
router.get('/user/:userId', postController.getUserPosts);

// React to post (requires auth)
router.post('/:postId/react', authMiddleware, postController.reactPost);

// Delete post (requires auth)
router.delete('/:postId', authMiddleware, postController.deletePost);

module.exports = router;
