// backend/controllers/comments.controller.js
const comments = require('../models/comment.model');
const posts = require('../models/post.model');
const likes = require('../models/like.model'); 
const { } = require('../config/db');

const nonEmpty = (v, min=1, max=65535) =>
  typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;

module.exports = {

  // GET /api/comments/:comment_id
  async getById(req, res, next) {
    try {
      const id = Number(req.params.comment_id);
      const c = await comments.findById(id);
      if (!c) return res.status(404).json({ message: 'Comment not found' });

      const viewerId = req.user?.id || null;
      const visible = await posts.findVisibleById(c.post_id, viewerId);
      if (!visible) return res.status(404).json({ message: 'Comment not found' });

      res.json(c);
    } catch (e) { next(e); }
  },

  // GET /api/comments/:comment_id/like
  async getLikes(req, res, next) {
    try {
      const id = Number(req.params.comment_id);
      const c = await comments.findByIdWithPost(id);
      if (!c) return res.status(404).json({ message: 'Comment not found' });

      // скрываем лайки, если коммент неактивен или пост неактивен
      if (!c.is_active || !c.post_is_active) {
        return res.status(403).json({ message: 'Likes are hidden for inactive comments' });
      }

      const visible = await posts.findVisibleById(c.post_id, req.user?.id || null);
      if (!visible) return res.status(404).json({ message: 'Comment not found' });

      const list = await likes.findByCommentId(id);
      res.json(list);
    } catch (e) { next(e); }
  },

  // POST /api/comments/:comment_id/like   { type: 'like'|'dislike' }
  async likeOrDislike(req, res, next) {
    try {
      const id = Number(req.params.comment_id);
      const uid = req.user.id;

      const c = await comments.findByIdWithPost(id);
      if (!c) return res.status(404).json({ message: 'Comment not found' });

      if (!c.is_active || !c.post_is_active) {
        return res.status(403).json({ message: 'Likes are disabled for inactive comments' });
      }

      const visible = await posts.findVisibleById(c.post_id, uid);
      if (!visible) return res.status(404).json({ message: 'Comment not found' });

      const type = String(req.body?.type || '').trim();
      if (!['like', 'dislike'].includes(type)) {
        return res.status(400).json({ message: 'type must be like|dislike' });
      }

      await likes.upsertForComment({ author_id: uid, comment_id: id, type });
      const score = await likes.aggregateForComment(id);
      res.json({ message: 'ok', score });
    } catch (e) { next(e); }
  },

  // DELETE /api/comments/:comment_id/like
  async unlike(req, res, next) {
    try {
      const id = Number(req.params.comment_id);
      const uid = req.user.id;

      const c = await comments.findByIdWithPost(id);
      if (!c) return res.status(404).json({ message: 'Comment not found' });
      if (!c.is_active || !c.post_is_active) {
        return res.status(403).json({ message: 'Likes are disabled for inactive comments' });
      }

      const visible = await posts.findVisibleById(c.post_id, uid);
      if (!visible) return res.status(404).json({ message: 'Comment not found' });

      await likes.removeForComment({ author_id: uid, comment_id: id });
      const score = await likes.aggregateForComment(id);
      res.json({ message: 'Like removed', score });
    } catch (e) { next(e); }
  },

  // PATCH /api/comments/:comment_id   { content?, is_active? }
async update(req, res, next) {
  try {
    const id = Number(req.params.comment_id);
    const c = await comments.findByIdWithPost(id);
    if (!c) return res.status(404).json({ message: 'Comment not found' });

    const patch = {};
    if (req.body.content !== undefined) {
      if (c.author_id !== req.user.id) {
        return res.status(403).json({ message: 'Only author can change content' });
      }
      if (!nonEmpty(req.body.content, 1)) {
        return res.status(400).json({ message: 'Invalid content' });
      }
      patch.content = req.body.content.trim();
    }

    if (req.body.is_active !== undefined) {
      const isOwner = c.author_id === req.user.id;
      const isPostOwner = c.post_author_id === req.user.id;
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isPostOwner && !isAdmin) {
        return res.status(403).json({ message: 'Forbidden (status)' });
      }

      // каскад статуса на ответы
      await comments.updateIsActiveCascade(id, !!req.body.is_active);
      return res.json(await comments.findById(id));
    }

    if (!Object.keys(patch).length) {
      return res.json(await comments.findById(id));
    }

    await comments.updatePartial(id, patch);
    res.json(await comments.findById(id));
  } catch (e) { next(e); }
},


  // DELETE /api/comments/:comment_id
  async remove(req, res, next) {
    try {
      const id = Number(req.params.comment_id);
      const c = await comments.findById(id);
      if (!c) return res.status(404).json({ message: 'Comment not found' });

      const isOwner = c.author_id === req.user.id;
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

      await comments.remove(id);
      res.json({ message: 'Comment deleted' });
    } catch (e) { next(e); }
  },
};
