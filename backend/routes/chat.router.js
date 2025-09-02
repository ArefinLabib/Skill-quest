const express = require('express');
const { getChatHistory, sendMessage } = require('../controllers/chat.controller');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/:projectId/chat', auth, getChatHistory);
router.post('/:projectId/chat', auth, sendMessage);

module.exports = router;
