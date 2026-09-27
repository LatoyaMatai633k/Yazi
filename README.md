# Yazi Dev — Know your code. Build with confidence.

**Yazi Dev** is an AI-powered developer assistant that helps you understand unfamiliar codebases and work on them with confidence.

Built with **Google Gemini** for the IBM Bob 2.0 Hackathon.

---

## What Yazi Dev Does

The core developer workflow:

```
Connect Repository → Understand Repository → Investigate Problem → Test → Check Deployment Readiness
```

Yazi Dev helps developers answer:

- What does this repository do?
- How is the project structured?
- Where is the important business logic?
- What does this file/function do?
- Where could this bug be coming from?
- What tests should I run?
- What areas are currently untested?
- Is this project ready for deployment?

---

## Architecture

```
React + Vite (TypeScript)
         ↓
Flask REST API (Python)
         ↓
Yazi AI Service (abstraction layer)
         ↓
Google Gemini API
         ↓
Structured AI Response

GitHub API  →  Repository Service
PostgreSQL  →  Application Data
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, TypeScript |
| Backend | Python, Flask |
| Database | PostgreSQL |
| AI | Google Gemini |
| Repository | GitHub REST API |
| Deployment | Render |

---

## Google Gemini Integration

Yazi Dev uses Google Gemini as its AI platform. All AI analysis is performed using the `google-generativeai` Python SDK. Credentials are always server-side and never exposed to the frontend.

The model is configurable via `GEMINI_MODEL_ID`. Suitable models include:

- `gemini-1.5-flash` (default — fast and cost-effective)
- `gemini-1.5-pro` (higher capability)
- `gemini-2.0-flash`

Set `GEMINI_MODEL_ID` in your environment to switch models.

---

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL
- Google Gemini API key ([get one free at Google AI Studio](https://aistudio.google.com/app/apikey))

### 1. Clone the repository

```bash
git clone https://github.com/your-username/yazi-dev
cd yazi-dev
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL_ID=gemini-1.5-flash

DATABASE_URL=postgresql://user:password@localhost:5432/yazidev
FLASK_ENV=development
FLASK_SECRET_KEY=a-random-secret-key
CORS_ORIGINS=http://localhost:5173
GITHUB_TOKEN=your_github_token
```

### 3. Database setup

```bash
# Create the database
createdb yazidev

# Tables are created automatically on first run
python run.py
```

### 4. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

The frontend proxy is configured in `vite.config.ts` to forward `/api` calls to `http://localhost:5000`.

### 5. Run locally

**Backend** (from `backend/`):

```bash
python run.py
```

**Frontend** (from `frontend/`):

```bash
npm run dev
```

Open `http://localhost:5173`.

---

## Environment Variables

### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL_ID` | Gemini model ID (default: `gemini-1.5-flash`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `FLASK_SECRET_KEY` | Flask session secret |
| `FLASK_ENV` | `development` or `production` |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |
| `GITHUB_TOKEN` | GitHub personal access token (optional, increases rate limits) |

### How to get a Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API key**
4. Copy the key into your `.env` as `GEMINI_API_KEY`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check + AI status |
| `GET` | `/api/repositories` | List connected repositories |
| `POST` | `/api/repositories` | Connect a repository |
| `DELETE` | `/api/repositories/:id` | Remove a repository |
| `POST` | `/api/repositories/analyze` | Run AI repository analysis |
| `POST` | `/api/debug` | Run AI debug analysis |
| `POST` | `/api/testing/analyze` | Run AI testing analysis |
| `POST` | `/api/deployment/check` | Run AI deployment readiness check |

---

## Deployment (Render)

This project ships with a `render.yaml` Blueprint — import the repo on Render and it auto-configures both services and the database.

### Backend

- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn run:app`
- Set `GEMINI_API_KEY` in the Render environment dashboard (marked `sync: false`)
- `GEMINI_MODEL_ID` defaults to `gemini-1.5-flash` (override if needed)
- `DATABASE_URL` is injected automatically from the linked PostgreSQL instance

### Frontend

- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- Set `VITE_API_BASE_URL` to your deployed backend URL

---

## Features

- **Repository Analysis** — AI-powered architecture, stack, and file analysis
- **Debugging** — Error diagnosis with probable cause and fix suggestions
- **Testing** — Gap analysis, suggested test cases, and edge cases
- **Deployment Readiness** — Configuration, security, and production checks
- **Light & Dark Mode** — Persisted theme preference
- **Responsive Design** — Mobile, tablet, and desktop

---

## IBM Bob Development

This project was built using **IBM Bob 2.0** as the primary development assistant.

Bob was used for:

- Project scaffolding and structure
- Backend Flask implementation
- Frontend React/TypeScript implementation
- Google Gemini integration
- Database modeling
- GitHub service implementation
- Error handling and security review
- Documentation

---

## Limitations

- Repository analysis is based on file structure, README, and config files — not full code parsing
- AI responses are generated inferences, not guaranteed facts
- Large repositories may hit context limits
- GitHub rate limiting applies without a token

## Future Improvements

- GitLab support
- Direct file/function analysis with code reading
- Session history and saved analyses
- Team collaboration features
- CI/CD pipeline integration
