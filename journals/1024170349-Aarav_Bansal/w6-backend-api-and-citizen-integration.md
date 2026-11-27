# Week 6: Building the Backend REST API and Integrating the Citizen Portal

## Objective

To implement the NagrikConnect backend REST API using Node.js, Express, TypeScript, and Prisma, and integrate the Citizen Portal end-to-end with persistent storage and media uploads.

## Relevant Context

Transitioning NagrikConnect from a static prototype into a full-stack application required building the server, database layer, authentication middleware, and API client (`api.ts`), and replacing mock citizen workflows with live API requests.

## Work Done

- Built the backend project in `code/backend/` (`package.json`, `tsconfig.json`, `.env.example`, `README.md`, and `src/index.ts`) with Express, CORS, static `/uploads` serving, health check (`/api/health`), and global error handling.
- Implemented `code/backend/prisma/schema.prisma` and `prisma/seed.ts` to populate departments (`PWD`, `Electrical`, `SWM`, `Water`), field workers, demo citizen/admin accounts, announcements, and sample complaints with timelines.
- Implemented JWT authentication and role guards (`src/middlewares/auth.ts`, `src/controllers/authController.ts`, `src/routes/authRoutes.ts`) using `bcryptjs` password hashing.
- Implemented `multer` media upload handling (`src/middlewares/upload.ts`) supporting image/video evidence uploads tied to `Attachment` records.
- Created `src/services/routingService.ts` for automated department recommendation, priority inference, SLA deadline calculation (`24h` Urgent, `48h` Medium, `72h` Low), and complaint ID generation (`GRV-YYYY-WXX-XXXX`).
- Built complaint, worker, analytics, and civic controllers/routes (`complaintController.ts`, `workerController.ts`, `analyticsController.ts`, `civicController.ts`).
- Created `code/frontend/src/api.ts` and updated `ComplaintContext.tsx`, `Login.tsx`, `CitizenPortal.tsx`, `ComplaintStep3.tsx`, `ComplaintsLog.tsx`, and `ComplaintTimelineModal.tsx` so citizens could log in, submit complaints with attachments, view live status timelines, and submit feedback.
- Documented local setup and demo credentials in the root `README.md` and `code/backend/README.md`.

## Key Observation

Wiring real multipart uploads (`FormData`), JWT bearer headers, and server-generated timeline events exposed edge cases in how frontend components hydrated initial state and handled async loading/error states.

## Solution and Improvements

- Centralised all HTTP requests, token storage, and error parsing inside `code/frontend/src/api.ts` so components stayed decoupled from `fetch` boilerplate.
- Verified end-to-end Citizen Portal flows against the live backend (`POST /api/auth/login`, `POST /api/complaints`, `GET /api/complaints`, `POST /api/complaints/:id/feedback`).

## Outcome

The backend REST API was operational and the Citizen Portal worked end-to-end with persistent database storage, real file uploads, automated department routing, and live timeline tracking.

## Plan for Next Week

Implement the citizen self-registration portal, profile and password management modals, and migrate the database from local SQLite to PostgreSQL/Supabase.
