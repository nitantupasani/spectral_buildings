// Load environment variables from .env.local first (for secrets like API keys) and fall back to .env
require('./config/env');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes = require('./routes/auth');
const buildingRoutes = require('./routes/buildings');

const noteRoutes = require('./routes/notes');
const linksRoutes = require('./routes/links');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['Content-Range', 'Content-Length', 'Accept-Ranges']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Spectral Buildings API',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register'
      },
      buildings: {
        getAll: 'GET /api/buildings',
        getOne: 'GET /api/buildings/:id',
        create: 'POST /api/buildings (Admin)',
        update: 'PUT /api/buildings/:id (Admin)',
        delete: 'DELETE /api/buildings/:id (Admin)'
      },
      notes: {
        getByBuilding: 'GET /api/notes/building/:buildingId',
        createText: 'POST /api/notes/text',
        createLink: 'POST /api/notes/link',
        transcribeVoice: 'POST /api/notes/voice/transcribe',
        createVoice: 'POST /api/notes/voice',
        createImage: 'POST /api/notes/image',
        delete: 'DELETE /api/notes/:id'
      }
    },
    frontend: 'http://localhost:3000',
    status: 'running'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/links', linksRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spectral_buildings')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
