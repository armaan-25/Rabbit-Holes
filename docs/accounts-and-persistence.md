# Accounts and persistence setup

Rabbit Holes now support two backend modes:

- Local dev mode: no `DATABASE_URL`, no auth secret, uses one in-memory `dev-user`.
- Persistent account mode: `DATABASE_URL` + `SUPABASE_JWT_SECRET`, stores user-scoped sessions/events/rabbit holes in Postgres.

## 1. Create Supabase project

Create a Supabase project and copy:

- Project database connection string
- JWT secret

## 2. Run schema

Open Supabase SQL Editor and run:

```sql
-- backend/sql/001_accounts_sessions.sql
```

Paste the contents of that file and execute it.

## 3. Configure backend env

In `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
SUPABASE_JWT_SECRET=<supabase-jwt-secret>
WEB_ORIGIN=http://localhost:3000
ANTHROPIC_API_KEY=<anthropic-key>
```

## 4. What is persisted

The backend persists:

- `app_users`: Supabase user id/email
- `sessions`: one recording session per capture run
- `events`: visits, searches, tab opens/closes, titles
- `rabbit_holes`: generated cluster results

## 5. Current behavior

Existing endpoints are now user-scoped:

- `GET /me`
- `POST /sessions`
- `POST /events`
- `POST /cluster`
- `GET /signals`
- `POST /clear`

Without `SUPABASE_JWT_SECRET`, requests use `dev-user`.
With `SUPABASE_JWT_SECRET`, requests must include:

```http
Authorization: Bearer <supabase-access-token>
```

## 6. Next step

Add Supabase Auth to the Next app, then teach the Chrome extension to get/store the Supabase access token and send it in API requests.
