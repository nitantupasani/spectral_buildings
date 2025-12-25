const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const os = require('os');
const Note = require('../models/Note');
const auth = require('../middleware/auth');
const { openaiApiKey } = require('../config/env');

const router = express.Router();

const allowedFileTypes = /jpeg|jpg|png|gif|mp3|wav|webm|ogg|m4a|pdf|doc|docx|xls|xlsx|csv|ppt|pptx|txt/;
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

const getRequestHelpers = async () => {
  let FormDataCtor = globalThis.FormData;
  let fetchFn = globalThis.fetch;

  if (!FormDataCtor || !fetchFn) {
    // Lazy-load undici only when needed to avoid experimental warnings
    let undici;
    try {
      undici = require('undici');
    } catch (err) {
      const error = new Error('Transcription requires fetch and FormData (Node 18+ globals or undici package)');
      error.statusCode = 503;
      throw error;
    }
    FormDataCtor = FormDataCtor || undici.FormData;
    fetchFn = fetchFn || undici.fetch;
  }

  return { FormData: FormDataCtor, fetch: fetchFn };
};

const transcribeWithOpenAI = async (buffer, filename, mimetype) => {
  if (!openaiApiKey) {
    const error = new Error('OpenAI API key is not configured');
    error.statusCode = 503;
    throw error;
  }

  const { FormData, fetch } = await getRequestHelpers();

  const formData = new FormData();
  
  // Use Blob instead of File to avoid experimental API warning
  const blob = new Blob([buffer], { type: mimetype || 'audio/webm' });
  formData.append('file', blob, filename || 'audio.webm');
  formData.append('model', 'whisper-1');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiApiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`OpenAI transcription failed: ${errorText}`);
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  return data?.text?.trim() || '';
};

// Get all notes for a building
router.get('/building/:buildingId', auth, async (req, res) => {
  try {
    const notes = await Note.find({ building: req.params.buildingId })
      .populate('user', 'username email')
      .populate('editedBy', 'username')
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

// Transcribe voice note using OpenAI Whisper API
router.post('/voice/transcribe', [auth, memoryUpload.single('audio')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file uploaded' });
    }

    const transcription = await transcribeWithOpenAI(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    return res.json({ transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    const status = error.statusCode || 500;
    const message = error.message || 'Failed to transcribe audio';
    res.status(status).json({ message });
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

// Upload voice note with optional attachments
router.post('/voice', [auth, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'attachments', maxCount: 10 }
])], async (req, res) => {
  try {
    if (!req.files || !req.files.audio || !req.files.audio[0]) {
      return res.status(400).json({ message: 'No audio file uploaded' });
    }

    const { buildingId, transcription, description } = req.body;
    const audioFile = req.files.audio[0];
    const attachmentFiles = req.files.attachments || [];

    // Prepare attachments array
    const attachments = attachmentFiles.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      mimeType: file.mimetype
    }));

    let finalTranscription = transcription || '';

    // Auto-transcribe if none provided
    if (!finalTranscription && audioFile) {
      try {
        const audioPath = path.join(uploadsDir, audioFile.filename);
        const buffer = fs.readFileSync(audioPath);
        finalTranscription = await transcribeWithOpenAI(
          buffer,
          audioFile.originalname || audioFile.filename,
          audioFile.mimetype
        );
      } catch (transcribeErr) {
        console.error('Voice upload transcription error:', transcribeErr);
      }
    }

    // Create voice note with attachments
    const note = new Note({
      building: buildingId,
      user: req.user.userId,
      type: 'voice',
      content: finalTranscription || 'Voice note',
      transcription: finalTranscription || '',
      description: description || '',
      fileUrl: `/uploads/${audioFile.filename}`,
      attachments: attachments
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

// Update a note
router.put('/:id', auth, upload.fields([
  { name: 'attachments', maxCount: 10 },
  { name: 'audio', maxCount: 5 }
]), async (req, res) => {
  try {
    const { content, description, transcription, removeAttachments } = req.body;
    const note = await Note.findById(req.params.id).populate('user', 'username');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Store previous values for revision history
    const previousValues = {
      content: note.content,
      description: note.description,
      transcription: note.transcription,
      attachments: [...(note.attachments || [])]
    };

    // Track what changed
    let changes = [];
    
    if (content && content !== note.content) {
      changes.push('content');
      note.content = content;
    }
    if (description !== undefined && description !== note.description) {
      changes.push('description');
      note.description = description;
    }
    if (transcription !== undefined && transcription !== note.transcription) {
      changes.push('transcription');
      note.transcription = transcription;
    }

    // Handle attachment removals
    if (removeAttachments) {
      const toRemove = JSON.parse(removeAttachments);
      if (toRemove.length > 0) {
        changes.push('removed attachments');
        // Remove files from disk
        toRemove.forEach(filename => {
          const filePath = path.join(__dirname, '../uploads', filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
        // Remove from array
        note.attachments = note.attachments.filter(att => !toRemove.includes(att.filename));
      }
    }

    // Handle new attachments
    if (req.files) {
      const newAttachments = [];
      
      // Handle regular attachments
      if (req.files.attachments) {
        req.files.attachments.forEach(file => {
          newAttachments.push({
            filename: file.filename,
            originalName: file.originalname,
            fileUrl: `/uploads/${file.filename}`,
            mimeType: file.mimetype
          });
        });
      }

      // Handle audio files
      if (req.files.audio) {
        req.files.audio.forEach(file => {
          newAttachments.push({
            filename: file.filename,
            originalName: file.originalname,
            fileUrl: `/uploads/${file.filename}`,
            mimeType: file.mimetype
          });
        });
      }

      if (newAttachments.length > 0) {
        changes.push('added attachments');
        note.attachments = [...(note.attachments || []), ...newAttachments];
      }
    }

    if (changes.length > 0) {
      // Add to edit history with previous values
      note.editHistory.push({
        editedBy: req.user.userId,
        editedAt: new Date(),
        changes: changes.join(', '),
        previousValues
      });

      // Update top-level edit tracking
      note.editedBy = req.user.userId;
      note.editedAt = new Date();

      await note.save();
      
      // Populate editedBy for response
      await note.populate('editedBy', 'username');
    }

    res.json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get revision history for a note
router.get('/:id/history', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('editHistory.editedBy', 'username')
      .select('editHistory');
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(note.editHistory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
