// backend/server.js  — Entry point, run with: npm run dev
require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { initSocket } = require('./src/config/socket');
 
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);
 
// Socket.io shares the same HTTP server as Express
initSocket(httpServer);
 
httpServer.listen(PORT, () => {
  console.log(`\n🚀 API: http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`🔍 Health: http://localhost:${PORT}/api/health\n`);
});
 
process.on('SIGTERM', () => {
  httpServer.close(() => process.exit(0));
});
