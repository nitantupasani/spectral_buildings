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
  description: {
    type: String
  },
  attachments: [{
    filename: String,
    originalName: String,
    fileUrl: String,
    mimeType: String
  }],
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  editedAt: {
    type: Date
  },
  editHistory: [{
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    editedAt: {
      type: Date,
      default: Date.now
    },
    changes: String,
    previousValues: {
      content: String,
      description: String,
      transcription: String,
      attachments: [{
        filename: String,
        originalName: String,
        fileUrl: String,
        mimeType: String
      }]
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Note', noteSchema);
