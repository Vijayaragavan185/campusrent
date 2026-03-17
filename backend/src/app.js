// backend/src/app.js — Express setup, all middleware and routes
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
 
const app = express();

// Trust the first proxy (nginx / ALB on EC2). Required for express-rate-limit
// to read X-Forwarded-For correctly without throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set('trust proxy', 1);

app.disable('x-powered-by');

function sanitizeValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeValue);

  if (value && typeof value === 'object') {
    const cleaned = {};
    for (const [key, val] of Object.entries(value)) {
      // Block common prototype pollution and operator injection keys.
      if (
        key === '__proto__' ||
        key === 'prototype' ||
        key === 'constructor' ||
        key.startsWith('$') ||
        key.includes('.')
      ) {
        continue;
      }
      cleaned[key] = sanitizeValue(val);
    }
    return cleaned;
  }

  if (typeof value === 'string') {
    // Remove null bytes that can be abused in parser edge-cases.
    return value.replace(/\0/g, '');
  }

  return value;
}

function requestSanitizer(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = sanitizeValue(req.body);
  if (req.query && typeof req.query === 'object') req.query = sanitizeValue(req.query);
  if (req.params && typeof req.params === 'object') req.params = sanitizeValue(req.params);
  next();
}

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
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no Origin header) and configured frontend origins.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS blocked for this origin'));
  },
  credentials: true,
}));
 
// ── Global rate limit: 300 requests per 15 minutes ───────
app.use(rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 300),
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health',
}));
 
// ── Body parsers ─────────────────────────────────────────
// Webhook raw body capture - COMMENTED OUT, to be enabled later
// app.use(express.json({
//   limit: '10mb',
//   verify: (req, _res, buf) => {
//     req.rawBody = buf?.toString('utf8') || '';
//   },
// }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestSanitizer);
 
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
safeUse('/api/payments', './routes/payments.routes');
 
// ── 404 for unknown routes ────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});
 
// ── Global error handler (must be LAST app.use) ──────────
app.use(require('./middleware/errorHandler'));
 
module.exports = app;
