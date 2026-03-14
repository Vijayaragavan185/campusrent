// backend/src/app.js — Express setup, all middleware and routes
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
 
const app = express();

function safeUse(basePath, modulePath) {
  try {
    const router = require(modulePath);
    if (typeof router === 'function') {
      app.use(basePath, router);
    } else {
      console.warn(`[routes] Skipping ${basePath}: ${modulePath} does not export a router function`);
    }
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' && err.message.includes(modulePath)) {
      console.warn(`[routes] Skipping ${basePath}: ${modulePath} not found`);
      return;
    }
    throw err;
  }
}
 
// ── Security middleware ───────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
 
// ── Global rate limit: 300 requests per 15 minutes ───────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests. Please slow down.' },
}));
 
// ── Body parsers ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
 
// ── Logging ──────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
 
// ── Health check endpoint (used by UptimeRobot) ──────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});
 
// ── Mount all route files ─────────────────────────────────
safeUse('/api/auth',     './routes/auth.routes');
safeUse('/api/listings', './routes/listings.routes');
safeUse('/api/bookings', './routes/bookings.routes');
safeUse('/api/messages', './routes/messages.routes');
safeUse('/api/users',    './routes/users.routes');
safeUse('/api/reviews',  './routes/reviews.routes');
 
// ── 404 for unknown routes ────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});
 
// ── Global error handler (must be LAST app.use) ──────────
app.use(require('./middleware/errorHandler'));
 
module.exports = app;
