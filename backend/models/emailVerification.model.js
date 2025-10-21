// backend/models/emailVerification.model.js
const crypto = require('crypto');
const pool = require('../config/db');

module.exports = {
  async markVerifiedNow(email) {
    await pool.query(
      `INSERT INTO email_verifications (email, token, is_verified, expires_at)
       VALUES (?, '', 1, NOW())
       ON DUPLICATE KEY UPDATE
         is_verified = 1,
         expires_at = NOW()`,
      [email]
    );
  },

  async isEmailVerified(email) {
    const [rows] = await pool.query(
      `SELECT is_verified FROM email_verifications
       WHERE email = ?
       ORDER BY id DESC LIMIT 1`,
      [email]
    );
    return rows[0]?.is_verified === 1;
  },

  async consume(email) {
    await pool.query(`DELETE FROM email_verifications WHERE email = ?`, [email]);
  }
};
