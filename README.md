# Personal Video Journal

A minimalist platform to store, transcribe, and tag personal video journals. Uses AI to automatically generate titles and tags based on the vibe of each entry.

## Features

- Upload vertical videos from your phone
- AI-powered transcription using Google Speech-to-Text (Chirp model)
- Automatic title and tag generation using Gemini Flash
- Clean, responsive UI for mobile and desktop
- Filter videos by AI-generated tags
- Simple password authentication

## Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS, TypeScript
- **Backend**: Python FastAPI, Cloud Run (scales to zero)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **AI**: Google Speech-to-Text, Gemini Flash

## Setup

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Firestore Database (Start in production mode)
4. Enable Storage
5. Go to Project Settings > Service Accounts > Generate new private key
6. Save the JSON file as `backend/service-account.json`
7. Go to Project Settings > General > Your apps > Add web app
8. Copy the Firebase config values

### 2. Get API Keys

- **Gemini API Key**: Get from [Google AI Studio](https://aistudio.google.com/apikey)

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your values:
# - APP_PASSWORD: Your chosen password
# - JWT_SECRET: Generate a random 32-character string
# - GEMINI_API_KEY: Your Gemini API key

# Run locally
python main.py
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your Firebase config values

# Run locally
npm run dev
```

## Deployment

### Backend (Cloud Run)

```bash
cd backend

# Deploy to Cloud Run
gcloud run deploy video-journal-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "APP_PASSWORD=your-password,JWT_SECRET=your-secret,GEMINI_API_KEY=your-key"
```

### Frontend (Vercel)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Project Structure

```
Personal_Video_Journal/
├── frontend/           # Next.js app
│   ├── app/           # Pages (App Router)
│   ├── components/    # React components
│   └── lib/           # Utilities (API, auth, Firebase)
├── backend/           # FastAPI service
│   ├── routers/       # API endpoints
│   ├── services/      # Business logic
│   └── models/        # Pydantic models
└── firebase/          # Firebase rules
```

## Usage

1. Visit the app and enter your password
2. Click "Upload" to add a new video
3. Wait for AI processing (transcription + tagging)
4. Browse and filter your journal entries by tag
5. Click any video to view with full transcript

## Local Development

Run backend and frontend in separate terminals:

```bash
# Terminal 1 - Backend
cd backend && python main.py

# Terminal 2 - Frontend
cd frontend && npm run dev
```

The frontend runs on `http://localhost:3000` and the backend on `http://localhost:8000`.
