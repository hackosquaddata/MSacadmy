# Project Hosting Handoff: MSacadmy

This document gives your hosting provider everything needed to deploy, size, and operate the MSacadmy web application.

## Overview
- App type: Full-stack web application
- Frontend: React (Vite) — static site
- Backend: Node.js (Express, ESM) + Supabase (Postgres + Auth + Storage)
- Video delivery: Dailymotion embeds (streaming bandwidth is offloaded)
- AuthN/Z: Supabase Auth; admin flag stored in `users.is_admin`
- Payments: Manual UPI flow with admin approval (no online gateway)
- Support: Built-in ticketing with threaded comments
- Quizzes: JSON-backed MCQs stored as course content

## Architecture
- Client (SPA) served from a static host (Vercel/Netlify/Cloudflare Pages or any CDN)
- API server (Express) runs separately (Render/Railway/Fly/VM)
- Database: Supabase (managed Postgres) + service-role key used only on the backend
- Object storage: Supabase Buckets (for course content uploads if used)

Logical flow:
- Browser → Frontend (CDN) → Backend API (Express) → Supabase (DB/Storage/Auth)
- Browser ↔ Dailymotion CDN for video playback

## Repository & Structure
- Root: `MSacadmy/`
  - `Frontend/` — Vite + React app (static)
  - `Backend/` — Express API (Node ESM)

## Environment Variables
### Backend (set on server; do not expose to frontend)
- SUPABASE_URL: Supabase instance URL
- SUPABASE_ANON_KEY: Public anon key (safe on server)
- SUPABASE_SERVICE_ROLE_KEY: Service role key (server only, never exposed)
- MANUAL_UPI: UPI ID displayed to payers
- MANUAL_UPI_QR: Optional QR image URL
- NODE_ENV: production
- PORT: 3000 (or host provided)

Optional:
- CORS_ORIGIN: Frontend origin to allow (e.g., https://app.example.com)

### Frontend (set at build time on static host)
- VITE_API_URL: Backend API base URL (e.g., https://api.example.com)

## Networking & CORS
- Backend listens on `PORT` (default 3000)
- CORS: In `Backend/src/server.js`, set `origin` to the exact production frontend domain(s)
- HTTPS recommended for both frontend and backend

## Build & Run
### Backend (Node ≥ 18 recommended; Node 22 supported)
- Run inside `Backend/`:
  - Install: `npm install`
  - Dev: `npm run dev`
  - Prod: `npm start` (uses `node -r dotenv/config src/server.js`)
- Notes:
  - Backend uses ESM imports
  - Dependency `express-rate-limit` is required (installed via `npm install`)

### Frontend
- Run inside `Frontend/`:
  - Install: `npm install`
  - Build: `npm run build` → outputs `dist/`
  - Preview: `npm run preview`
  - Deploy: upload `dist/` to CDN/static host

## Health & Monitoring
- Health check: `GET /` on the backend returns 200 with a simple message
- Logs: Console logs; sensitive tokens/headers are not logged in production
- Recommended: host-level log collection and alerting on 5xx spikes and high latency

## Security & Hardening (current)
- No sensitive token/header logging in production
- Input sanitization on payments and support/comments
- Rate limits on sensitive POST routes (payments, progress, quiz)
- Admin authorization checks for admin routes
- Error responses avoid leaking internal details

Recommended next (optional):
- Add schema validation (zod/joi) for all request bodies
- Tighten CORS to production origin(s)
- Review storage bucket policies (public vs signed URLs)

## Expected Traffic & Sizing
- Concurrency: ~30–40 simultaneous learners
- Backend load: low–moderate (auth/profile/support/manual payment submissions)
- Video bandwidth: handled by Dailymotion (not the backend)
- Suggested backend instance (free tiers typically OK):
  - 1 shared vCPU, 512–1024 MB RAM
  - Expect cold starts on free plans

## Data & Storage
- Database: Supabase Postgres
- Key tables (non-exhaustive):
  - `users` (id, email, full_name, is_admin)
  - `courses` (id, title, price, thumbnail, status)
  - `course_contents` (id, course_id, type: video|file|quiz, metadata JSON)
  - `enrollments` (id, user_id, course_id, status)
  - `manual_payments` (id, user_id, course_id, amount, transaction_id, receipt_email, status, processed_by, processed_at)
  - `course_progress` (user_id, content_id, status) — upserts with `onConflict`
  - `support_tickets` (id, user_id, name, email, type, message, status)
  - `support_ticket_comments` (id, ticket_id, author_id, author_is_admin, message)

- Migrations to apply:
  - `Backend/src/db/migrations/course_progress.sql`
  - `Backend/src/db/migrations/support_tickets.sql`
  - `Backend/src/db/migrations/support_ticket_comments.sql`

- Storage: Supabase Buckets if needed; videos are embedded from Dailymotion

## API (high-level)
- Base: `${VITE_API_URL}` → Backend
- Auth: `/api/auth/v1/*`
- Courses: `/api/courses/*`
- Admin: `/api/admin/*`
- Payments: `/api/payments/*` (manual payments)
- Progress & Quiz: `/api/auth/v1/*`
- Support: `/api/support/*` (tickets + comments), admin: `/api/support/admin/*`

## Frontend Routes
- User: `/dashboard`, `/courses/:id`, `/courses/:id/learn`, `/my-learning`, `/profile`, `/checkout/:courseId`, `/payment/success`, `/support`
- Auth: `/login`, `/signup`, `/forgot-password`, `/reset-password`
- Admin: `/admin/dashboard`, `/admin/create-course`, `/admin/course/:id/content`, `/admin/course/:id/upload`, `/admin/course/:id/edit`, `/admin/manual-payments`, `/admin/help`

## Deployment Options
- Frontend (static): Vercel/Netlify/Cloudflare Pages — set `VITE_API_URL`
- Backend: Render/Railway/Fly/VM — `npm install`, `npm start`, set env vars, configure CORS origin

## Backups & DR
- DB: Supabase automated backups (per plan)
- Storage: Supabase Storage (S3-backed); consider lifecycle rules
- Secrets: Host-managed secrets; do not commit `.env` to VCS

## SLA & Alerts
- Free tiers may cold-start or throttle
- Monitor: 5xx rates, latency, rate-limit hits
- Health probe: `GET /` should return 200

## Notes for Hosting Provider
- Backend uses ESM modules; run on Node ≥ 18.17 (Node 22 OK)
- Install dependencies separately in `Frontend/` and `Backend/`
- Dailymotion offloads video bandwidth
- Use HTTPS, set strict CORS, and consider HSTS at the edge

If more details are needed (domains, WAF, CDN policies), we will add them once the target platform is chosen.
