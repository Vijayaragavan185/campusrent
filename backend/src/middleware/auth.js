// backend/src/middleware/auth.js
// Usage in route files: router.get('/protected', authMiddleware, controller.fn)
const jwt = require('jsonwebtoken');
 
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;  // available in all downstream controllers
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
 
module.exports = authMiddleware;
