const express = require('express');
const { body, validationResult } = require('express-validator');
const Link = require('../models/Link');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all links for a channel
router.get('/channel/:channel', auth, async (req, res) => {
  try {
    const { channel } = req.params;
    const links = await Link.find({ channel }).populate('user', 'username');
    res.json(links);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new link to a channel
router.post('/', [
  auth,
  body('channel').isIn(['general', 'onboarding', 'duty', 'mapping']).withMessage('Invalid channel'),
  body('title').isString().isLength({ min: 1, max: 40 }),
  body('url').isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { channel, title, url } = req.body;
    const link = new Link({
      channel,
      title,
      url,
      user: req.user.userId
    });
    await link.save();
    await link.populate('user', 'username');
    res.status(201).json(link);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
