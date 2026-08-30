# SchoolDeck — School Management SaaS

A multi-tenant school administration platform: a Next.js admin panel and a Vite
marketing site, backed by an Express + MongoDB API.

```
frontend/          Next.js 16 admin panel (React 19, Tailwind 4)
backend/           Express 5 API (MongoDB via Mongoose, JWT auth, RBAC)
showcase-website/  Vite marketing site + school registration (/school/register)
```

---

## Running locally

Two terminals. **Start the backend first** — the frontend calls it on boot.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # then edit .env (see below)
npm run dev                 # http://localhost:4000
```

Generate a real `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**`MONGODB_URI`** — leave it blank in development and the server starts a
throwaway in-memory MongoDB, so nothing has to be installed. That database is
rebuilt on every restart, so the dev server re-seeds itself automatically.

For data that survives restarts, use a free MongoDB Atlas cluster:

1. Create a cluster at <https://mongodb.com/atlas>
2. Database Access → add a user (note the password)
3. Network Access → allow your IP (or `0.0.0.0/0` while testing)
4. Connect → Drivers → copy the connection string
5. Put it in `.env` and append a database name:

```
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/schoolos
```

Restart the server, then seed the (empty) database once:

```bash
npm run seed
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev                 # http://localhost:3000
```

### Demo accounts

Every seeded account uses the password **`springdale123`**:

| Email | Role |
| --- | --- |
| `admin@springdale.edu` | school_admin |
| `principal@springdale.edu` | principal |
| `priya.sharma@springdale.edu` | teacher |
| `parent@springdale.edu` | parent |
| `aarav.sharma@springdale.edu` | student |
| `driver@springdale.edu` | driver |

---

## Deploying

**Backend** (Render, Railway, Fly, any Node host):

```bash
npm run build && npm start
```

Required environment variables:

| Variable | Notes |
| --- | --- |
| `MONGODB_URI` | **Required in production** — the server refuses to start without it, so an ephemeral database can never reach production by accident. |
| `JWT_SECRET` | Long random string. Changing it signs everyone out. |
| `CORS_ORIGINS` | Comma-separated. Must include the deployed frontend URL. |
| `NODE_ENV` | `production` |

**Frontend** (Vercel or any Next host): set `NEXT_PUBLIC_API_URL` to the
deployed API URL. Note this value is baked in at build time — changing it needs
a rebuild, not just a restart.

---

## What is real, and what is not

Being explicit so nothing here is mistaken for finished:

**Real and working**
- JWT authentication, password hashing, role-based access control
- Students, Teachers and Fees: full CRUD against MongoDB, tenant-scoped by
  `schoolId`, with server-side search, filtering and pagination
- SaaS onboarding: public registration (`/school/register`) → Super Admin
  approval → 7-day free trial + emailed credentials
- Subscription enforcement (server-authoritative): trial/paid expiry, a
  full-screen lock when access lapses, and Super Admin overrides (extend,
  activate free/paid, suspend/resume)
- Razorpay payments with server-side signature verification, and reminder
  emails (trial ending/expired, payment success, plan expiring)
- The admin panel: ~60 screens, dark mode, command palette, CSV export,
  printable ID cards / admit cards / report cards / fee receipts

**Not real yet**
- Attendance, exams and the other modules still run on in-memory mock data and
  reset on reload; only Students/Teachers/Fees are database-backed.
- "AI" features are transparent rule-based formulas, not a model.
- QR codes are drawn placeholders — they encode nothing and will not scan.
- No parent / student / teacher / driver apps yet. The backend has roles for
  them, which is the prerequisite, but the apps themselves are not built.
- No integrations beyond payments/email: WhatsApp, SMS and GPS are absent.
