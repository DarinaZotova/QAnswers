// controllers/posts.controller.js
const posts = require('../models/post.model');
const comments = require('../models/comment.model');
const likes = require('../models/like.model');
const categories = require('../models/category.model');
const path = require('path');                 
const pool = require('../config/db');

const nonEmpty = (v, min=1, max=65535) =>
  typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;

module.exports = {
  // GET /api/posts?status=active|all&category=1,2&from=2025-01-01&to=2025-12-31&sort=likes|date&order=desc|asc&page=1&limit=10
  async list(req, res, next) {
    try {
      const page  = Math.max(parseInt(req.query.page||'1',10), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit||'10',10), 1), 50);
      const offset = (page-1)*limit;
      const status = (req.query.status === 'all') ? 'all' : 'active'; 
      const sort = (req.query.sort === 'date') ? 'date' : 'likes';  
      const order = (req.query.order === 'asc') ? 'asc' : 'desc';
      const categoryIds = String(req.query.category||'').trim();
      const from = String(req.query.from||'').trim();
      const to   = String(req.query.to||'').trim();
      const q = String(req.query.q || '').trim();

      const viewer = req.user || null;

      const [items, total] = await Promise.all([
        posts.findMany({ viewer, status, sort, order, categoryIds, from, to, limit, offset, q }),
        posts.countMany({ viewer, status, categoryIds, from, to, q })
      ]);

      res.json({ page, limit, total, items });
    } catch (e) { next(e); }
  },

  // GET /api/posts/:post_id
  async getById(req, res, next) {
    try {
      const id = Number(req.params.post_id);
      const viewerId = req.user?.id || null;
      const post = await posts.findVisibleById(id, viewerId);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      res.json(post);
    } catch (e) { next(e); }
  },

  // GET /api/posts/:post_id/comments
  async getComments(req, res, next) {
    try {
      const id = Number(req.params.post_id);
      const viewerId = req.user?.id || null;
      const post = await posts.findVisibleById(id, viewerId);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      const list = await comments.findByPostId(id);
      res.json(list);
    } catch (e) { next(e); }
  },

  // POST /api/posts/:post_id/comments  { content, parent_id? }
async createComment(req, res, next) {
  try {
    const id = Number(req.params.post_id);
    const userId = req.user.id;

    const post = await posts.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isOwner = post.author_id === userId;
    const isAdmin = req.user.role === 'admin';
    if (!post.is_active && !isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Comments are allowed only under active posts' });
    }

    const { content, parent_id } = req.body || {};
    if (!nonEmpty(content, 1)) return res.status(400).json({ message: 'Invalid content' });

    let parentId = parent_id ? Number(parent_id) : null;
    if (parentId) {
      const parent = await comments.findByIdWithPost(parentId);
      if (!parent || parent.post_id !== id) {
        return res.status(400).json({ message: 'Invalid parent comment' });
      }
      if (!parent.is_active) {
        return res.status(403).json({ message: 'Cannot reply to inactive comment' });
      }
    }

    const commentId = await comments.create({ post_id: id, parent_id: parentId, author_id: userId, content: content.trim() });
    const created = await comments.findById(commentId);
    res.status(201).json(created);
  } catch (e) { next(e); }
},


  // GET /api/posts/:post_id/categories
  async getCategories(req, res, next) {
    try {
      const id = Number(req.params.post_id);
      const viewerId = req.user?.id || null;
      const post = await posts.findVisibleById(id, viewerId);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      const cats = await categories.findByPostId(id);
      res.json(cats);
    } catch (e) { next(e); }
  },

  // GET /api/posts/:post_id/like
  async getLikes(req, res, next) {
    try {
      const id = Number(req.params.post_id);
      const viewerId = req.user?.id || null;
      const post = await posts.findVisibleById(id, viewerId);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      const list = await likes.findByPostId(id);
      res.json(list);
    } catch (e) { next(e); }
  },

  // POST /api/posts   { title, content, categories: [ids] }
  // POST /api/posts   { title, content, categories[] } + files: images[]
