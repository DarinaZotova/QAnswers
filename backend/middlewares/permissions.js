// backend/middlewares/permissions.js
module.exports.requireAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin only' });
};

module.exports.requireSelfOrAdmin = (req, res, next) => {
  const isAdmin = req.user?.role === 'admin';
  const isSelf  = Number(req.user?.id) === Number(req.params.user_id);
  if (isAdmin || isSelf) return next();
  return res.status(403).json({ message: 'Forbidden' });
};
