# Meeting Summarizer

An AI-powered meeting notes summarizer and sharer.

## Tech Stack
- Node.js + Express
- Multer for file uploads
- Groq SDK (optional) for AI summarization
- Nodemailer (SMTP) for email sending

## Local Setup
1. Copy env file:
   cp .env.example .env
2. Fill in SMTP credentials. Optionally set GROQ_API_KEY to enable real AI summaries.
3. Install deps:
   npm ci
4. Start server:
   npm start
5. Open http://localhost:3000

## Environment Variables
See `.env.example` for all variables.

## Deployment
- Docker: build and run
  docker build -t meeting-summarizer .
  docker run -p 3000:3000 --env-file .env meeting-summarizer

- Render: push this repo to GitHub and use `render.yaml` as Blueprint. Configure env vars in dashboard.

## API
- POST /generate-summary: multipart form with `transcript` (.txt) and `prompt`
- POST /share-summary: JSON { summary, recipient }
- GET /healthz: health check