const express = require('express');
const router = express.Router();
const hobbySpaceController = require('../controllers/hobbySpaceController');
const { authenticate } = require('../middleware/auth');

// Protected routes (must come before /:id routes)
router.get('/user/my-spaces', authenticate, hobbySpaceController.getUserHobbySpaces);
router.get('/user/my-spaces-summary', authenticate, hobbySpaceController.getUserHobbySpacesSummary);
router.post('/create', authenticate, hobbySpaceController.createHobbySpace);

// Public routes
router.get('/', hobbySpaceController.getAllHobbySpaces);
router.get('/:id', hobbySpaceController.getHobbySpace);

// Protected routes with :id parameter
router.post('/:id/join', authenticate, hobbySpaceController.joinHobbySpace);
router.post('/:id/leave', authenticate, hobbySpaceController.leaveHobbySpace);
router.put('/:id', authenticate, hobbySpaceController.updateHobbySpace);
router.delete('/:id', authenticate, hobbySpaceController.deleteHobbySpace);

module.exports = router;
