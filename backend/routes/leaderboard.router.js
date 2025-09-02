const express = require('express');
const { getLeaderboard } = require('../controllers/leaderboard.controller');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

// GET leaderboard
router.get('/', auth, getLeaderboard);

module.exports = router;
