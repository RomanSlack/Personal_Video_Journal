# Still

A minimalist personal video journal app. Upload videos from your phone and let AI automatically transcribe, title, and tag each entry based on its vibe.

## Features

- Upload vertical videos from your phone
- AI-powered transcription using OpenAI Whisper
- Automatic title, tags, and summary generation using Gemini 2.0 Flash
- Real-time processing progress with SSE
- Multiple view modes (card, grid, list) with month groupings
- Timeline scrubber for quick date navigation
- PWA support - install on your phone's home screen
- Clean, responsive UI for mobile and desktop
- Filter videos by AI-generated tags
- Simple password authentication

## Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS, TypeScript
- **Backend**: Python FastAPI, Docker
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **AI**: OpenAI Whisper (transcription), Gemini 2.0 Flash (title/tags/summary)

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
- **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your values:
# - APP_PASSWORD: Your chosen password
# - JWT_SECRET: Generate a random 32-character string
# - GEMINI_API_KEY: Your Gemini API key
# - OPENAI_API_KEY: Your OpenAI API key

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
gcloud run deploy still-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "APP_PASSWORD=xxx,JWT_SECRET=xxx,GEMINI_API_KEY=xxx,OPENAI_API_KEY=xxx"
```

### Frontend (Vercel)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Install as PWA

On your phone:
1. Open the app in Chrome/Safari
2. Tap the menu (⋮) or share button
3. Select "Add to Home Screen" or "Install App"
4. The app will now launch in full-screen mode

## Project Structure

```
Still/
├── frontend/           # Next.js app
│   ├── app/           # Pages (App Router)
│   ├── components/    # React components
│   ├── lib/           # Utilities (API, auth, Firebase)
│   └── public/        # Static assets & PWA manifest
├── backend/           # FastAPI service
│   ├── routers/       # API endpoints
│   ├── services/      # Business logic (transcription, AI)
│   └── models/        # Pydantic models
└── firebase/          # Firebase rules
```

## Usage

1. Visit the app and enter your password
2. Click "Upload" to add a new video
3. Watch real-time processing progress
4. Browse your entries with card, grid, or list view
5. Use the timeline scrubber to jump to specific months
6. Filter by AI-generated tags
7. Click any video to view with transcript and summary

## Local Development

Run backend and frontend in separate terminals:

```bash
# Terminal 1 - Backend
cd backend && source .venv/bin/activate && python main.py

# Terminal 2 - Frontend
cd frontend && npm run dev
```

The frontend runs on `http://localhost:3000` and the backend on `http://localhost:8000`.
