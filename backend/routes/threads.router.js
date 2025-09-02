const express = require('express');
const { getThreads, createThread } = require('../controllers/threads.controller');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

// GET all threads for a project
router.get('/:projectId/threads', auth, getThreads);

// POST a new thread
router.post('/:projectId/threads', auth, createThread);

module.exports = router;
