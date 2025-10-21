# Security Review Report

Date: 2025-10-18
Scope: MSacadmy full-stack application (Backend/Frontend)

## Summary
This report summarizes identified security risks, fixes applied during this session, and prioritized recommendations. The app uses Express + Supabase (service role for server), and Vite + React on the frontend.

## High-Risk Findings (Fix ASAP)

1) Sensitive logging of authentication data
- Files: Backend/src/server.js, Backend/src/middleware/auth.js
- Issue: Debug logs print request headers and token substrings. Risk of token leakage.
- Status: Not yet removed.
- Action: Remove or gate logs by NODE_ENV. Never log Authorization or token content.

2) Admin endpoints must consistently enforce admin auth
- Files: Backend/src/controllers/Admin.controller.js, Backend/src/routes/Admin.routes.js
- Issue: Some admin endpoints lacked explicit admin checks.
- Status: Hardened. Admin checks added to uploadCourseContent, deleteCourseContent, getCourseContents.
- Action: Consider a shared requireAdmin middleware for all admin routes.

3) File uploads hardening
- Files: Backend/src/controllers/Admin.controller.js
- Issue: Unrestricted file types and filenames.
- Status: Hardened. Added multer limits (200MB), MIME allowlist, and filename sanitization for storage writes.
- Action: If possible, verify file signatures (magic bytes) and consider AV scanning for PDFs.

4) Progress upsert failures (500)
- Files: Backend/src/controllers/Progress.controller.js, Backend/src/controllers/Quiz.controller.js
- Issue: Upserts lacked onConflict target for composite unique key.
- Status: Fixed by specifying `{ onConflict: 'user_id,content_id' }`.

5) Error detail leakage
- Files: Multiple
- Issue: Some endpoints return raw error messages.
- Status: Partial. Error details gated in places, but audit all controllers.
- Action: Return generic messages to clients and log detailed errors server-side only.

## Medium-Risk / Best Practices

6) CORS tightening
- Files: Backend/src/server.js
- Status: Dev origin set to http://localhost:5173. For prod, set exact origins and assess if credentials are needed.

7) Rate limiting
- Targets: Auth endpoints, payments submit, comments create, quiz submit.
- Status: Not implemented.
- Action: Add express-rate-limit per route group; optionally Redis store for distributed environments.

8) Input validation
- Targets: Course create/edit, content upload, payment submit, comments.
- Status: Minimal validation.
- Action: Add schema validation (zod/yup/joi). Enforce size/length limits and safe character sets.

9) Storage bucket policies
- Status: Some buckets are public for delivery.
- Action: Review which objects must be public. Keep sensitive files private and serve via signed URLs.

10) Content authorization
- Status: Learner content fetch checks enrollment (good). Ensure all content metadata endpoints remain gated by enrollment or admin.

11) Quiz security
- Status: GET returns questions without answers (good). Submit normalizes answers via JSON comparison.
- Action: Normalize answer arrays (order-insensitive), trim inputs; store attempt history.

## Fixes Applied in This Review

- Backend
  - Admin.controller.js
    - Added multer limits and MIME allowlist.
    - Sanitized uploaded filenames and enforced admin auth for content ops.
    - Added quiz JSON handling for course contents.
  - Progress.controller.js
    - Upsert uses onConflict for composite key.
  - Quiz.controller.js
    - Added quiz endpoints (get, submit) and onConflict for progress upsert.
  - server.js
    - Mounted quiz routes.

- Frontend
  - DailymotionPlayer.jsx
    - Hardened URL parsing and graceful fallback to prevent crashes.
  - Admincourseuplaod.jsx + QuizBuilder.jsx
    - Visual quiz builder (no JSON required in UI); integrated into content upload.
  - CourseContent.jsx + QuizView.jsx
    - Renders quizzes, collects answers, submits for scoring, marks completion on pass.

## Recommended Next Steps (Priority Order)

1) Remove sensitive logs
- Remove header/token logs in server.js and auth.js. Mask any remaining auth info.

2) Add rate limits
- Use express-rate-limit on: /api/auth/v1/content/*/comments (POST), /api/payments/* (POST), /api/auth/v1/content/*/quiz (POST), admin routes (list/approve payments).

3) Add schema validation
- Introduce zod schemas for create/edit course, upload content, payment submission, comments. Return 400 on invalid input.

4) Tighten CORS
- In production, set `origin` to your exact domain(s). Disable credentials unless needed.

5) Error handling policy
- Standardize error responses: `{ message: '...' }`. Hide internals unless NODE_ENV=development.

6) Quiz robustness
- Normalize multi-answer comparisons (sort arrays) and trim strings.
- Track attempts (count, timestamps) for analytics and abuse detection.

7) Storage review
- Confirm which buckets require public access. Use signed URLs for private materials.

8) Deployment security
- Ensure Supabase service role key is only on backend and never shipped in client.
- Rotate keys if any accidental exposure occurred in logs.

## Appendix: Quick Code Pointers

- Admin content upload (auth enforced; file limits and quiz support)
  - `Backend/src/controllers/Admin.controller.js`: uploadCourseContent/deleteCourseContent/getCourseContents
- Progress updates fixed
  - `Backend/src/controllers/Progress.controller.js`: onConflict added
  - `Backend/src/controllers/Quiz.controller.js`: onConflict added
- Logging to remove/gate
  - `Backend/src/server.js` debug middleware
  - `Backend/src/middleware/auth.js` token/header logs
- Frontend quiz and player
  - `Frontend/src/components/QuizBuilder.jsx`, `Frontend/src/components/QuizView.jsx`
  - `Frontend/src/components/DailymotionPlayer.jsx`
  - `Frontend/src/pages/Admincourseuplaod.jsx`, `Frontend/src/pages/CourseContent.jsx`

---
Prepared by: Security review assistant
