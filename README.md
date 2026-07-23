# SkillSwap Platform

A full-stack peer-learning platform where developers exchange skills through 1-on-1 sessions, real-time chat, and AI-powered mentorship tools.

## Tech Stack

- **Frontend:** React 19 + Vite + React Router + Socket.IO Client
- **Backend:** Express + Node.js + Socket.IO + MongoDB (Mongoose)
- **AI:** Google Gemini API (Mentor, Roadmap, Resume Analyzer)

## Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)
- Google Gemini API key

## Quick Start

### 1. Clone

```bash
git clone <your-repo-url>
cd skill-swap-platform
```

### 2. Backend

```bash
cd Backend
cp .env.example .env
# Edit .env and fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm install
npm run dev
```

Backend runs on `http://localhost:3000`.

### 3. Frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Environment Variables

See `Backend/.env.example` for required variables.

| Variable | Description |
|----------|-------------|
| `PORT` | Backend port (default: 3000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `FRONTEND_URL` | Frontend origin for CORS |
| `GEMINI_API_KEY` | Google AI API key |
| `GEMINI_MODEL` | Model name (default: gemini-flash-latest) |

## Features

- User authentication (register/login/logout)
- Search users by skills
- Send/accept connection requests
- Real-time chat with Socket.IO
- Typing indicators and online status
- Schedule 1-on-1 skill swap sessions
- AI Mentor (chat-based guidance)
- AI Roadmap Generator
- Resume Analyzer (ATS optimization)
- Notifications

## Deployment

Recommended stack:
- **Frontend:** Vercel / Netlify
- **Backend:** Render / Railway
- **Database:** MongoDB Atlas

Set `FRONTEND_URL` in your production backend environment to your deployed frontend domain.
