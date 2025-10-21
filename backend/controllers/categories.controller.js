// backend/controllers/categories.controller.js
const categories = require('../models/category.model');

const nonEmpty = (v, min=1, max=255) =>
  typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;

module.exports = {
  // GET /api/categories
  async list(req, res, next) {
    try {
      const list = await categories.findAll();
      res.json(list);
    } catch (e) { next(e); }
  },

  // GET /api/categories/:category_id
  async getById(req, res, next) {
    try {
      const id = Number(req.params.category_id);
      const c = await categories.findById(id);
      if (!c) return res.status(404).json({ message: 'Category not found' });
      res.json(c);
    } catch (e) { next(e); }
  },

  // GET /api/categories/:category_id/posts?sort=likes|date&order=desc|asc&page=1&limit=10
  async getPosts(req, res, next) {
    try {
      const categoryId = Number(req.params.category_id);
      const cat = await categories.findById(categoryId);
      if (!cat) return res.status(404).json({ message: 'Category not found' });

      const page  = Math.max(parseInt(req.query.page||'1',10),1);
      const limit = Math.min(Math.max(parseInt(req.query.limit||'10',10),1),50);
      const offset = (page-1)*limit;
      const sort = (req.query.sort === 'date') ? 'date' : 'likes';
      const order = (req.query.order === 'asc') ? 'asc' : 'desc';
      const viewer = req.user || null;

      const [items, total] = await Promise.all([
        categories.findPostsByCategory({ categoryId, viewer, limit, offset, sort, order }),
        categories.countPostsByCategory({ categoryId, viewer })
      ]);

      res.json({ page, limit, total, items });
    } catch (e) { next(e); }
  },

  // POST /api/categories   { title, description? }  (admin)
  async create(req, res, next) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admins only' });
      }
      const { title, description } = req.body || {};
      if (!nonEmpty(title, 1, 100)) return res.status(400).json({ message: 'Invalid title (1..100)' });

      const id = await categories.create({ title: title.trim(), description: description?.trim() || null });
      const created = await categories.findById(id);
      res.status(201).json(created);
    } catch (e) { next(e); }
  },

  // PATCH /api/categories/:category_id   { title?, description? }  (admin)
  async update(req, res, next) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admins only' });
      }
      const id = Number(req.params.category_id);
      const exists = await categories.findById(id);
      if (!exists) return res.status(404).json({ message: 'Category not found' });

      const patch = {};
      if (req.body.title !== undefined) {
        if (!nonEmpty(req.body.title, 1, 100)) return res.status(400).json({ message: 'Invalid title (1..100)' });
        patch.title = req.body.title.trim();
      }
      if (req.body.description !== undefined) {
        const d = String(req.body.description || '').trim();
        if (d.length > 255) return res.status(400).json({ message: 'Invalid description (0..255)' });
        patch.description = d || null;
      }

      await categories.update(id, patch);
      res.json(await categories.findById(id));
    } catch (e) { next(e); }
  },

  // DELETE /api/categories/:category_id  (admin)
  async remove(req, res, next) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admins only' });
      }
      const id = Number(req.params.category_id);
      const exists = await categories.findById(id);
      if (!exists) return res.status(404).json({ message: 'Category not found' });

      await categories.remove(id);
      res.json({ message: 'Category deleted' });
    } catch (e) { next(e); }
  }
};
