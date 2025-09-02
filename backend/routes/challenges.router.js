const express = require('express');
const { getDailyChallenge, submitChallenge } = require('../controllers/challenges.controller');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

// GET daily challenge
router.get('/', auth, getDailyChallenge);

// POST challenge submission
router.post('/:challengeId/submit', auth, submitChallenge);

module.exports = router;
