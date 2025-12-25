const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const os = require('os');
const Note = require('../models/Note');
const auth = require('../middleware/auth');
const { pipeline } = require('@xenova/transformers');
const { WaveFile } = require('wavefile');

const router = express.Router();

const allowedFileTypes = /jpeg|jpg|png|gif|mp3|wav|webm|ogg|m4a/;
const audioOnlyTypes = /mp3|wav|webm|ogg|m4a/;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit for transcription
  fileFilter: (req, file, cb) => {
    const extname = audioOnlyTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = audioOnlyTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid audio file type'));
  }
});

let transcriberPromise = null;
const getTranscriber = async () => {
  if (!transcriberPromise) {
    transcriberPromise = pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
  }
  return transcriberPromise;
};

// Get all notes for a building
router.get('/building/:buildingId', auth, async (req, res) => {
  try {
    const notes = await Note.find({ building: req.params.buildingId })
      .populate('user', 'username email')
      .sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create text note
router.post('/text', [auth, [
  body('buildingId').notEmpty(),
  body('content').notEmpty()
]], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { buildingId, content } = req.body;

    const note = new Note({
      building: buildingId,
      user: req.user.userId,
      type: 'text',
      content
    });

    await note.save();
    await note.populate('user', 'username email');

    res.status(201).json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Transcribe voice note using Whisper (free, on-device)
router.post('/voice/transcribe', [auth, memoryUpload.single('audio')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file uploaded' });
    }

    // Read WAV file and extract audio data
    const wav = new WaveFile(req.file.buffer);
    
    // Convert to 16kHz mono if needed
    wav.toSampleRate(16000);
    wav.toMono();
    
    // Get the samples as Float32Array
    const samples = wav.getSamples(false, Float32Array);
    const audioData = samples[0] || samples;

    const transcriber = await getTranscriber();
    const result = await transcriber(audioData);
    const transcription = result?.text?.trim() || '';
    
    return res.json({ transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ message: 'Failed to transcribe audio' });
  }
});

// Create link note
router.post('/link', [auth, [
  body('buildingId').notEmpty(),
  body('content').isURL()
]], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { buildingId, content } = req.body;

    const note = new Note({
      building: buildingId,
      user: req.user.userId,
      type: 'link',
      content
    });

    await note.save();
    await note.populate('user', 'username email');

    res.status(201).json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload voice note
router.post('/voice', [auth, upload.single('audio')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file uploaded' });
    }

    const { buildingId, transcription, content } = req.body;

    const note = new Note({
      building: buildingId,
      user: req.user.userId,
      type: 'voice',
      content: (content && content.trim()) ? content.trim() : 'Voice note',
      transcription: transcription || '',
      fileUrl: `/uploads/${req.file.filename}`
    });

    await note.save();
    await note.populate('user', 'username email');

    res.status(201).json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload image
router.post('/image', [auth, upload.single('image')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const { buildingId, content } = req.body;

    const note = new Note({
      building: buildingId,
      user: req.user.userId,
      type: 'image',
      content: content || 'Image attachment',
      fileUrl: `/uploads/${req.file.filename}`
    });

    await note.save();
    await note.populate('user', 'username email');

    res.status(201).json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user owns the note
    if (note.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete associated file if exists
    if (note.fileUrl) {
      const filePath = path.join(__dirname, '..', note.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await note.deleteOne();
    res.json({ message: 'Note deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
