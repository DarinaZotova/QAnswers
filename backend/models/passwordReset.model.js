// backend/models/passwordReset.model.js
const crypto = require('crypto');
const pool = require('../config/db');

function genToken() {
  return crypto.randomBytes(32).toString('hex'); 
}

module.exports = {
  genToken,

  async create(userId, ttlMinutes = 30) {
    const token = genToken();
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
      [userId, token, ttlMinutes]
    );
    return token;
  },

  async findActiveByToken(token) {
    const [rows] = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE token = ? AND used_at IS NULL AND expires_at > NOW()
       LIMIT 1`,
      [token]
    );
    return rows[0] || null;
  },

  async markUsed(token) {
    await pool.query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ? AND used_at IS NULL`,
      [token]
    );
  },

  async invalidateForUser(userId) {
    await pool.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE user_id = ? AND used_at IS NULL`,
      [userId]
    );
  }
};