async create(req, res, next) {
  try {
    const { title, content } = req.body || {};
    const uploadsRoot = process.env.UPLOADS_DIR || 'uploads';

    const rawCats = req.body?.categories;
    const cats = Array.isArray(rawCats) ? rawCats : (rawCats ? [rawCats] : []);
    const categoryIds = cats.map(Number).filter(Boolean);

    if (!nonEmpty(title, 1, 200))  return res.status(400).json({ message: 'Invalid title (1..200)' });
    if (!nonEmpty(content, 1))     return res.status(400).json({ message: 'Invalid content' });

    const postId = await posts.create({
      author_id: req.user.id,
      title: title.trim(),
      content: content.trim(),
      categoryIds
    });

    if (Array.isArray(req.files) && req.files.length) {
      const values = req.files.map((f, idx) => [
        postId,
        path.posix.join(uploadsRoot, 'post-images', f.filename),
        f.originalname || null,
        idx
      ]);
      await pool.query(
        `INSERT INTO post_images (post_id, filepath, alt_text, sort_order) VALUES ?`,
        [values]
      );
    }

    const created = await posts.findByIdFull(postId);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
},

  // POST /api/posts/:post_id/like   { type: 'like'|'dislike' }
    async likeOrDislike(req, res, next) {
    try {
      const id = Number(req.params.post_id);
      const viewerId = req.user.id;
      const pRaw = await posts.findById(id);
      if (!pRaw) return res.status(404).json({ message: 'Post not found' });
      if (!pRaw.is_active) return res.status(403).json({ message: 'Likes are disabled for inactive posts' });
      const post = await posts.findVisibleById(id, viewerId);
 if (!post) return res.status(404).json({ message: 'Post not found' });

      const type = String(req.body?.type||'').trim();
      if (!['like','dislike'].includes(type)) return res.status(400).json({ message: 'type must be like|dislike' });

      await likes.upsertForPost({ author_id: viewerId, post_id: id, type });
      const score = await likes.aggregateForPost(id);
      res.json({ message: 'ok', score });
    } catch (e) { next(e); }
  },

// PATCH /api/posts/:post_id/comments/:comment_id/status  { is_active: boolean }
async updateCommentStatus(req, res, next) {
  try {
    const postId = Number(req.params.post_id);
    const commentId = Number(req.params.comment_id);
    const wantActive = !!req.body?.is_active;

    const c = await comments.findByIdWithPost(commentId);
    if (!c) return res.status(404).json({ message: 'Comment not found' });

    const isAdmin        = req.user.role === 'admin';
    const isCommentOwner = c.author_id === req.user.id;
    const isPostOwner    = c.post_author_id === req.user.id;

    if (!isAdmin) {
      if (c.post_id !== postId) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      if (!isCommentOwner && !isPostOwner) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    await comments.updateIsActive(commentId, wantActive);
    const updated = await comments.findById(commentId);
    res.json(updated);
  } catch (e) { next(e); }
},
  // PATCH /api/posts/:post_id  { title?, content?, categories?, is_active? }
    async update(req, res, next) {
    try {
      const id = Number(req.params.post_id);
      const p = await posts.findById(id);
      if (!p) return res.status(404).json({ message: 'Post not found' });

      const isOwner = p.author_id === req.user.id;
      const isAdmin = req.user.role === 'admin';

      const patch = {};
      let newCats = null;

      if (req.body.title !== undefined) {
        if (!isOwner) return res.status(403).json({ message: 'Only owner can change title' });
        if (!nonEmpty(req.body.title, 1, 200)) return res.status(400).json({ message: 'Invalid title' });
        patch.title = req.body.title.trim();
      }

      if (req.body.content !== undefined) {
                if (!isOwner) return res.status(403).json({ message: 'Only owner can change content' });
        if (!nonEmpty(req.body.content, 1)) return res.status(400).json({ message: 'Invalid content' });
        patch.content = req.body.content.trim();
      }

      if (req.body.categories !== undefined) {
        const ids = Array.isArray(req.body.categories) ? req.body.categories.map(Number).filter(Boolean) : [];
        newCats = ids; 
      }

      if (req.body.is_active !== undefined) {
  if (!(isAdmin || isOwner)) {
    return res.status(403).json({ message: 'Only owner or admin can change is_active' });
  }
  patch.is_active = req.body.is_active ? 1 : 0;
}


      if (!Object.keys(patch).length && newCats === null) {
        return res.json(await posts.findByIdFull(id));
      }

      await posts.updatePartial(id, patch);
      if (newCats !== null) await posts.replaceCategories(id, newCats);

      res.json(await posts.findByIdFull(id));
    } catch (e) { next(e); }
  },


  // DELETE /api/posts/:post_id
  async remove(req, res, next) {
    try {
      const id = Number(req.params.post_id);
      const p = await posts.findById(id);
      if (!p) return res.status(404).json({ message: 'Post not found' });

      const isOwner = p.author_id === req.user.id;
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

      await posts.remove(id);
      res.json({ message: 'Post deleted' });
    } catch (e) { next(e); }
  },

  // DELETE /api/posts/:post_id/like
    async unlike(req, res, next) {
    try {
      const id = Number(req.params.post_id);
      const viewerId = req.user.id;
      const pRaw = await posts.findById(id);
      if (!pRaw) return res.status(404).json({ message: 'Post not found' });
      if (!pRaw.is_active) return res.status(403).json({ message: 'Likes are disabled for inactive posts' });
      const post = await posts.findVisibleById(id, viewerId);
      if (!post) return res.status(404).json({ message: 'Post not found' });

      await likes.removeForPost({ author_id: viewerId, post_id: id });
      const score = await likes.aggregateForPost(id);
      res.json({ message: 'Like removed', score });
    } catch (e) { next(e); }
  },
};
