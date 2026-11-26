# NagrikConnect setup

## Requirements

- Node.js 18 or newer
- PostgreSQL 13 or newer
- A Google OAuth web client (for Google sign-in)

## Start the API

1. Create a PostgreSQL database, for example `nagrikconnect`.
2. In `code/backend`, copy `.env.example` to `.env` and set `DATABASE_URL` and a randomly generated `JWT_SECRET` (at least 32 characters). Keep `.env` private.
3. Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Register the exact `GOOGLE_CALLBACK_URL` as an authorized redirect URI in Google Cloud; by default it is `http://localhost:3001/api/auth/google/callback`.
4. Run `npm install` and `npm run dev`. The API creates its tables on startup.

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
- Set `NODE_ENV=production` behind HTTPS so session cookies are marked Secure. Set `PGSSL=true` when the database provider requires verified TLS.
- Set `FRONTEND_URL` to the exact public web-app origin. Use HTTPS URLs in production, including the Google callback URL.
