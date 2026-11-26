# NagrikConnect setup

## Requirements

- Node.js 18 or newer
- PostgreSQL 13 or newer
- A Google OAuth web client (for Google sign-in)

## Start the API

1. Create a PostgreSQL database, for example `nagrikconnect`.
2. In `code/backend`, copy `.env.example` to `.env` and set `DATABASE_URL` and a randomly generated `JWT_SECRET` (at least 32 characters). Keep `.env` private.
3. Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Register the exact `GOOGLE_CALLBACK_URL` as an authorized redirect URI in Google Cloud; by default it is `http://localhost:3001/api/auth/google/callback`.
4. Run `npm install` and `npm run dev`. The API creates its tables and adds missing profile columns on startup without deleting existing user data. The startup schema also adds the `field_workers` and `complaint_assignments` tables and their active-assignment indexes; no worker or assignment records are seeded.

## Start the web app

In another terminal, run `npm install` and `npm run dev` in `code/frontend`. Vite proxies `/api` requests to `http://localhost:3001`; override this with `API_PROXY_TARGET` if needed.

## Administrator access

Public registration and Google sign-in always create citizen accounts. Promote an account to administrator only through a trusted PostgreSQL connection after registration:

```sql
UPDATE users SET role = 'admin' WHERE email = LOWER('officer@example.com');
```

Sign out and back in after changing roles. Complaint listing and status/feedback updates require the administrator role; citizens can access only their own complaints and evidence files.

## Persistence and security

- Passwords are stored as bcrypt hashes. Authentication uses a signed, HTTP-only, SameSite=Lax cookie; the JWT secret must remain private.
- Complaints, status/feedback changes, and evidence file contents are stored in PostgreSQL. Evidence is limited to five JPG/PNG/MP4 files, up to 25 MB each.
- Administrators manage persistent workers with `GET/POST /api/workers` and `PATCH /api/workers/:id`. Dispatch uses `POST /api/complaints/:complaintId/assign`; `PATCH /api/assignments/:id` completes or releases an active assignment, and `GET /api/assignments` returns assignment history (optionally filtered by `complaintId`). These endpoints require an authenticated administrator. Dispatch, complaint status, and status history are updated in one transaction. Partial unique indexes prevent multiple active assignments per worker or complaint. Worker availability is derived from active assignments and duty status.
- Administrator analytics are served by `GET /api/analytics?period=today|7d|30d|custom`; custom ranges require `Asia/Kolkata` calendar dates in `from=YYYY-MM-DD&to=YYYY-MM-DD`. Complaint analytics use creation time for range selection, locality counts use normalized complaint addresses, and reporting hours are grouped in IST. Resolution durations use the resolved status history when available. No SLA target or citizen rating storage is configured, so those metrics are reported as unavailable rather than estimated.
- Authenticated profile endpoints are `GET /api/profile`, `PATCH /api/profile`, and `POST /api/profile/complete`; profile updates are scoped to the signed-in user. New accounts are directed to complete required personal and residential details. Complaint creation checks profile completeness in the API, while existing complaints remain available and retain their submitted addresses.
- The citizen dashboard location is loaded from the signed-in user's profile. New complaint forms use that residential address as an editable starting point; the location map does not assume a default geographic coordinate.
- Google sign-in uses `GET /api/auth/google` and `GET /api/auth/google/callback`, requests only `openid email profile`, validates a short-lived CSRF state cookie, and verifies the ID token on the server. New Google accounts are citizens and are sent to profile completion when required. An existing email/password account is not silently linked to Google; sign in with that account instead.
- Set `NODE_ENV=production` behind HTTPS so session cookies are marked Secure. Set `PGSSL=true` when the database provider requires verified TLS.
- Set `FRONTEND_URL` to the exact public web-app origin. Use HTTPS URLs in production, including the Google callback URL.
