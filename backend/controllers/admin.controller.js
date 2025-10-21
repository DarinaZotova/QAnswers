// backend/controllers/admin.controller.js
const posts = require('../models/post.model');
const comments = require('../models/comment.model');

module.exports = {
async listPosts(req, res, next) {
  try {
    const page  = Math.max(parseInt(req.query.page||'1',10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit||'10',10), 1), 50);
    const offset = (page-1)*limit;

    const qStatus = String(req.query.status||'all');
    const status = ['inactive','active','all'].includes(qStatus) ? qStatus : 'all';

    const sort  = (req.query.sort === 'date') ? 'date' : 'likes';
    const order = (req.query.order === 'asc') ? 'asc' : 'desc';
    const categoryIds = String(req.query.category||'').trim();
    const from = String(req.query.from||'').trim();
    const to   = String(req.query.to||'').trim();
    const q    = String(req.query.q || '').trim();

    const viewer = { id: req.user.id, role: 'admin' };

    const baseItems = await posts.findMany({
      viewer, status: 'all', sort, order, categoryIds, from, to, q,
      limit: 1000, offset: 0 
    });

    let filtered = baseItems;
    if (status === 'inactive') filtered = baseItems.filter(p => !p.is_active);
    if (status === 'active')   filtered = baseItems.filter(p => !!p.is_active);

    const items = filtered.slice(offset, offset + limit);
    res.json({ page, limit, total: filtered.length, items });
  } catch (e) { next(e); }
},

  // GET /api/admin/posts/:post_id
  async getPostById(req, res, next) {
    try {
      const id = Number(req.params.post_id);
      const p = await posts.findByIdFull(id); 
      if (!p) return res.status(404).json({ message: 'Post not found' });
      res.json(p);
    } catch (e) { next(e); }
  },

  // GET /api/admin/posts/:post_id/comments?status=inactive|active|all
  async listPostComments(req, res, next) {
    try {
      const postId = Number(req.params.post_id);
      const p = await posts.findById(postId);
      if (!p) return res.status(404).json({ message: 'Post not found' });

      const qStatus = String(req.query.status||'inactive');
      const status = ['inactive','active','all'].includes(qStatus) ? qStatus : 'inactive';

      const list = await comments.findByPostIdFiltered(postId, status);
      res.json(list);
    } catch (e) { next(e); }
  }
};
