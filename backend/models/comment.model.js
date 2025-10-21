// backend/models/comment.model.js
const pool = require('../config/db');

const SCORE_SQL = `COALESCE(SUM(CASE l.type WHEN 'like' THEN 1 WHEN 'dislike' THEN -1 ELSE 0 END),0) AS score`;

module.exports = {
  async findById(id) {
    const [r] = await pool.query(
      `SELECT
         c.id, c.post_id, c.parent_id, c.author_id, c.content, c.published_at, c.is_active,
         u.login AS author_login,
         u.profile_pic AS author_avatar
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.id = ?`,
      [id]
    );
    return r[0] || null;
  },

async findByPostId(post_id) {
    const [rows] = await pool.query(
      `SELECT
         c.id, c.post_id, c.parent_id, c.author_id, c.content, c.published_at, c.is_active,
         u.login AS author_login,
         u.profile_pic AS author_avatar
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.post_id = ?
       ORDER BY c.published_at ASC, c.id ASC`,
      [post_id]
    );
    return rows;
  },

  async findByIdWithPost(commentId) {
    const [rows] = await pool.query(
      `SELECT c.*, p.author_id AS post_author_id, p.is_active AS post_is_active
       FROM comments c
       JOIN posts p ON p.id = c.post_id
       WHERE c.id = ? LIMIT 1`,
      [commentId]
    );
    return rows[0] || null;
  },

  async updateIsActive(id, isActive) {
    await pool.query(`UPDATE comments SET is_active=? WHERE id=?`, [isActive ? 1 : 0, id]);
  },


  async create({ post_id, parent_id=null, author_id, content }) {
    const [res] = await pool.query(
      `INSERT INTO comments (post_id, parent_id, author_id, content) VALUES (?,?,?,?)`,
      [post_id, parent_id, author_id, content]
    );
    return res.insertId;
  },

async updateIsActiveCascade(id, isActive) {
    const val = isActive ? 1 : 0;
    await pool.query(`UPDATE comments SET is_active = ? WHERE id = ?`, [val, id]);
    await pool.query(`UPDATE comments SET is_active = ? WHERE parent_id = ?`, [val, id]);
  },


  async updatePartial(id, fields) {
    if (!fields || !Object.keys(fields).length) return;
    const cols = [], vals = [];
    for (const [k, v] of Object.entries(fields)) { cols.push(`${k} = ?`); vals.push(v); }
    vals.push(id);
    await pool.query(`UPDATE comments SET ${cols.join(', ')} WHERE id = ?`, vals);
  },

  async remove(id) { await pool.query(`DELETE FROM comments WHERE id=?`, [id]); },

  
  async findByPostIdFiltered(postId, status='inactive') {
  let where = `c.post_id = ?`;
  const params = [postId];
  if (status === 'inactive') where += ` AND c.is_active = 0`;
  else if (status === 'active') where += ` AND c.is_active = 1`;

  const [rows] = await pool.query(
    `SELECT
       c.id, c.post_id, c.author_id, c.content, c.published_at, c.is_active,
       u.login AS author_login,
       u.profile_pic AS author_avatar
     FROM comments c
     JOIN users u ON u.id = c.author_id
     WHERE ${where}
     ORDER BY c.published_at ASC`,
    params
  );
  return rows;
},

  async findManyByAuthor({ authorId, status, sort, order, from, to, limit, offset }) {
    const params = [authorId];
    let where = `c.author_id = ?`;
    const o = (order||'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    if (status === 'active')   { where += ` AND c.is_active = 1`; }
    else if (status === 'inactive') { where += ` AND c.is_active = 0`; }

    if (from) { where += ` AND c.published_at >= ?`; params.push(from); }
    if (to)   { where += ` AND c.published_at <= ?`; params.push(to); }

    let orderBy = `score ${o}, c.published_at DESC`;
    if (sort === 'date') orderBy = `c.published_at ${o}`;

    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(
      `
      SELECT
        c.id, c.post_id, c.author_id, c.content, c.published_at, c.is_active,
        p.title AS post_title, p.is_active AS post_is_active,
        ${SCORE_SQL}
      FROM comments c
      JOIN posts p ON p.id = c.post_id
      LEFT JOIN likes l ON l.comment_id = c.id
      WHERE ${where}
      GROUP BY c.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
      `,
      params
    );
    return rows;
  },

  async countManyByAuthor({ authorId, status, from, to }) {
    const params = [authorId];
    let where = `c.author_id = ?`;

    if (status === 'active')   { where += ` AND c.is_active = 1`; }
    else if (status === 'inactive') { where += ` AND c.is_active = 0`; }

    if (from) { where += ` AND c.published_at >= ?`; params.push(from); }
    if (to)   { where += ` AND c.published_at <= ?`; params.push(to); }

    const [rows] = await pool.query(
      `SELECT COUNT(DISTINCT c.id) AS c
       FROM comments c
       JOIN posts p ON p.id = c.post_id
       WHERE ${where}`,
      params
    );
    return rows[0].c;
  }

};
