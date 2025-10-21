//backend/models/like.model.js
const pool = require('../config/db');

function valOf(type) {
  return type === 'like' ? 1 : -1;
}

async function bumpUserRating(conn, userId, delta) {
  if (!delta) return;
  await conn.query(`UPDATE users SET rating = rating + ? WHERE id = ?`, [delta, userId]);
}

module.exports = {
  async findByPostId(post_id) {
    const [rows] = await pool.query(
      `SELECT id, author_id, type FROM likes WHERE post_id=? ORDER BY id ASC`,
      [post_id]
    );
    return rows;
  },

  async upsertForPost({ author_id, post_id, type }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[p]] = await conn.query(
        `SELECT author_id FROM posts WHERE id=? FOR UPDATE`,
        [post_id]
      );
      if (!p) throw new Error('Post not found');
      const targetUserId = p.author_id;

      const [[prev]] = await conn.query(
        `SELECT id, type FROM likes WHERE author_id=? AND post_id=? FOR UPDATE`,
        [author_id, post_id]
      );

      let delta = 0;
      if (!prev) {
        await conn.query(
          `INSERT INTO likes (author_id, post_id, type) VALUES (?, ?, ?)`,
          [author_id, post_id, type]
        );
        delta = valOf(type);       
      } else if (prev.type !== type) {
        await conn.query(`UPDATE likes SET type=? WHERE id=?`, [type, prev.id]);
        delta = valOf(type) - valOf(prev.type); 
      }

      await bumpUserRating(conn, targetUserId, delta);

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  async removeForPost({ author_id, post_id }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[p]] = await conn.query(
        `SELECT author_id FROM posts WHERE id=? FOR UPDATE`,
        [post_id]
      );
      if (!p) throw new Error('Post not found');
      const targetUserId = p.author_id;

      const [[prev]] = await conn.query(
        `SELECT id, type FROM likes WHERE author_id=? AND post_id=? FOR UPDATE`,
        [author_id, post_id]
      );

      if (prev) {
        await conn.query(`DELETE FROM likes WHERE id=?`, [prev.id]);
        await bumpUserRating(conn, targetUserId, -valOf(prev.type));
      }

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  async aggregateForPost(post_id) {
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(CASE type WHEN 'like' THEN 1 WHEN 'dislike' THEN -1 ELSE 0 END),0) AS score
       FROM likes WHERE post_id=?`,
      [post_id]
    );
    return rows[0]?.score ?? 0;
  },


  async findByCommentId(comment_id) {
    const [rows] = await pool.query(
      `SELECT id, author_id, type FROM likes WHERE comment_id = ? ORDER BY id ASC`,
      [comment_id]
    );
    return rows;
  },

  async upsertForComment({ author_id, comment_id, type }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[c]] = await conn.query(
        `SELECT author_id FROM comments WHERE id=? FOR UPDATE`,
        [comment_id]
      );
      if (!c) throw new Error('Comment not found');
      const targetUserId = c.author_id;

      const [[prev]] = await conn.query(
        `SELECT id, type FROM likes WHERE author_id=? AND comment_id=? FOR UPDATE`,
        [author_id, comment_id]
      );

      let delta = 0;
      if (!prev) {
        await conn.query(
          `INSERT INTO likes (author_id, comment_id, type) VALUES (?, ?, ?)`,
          [author_id, comment_id, type]
        );
        delta = valOf(type);
      } else if (prev.type !== type) {
        await conn.query(`UPDATE likes SET type=? WHERE id=?`, [type, prev.id]);
        delta = valOf(type) - valOf(prev.type);
      }

      await bumpUserRating(conn, targetUserId, delta);

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  async removeForComment({ author_id, comment_id }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[c]] = await conn.query(
        `SELECT author_id FROM comments WHERE id=? FOR UPDATE`,
        [comment_id]
      );
      if (!c) throw new Error('Comment not found');
      const targetUserId = c.author_id;

      const [[prev]] = await conn.query(
        `SELECT id, type FROM likes WHERE author_id=? AND comment_id=? FOR UPDATE`,
        [author_id, comment_id]
      );

      if (prev) {
        await conn.query(`DELETE FROM likes WHERE id=?`, [prev.id]);
        await bumpUserRating(conn, targetUserId, -valOf(prev.type));
      }

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  async aggregateForComment(comment_id) {
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(CASE type WHEN 'like' THEN 1 WHEN 'dislike' THEN -1 ELSE 0 END),0) AS score
       FROM likes WHERE comment_id = ?`,
      [comment_id]
    );
    return rows[0]?.score || 0;
  }
};
