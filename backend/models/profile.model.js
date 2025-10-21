// backend/models/profile.model.js
const pool = require('../config/db');

module.exports = {
  async findPublicById(id) {
    const [rows] = await pool.query(
      `SELECT id, login, full_name, profile_pic, role, rating, created_at
       FROM users WHERE id=? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async findPublicByLogin(login) {
    const [rows] = await pool.query(
      `SELECT id, login, full_name, profile_pic, role, rating, created_at
       FROM users WHERE login=? LIMIT 1`,
      [login]
    );
    return rows[0] || null;
  },

  async findRecentPosts(userId, limit = 10) {
    const [rows] = await pool.query(
      `SELECT id, title, published_at, is_active
       FROM posts
       WHERE author_id = ?
       ORDER BY published_at DESC
       LIMIT ?`,
      [userId, Number(limit)]
    );
    return rows;
  },

  async findRecentComments(userId, limit = 10) {
    const [rows] = await pool.query(
      `SELECT c.id, c.post_id, c.content, c.published_at, c.is_active
       FROM comments c
       WHERE c.author_id = ?
       ORDER BY c.published_at DESC
       LIMIT ?`,
      [userId, Number(limit)]
    );
    return rows;
  },

  async aggregateCounts(userId) {
    const [[p]] = await pool.query(
      `SELECT COUNT(*) AS c FROM posts WHERE author_id=?`,
      [userId]
    );
    const [[cm]] = await pool.query(
      `SELECT COUNT(*) AS c FROM comments WHERE author_id=?`,
      [userId]
    );
    return { posts: p.c || 0, comments: cm.c || 0 };
  },
};
