const express = require('express');
const router = express.Router();
const { createSession, getSessions, getMessages } = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, createSession);
router.get('/', protect, getSessions);
router.get('/:sessionId/messages', protect, getMessages);

module.exports = router;
