// backend/controllers/me.controller.js
const posts = require('../models/post.model');
const myCommentsModel = require('../models/comment.model');

const nonEmpty = (v, min=1, max=65535) =>
  typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;

module.exports = {
  async myPosts(req, res, next) {
    try {
      const user = req.user; 
      const page  = Math.max(parseInt(req.query.page||'1',10), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit||'10',10), 1), 50);
      const offset = (page-1)*limit;

      const statusQ = String(req.query.status||'all').toLowerCase();
      const status = ['active','inactive','all'].includes(statusQ) ? statusQ : 'all';

      const sort   = (req.query.sort === 'date') ? 'date' : 'likes';
      const order  = (req.query.order === 'asc') ? 'asc' : 'desc';
      const categoryIds = String(req.query.category||'').trim();
      const from = String(req.query.from||'').trim();
      const to   = String(req.query.to||'').trim();
      const q = String(req.query.q || '').trim();

      const [items, total] = await Promise.all([
        posts.findManyByAuthor({
          authorId: user.id,
          status, sort, order, categoryIds, from, to, limit, offset , q
        }),
        posts.countManyByAuthor({
          authorId: user.id,
          status, categoryIds, from, to, q
        })
      ]);

      res.json({ page, limit, total, items });
    } catch (e) { next(e); }
  },

 // НОВОЕ: GET /api/me/comments?status=active|inactive|all&from=YYYY-MM-DD&to=YYYY-MM-DD&sort=likes|date&order=desc|asc&page=1&limit=10
  async myComments(req, res, next) {
    try {
      const user = req.user;

      const page  = Math.max(parseInt(req.query.page||'1',10), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit||'10',10), 1), 50);
      const offset = (page-1)*limit;

      const statusQ = String(req.query.status||'all').toLowerCase();
      const status = ['active','inactive','all'].includes(statusQ) ? statusQ : 'all';

      const sort  = (req.query.sort === 'date') ? 'date' : 'likes'; 
      const order = (req.query.order === 'asc') ? 'asc' : 'desc';
      const from  = String(req.query.from||'').trim(); 
      const to    = String(req.query.to||'').trim();  

      const [items, total] = await Promise.all([
        myCommentsModel.findManyByAuthor({ authorId: user.id, status, sort, order, from, to, limit, offset }),
        myCommentsModel.countManyByAuthor({ authorId: user.id, status, from, to })
      ]);

      res.json({ page, limit, total, items });
    } catch (e) { next(e); }
  }
};
