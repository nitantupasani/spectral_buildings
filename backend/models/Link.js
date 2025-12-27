const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
  channel: {
    type: String,
    enum: ['general', 'onboarding', 'duty', 'mapping'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 40
  },
  url: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Link', linkSchema);
