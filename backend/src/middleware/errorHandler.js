// backend/src/middleware/errorHandler.js
// Catches any error thrown with next(err) in any controller
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
 
module.exports = errorHandler;
