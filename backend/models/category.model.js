// backend/models/category.model.js
const pool = require('../config/db');

module.exports = {
  async findByPostId(post_id) {
    const [rows] = await pool.query(
      `SELECT c.id, c.title, c.description
       FROM post_categories pc JOIN categories c ON c.id=pc.category_id
       WHERE pc.post_id=? ORDER BY c.title ASC`, [post_id]
    );
    return rows;
  },

async findAll() {
    const [rows] = await pool.query(
      `SELECT id, title, description FROM categories ORDER BY id ASC`
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, title, description FROM categories WHERE id=? LIMIT 1`, [id]
    );
    return rows[0] || null;
  },

  async findPostsByCategory({ categoryId, viewer, limit = 20, offset = 0, sort = 'likes', order = 'desc' }) {
    let where = `1=1`;
    const params = [categoryId];

    if (!viewer || viewer.role !== 'admin') {
      where += ` AND (p.is_active = 1 OR p.author_id = ?)`;
      params.push(viewer?.id || 0);
    }

    let orderBy = `score DESC, p.published_at DESC`;
    if (sort === 'date') orderBy = `p.published_at ${order.toUpperCase()}`;
    else if (sort === 'likes') orderBy = `score ${order.toUpperCase()}, p.published_at DESC`;

    const [rows] = await pool.query(
      `
      SELECT p.id, p.author_id, p.title, p.content, p.published_at, p.updated_at, p.is_active,
             COALESCE(SUM(CASE l.type WHEN 'like' THEN 1 WHEN 'dislike' THEN -1 ELSE 0 END),0) AS score
      FROM post_categories pc
      JOIN posts p ON p.id = pc.post_id
      LEFT JOIN likes l ON l.post_id = p.id
      WHERE pc.category_id = ?
        AND ${where}
      GROUP BY p.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), Number(offset)]
    );
    return rows;
  },

  async countPostsByCategory({ categoryId, viewer }) {
    let where = `1=1`;
    const params = [categoryId];
    if (!viewer || viewer.role !== 'admin') {
      where += ` AND (p.is_active = 1 OR p.author_id = ?)`;
      params.push(viewer?.id || 0);
    }
    const [rows] = await pool.query(
      `
      SELECT COUNT(DISTINCT p.id) AS c
      FROM post_categories pc
      JOIN posts p ON p.id = pc.post_id
      WHERE pc.category_id = ? AND ${where}
      `,
      params
    );
    return rows[0].c || 0;
  },

  async create({ title, description = null }) {
    const [res] = await pool.query(
      `INSERT INTO categories (title, description) VALUES (?, ?)`,
      [title, description]
    );
    return res.insertId;
  },

  async update(id, fields) {
    const cols = [], vals = [];
    for (const [k, v] of Object.entries(fields)) { cols.push(`${k}=?`); vals.push(v); }
    if (!cols.length) return;
    vals.push(id);
    await pool.query(`UPDATE categories SET ${cols.join(', ')} WHERE id=?`, vals);
  },

  async remove(id) {
    await pool.query(`DELETE FROM categories WHERE id=?`, [id]);
  }
};
