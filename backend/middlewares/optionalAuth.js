// backend/middlewares/optionalAuth.js
const jwt = require('jsonwebtoken');

module.exports = function optionalAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return next();
  try {
    const payload = jwt.verify(m[1], process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role || 'user' };
  } catch (e) {
  }
  return next();
};
