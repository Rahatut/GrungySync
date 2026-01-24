const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const progressController = require('../controllers/progressController');

// Get user's progress dashboard
router.get('/dashboard', authenticate, progressController.getProgressDashboard);

// Get analytics for a hobby space
router.get('/hobby-space/:hobbySpaceId', authenticate, progressController.getHobbySpaceAnalytics);

// Update user's baseline
router.post('/update-baseline', authenticate, progressController.updateBaseline);

// Get improvement score
router.get('/improvement-score', authenticate, progressController.getImprovementScore);

// Get hobby space leaderboard
router.get('/leaderboard/:hobbySpaceId', progressController.getHobbySpaceLeaderboard);

module.exports = router;
