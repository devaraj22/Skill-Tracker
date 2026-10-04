# SkillTrack: Student Skill & Placement Management System

A full-stack app where **students** track skills, certificates, projects, achievements, learning goals and placement-preparation results, and publish an optional public portfolio, and **college administrators** manage accounts, verify certificates and view aggregate analytics.

* **Frontend:** React 18, TypeScript (strict), Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form + Zod, Recharts, Lucide.
* **Backend:** Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, PostgreSQL, JWT in HttpOnly cookies, bcrypt.
* No cloud services or paid APIs.

```
student-skill-tracker/
  backend/   FastAPI app (app/), Alembic (alembic/), tests (tests/)
  frontend/  React app (src/)
  docs/      API.md, DATABASE.md
```

## Prerequisites

* Python 3.12+, Node.js 20+ (22 tested), PostgreSQL 14+ (16 recommended).

## Windows PowerShell setup

### 1. Database

```powershell
psql -U postgres
```
```sql
CREATE ROLE skilltrack WITH LOGIN PASSWORD 'choose-a-strong-password';
CREATE DATABASE skilltrack OWNER skilltrack;
\q
```

### 2. Backend

```powershell
cd student-skill-tracker\backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1        # if blocked: Set-ExecutionPolicy -Scope Process Bypass
pip install -r requirements.txt
Copy-Item .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(48))"   # paste into SECRET_KEY in .env
notepad .env                         # set DATABASE_URL password and SECRET_KEY
alembic upgrade head                 # create tables
```

**Create the first administrator** (public registration can only create students). The password is prompted, so it never lands in your shell history:

```powershell
python scripts/create_admin.py --email admin@yourcollege.edu
```

Use that email and password on the normal **Sign in** page. Administrator accounts cannot be created from the public registration form. Passwords must be 10-72 UTF-8 bytes and contain at least one letter and one number. If an admin email already exists, choose a different email or remove/update that account directly through your normal database administration process.

The existing equivalent command remains available:

```powershell
python -m app.cli create-admin --email admin@yourcollege.edu
```

**Reset a forgotten password** (the old password cannot be recovered because only its bcrypt hash is stored):

```powershell
python -m app.cli reset-password --email roughcodee@gmail.com
```

Enter and confirm the new password when prompted, then sign in again. This also revokes any existing sessions for that account.

**Optional, development only:** fictional sample students (refuses to run when `APP_ENV=production`):

```powershell
python -m app.cli seed-dev           # students: demo.student1@example.com ... password printed by the command
```

Start the API (docs at http://localhost:8000/docs):

```powershell
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend (second terminal)

```powershell
cd student-skill-tracker\frontend
npm install
Copy-Item .env.example .env
npm run dev                          # http://localhost:5173
```

The dev server proxies `/api` to the backend, so the browser sees one origin and cookies/CSRF work without extra setup.

## Tests

```powershell
cd backend;  .\.venv\Scripts\Activate.ps1;  python -m pytest -q     # isolated in-memory SQLite
cd ..\frontend; npm test
```

To run the backend suite against PostgreSQL, create an empty database whose name contains `test` (the suite drops/recreates its tables, and refuses other names):

```powershell
$env:TEST_DATABASE_URL = "postgresql+psycopg://skilltrack:PASSWORD@localhost:5432/skilltrack_test"
python -m pytest -q
```

## Production build

```powershell
cd frontend; npm run build           # outputs frontend/dist (type-checks first)
```

Serve `dist/` and proxy `/api` to the backend **from the same origin** (see Security notes). Set `APP_ENV=production` so cookies get the `Secure` flag, use HTTPS, and run e.g. `uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2` behind the reverse proxy.

## Security notes

* Passwords: bcrypt (max 72 bytes, enforced). Roles are read from the database on each request; registration cannot create admins.
* Sessions: JWT in an **HttpOnly** cookie (`Secure` in production, `SameSite=Lax`). Writes require a matching `X-CSRF-Token` header (double-submit cookie). Logout bumps a per-user `token_version`, revoking existing tokens; deactivating an account does the same.
* No credentials in `localStorage`; the frontend never stores student data locally.
* Other users' records return **404** (not 403) so ids cannot be probed. Admin endpoints return 401/403 as appropriate.
* Certificate files: stored outside any static directory under server-generated names, validated by extension, declared MIME type, magic bytes and size (5 MB), downloaded only through authenticated endpoints.
* Public portfolio is built from an allow-list (`schemas/portfolio.py`); email, register number, unpublished items, unverified certificates and review notes cannot be serialised.
* CSV export neutralises formula injection and excludes emails.
* **Same-origin deployment is required** for the cookie+CSRF design. Hosting the API on a different site would need `COOKIE_SAMESITE=none`, HTTPS and a reviewed CORS/CSRF setup.

## Common errors

| Symptom | Fix |
|---|---|
| `SECRET_KEY must be set to at least 32 characters` | Generate one (command above) and put it in `backend/.env`. |
| `could not connect to server` / `password authentication failed` | Check `DATABASE_URL`, that PostgreSQL is running, and the role password. |
| `relation "users" does not exist` | Run `alembic upgrade head`. |
| PowerShell blocks `Activate.ps1` | `Set-ExecutionPolicy -Scope Process Bypass`, then activate again. |
| Browser shows CORS/401 errors | Use the Vite proxy (default `VITE_API_BASE_URL=/api/v1`) and keep `CORS_ORIGINS` in sync if you change ports. |
| `403 CSRF validation failed` | You are calling the API outside the app without the `X-CSRF-Token` header (copy it from the `csrf_token` cookie). |
| Port already in use | `uvicorn ... --port 8001` and set `VITE_DEV_API_TARGET=http://localhost:8001`. |

## Known limitations

* No login rate limiting, email verification or password reset. Add these before a real deployment.
* Avatar, project cover image, resume and achievement evidence are **links**, not uploads. Only certificate evidence is a managed upload.
* Registering with an existing email returns a clear 409, which reveals that the address is registered.
* Public portfolio responses are cacheable for 60 s, so unpublishing can take up to a minute to reach shared caches.
* The UI is covered by jsdom component tests, not by automated real-browser/E2E tests or an accessibility audit tool.
* Single JS bundle (~780 kB, 223 kB gzipped); route-level code splitting would reduce it.
