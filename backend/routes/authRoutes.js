const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { upload, uploadErrorHandler } = require('../middleware/upload');

const router = express.Router();

// Sign up
router.post(
  '/signup',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
  ],
  authController.signup
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  authController.login
);

// Get current user profile
router.get('/profile', authMiddleware, authController.getProfile);

// Update user profile
router.put(
  '/profile',
  authMiddleware,
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ]),
  uploadErrorHandler,
  authController.updateProfile
);

// Search users by username
router.get('/search', authController.searchUsers);

// Get user by ID
router.get('/:userId', authController.getUserById);

// Follow user (requires auth)
router.post('/:userId/follow', authMiddleware, authController.followUser);

// Unfollow user (requires auth)
router.post('/:userId/unfollow', authMiddleware, authController.unfollowUser);

module.exports = router;
