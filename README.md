# Habitual — Habit Tracker

A full-stack habit tracking app. Build streaks, log completions, and visualize your consistency over time.

---

## Stack

**Server** — Node.js · Express 5 · TypeScript · Drizzle ORM · PostgreSQL · JWT · Zod · Vitest

**Client** — React 18 · TypeScript · Vite · Tailwind CSS · TanStack Query · Axios · React Router v6

---

## Project Structure

```
habit-tracker/
├── server/                  # Express REST API
│   ├── src/
│   │   ├── controllers/     # Route handlers (auth, habits)
│   │   ├── db/              # Drizzle schema, connection, seed
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── routes/          # Express routers
│   │   └── utils/           # JWT helpers, password hashing
│   ├── drizzle.config.ts
│   └── package.json
│
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # HabitCard, HabitFormModal, HabitStatsModal, Sidebar
│   │   ├── context/         # AuthContext
│   │   ├── lib/             # Axios client, utility functions
│   │   ├── pages/           # LoginPage, RegisterPage, DashboardPage
│   │   └── types/           # Shared TypeScript interfaces
│   ├── vite.config.ts
│   └── package.json
│
└── README.md
```

---

## Prerequisites

- Node.js 18+
- PostgreSQL (local or hosted)

---

## Setup

### 1. Install dependencies

```bash
# Server
cd server && npm install

# Client
cd client && npm install
```

### 2. Configure environment

Create a `.env` file inside `server/`:

```env
DATABASE_URL=postgres://user:password@localhost:5432/habitual
JWT_SECRET=your_super_secret_key_here
PORT=3000
```

### 3. Set up the database

From inside the `server/` directory:

```bash
# Push the schema to your database
npm run db:push

# (Optional) Seed with sample data
npm run db:seed
```

### 4. Start the development servers

You'll need two terminals.

**Terminal 1 — API** (from `server/`):
```bash
npm run dev
```
Runs on `http://localhost:3000`

**Terminal 2 — Client** (from `client/`):
```bash
npm run dev
```
Runs on `http://localhost:5173`

The Vite dev server proxies all `/api/*` requests to `localhost:3000`, so no CORS configuration is needed during development.

---

## Scripts

### Server (`server/`)

| Script | Description |
|---|---|
| `npm run dev` | Start API with hot reload |
| `npm run start` | Start API in production mode |
| `npm run db:push` | Push schema changes to the database |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:studio` | Open Drizzle Studio (visual DB explorer) |
| `npm run db:seed` | Seed the database with sample data |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

### Client (`client/`)

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |

---

## API Reference

Base URL: `http://localhost:3000/api`

All protected routes require an `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Register a new user |
| `POST` | `/auth/login` | — | Log in and receive a JWT |

### Habits

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/habits` | ✓ | List all habits for the current user |
| `POST` | `/habits` | ✓ | Create a new habit |
| `GET` | `/habits/:id` | ✓ | Get a single habit with recent entries |
| `PATCH` | `/habits/:id` | ✓ | Update a habit |
| `DELETE` | `/habits/:id` | ✓ | Delete a habit and all its history |
| `POST` | `/habits/:id/complete` | ✓ | Log a completion entry for today |
| `GET` | `/habits/:id/stats` | ✓ | Get streaks and completion statistics |

See [`server/API_DOCS.md`](./server/API_DOCS.md) for full request/response examples.

---

## Deployment

The client uses a relative base URL (`/api`) by default, which means it sends API requests to whatever origin is serving it. How that resolves depends on how you deploy.

### Option A — Same origin (recommended)

Serve the built client from Express. Both the app and the API live on a single host (e.g. `https://yourapp.com`). Relative `/api` URLs resolve correctly with no extra config.

```bash
# 1. Build the client
cd client && npm run build

# 2. Run the server in production mode
cd ../server && NODE_ENV=production npm start
```

When `NODE_ENV=production`, Express automatically serves `client/dist` as static files and falls back to `index.html` for all non-API routes so React Router keeps working.

---

### Option B — Split deployment

Deploy the client and server to separate hosts (e.g. client on Vercel/Netlify, API on Railway/Render/Fly.io).

**1. Set `VITE_API_URL` before building the client**

Create `client/.env.production`:

```env
VITE_API_URL=https://your-api.example.com/api
```

Or pass it inline:

```bash
VITE_API_URL=https://your-api.example.com/api npm run build
```

The client bakes this URL in at build time. All API requests go to that absolute URL instead of the relative `/api` path.

**2. Set `CLIENT_ORIGIN` on the server**

To restrict CORS to your deployed client's domain, set this on the server:

```env
CLIENT_ORIGIN=https://your-client.example.com
```

Leave it unset to allow all origins (fine for local dev, be more careful in production).

---

### Environment variable reference

#### `server/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret used to sign JWT tokens — keep this long and random |
| `PORT` | No | Port the API listens on (default: `3000`) |
| `NODE_ENV` | No | Set to `production` to enable static file serving |
| `CLIENT_ORIGIN` | No | Allowed CORS origin for split deployments |

#### `client/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | Absolute API base URL for split deployments. Omit for same-origin. |