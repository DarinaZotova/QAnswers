// backend/controllers/profile.controller.js
const profile = require('../models/profile.model');

module.exports = {
  // GET /api/profile/:user_id
  async getById(req, res, next) {
    try {
      const id = Number(req.params.user_id);
      if (!id) return res.status(400).json({ message: 'Invalid user_id' });

      const u = await profile.findPublicById(id);
      if (!u) return res.status(404).json({ message: 'User not found' });

      const [stats, recent_posts, recent_comments] = await Promise.all([
        profile.aggregateCounts(id),
        profile.findRecentPosts(id, 10),
        profile.findRecentComments(id, 10),
      ]);

      res.json({ ...u, stats, recent_posts, recent_comments });
    } catch (e) { next(e); }
  },

  // GET /api/profile/by-login/:login
  async getByLogin(req, res, next) {
    try {
      const login = String(req.params.login || '').trim();
      if (!login) return res.status(400).json({ message: 'Invalid login' });

      const u = await profile.findPublicByLogin(login);
      if (!u) return res.status(404).json({ message: 'User not found' });

      const [stats, recent_posts, recent_comments] = await Promise.all([
        profile.aggregateCounts(u.id),
        profile.findRecentPosts(u.id, 10),
        profile.findRecentComments(u.id, 10),
      ]);

      res.json({ ...u, stats, recent_posts, recent_comments });
    } catch (e) { next(e); }
  },
};
