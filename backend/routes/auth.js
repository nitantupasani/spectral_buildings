const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { fetch } = require('undici');
const User = require('../models/User');

const router = express.Router();

const ALLOWED_DOMAIN = 'spectral.energy';
const allowedEmails = (process.env.ALLOWED_GOOGLE_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const verifyGoogleToken = async (idToken) => {
  const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
  const response = await fetch(tokenInfoUrl);

  if (!response.ok) {
    throw new Error('Invalid Google token');
  }

  const payload = await response.json();

  if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new Error('Token audience mismatch');
  }

  return payload;
};

const issueToken = (user) => {
  const payload = {
    userId: user._id,
    role: user.role,
    authProvider: user.authProvider || 'local'
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider || 'local'
    }
  };
};

// Register
router.post('/register', [
  body('username').isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    let user = await User.findOne({ $or: [{ email: normalizedEmail }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      role: role || 'engineer',
      authProvider: 'local'
    });

    await user.save();

    // Create token
    res.json(issueToken(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.authProvider === 'google') {
      return res.status(400).json({ message: 'Use Google login for this account' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.json(issueToken(user));
  } catch (error) {
    console.error(error);
    const clientErrorMessages = ['Invalid Google token', 'Token audience mismatch'];
    const status = clientErrorMessages.includes(error.message) ? 400 : 500;
    res.status(status).json({ message: error.message || 'Server error' });
  }
});

router.post('/google', [
  body('token').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token: idToken } = req.body;

    const payload = await verifyGoogleToken(idToken);
    const email = (payload?.email || '').trim().toLowerCase();
    const hd = payload?.hd;
    const googleId = payload?.sub;
    const name = payload?.name;

    if (!email || !googleId) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    if (hd !== ALLOWED_DOMAIN) {
      return res.status(403).json({ message: 'Only spectral.energy accounts are allowed' });
    }

    if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
      return res.status(403).json({ message: 'This account is not allowed' });
    }

    let user = await User.findOne({ email });
    let needsSave = false;

    if (!user) {
      const baseUsername = name || email.split('@')[0];
      let username = baseUsername.trim() || `user-${googleId}`;

      const usernameExists = await User.exists({ username });
      if (usernameExists) {
        username = `${username}-${googleId.slice(0, 6)}`;
      }

      user = new User({
        username,
        email,
        role: 'admin',
        authProvider: 'google',
        googleId
      });
      needsSave = true;
    } else {
      if (user.authProvider !== 'google') {
        user.authProvider = 'google';
        needsSave = true;
      }

      if (!user.googleId) {
        user.googleId = googleId;
        needsSave = true;
      }
    }

    // Ensure Google users are treated as admins (per requirements)
    if (user.role !== 'admin') {
      user.role = 'admin';
      needsSave = true;
    }

    if (needsSave) {
      await user.save();
    }

    res.json(issueToken(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
