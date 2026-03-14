// backend/src/config/socket.js
// Handles all real-time chat events over WebSocket
const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');
 
let io;
 
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });
 
  // ── Authenticate socket connections with JWT ─────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });
 
  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);
 
    // ── Join/leave a conversation room ───────────────────
    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
    });
 
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId);
    });
 
    // ── Broadcast message to room members ────────────────
    socket.on('send_message', (messageData) => {
      io.to(messageData.conversationId).emit('receive_message', {
        ...messageData,
        senderId: socket.userId,
        createdAt: new Date().toISOString(),
      });
    });
 
    // ── Typing indicators ─────────────────────────────────
    socket.on('typing', ({ conversationId }) => {
      socket.to(conversationId).emit('user_typing', { userId: socket.userId });
    });
 
    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(conversationId).emit('user_stop_typing', { userId: socket.userId });
    });
 
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
    });
  });
}
 
function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
 
module.exports = { initSocket, getIO };
