const express = require('express');
const { body, param } = require('express-validator');

const router = express.Router();
const messages = require('../controllers/messages.controller');
const authMW = require('../middleware/auth');

router.get('/conversations', authMW, messages.getConversations);

router.get('/:conversationId', authMW,
  [param('conversationId').trim().notEmpty()],
  messages.getMessages);

router.post('/', authMW,
  [
    body('content').trim().notEmpty(),
    body('conversationId').optional().trim().notEmpty(),
    body('recipientId').optional().trim().notEmpty(),
    body('listingId').optional().trim().notEmpty(),
  ],
  messages.send);

module.exports = router;