// backend/models/post.model.js
const pool = require('../config/db');

const SCORE_SQL = `COALESCE(SUM(CASE l.type WHEN 'like' THEN 1 WHEN 'dislike' THEN -1 ELSE 0 END),0) AS score`;

module.exports = {
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT p.id, p.author_id, p.title, p.content, p.published_at, p.updated_at, p.is_active
       FROM posts p WHERE p.id = ? LIMIT 1`, [id]
    );
    return rows[0] || null;
  },

async findByIdFull(id) {
  const [rows] = await pool.query(
    `SELECT p.id, p.author_id, p.title, p.content, p.published_at, p.updated_at, p.is_active,
            COALESCE(s.score, 0) AS score
     FROM posts p
     LEFT JOIN (
       SELECT l.post_id,
              ${SCORE_SQL}
       FROM likes l
       WHERE l.post_id IS NOT NULL
       GROUP BY l.post_id
     ) s ON s.post_id = p.id
     WHERE p.id = ? LIMIT 1`, [id]
  );
  if (!rows[0]) return null;

  const post = rows[0];

  const [cats] = await pool.query(
    `SELECT c.id, c.title, c.description
     FROM post_categories pc JOIN categories c ON c.id=pc.category_id
     WHERE pc.post_id=?`, [id]
  );
  post.categories = cats;

  const [imgs] = await pool.query(
    `SELECT id, filepath, alt_text, sort_order
     FROM post_images
     WHERE post_id = ?
     ORDER BY sort_order ASC, id ASC`, [id]
  );
  post.images = imgs;

  const [ua] = await pool.query(
    `SELECT id, login, full_name, profile_pic FROM users WHERE id=? LIMIT 1`,
    [post.author_id]
  );
  const u = ua[0] || {};
  post.author = {
    id: post.author_id,
    login: u.login || null,
    full_name: u.full_name || null,
    avatar: u.profile_pic || null,
  };

  return post;
},

  async findVisibleById(id, viewerId) {
    const p = await this.findByIdFull(id);
    if (!p) return null;
    if (p.is_active) return p;
    if (!viewerId) return null;
    const [urows] = await pool.query(`SELECT role FROM users WHERE id=?`, [viewerId]);
    const role = urows[0]?.role || 'user';
    if (role === 'admin' || p.author_id === viewerId) return p;
    return null;
  },

  async create({ author_id, title, content, categoryIds=[] }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [res] = await conn.query(
        `INSERT INTO posts (author_id, title, content) VALUES (?, ?, ?)`,
        [author_id, title, content]
      );
      const postId = res.insertId;
      if (categoryIds.length) {
        const values = categoryIds.map(cid => [postId, cid]);
        await conn.query(`INSERT INTO post_categories (post_id, category_id) VALUES ?`, [values]);
      }
      await conn.commit();
      return postId;
    } catch (e) {
      await conn.rollback(); throw e;
    } finally { conn.release(); }
  },

  async updatePartial(id, fields) {
    if (!fields || !Object.keys(fields).length) return;
    const cols = [], vals = [];
    for (const [k,v] of Object.entries(fields)) { cols.push(`${k} = ?`); vals.push(v); }
    vals.push(id);
    await pool.query(`UPDATE posts SET ${cols.join(', ')} WHERE id = ?`, vals);
  },

  async replaceCategories(postId, categoryIds) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(`DELETE FROM post_categories WHERE post_id=?`, [postId]);
      if (categoryIds.length) {
        const values = categoryIds.map(cid => [postId, cid]);
        await conn.query(`INSERT INTO post_categories (post_id, category_id) VALUES ?`, [values]);
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback(); throw e;
    } finally { conn.release(); }
  },

  async remove(id) {
    await pool.query(`DELETE FROM posts WHERE id=?`, [id]);
  },


async findMany({ viewer, status, sort, order, categoryIds, from, to, limit, offset, q }) {
  const params = [];
  let where = `1=1`;
  let joinCatsFilter = ``;

  if (!viewer || viewer.role !== 'admin') {
    if (status === 'all') {
      where += ` AND (p.is_active = 1 OR p.author_id = ?)`;
      params.push(viewer?.id || 0);
    } else {
      where += ` AND p.is_active = 1`;
    }
  }

  if (from) { where += ` AND p.published_at >= ?`; params.push(from); }
  if (to)   { where += ` AND p.published_at <= ?`; params.push(to); }

  if (categoryIds) {
    const ids = categoryIds.split(',').map(x => Number(x)).filter(Boolean);
    if (ids.length) {
      joinCatsFilter =
        `JOIN post_categories fpc ON fpc.post_id = p.id AND fpc.category_id IN (${ids.map(()=>'?').join(',')})`;
      params.push(...ids);
    }
  }

  if (q) { where += ` AND p.title LIKE ?`; params.push(`%${q}%`); }

  const o = (order || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  let orderBy = `score DESC, p.published_at DESC`;
  if (sort === 'date')  orderBy = `p.published_at ${o}`;
  if (sort === 'likes') orderBy = `score ${o}, p.published_at DESC`;

  const sql = `
    SELECT
      p.id, p.title, p.content, p.published_at, p.updated_at, p.is_active,
      u.id AS author_id, u.login AS author_login, u.full_name AS author_name,
      u.profile_pic AS author_avatar,
      COALESCE(SUM(CASE l.type WHEN 'like' THEN 1 WHEN 'dislike' THEN -1 ELSE 0 END), 0) AS score,
      GROUP_CONCAT(DISTINCT CONCAT(c.id, ':', c.title) SEPARATOR ',') AS cats_raw
    FROM posts p
    JOIN users u ON u.id = p.author_id
    ${joinCatsFilter}
    LEFT JOIN likes l ON l.post_id = p.id
    LEFT JOIN post_categories pc ON pc.post_id = p.id
    LEFT JOIN categories c ON c.id = pc.category_id
    WHERE ${where}
    GROUP BY p.id
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(sql, [...params, Number(limit), Number(offset)]);

  return rows.map(r => {
    const categories = [];
    if (r.cats_raw) {
      for (const pair of r.cats_raw.split(',')) {
        const [idStr, title] = pair.split(':');
        const id = Number(idStr);
        if (id && title) categories.push({ id, title });
      }
    }
    return {
      id: r.id,
      title: r.title,
      content: r.content,
      published_at: r.published_at,
      updated_at: r.updated_at,
      is_active: !!r.is_active,
      score: Number(r.score) || 0,
      author: {
        id: r.author_id,
        login: r.author_login,
        full_name: r.author_name,
        avatar: r.author_avatar || null,  
      },
      categories,
    };
  });
},

