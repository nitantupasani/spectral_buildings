const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'voice', 'link', 'image'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  transcription: {
    type: String
  },
  fileUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Note', noteSchema);
