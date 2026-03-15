const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function buildConversationId(userA, userB, listingId) {
  return [userA, userB].sort().join('_') + `_${listingId}`;
}

function isConversationParticipant(conversationId, userId) {
  const [firstUserId, secondUserId] = conversationId.split('_');
  return firstUserId === userId || secondUserId === userId;
}

// GET /api/messages/conversations
exports.getConversations = async (req, res, next) => {
  try {
    // TODO: Uncomment after running: npx prisma migrate dev
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.userId },
          { conversationId: { contains: req.userId } },
        ],
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true, verified: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const latestByConversation = [];
    const seen = new Set();
    for (const message of messages) {
      if (seen.has(message.conversationId)) continue;
      if (!isConversationParticipant(message.conversationId, req.userId)) continue;
      seen.add(message.conversationId);
      latestByConversation.push(message);
    }

    // TODO: Uncomment after running: npx prisma migrate dev
    const conversationSummaries = await Promise.all(
      latestByConversation.map(async (message) => {
        const [firstUserId, secondUserId, listingId] = message.conversationId.split('_');
        const otherUserId = firstUserId === req.userId ? secondUserId : firstUserId;

        const [otherUser, listing] = await Promise.all([
          prisma.user.findUnique({
            where: { id: otherUserId },
            select: {
              id: true,
              name: true,
              avatar: true,
              department: true,
              verified: true,
            },
          }),
          prisma.listing.findUnique({
            where: { id: listingId },
            select: {
              id: true,
              title: true,
              images: true,
              pricePerDay: true,
            },
          }),
        ]);

        return {
          id: message.conversationId,
          conversationId: message.conversationId,
          listingId,
          listing,
          otherUser,
          lastMessage: {
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            createdAt: message.createdAt,
          },
          unreadCount: 0,
          updatedAt: message.createdAt,
        };
      })
    );

    res.json(conversationSummaries.filter((c) => c.otherUser && c.listing));
  } catch (err) { next(err); }
};

// GET /api/messages/:conversationId
exports.getMessages = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { conversationId } = req.params;
    if (!isConversationParticipant(conversationId, req.userId)) {
      return res.status(403).json({ error: 'You are not part of this conversation' });
    }

    // TODO: Uncomment after running: npx prisma migrate dev
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true, verified: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages);
  } catch (err) { next(err); }
};

// POST /api/messages
exports.send = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { content, conversationId: providedConversationId, recipientId, listingId } = req.body;
    const conversationId = providedConversationId || (recipientId && listingId
      ? buildConversationId(req.userId, recipientId, listingId)
      : null);

    if (!conversationId) {
      return res.status(400).json({
        error: 'Provide either conversationId or both recipientId and listingId',
      });
    }

    if (!isConversationParticipant(conversationId, req.userId)) {
      return res.status(403).json({ error: 'You are not part of this conversation' });
    }

    const [, , resolvedListingId] = conversationId.split('_');
    if (!resolvedListingId) {
      return res.status(400).json({ error: 'Invalid conversationId format' });
    }

    // TODO: Uncomment after running: npx prisma migrate dev
    const listing = await prisma.listing.findUnique({
      where: { id: resolvedListingId },
      select: { id: true },
    });

    if (!listing) return res.status(404).json({ error: 'Listing not found for this conversation' });

    // TODO: Uncomment after running: npx prisma migrate dev
    const message = await prisma.message.create({
      data: {
        conversationId,
        content,
        senderId: req.userId,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true, verified: true },
        },
      },
    });

    res.status(201).json(message);
  } catch (err) { next(err); }
};