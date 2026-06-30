# PersonaForge

> **AI-powered UX analysis platform** — Simulate how real user personas experience your product, powered by GPT-4o, Playwright crawling, and a focus-group AI discussion engine.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Database Setup & Migrations](#database-setup--migrations)
- [Testing Guide](#testing-guide)
  - [1. Auth & Onboarding](#1-auth--onboarding)
  - [2. Dashboard — Overview](#2-dashboard--overview)
  - [3. New Analysis — Wizard](#3-new-analysis--wizard)
  - [4. Analysis Detail — Live Results](#4-analysis-detail--live-results)
  - [5. Persona Management](#5-persona-management)
  - [6. Admin Dashboard](#6-admin-dashboard)
  - [7. Theme Toggle](#7-theme-toggle)
  - [8. Mobile Responsiveness](#8-mobile-responsiveness)
  - [9. API Endpoint Smoke Tests (curl)](#9-api-endpoint-smoke-tests-curl)
- [API Reference](#api-reference)
- [Dashboard UI Architecture](#dashboard-ui-architecture)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

PersonaForge crawls any URL with Playwright, then runs GPT-4o through a configurable set of user personas (age, occupation, tech-level, goals, frustrations). Each persona produces:

- **Sentiment** (Positive / Neutral / Negative)
- **Friction Score** (0–100)
- **First Impressions**, Pain Points, Positives, Recommendations
- **Adoption Likelihood** (%)

Finally, all personas join a simulated **Focus Group** that surfaces consensus, conflicts, and a unified product recommendation. Results are stored in PostgreSQL via Prisma and surfaced through a Next.js 15 App Router dashboard.

---

## Tech Stack

| Layer      | Technology                                 |
| ---------- | ------------------------------------------ |
| Framework  | Next.js 15 (App Router, Server Components) |
| Auth       | Clerk                                      |
| Database   | PostgreSQL + Prisma ORM                    |
| AI         | OpenAI GPT-4o                              |
| Crawler    | Playwright (headless Chromium)             |
| Styling    | Tailwind CSS v4, CSS custom properties     |
| Animations | Motion (Framer Motion v12)                 |
| Icons      | Lucide React                               |
| Hosting    | Vercel (recommended)                       |

---

## Project Structure

```
personaforge/
├── app/
│   ├── (auth)/               # Clerk sign-in / sign-up pages
│   ├── (dashboard)/
│   │   ├── dashboard/        # User dashboard (overview, analyses, personas, new-analysis)
│   │   └── admin/            # Admin panel (users, analyses, personas)
│   └── api/                  # Route handlers
│       ├── analyses/
│       ├── personas/
│       ├── webhooks/
│       └── admin/
├── components/
│   ├── dashboard/            # All reusable dashboard components
│   └── shared/               # ThemeToggle, etc.
├── lib/
│   ├── auth.ts               # requireAuth helper
│   ├── db.ts                 # Prisma client singleton
│   └── openai.ts             # OpenAI client
├── prisma/
│   ├── schema.prisma
│   └── seed.ts               # Prebuilt persona seed
└── public/
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/personaforge"

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# OpenAI
OPENAI_API_KEY=sk-...

# App URL (used for admin API self-calls)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Clerk Webhook Secret (for user sync)
CLERK_WEBHOOK_SECRET=whsec_...
```

> **Never commit `.env.local` to version control.**

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- PostgreSQL 14+ running locally or a connection string to a hosted DB (Neon, Supabase, Railway)
- Playwright Chromium binary

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/rahulkpr2510/personaforge.git
cd personaforge

# 2. Install dependencies
pnpm install

# 3. Install Playwright browser
pnpm exec playwright install chromium

# 4. Copy and fill environment variables
cp .env.example .env.local
# → Edit .env.local with your values

# 5. Push the Prisma schema to your DB
pnpm prisma db push

# 6. Seed prebuilt personas
pnpm prisma db seed

# 7. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Setup & Migrations

```bash
# Generate Prisma client after schema changes
pnpm prisma generate

# Create a new migration
pnpm prisma migrate dev --name <migration_name>

# Apply migrations in production
pnpm prisma migrate deploy

# Open Prisma Studio (GUI)
pnpm prisma studio

# Reset the DB (development only — DESTRUCTIVE)
pnpm prisma migrate reset
```

---

## Testing Guide

Follow these steps sequentially after completing local setup. Each section covers a specific flow with exact steps and what to verify.

---

### 1. Auth & Onboarding

**Goal:** Confirm Clerk sign-up creates a `User` row in the database via webhook.

1. Visit `http://localhost:3000`.
2. Click **Sign Up** — create an account with email + password (or Google OAuth).
3. After redirect to `/dashboard`, open Prisma Studio (`pnpm prisma studio`).
4. Open the **User** table — confirm a row exists with your email.
5. Check `role` is `USER` and `analysesUsed` is `0`.
6. Sign out, sign back in — confirm redirect to `/dashboard/overview`.

**Expected:** No errors, user row present, role = `USER`.

---

### 2. Dashboard — Overview

**Goal:** Verify stat cards, empty states, and navigation render correctly.

1. Sign in and land on `/dashboard`.
2. Verify **three stat cards** render: Total Analyses (0), Completed (0), Custom Personas (0).
3. Verify the **"No analyses yet"** empty state is visible with the "Start your first analysis" CTA.
4. Click the logo — confirm it links to `/dashboard`.
5. Click each sidebar item (Analyses, Personas, New Analysis) — confirm navigation works.
6. On mobile (resize to 375px width): confirm the **sidebar is hidden** and a **top header with hamburger** appears.
7. Tap the hamburger — confirm a slide-in drawer opens. Tap a nav item — confirm it closes and navigates.

**Expected:** All elements visible, mobile nav fully functional.

---

### 3. New Analysis — Wizard

**Goal:** Confirm the 3-step wizard submits to `POST /api/analyses` and redirects to the analysis detail page.

#### Step 1 — URL & Device

1. Navigate to `/dashboard/new-analysis`.
2. Observe the **progress indicator** at the top (Step 1 of 3 active).
3. Leave URL blank — click **Continue** — confirm the button is **disabled** (no URL entered).
4. Enter a valid URL: `https://vercel.com`.
5. Select **Mobile** device type.
6. Click **Continue**.

#### Step 2 — Personas

1. Confirm the prebuilt persona library cards are visible.
2. Click one persona card — confirm it gets a teal border + ring (selected state).
3. Click it again — confirm deselection.
4. Select **2–3 personas**.
5. Try selecting a 6th persona — confirm the selection is capped at 5.
6. Click **Continue**.

#### Step 3 — Review & Submit

1. Confirm the review panel shows your URL, device type, and persona count.
2. Click **Start Analysis**.
3. Confirm a loading state appears on the button ("Starting…").
4. Confirm redirect to `/dashboard/analyses/<id>`.

**Expected:** Analysis record created, status = `PENDING` → transitions to `CRAWLING`.

---

### 4. Analysis Detail — Live Results

**Goal:** Verify status polling, data display, and all result sections render when complete.

1. On the analysis detail page `/dashboard/analyses/<id>`, observe the **StatusBadge** showing `Crawling` with a pulsing dot.
2. Refresh the page every 30 seconds — watch status transition: `CRAWLING` → `ANALYZING` → `COMPLETED`.
3. Once `COMPLETED`, verify:
   - **Summary strip** shows device type, pages crawled, personas evaluated, start date.
   - **Overall Results** card shows Sentiment badge + animated Friction Score bar (bar should animate in from 0 on load).
   - **Persona Evaluations** section renders one card per persona with: sentiment badge, adoption %, first impressions, positives (green box), pain points (red box), recommendations (teal box).
   - **Focus Group Insight** card (teal border) shows the group summary.
   - **Crawled Pages** table shows each URL with depth, form count, and friction bar.
4. If status = `FAILED`, verify the red error card appears with the error message.

**Expected:** All sections render, friction bars animate on mount, no layout breakage.

---

### 5. Persona Management

**Goal:** Verify CRUD for custom personas.

#### Create

1. Navigate to `/dashboard/personas`.
2. Confirm prebuilt personas are shown under **Persona Library**.
3. Click **Create Persona** (top-right button).
4. In the modal:
   - Enter: Name = `Priya Sharma`, Age = `28`, Occupation = `Product Manager`.
   - Select **Medium** technical level.
   - Fill Goals and Frustrations text areas.
   - Add two tags by typing a word and pressing Enter.
   - Click **Save Persona**.
5. Confirm the modal closes and the new persona card appears under **Your Custom Personas**.

#### Validate Limits

1. Try creating a persona with an empty name — confirm Save is disabled / validation fires.
2. Add 11 tags — confirm the 11th is rejected.

#### Delete

1. Hover over the custom persona card — confirm **Edit** and **Delete** buttons fade in.
2. Click **Delete** — confirm a browser `confirm()` dialog appears.
3. Confirm — verify the card is removed immediately from the UI.

#### Prebuilt Persona Protection

1. Hover over a **Library** persona — confirm no Delete button appears.

**Expected:** Full create-delete flow works, prebuilt personas are immutable.

---

### 6. Admin Dashboard

**Goal:** Verify admin-only access, stats, user role management, and paginated analyses.

#### Access Control

1. With a normal `USER` role, navigate directly to `http://localhost:3000/admin`.
2. Confirm you are **redirected to `/dashboard`** (403 guard).

#### Promote to Admin (via Prisma Studio)

1. Open `pnpm prisma studio` → **User** table.
2. Find your user row, change `role` from `USER` to `ADMIN`, click Save.
3. Sign out and sign back in (Clerk session refresh).
4. Navigate to `http://localhost:3000/admin` — confirm access is granted.

#### Admin Overview

1. Verify stat cards (Total Users, Total Analyses, Completed, Failed) show real counts.
2. Verify the **Status Breakdown** strip shows all 5 statuses with counts.
3. If any analyses failed, verify **Recent Failures** table lists them.

#### Users Page (`/admin/users`)

1. Navigate to `/admin/users` — confirm the data table lists all users.
2. Click a column header (Email, Joined) — confirm rows sort in ascending then descending order.
3. Click **Make Admin** on a different user — confirm role badge updates to `ADMIN`.
4. Click **Revoke Admin** — confirm it reverts to `USER`.

#### Analyses Page (`/admin/analyses`)

1. Navigate to `/admin/analyses`.
2. Click status filter pills (e.g., `COMPLETED`) — confirm the table filters correctly.
3. If there are >10 analyses, confirm **pagination controls** (Prev / Next) appear and work.

**Expected:** All admin features gate correctly, data tables sort and filter, pagination works.

---

### 7. Theme Toggle

**Goal:** Verify light/dark mode toggle persists within the session.

1. On any dashboard page, locate the **sun/moon icon** in the sidebar bottom-left (desktop) or in the mobile header.
2. Click it — confirm the entire page transitions smoothly to dark mode (background becomes `#171614`, text lightens).
3. Navigate to a different page — confirm dark mode persists (state is maintained in memory via JS variable).
4. Refresh the page — confirm the theme defaults back to your system preference (`prefers-color-scheme`).
5. Switch your OS to dark mode — reload — confirm the dashboard defaults to dark without toggling.

**Expected:** Toggle works, transitions are smooth (~200ms), system preference is respected on load.

---

### 8. Mobile Responsiveness

**Goal:** Verify the layout adapts correctly at 375px (mobile) and 768px (tablet).

Use browser DevTools → Responsive Design Mode.

| Breakpoint | Check                                                                    |
| ---------- | ------------------------------------------------------------------------ |
| 375px      | Sidebar hidden, top header visible, hamburger menu opens slide-in drawer |
| 375px      | Stat cards stack 2-column (not 3)                                        |
| 375px      | Analysis cards stack to 1-column                                         |
| 375px      | Wizard step indicator labels hidden, dots only visible                   |
| 375px      | Persona form modal fills screen with scrollable body                     |
| 375px      | Admin table scrolls horizontally with visible scroll hint                |
| 768px      | Sidebar still hidden (appears at 1024px+)                                |
| 1024px+    | Sidebar visible, content area has `pl-60` offset                         |

**Expected:** No horizontal overflow at 375px, all touch targets ≥ 44×44px.

---

### 9. API Endpoint Smoke Tests (curl)

Replace `<TOKEN>` with a valid Clerk session token (copy from browser DevTools → Network → any request → `Authorization` header).

```bash
BASE="http://localhost:3000"
TOKEN="Bearer <your_clerk_session_token>"

# List your analyses
curl -s -H "Authorization: $TOKEN" $BASE/api/analyses | jq '.analyses | length'

# Get a single analysis
curl -s -H "Authorization: $TOKEN" $BASE/api/analyses/<analysis_id> | jq '.status'

# List personas
curl -s -H "Authorization: $TOKEN" $BASE/api/personas | jq 'keys'

# Create a custom persona
curl -s -X POST -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Test User","age":30,"occupation":"Engineer","technicalLevel":"HIGH","goals":"Get things done","frustrations":"Too many steps","tags":["test"]}' \
  $BASE/api/personas | jq '.id'

# Delete a persona
curl -s -X DELETE -H "Authorization: $TOKEN" $BASE/api/personas/<persona_id> | jq '.'

# Admin: get platform stats
curl -s -H "Authorization: $TOKEN" $BASE/api/admin/stats | jq 'keys'

# Admin: list all users
curl -s -H "Authorization: $TOKEN" $BASE/api/admin/users | jq '.users | length'

# Admin: list analyses with filter
curl -s -H "Authorization: $TOKEN" "$BASE/api/admin/analyses?status=COMPLETED&page=1" | jq '.total'
```

---

## API Reference

### Analysis Endpoints

| Method   | Path                | Auth | Description                     |
| -------- | ------------------- | ---- | ------------------------------- |
| `POST`   | `/api/analyses`     | User | Start a new analysis            |
| `GET`    | `/api/analyses`     | User | List own analyses               |
| `GET`    | `/api/analyses/:id` | User | Get single analysis + full data |
| `DELETE` | `/api/analyses/:id` | User | Delete own analysis             |

**POST `/api/analyses` body:**

```json
{
	"url": "https://example.com",
	"personaIds": ["id1", "id2"],
	"customPersonas": [],
	"deviceType": "DESKTOP"
}
```

**Response:**

```json
{ "analysisId": "cuid..." }
```

---

### Persona Endpoints

| Method   | Path                | Auth | Description                         |
| -------- | ------------------- | ---- | ----------------------------------- |
| `GET`    | `/api/personas`     | User | List prebuilt + own custom personas |
| `POST`   | `/api/personas`     | User | Create custom persona (limit: 20)   |
| `PUT`    | `/api/personas/:id` | User | Update own custom persona           |
| `DELETE` | `/api/personas/:id` | User | Delete own custom persona           |

---

### Admin Endpoints

| Method   | Path                      | Auth  | Description                                    |
| -------- | ------------------------- | ----- | ---------------------------------------------- |
| `GET`    | `/api/admin/stats`        | Admin | Platform-wide stats + recent errors            |
| `GET`    | `/api/admin/users`        | Admin | All users                                      |
| `PATCH`  | `/api/admin/users`        | Admin | Update user role                               |
| `GET`    | `/api/admin/analyses`     | Admin | All analyses (paginated, filterable by status) |
| `GET`    | `/api/admin/personas`     | Admin | All prebuilt + custom personas                 |
| `POST`   | `/api/admin/personas`     | Admin | Create prebuilt persona                        |
| `PUT`    | `/api/admin/personas/:id` | Admin | Edit any persona                               |
| `DELETE` | `/api/admin/personas/:id` | Admin | Delete any persona                             |

---

### Webhook Endpoints

| Method | Path                  | Description                                                          |
| ------ | --------------------- | -------------------------------------------------------------------- |
| `POST` | `/api/webhooks/clerk` | Clerk user lifecycle sync (user.created, user.updated, user.deleted) |

---

## Dashboard UI Architecture

```
Sidebar (desktop, fixed left, w-60)
└── Logo
└── SidebarItem × N   ← active state: teal bg + left indicator bar
└── ThemeToggle + UserButton

MobileNav (mobile only, sticky top)
└── Hamburger → AnimatePresence slide-in drawer

Layout Shell
└── <main> lg:pl-60
    └── PageHeader (title + description + actions slot)
    └── Page content

Reusable Components:
  StatCard       → KPI metric with icon, value, optional trend
  AnalysisCard   → Clickable card, status badge, friction bar, sentiment
  PersonaCard    → Persona display, selectable mode for wizard
  StatusBadge    → Animated pulsing dot for CRAWLING/ANALYZING
  SentimentBadge → Colour-coded ↑ / → / ↓ pill
  FrictionBar    → Animated width bar, colour shifts green→amber→red
  DataTable      → Generic sortable table with click-to-sort headers
  EmptyState     → Animated icon + title + description + optional CTA
  SkeletonCard   → Shimmer placeholder matching card layout
  PersonaFormModal → Controlled form modal with tag builder
  AnalysisWizard → 3-step wizard (URL → Personas → Review)
```

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod
```

Set all environment variables in the Vercel project dashboard under **Settings → Environment Variables**. Ensure `NEXT_PUBLIC_APP_URL` is set to your production domain (e.g., `https://personaforge.vercel.app`).

### Clerk Webhook Setup (Required for Production)

1. In the Clerk dashboard → **Webhooks** → Add endpoint.
2. URL: `https://your-domain.com/api/webhooks/clerk`
3. Subscribe to events: `user.created`, `user.updated`, `user.deleted`.
4. Copy the **Signing Secret** → set as `CLERK_WEBHOOK_SECRET` in Vercel env vars.

### Database (Neon / Supabase)

Use a pooled connection string for serverless environments:

```env
DATABASE_URL="postgresql://user:pass@host/db?pgbouncer=true&connect_timeout=15"
```

Run migrations on deploy:

```bash
pnpm prisma migrate deploy
```

---

## Contributing

1. Fork the repo and create a feature branch: `git checkout -b feat/your-feature`
2. Follow existing file conventions — Server Components for data fetching, Client Components only where interactivity is needed.
3. Run `pnpm lint` and `pnpm build` before pushing — fix all errors.
4. Open a pull request with a clear description of the change and which API endpoints or UI flows are affected.

---

## License

MIT © 2026 Rahul Kapoor
