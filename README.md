# Yazi Dev — Know your code. Build with confidence.

**Yazi Dev** is an AI-powered developer assistant that helps you understand unfamiliar codebases and work on them with confidence.

> Connect a repository. Understand its architecture. Debug errors. Identify test gaps. Check deployment readiness.

---

## What Yazi Dev Does

```
Connect Repository → Understand Repository → Investigate Problem → Test → Check Deployment Readiness
```

Yazi Dev helps developers answer:

- What does this repository do?
- How is the project structured?
- Where is the important business logic?
- Where could this bug be coming from?
- What tests should I run?
- What areas are currently untested?
- Is this project ready for deployment?

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript |
| Backend | Netlify Functions (Node.js) |
| AI | OpenRouter API (OpenAI models) |
| Repository | GitHub REST API |
| Hosting | Netlify |

---

## Project Structure

```
yazi-dev/
├── frontend/                  # React + Vite application
│   ├── src/
│   │   ├── components/        # Sidebar, Topbar
│   │   ├── hooks/             # useTheme
│   │   ├── pages/             # Dashboard, RepositoryAnalysis, Debugging, Testing, DeploymentReadiness
│   │   ├── services/          # api.ts — all API calls
│   │   └── styles/            # globals.css — design system (cream/burgundy theme)
│   ├── vite.config.ts
│   └── package.json
├── netlify/
│   └── functions/             # Netlify serverless functions
│       ├── lib/
│       │   ├── github.js      # GitHub REST API service
│       │   ├── openai.js      # OpenAI API service + prompt builders
│       │   └── helpers.js     # CORS headers, JSON response helpers
│       ├── health.js                  # GET /api/health
│       ├── repositories-connect.js   # POST /api/repositories
│       ├── repositories-analyze.js   # POST /api/repositories/analyze
│       ├── debug.js                   # POST /api/debug
│       ├── testing-analyze.js         # POST /api/testing/analyze
│       └── deployment-check.js        # POST /api/deployment/check
├── backend/                   # Legacy Python/Flask backend (kept for reference)
├── netlify.toml               # Netlify build + function routing configuration
├── .env.example               # Environment variable documentation
└── README.md
```

---

## Prerequisites

- **Node.js 18+** — for local development
- **Netlify CLI** — for running functions locally (`npm install -g netlify-cli`)
- **OpenRouter API key** — [get one at openrouter.ai/keys](https://openrouter.ai/keys)
- **GitHub Personal Access Token** — optional but recommended for higher rate limits

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/your-username/yazi-dev
cd yazi-dev
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
GITHUB_TOKEN=your_github_personal_access_token_here
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
```

### 4. Run locally with Netlify Dev

From the **project root**:

```bash
netlify dev
```

This starts:
- Netlify Functions on `http://localhost:8888`
- The Vite dev server (proxied through Netlify Dev)

Open `http://localhost:8888` in your browser.

> **Without Netlify CLI:** You can run `npm run dev` from `frontend/` but API calls will not work unless you have a separately running function server.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | ✅ Required | Your OpenRouter API key. Get one at [openrouter.ai/keys](https://openrouter.ai/keys) |
| `OPENROUTER_MODEL` | Optional | Model to use via OpenRouter. Default: `openai/gpt-4o-mini`. Format: `provider/model`. See [openrouter.ai/models](https://openrouter.ai/models) |
| `GITHUB_TOKEN` | Recommended | GitHub personal access token. Without it, GitHub API rate limits apply (60 req/hr). With it: 5,000 req/hr. Required scope: `public_repo` for public repos, `repo` for private repos. |

### Getting an OpenRouter API key

1. Go to [openrouter.ai](https://openrouter.ai) and create an account
2. Navigate to [openrouter.ai/keys](https://openrouter.ai/keys)
3. Click **Create Key**
4. Copy the key into your `.env` as `OPENROUTER_API_KEY`

### Getting a GitHub Personal Access Token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Select scope: `public_repo` (for public repos) or `repo` (for private repos)
4. Copy the token into your `.env` as `GITHUB_TOKEN`

---

## API Endpoints

All endpoints are Netlify Functions accessed via `/api/` (redirects configured in `netlify.toml`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check + AI provider status |
| `POST` | `/api/repositories` | Validate and connect a GitHub repository |
| `POST` | `/api/repositories/analyze` | Run AI repository analysis |
| `POST` | `/api/debug` | Run AI debug analysis on an error |
| `POST` | `/api/testing/analyze` | Run AI testing gap analysis |
| `POST` | `/api/deployment/check` | Run AI deployment readiness check |

---

## Deploying to Netlify

### Option A: Deploy via Netlify CLI

```bash
# Authenticate
netlify login

# Link to a new or existing site
netlify init

# Build and deploy
netlify deploy --prod
```

### Option B: Deploy via Netlify Dashboard

1. Push your repository to GitHub.
2. Log in to [app.netlify.com](https://app.netlify.com) and click **Add new site → Import an existing project**.
3. Connect your GitHub repository.
4. Netlify auto-detects `netlify.toml`. Build settings are pre-configured:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
5. Go to **Site configuration → Environment variables** and add:
   - `OPENROUTER_API_KEY` — your OpenRouter key
   - `OPENROUTER_MODEL` — e.g. `openai/gpt-4o-mini`
   - `GITHUB_TOKEN` — your GitHub token
6. Click **Deploy site**.

---

## Features

- **Repository Analysis** — AI-powered architecture, stack, and file analysis via GitHub + OpenRouter
- **Debugging** — Error diagnosis with probable cause and fix suggestions
- **Testing** — Gap analysis, suggested test cases, edge cases
- **Deployment Readiness** — Configuration, security, and production checks
- **Light & Dark Mode** — Persisted theme preference
- **Responsive Design** — Mobile, tablet, and desktop layouts

---

## Known Limitations

- Repository analysis is based on file structure, README, and config files — not full code parsing
- AI responses are generated inferences, not guaranteed facts
- Large repositories may hit GitHub API context limits (tree capped at 300 files)
- GitHub API rate limiting applies without a GITHUB_TOKEN (60 requests/hour)
- Netlify Functions are stateless — there is no persistent repository or session history between page loads. All analysis results are held in React component state for the current session only.

---

## Removed Integrations

The following services have been removed from the original codebase:

| Removed | Replaced With |
|---------|--------------|
| Google Gemini API | OpenRouter API (OpenAI models) |
| IBM watsonx.ai (WatsonX branding) | OpenRouter |
| Direct OpenAI API calls (`api.openai.com`) | OpenRouter (`openrouter.ai/api/v1`) |
| Python Flask backend | Netlify Functions (Node.js) |
| PostgreSQL / SQLAlchemy | Stateless serverless (no DB required) |
| Render deployment (`render.yaml`) | Netlify (`netlify.toml`) |
| Supabase (not used, removed) | N/A |

---

## Built With IBM Bob

This project was built and modernised using **IBM Bob** as the primary development assistant.
