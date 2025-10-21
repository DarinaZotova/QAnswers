//backend/models/user.model.js
const pool = require('../config/db');

module.exports = {
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async findByLogin(login) {
    const [rows] = await pool.query('SELECT * FROM users WHERE login = ? LIMIT 1', [login]);
    return rows[0] || null;
  },

  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  },

  async findByLoginOrEmail(loginOrEmail) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE login = ? OR email = ? LIMIT 1',
      [loginOrEmail, loginOrEmail]
    );
    return rows[0] || null;
  },

  async create({ login, email, password_hash, full_name, role = 'user' }) {
    const [res] = await pool.query(
      `INSERT INTO users (login, email, password_hash, full_name, role)
       VALUES (?, ?, ?, ?, ?)`,
      [login, email, password_hash, full_name, role]
    );
    return res.insertId;
  },

  async updatePasswordHash(id, password_hash) {
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [password_hash, id]
    );
  },

  async findMany({ search, limit, offset }) {
    const params = [];
    let sql = `SELECT id, login, email, full_name, role, profile_pic, rating, created_at FROM users`;
    if (search) {
      sql += ` WHERE login LIKE ? OR email LIKE ? OR full_name LIKE ?`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    sql += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async count({ search }) {
    const params = [];
    let sql = `SELECT COUNT(*) AS c FROM users`;
    if (search) {
      sql += ` WHERE login LIKE ? OR email LIKE ? OR full_name LIKE ?`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    const [rows] = await pool.query(sql, params);
    return rows[0].c;
  },

  async updatePartial(id, fields) {
    if (!fields || !Object.keys(fields).length) return;
    const cols = [];
    const vals = [];
    for (const [k, v] of Object.entries(fields)) {
      cols.push(`${k} = ?`);
      vals.push(v);
    }
    vals.push(id);
    const sql = `UPDATE users SET ${cols.join(', ')} WHERE id = ?`;
    await pool.query(sql, vals);
  },

  async remove(id) {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
  }

};
