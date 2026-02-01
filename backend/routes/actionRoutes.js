const express = require('express');
const router = express.Router();
const actionController = require('../controllers/actionController');
const { authenticate } = require('../middleware/auth');
const { upload, uploadErrorHandler } = require('../middleware/upload');
const cloudinaryUpload = require('../middleware/cloudinaryUpload');

// Middleware to optionally authenticate
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    authenticate(req, res, next);
  } else {
    req.user = null;
    next();
  }
};

// Public routes
router.get('/user/:userId', optionalAuth, actionController.getUserActionsByUserId);

// Protected routes
router.get('/feed', authenticate, actionController.getFeedActions);
router.post(
  '/',
  authenticate,
  upload.fields([{ name: 'media', maxCount: 10 }]),
  uploadErrorHandler,
  cloudinaryUpload,
  actionController.createAction
);
router.get('/user/my-actions', authenticate, actionController.getUserActions);
router.post('/:actionId/revision', authenticate, actionController.createRevision);
router.post('/:actionId/feedback', authenticate, actionController.giveFeedback);
router.post('/:actionId/react', authenticate, actionController.reactAction);
router.delete('/:actionId', authenticate, actionController.deleteAction);
router.get('/:hobbySpaceId', actionController.getHobbySpaceActions);

module.exports = router;
