// backend/controllers/auth.controller.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const users = require('../models/user.model');
const emailVerif = require('../models/emailVerification.model');
const passwordReset = require('../models/passwordReset.model');
const { sendMail } = require('../services/mail.service');

function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()); }
function nonEmpty(v, min = 1, max = 255) { if (typeof v !== 'string') return false; const t=v.trim(); return t.length>=min && t.length<=max; }
function signToken(payload) { return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }); }

module.exports = {

  // POST /api/auth/email/request 
  async requestEmailVerification(req, res, next) {
    try {
      const { email } = req.body || {};
      if (!isEmail(email)) return res.status(400).json({ message: 'Invalid email' });

      const exists = await users.findByEmail(email.trim());
      if (exists) return res.status(409).json({ message: 'Email already used' });

      await emailVerif.markVerifiedNow(email.trim());

      const html = `
        <p>Your email has been verified.</p>
        <p>Go back to the registration page and complete your account creation.</p>
      `;
      await sendMail({ to: email.trim(), subject: 'QAnswers: e-mail verified', html });

      res.json({ message: 'Email verified (notification sent)' });
    } catch (e) { next(e); }
  },

  // GET /api/auth/email/status?email
  async emailStatus(req, res, next) {
    try {
      const email = String(req.query.email || '').trim();
      if (!isEmail(email)) return res.status(400).json({ message: 'Invalid email' });

      const verified = await emailVerif.isEmailVerified(email);
      res.json({ email, verified });
    } catch (e) { next(e); }
  },

  // POST /api/auth/register
async register(req, res, next) {
  try {
    const { login, email, password, password_confirmation, full_name } = req.body || {};

    if (!nonEmpty(login, 3, 50))          return res.status(400).json({ message: 'Invalid login (3..50)' });
    if (!isEmail(email))                  return res.status(400).json({ message: 'Invalid email' });
    if (!nonEmpty(password, 6))           return res.status(400).json({ message: 'Invalid password (>=6)' });
    if (password !== password_confirmation)
                                          return res.status(400).json({ message: 'Passwords do not match' });
    if (!nonEmpty(full_name, 1, 100))     return res.status(400).json({ message: 'Invalid full_name (1..100)' });

    const verified = await emailVerif.isEmailVerified(email.trim());
    if (!verified) return res.status(400).json({ message: 'Email not verified' });

    if (await users.findByLogin(login.trim()))
      return res.status(409).json({ message: 'Login already taken' });
    if (await users.findByEmail(email.trim()))
      return res.status(409).json({ message: 'Email already used' });

    const passwordHash = await bcrypt.hash(password.trim(), 10);
    const userId = await users.create({
      login: login.trim(),
      email: email.trim(),
      password_hash: passwordHash,
      full_name: full_name.trim()
    });

    await emailVerif.consume(email.trim());

    const token = signToken({ id: userId, role: 'user' });
    res.status(201).json({
      id: userId,
      login: login.trim(),
      email: email.trim(),
      full_name: full_name.trim(),
      role: 'user',
      token
    });
  } catch (e) {
    next(e);
  }
},

  // POST /api/auth/login 
  async login(req, res, next) {
    try {
      const { loginOrEmail, password } = req.body || {};
      if (!nonEmpty(loginOrEmail) || !nonEmpty(password)) {
        return res.status(400).json({ message: 'loginOrEmail and password are required' });
      }
      const user = await users.findByLoginOrEmail(loginOrEmail.trim());
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

      const token = signToken({ id: user.id, role: user.role });
      res.json({ id:user.id, login:user.login, email:user.email, full_name:user.full_name, role:user.role, profile_pic: user.profile_pic, token });
    } catch (e) { next(e); }
  },

  // GET /api/auth/me 
  async me(req, res, next) {
    try {
      const user = await users.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json({
        id: user.id, login: user.login, email: user.email,
        full_name: user.full_name, role: user.role,
        profile_pic: user.profile_pic, rating: user.rating, created_at: user.created_at
      });
    } catch (e) { next(e); }
  },

  // POST /api/auth/logout 
  async logout(req, res, next) {
    try { res.json({ message: 'Logged out successfully' }); }
    catch (e) { next(e); }
  },

  // POST /api/auth/password-reset 
async passwordResetSend(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!isEmail(email)) {
      return res.json({ message: 'If this email exists, a reset link has been sent' });
    }

    const user = await users.findByEmail(email.trim());
    if (user) {
      await passwordReset.invalidateForUser(user.id);
      const token = await passwordReset.create(user.id, 30);

      const FRONTEND_URL =
        process.env.FRONTEND_URL
        || 'http://localhost:5173';

      const resetUrl = `${FRONTEND_URL.replace(/\/+$/, '')}/change-password/${token}`;

      const html = `
        <p>Password reset requested for: <b>${user.email}</b></p>
        <p>Click the link to set a new password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link is valid for 30 minutes and can be used once.</p>
      `;

      await sendMail({ to: user.email, subject: 'QAnswers: password reset', html });
    }

    return res.json({ message: 'If this email exists, a reset link has been sent' });
  } catch (e) { next(e); }
},

  // POST /api/auth/password-reset/:confirm_token 
  async passwordResetConfirm(req, res, next) {
    try {
      const token = String(req.params.confirm_token || '').trim();
      const { new_password } = req.body || {};

      if (!nonEmpty(new_password, 6)) {
        return res.status(400).json({ message: 'Invalid new_password (>=6)' });
      }

      const entry = await passwordReset.findActiveByToken(token);
      if (!entry) return res.status(400).json({ message: 'Invalid or expired token' });

      const user = await users.findById(entry.user_id);
      if (!user) {
        await passwordReset.markUsed(token);
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      const password_hash = await bcrypt.hash(new_password.trim(), 10);
      await users.updatePasswordHash(user.id, password_hash);

      await passwordReset.markUsed(token);

      res.json({ message: 'Password has been reset' });
    } catch (e) { next(e); }
  }
};
