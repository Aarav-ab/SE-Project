# Week 7: Citizen Registration, Account Management, and PostgreSQL Migration

## Objective

To add full citizen registration and account settings management on both frontend and backend, improve the Citizen Portal UX, and migrate the database layer from SQLite to PostgreSQL (Supabase) with performance caching.

## Relevant Context

After establishing the core backend and Citizen Portal workflow in Week 6, users still relied on seeded demo accounts and a local SQLite database. Production readiness required self-service registration, structured user profiles, password changes, and a cloud-ready PostgreSQL database setup.

## Work Done

- Built the Citizen Registration Portal (`code/frontend/src/pages/Register.tsx`) and connected it to `POST /api/auth/register` with validation and automatic redirect/pre-fill into `Login.tsx`.
- Extended `User` in `prisma/schema.prisma` with structured address fields (`addressLine1`, `addressLine2`, `city`, `state`, `pincode`) and updated `authController.ts` and `authRoutes.ts` with `PATCH /api/auth/profile`, `POST /api/auth/change-password`, and `POST /api/auth/verify-password`.
- Created `EditProfileModal.tsx`, `ChangePasswordModal.tsx`, and `SettingsMenu.tsx` in `code/frontend/src/pages/`, integrating them into the portal headers and updating `ComplaintStep1..3.tsx`, `CitizenPortal.tsx`, and `ComplaintsLog.tsx`.
- Migrated `code/backend/prisma/schema.prisma` from SQLite to the `postgresql` provider (`DATABASE_URL` and `DIRECT_URL` with `pg` driver) and created migration utilities: `prisma/export-sqlite.ts`, `prisma/import-to-pg.ts`, `prisma/check-supabase.js`, and `prisma/sqlite_backup.json`.
- Added an in-memory TTL cache utility (`code/backend/src/config/cache.ts`) with operational cache invalidation (`complaints:`, `workers:`, `analytics:`) to speed up repeated dashboard and analytics reads.
- Refined `routingService.ts` so explicit citizen category selections are honoured ahead of keyword fallback (preventing road/street names in addresses from overriding selected categories) and updated `ComplaintTimelineModal.tsx` and `vite.config.ts`.

## Key Observation

During routing tests, street names such as "Nabha Road" in complaint titles or addresses caused naive keyword matching to misclassify non-road complaints as `Pothole / Road`. Additionally, migrating from SQLite to PostgreSQL required careful ordering of table exports and imports to satisfy foreign-key constraints.

## Solution and Improvements

- Updated `recommendDepartment()` in `routingService.ts` to check `CATEGORY_ROUTING[normalizedCategory]` first with 0.98 confidence before falling back to description/title keyword inference.
- Wrote `import-to-pg.ts` to clear and import tables in dependency-safe order (`Ward` -> `Department` -> `FieldWorker` -> `User` -> `Complaint` -> `Attachment` -> `TimelineEvent` -> `Feedback` -> `Announcement`).

## Outcome

Citizens could register new accounts, edit profile details, and change passwords securely, while the backend ran on PostgreSQL/Supabase with TTL caching and refined automated complaint routing.

## Plan for Next Week

Connect the Admin/Department Portal, Field Workers management, Analytics dashboard, and Civic Schedule management to the live backend and resolve remaining cross-portal bugs.