async countMany({ viewer, status, categoryIds, from, to, q }) {
  const params = [];
  let where = `1=1`;
  let joinCats = ``;

  if (!viewer || viewer.role !== 'admin') {
    if (status === 'all') {
      where += ` AND (p.is_active = 1 OR p.author_id = ?)`;
      params.push(viewer?.id || 0);
    } else {
      where += ` AND p.is_active = 1`;
    }
  }
  if (from) { where += ` AND p.published_at >= ?`; params.push(from); }
  if (to)   { where += ` AND p.published_at <= ?`; params.push(to); }

  if (categoryIds) {
    const ids = categoryIds.split(',').map(x=>Number(x)).filter(Boolean);
    if (ids.length) {
      joinCats = `JOIN post_categories fpc ON fpc.post_id = p.id AND fpc.category_id IN (${ids.map(()=>'?').join(',')})`;
      params.push(...ids);
    }
  }

  if (q) { where += ` AND p.title LIKE ?`; params.push(`%${q}%`); }

  const [rows] = await pool.query(
    `SELECT COUNT(DISTINCT p.id) AS c FROM posts p ${joinCats} WHERE ${where}`,
    params
  );
  return rows[0].c;
},

async findManyByAuthor({ authorId, status, sort, order, categoryIds, from, to, limit, offset, q }) {
  const params = [authorId];
  let where = `p.author_id = ?`;
  let joinCatsFilter = ``;

  if (status === 'active') where += ` AND p.is_active = 1`;
  else if (status === 'inactive') where += ` AND p.is_active = 0`;

  if (from) { where += ` AND p.published_at >= ?`; params.push(from); }
  if (to)   { where += ` AND p.published_at <= ?`; params.push(to); }

  if (categoryIds) {
    const ids = categoryIds.split(',').map(x => Number(x)).filter(Boolean);
    if (ids.length) {
      joinCatsFilter =
        `JOIN post_categories fpc ON fpc.post_id = p.id AND fpc.category_id IN (${ids.map(()=>'?').join(',')})`;
      params.push(...ids);
    }
  }
  if (q) { where += ` AND p.title LIKE ?`; params.push(`%${q}%`); }

  const o = (order || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  let orderBy = `score DESC, p.published_at DESC`;
  if (sort === 'date')  orderBy = `p.published_at ${o}`;
  else if (sort === 'likes') orderBy = `score ${o}, p.published_at DESC`;

  params.push(Number(limit), Number(offset));

  const sql = `
    SELECT
      p.id, p.title, p.content, p.published_at, p.updated_at, p.is_active,
      u.id AS author_id, u.login AS author_login, u.full_name AS author_name,
      u.profile_pic AS author_avatar,
      COALESCE(SUM(CASE l.type WHEN 'like' THEN 1 WHEN 'dislike' THEN -1 ELSE 0 END), 0) AS score,
      GROUP_CONCAT(DISTINCT CONCAT(c.id, ':', c.title) SEPARATOR ',') AS cats_raw
    FROM posts p
    JOIN users u ON u.id = p.author_id
    ${joinCatsFilter}
    LEFT JOIN likes l ON l.post_id = p.id
    LEFT JOIN post_categories pc ON pc.post_id = p.id
    LEFT JOIN categories c ON c.id = pc.category_id
    WHERE ${where}
    GROUP BY p.id
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(sql, params);

  return rows.map(r => {
    const categories = [];
    if (r.cats_raw) {
      for (const pair of r.cats_raw.split(',')) {
        const [idStr, title] = pair.split(':');
        const id = Number(idStr);
        if (id && title) categories.push({ id, title });
      }
    }
    return {
      id: r.id,
      title: r.title,
      content: r.content,
      published_at: r.published_at,
      updated_at: r.updated_at,
      is_active: !!r.is_active,
      score: Number(r.score) || 0,
      author: {
        id: r.author_id,
        login: r.author_login,
        full_name: r.author_name,
        avatar: r.author_avatar || null,
      },
      categories,
    };
  });
},

async countManyByAuthor({ authorId, status, categoryIds, from, to, q }) {
  const params = [authorId];
  let where = `p.author_id = ?`;
  let joinCats = ``;

  if (status === 'active') where += ` AND p.is_active = 1`;
  else if (status === 'inactive') where += ` AND p.is_active = 0`;

  if (from) { where += ` AND p.published_at >= ?`; params.push(from); }
  if (to)   { where += ` AND p.published_at <= ?`; params.push(to); }

  if (categoryIds) {
    const ids = categoryIds.split(',').map(x=>Number(x)).filter(Boolean);
    if (ids.length) {
      joinCats = `JOIN post_categories fpc ON fpc.post_id = p.id AND fpc.category_id IN (${ids.map(()=>'?').join(',')})`;
      params.push(...ids);
    }
  }

  if (q) { where += ` AND p.title LIKE ?`; params.push(`%${q}%`); }

  const [rows] = await pool.query(
    `SELECT COUNT(DISTINCT p.id) AS c FROM posts p ${joinCats} WHERE ${where}`,
    params
  );
  return rows[0].c;
}

};

