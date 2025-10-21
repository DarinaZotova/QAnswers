//backend/controllers/users.controller.js
const users = require('../models/user.model');
const bcrypt = require('bcrypt');
const path = require('path');

const nonEmpty = (v, min=1, max=255) =>
  typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;
const isEmail = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim());

const toPublic = (u) => ({
  id: u.id, login: u.login, email: u.email, full_name: u.full_name,
  role: u.role, profile_pic: u.profile_pic, rating: u.rating, created_at: u.created_at
});

module.exports = {
  // GET /api/users
  async list(req, res, next) {
    try {
      const page  = Math.max(parseInt(req.query.page||'1',10), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit||'20',10), 1), 100);
      const search = String(req.query.search||'').trim();
      const offset = (page-1)*limit;

      const [items, total] = await Promise.all([
        users.findMany({ search, limit, offset }),
        users.count({ search })
      ]);

      res.json({ page, limit, total, items: items.map(toPublic) });
    } catch (e) { next(e); }
  },

  // GET /api/users/:user_id
  async getById(req, res, next) {
    try {
      const u = await users.findById(Number(req.params.user_id));
      if (!u) return res.status(404).json({ message: 'User not found' });
      res.json(toPublic(u));
    } catch (e) { next(e); }
  },

  // POST /api/users
  async createByAdmin(req, res, next) {
    try {
      const { login, password, password_confirmation, email, role, full_name } = req.body || {};

      if (!nonEmpty(login,3,50))      return res.status(400).json({ message: 'Invalid login (3..50)' });
      if (!nonEmpty(password,6))      return res.status(400).json({ message: 'Invalid password (>=6)' });
      if (password !== password_confirmation) return res.status(400).json({ message: 'Passwords do not match' });
      if (!isEmail(email))            return res.status(400).json({ message: 'Invalid email' });
      if (!nonEmpty(full_name,1,100)) return res.status(400).json({ message: 'Invalid full_name (1..100)' });

      if (await users.findByLogin(login.trim())) return res.status(409).json({ message: 'Login already taken' });
      if (await users.findByEmail(email.trim())) return res.status(409).json({ message: 'Email already used' });

      const password_hash = await bcrypt.hash(password.trim(), 10);
      const newRole = (role === 'admin') ? 'admin' : 'user';
      const id = await users.create({ login, email, password_hash, full_name, role: newRole });
      const created = await users.findById(id);
      res.status(201).json(toPublic(created));
    } catch (e) { next(e); }
  },

  // PATCH /api/users/avatar
  async updateAvatar(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ message: 'avatar file is required (field: avatar)' });
      const rel = path.posix.join(process.env.UPLOADS_DIR || 'uploads', 'avatars', path.basename(req.file.filename));
      await users.updatePartial(req.user.id, { profile_pic: rel });
      const u = await users.findById(req.user.id);
      res.json(toPublic(u));
    } catch (e) { next(e); }
  },

  // PATCH /api/users/:user_id 
  async update(req, res, next) {
    try {
      const id = Number(req.params.user_id);
      const target = await users.findById(id);
      if (!target) return res.status(404).json({ message: 'User not found' });

      const patch = {};
      const { login, email, full_name, password, role } = req.body || {};

      if (login !== undefined) {
        if (!nonEmpty(login,3,50)) return res.status(400).json({ message: 'Invalid login (3..50)' });
        if (login.trim() !== target.login && await users.findByLogin(login.trim()))
          return res.status(409).json({ message: 'Login already taken' });
        patch.login = login.trim();
      }
      if (email !== undefined) {
        if (!isEmail(email)) return res.status(400).json({ message: 'Invalid email' });
        if (email.trim() !== target.email && await users.findByEmail(email.trim()))
          return res.status(409).json({ message: 'Email already used' });
        patch.email = email.trim();
      }
      if (full_name !== undefined) {
        if (!nonEmpty(full_name,1,100)) return res.status(400).json({ message: 'Invalid full_name (1..100)' });
        patch.full_name = full_name.trim();
      }
      if (password !== undefined) {
        if (!nonEmpty(password,6)) return res.status(400).json({ message: 'Invalid password (>=6)' });
        patch.password_hash = await bcrypt.hash(password.trim(), 10);
      }
      if (role !== undefined) {
        if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Only admin can change role' });
        patch.role = (role === 'admin') ? 'admin' : 'user';
      }

      if (Object.keys(patch).length) await users.updatePartial(id, patch);
      const updated = await users.findById(id);
      res.json(toPublic(updated));
    } catch (e) { next(e); }
  },

  // DELETE /api/users/:user_id 
  async remove(req, res, next) {
    try {
      const id = Number(req.params.user_id);
      const target = await users.findById(id);
      if (!target) return res.status(404).json({ message: 'User not found' });
      await users.remove(id);
      res.json({ message: 'User deleted' });
    } catch (e) { next(e); }
  }
};
