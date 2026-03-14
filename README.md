# Habitual — Habit Tracker

A full-stack habit tracking application built with Node.js, Express, Drizzle ORM, and React.

---

## Project Structure

```
api-design-node-v5/
├── src/                  # Express API (backend)
│   ├── controllers/
│   ├── db/
│   ├── middleware/
│   ├── routes/
│   └── utils/
├── client/               # React app (frontend)
│   └── src/
├── drizzle.config.ts
└── package.json
```

---

## Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a connection string to a hosted instance)

---

## Getting Started

### 1. Install dependencies

**Backend:**
```bash
npm install
```

**Frontend:**
```bash
npm install --prefix client
```

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Required variables:

```env
DATABASE_URL=postgres://user:password@localhost:5432/habitual
JWT_SECRET=your_super_secret_key_here
PORT=3000
```

### 3. Set up the database

Push the schema to your database:

```bash
npm run db:push
```

Optionally seed with sample data:

```bash
npm run db:seed
```

### 4. Run in development

You'll need two terminals — one for the API and one for the frontend dev server.

**Terminal 1 — API:**
```bash
npm run dev
```
Runs on `http://localhost:3000`

**Terminal 2 — Frontend:**
```bash
npm run dev --prefix client
```
Runs on `http://localhost:5173`

The Vite dev server proxies all `/api` requests to `http://localhost:3000`, so no CORS issues.

---

## Available Scripts

### Backend

| Script | Description |
|---|---|
| `npm run dev` | Start API with hot reload (nodemon) |
| `npm run start` | Start API in production mode |
| `npm run db:push` | Push schema changes to the database |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Drizzle Studio (DB GUI) |
| `npm run db:seed` | Seed the database with sample data |
| `npm test` | Run tests |

### Frontend

| Script | Description |
|---|---|
| `npm run dev --prefix client` | Start Vite dev server with HMR |
| `npm run build --prefix client` | Production build |
| `npm run preview --prefix client` | Preview the production build |

---

## API Overview

Base URL: `http://localhost:3000/api`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Register a new user |
| `POST` | `/auth/login` | No | Login and receive a JWT |
| `GET` | `/habits` | Yes | Get all habits for the current user |
| `POST` | `/habits` | Yes | Create a new habit |
| `GET` | `/habits/:id` | Yes | Get a single habit with recent entries |
| `PATCH` | `/habits/:id` | Yes | Update a habit |
| `DELETE` | `/habits/:id` | Yes | Delete a habit |
| `POST` | `/habits/:id/complete` | Yes | Log a completion for today |
| `GET` | `/habits/:id/stats` | Yes | Get streak and completion stats |

See [API_DOCS.md](./API_DOCS.md) for full request/response examples.

---

## Tech Stack

### Backend
- **Runtime:** Node.js with TypeScript (`tsx`)
- **Framework:** Express 5
- **Database:** PostgreSQL via `pg`
- **ORM:** Drizzle ORM
- **Auth:** JWT via `jose` + bcrypt for password hashing
- **Validation:** Zod
- **Testing:** Vitest + Supertest

### Frontend
- **Framework:** React 18 + TypeScript
- **Build tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **Data fetching:** TanStack Query (React Query)
- **HTTP client:** Axios
- **Icons:** Lucide React
- **Toasts:** React Hot Toast