# 🏢 Spectral Buildings Management System

A full-stack web application for managing smart buildings with voice notes, comments, links, and images. Built for smart building engineers to collaborate and document building information efficiently.

## ✨ Features

- **🏗️ Building Management**: List and manage all onboarded buildings
- **📝 Multiple Note Types**: 
  - Text comments
  - Voice notes with transcription
  - Links to external resources
  - Image attachments
- **🎤 Voice Recording**: Record voice notes directly in the browser with optional transcription
- **👥 User Authentication**: Secure JWT-based authentication
- **🔐 Role-Based Access Control**:
  - **Admin**: Can add/edit/delete buildings
  - **Engineer**: Can view buildings and add notes
- **⏰ Timestamps**: All notes display when they were created
- **👤 User Attribution**: See who added each note

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client
- **date-fns** - Date formatting

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **JWT** - Authentication
- **Multer** - File uploads
- **bcryptjs** - Password hashing

### Voice Transcription
- Browser Web Speech API (basic)
- Ready for Whisper.js or OpenAI Whisper integration

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local or MongoDB Atlas)
- **npm** or **yarn**

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd spectral_buildings
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Backend
MONGODB_URI=mongodb://localhost:27017/spectral_buildings
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=5000

# Frontend API URL
VITE_API_URL=http://localhost:5000/api

# Google Login (optional)
# Use the OAuth 2.0 Web client ID from Google Cloud Console → Credentials
GOOGLE_CLIENT_ID=YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com
# Comma-separated allowlist of specific @spectral.energy accounts (lowercase)
ALLOWED_GOOGLE_EMAILS=nitant@spectral.energy,adam@spectral.energy,martijn@spectral.energy,norbert@spectral.energy
```

### 4. Start MongoDB

Make sure MongoDB is running:

```bash
# If using local MongoDB
mongod

# Or if using Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

### 5. Run the Application

#### Option 1: Run Both (Recommended)

```bash
npm run dev
```

This starts both backend (port 5000) and frontend (port 3000).

#### Option 2: Run Separately

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 6. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## 🌐 Deploying the frontend to Netlify

The repository includes a `netlify.toml` that points Netlify at the `frontend` workspace, runs the Vite build, and enables single-page-app routing.

1. **Create a new Netlify site from Git** and select this repository.
2. Netlify will auto-detect the settings from `netlify.toml`:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. In **Site Settings → Environment variables**, add `VITE_API_URL` pointing at your deployed backend (for example, `https://your-backend.example.com/api`).
4. Deploy. Netlify will install dependencies, build the Vite app, and publish the contents of `frontend/dist`.

## 👤 User Roles & Permissions

### Admin Role
- Add new buildings
- Edit building information
- Delete buildings (local admins only; Google-authenticated admins cannot delete buildings)
- Add all types of notes
- Delete notes

### Engineer Role
- View all buildings
- Add notes (text, voice, link, image)
- Delete their own notes

## 📱 Usage Guide

### 1. Register an Account

1. Navigate to http://localhost:3000
2. Click "Register"
3. Fill in your details
4. Choose role: **Admin** or **Engineer**
5. Click "Register"

### 2. Add a Building (Admin Only)

1. Login with an admin account
2. Click "Add Building" button
3. Enter building name, address, and description
4. Select status (Active/Inactive/Maintenance)
5. Click "Add Building"

### 3. Add Notes to a Building

1. Click on any building from the list
2. Click "Add Note" for text/link/image
3. Or click "🎤 Voice Note" to record audio

#### Adding Text Notes
- Select "Text" type
- Enter your note content
- Click "Add Note"

#### Adding Links
- Select "Link" type
- Enter a valid URL
- Click "Add Note"

#### Adding Images
- Select "Image" type
- Upload an image file
- Optionally add a description
- Click "Add Note"

#### Recording Voice Notes
1. Click "🎤 Voice Note"
2. Grant microphone permission
3. Click "Start Recording"
4. Speak your note
5. Click "Stop Recording"
6. (Optional) Click "Auto Transcribe" or manually add transcription
7. Click "Upload Voice Note"

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Buildings
- `GET /api/buildings` - Get all buildings
- `GET /api/buildings/:id` - Get single building
- `POST /api/buildings` - Create building (Admin only)
- `PUT /api/buildings/:id` - Update building (Admin only)
- `DELETE /api/buildings/:id` - Delete building (Admin only)

### Notes
- `GET /api/notes/building/:buildingId` - Get all notes for a building
- `POST /api/notes/text` - Create text note
- `POST /api/notes/link` - Create link note
- `POST /api/notes/voice` - Upload voice note
- `POST /api/notes/image` - Upload image note
- `DELETE /api/notes/:id` - Delete note

## 🎯 Future Enhancements

### Voice Transcription
Currently uses browser Web Speech API (limited). For production:

1. **Server-side Whisper** - Use OpenAI Whisper model on backend
2. **Whisper.js** - Client-side transcription with WebAssembly
3. **External API** - Integrate with services like AssemblyAI or Deepgram

Example Whisper integration:

```bash
# Backend
npm install @xenova/transformers

# In your backend route
const { pipeline } = require('@xenova/transformers');
const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
const result = await transcriber(audioBuffer);
```

### Additional Features
- [ ] Real-time notifications
- [ ] Email notifications for new notes
- [ ] File export (PDF reports)
- [ ] Search and filter buildings
- [ ] Advanced permissions (team-based)
- [ ] Audit logs
- [ ] Mobile app version

## 🌐 Backend-only VM deployment (Google Cloud quickstart)

If you want to stand up just the backend on a small Google Compute Engine VM and hit it directly by IP before adding a domain, follow `docs/backend-vm-deploy.md` for copy-paste commands. A domain + HTTPS can be added later without changing the backend setup.

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB
mongod --dbpath /path/to/data
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Microphone Permission Denied
- Ensure your browser has microphone permissions
- Use HTTPS in production (required for microphone access)
- Check browser console for detailed errors

## 📄 License

MIT License - feel free to use this project for your needs.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📧 Support

For issues or questions, please open a GitHub issue.

---

Built with ❤️ for Spectral Buildings Management
