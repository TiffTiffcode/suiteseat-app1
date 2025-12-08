//C:\Users\tiffa\OneDrive\Desktop\Live\routes\holds.js

// C:\Users\tiffa\OneDrive\Desktop\Live\routes\auth.js
const express  = require('express');
const router   = express.Router();          // <-- define router FIRST
const bcrypt   = require('bcryptjs');
const AuthUser = require('../models/AuthUser');

// /api/login (canonical)
router.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await AuthUser.findOne({ email: String(email || '').toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(String(password || ''), user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    req.session.userId = String(user._id);
    req.session.user = {
      _id: String(user._id),
      email: user.email,
      firstName: user.firstName || '',
      lastName:  user.lastName  || '',
      roles: Array.isArray(user.roles) ? user.roles : []
    };
    await req.session.save();

    return res.json({ ok: true, user: req.session.user });
  } catch (e) {
    console.error('/api/login error', e);
    return res.status(500).json({ message: 'Login failed' });
  }
});

// Simple /login (availability page)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await AuthUser.findOne({ email: String(email || '').toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(String(password || ''), user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    req.session.userId = String(user._id);
    req.session.roles  = Array.isArray(user.roles) ? user.roles : ['pro'];
    req.session.email  = user.email;
    await req.session.save();

    console.log('[LOGIN] set session', { userId: req.session.userId, roles: req.session.roles });
    return res.json({ loggedIn: true, userId: req.session.userId, email: req.session.email, roles: req.session.roles });
  } catch (e) {
    console.error('/login error', e);
    return res.status(500).json({ message: 'Login failed' });
  }
});

// /signup (client)
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email & password required' });

    const existing = await AuthUser.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await AuthUser.create({
      firstName, lastName, email: String(email).toLowerCase().trim(), phone, passwordHash, roles: ['client']
    });

    req.session.userId = String(user._id);
    req.session.user = { _id: String(user._id), email: user.email, name: user.name, roles: user.roles };
    await req.session.save();

    return res.json({ ok: true, user: { _id: String(user._id), firstName, lastName, email: user.email, phone } });
  } catch (e) {
    console.error('/signup error', e);
    return res.status(500).json({ message: 'Signup failed' });
  }
});

// /signup/pro
router.post('/signup/pro', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Missing email/password' });

    const existing = await AuthUser.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await AuthUser.create({
      firstName, lastName,
      email: String(email).toLowerCase().trim(),
      phone,
      passwordHash,
      roles: ['pro']
    });

    req.session.userId = String(user._id);
    req.session.user = { _id: String(user._id), firstName, lastName, email: user.email, roles: user.roles };
    await req.session.save();

    return res.status(201).json({ user: req.session.user, redirect: '/appointment-settings' });
  } catch (e) {
    console.error('/signup/pro error', e);
    return res.status(500).json({ message: e.message || 'Signup failed' });
  }
});

// /api/logout
router.post('/api/logout', async (req, res) => {
  try {
    await new Promise((resolve) => req.session.destroy(resolve));
    res.clearCookie('connect.sid');
    return res.json({ ok: true });
  } catch (e) {
    console.error('/api/logout error', e);
    return res.status(500).json({ ok: false });
  }
});

// /api/me
router.get('/api/me', (req, res) => {
  const userId = req.session?.userId ? String(req.session.userId) : null;
  return res.json({ userId, user: req.session?.user || null });
});

module.exports = router; // <-- export router LAST
