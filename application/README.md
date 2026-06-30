# PersonaForge Application

The primary Next.js web application and dashboard for PersonaForge. This app handles user authentication, dashboard analytics, custom persona management, PDF report generation, and coordinates the AI evaluation pipeline.

## Table of Contents
- [Tech Stack](#tech-stack)
- [Project Directory Structure](#project-directory-structure)
- [Key Features & Architecture](#key-features--architecture)
  - [1. Authentication & User Sync](#1-authentication--user-sync)
  - [2. Validation & Security](#2-validation--security)
  - [3. In-Memory Rate Limiting](#3-in-memory-rate-limiting)
  - [4. PDF Report Generation](#4-pdf-report-generation)
  - [5. Dark Mode & Theme System](#5-dark-mode--theme-system)
  - [6. Development Feedback Loop (Agentation)](#6-development-feedback-loop-agentation)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [API Route Index](#api-route-index)

---

## Tech Stack

* **Framework**: Next.js 15 (App Router with Server Components)
* **Auth**: Clerk (ClerkProvider + ClerkMiddleware)
* **Database**: PostgreSQL (via Prisma ORM)
* **AI Orchestration**: Groq SDK (Llama-3.3-70b) + Google Generative AI (Gemini 2.0 Flash) + OpenRouter fallback
* **PDF Engine**: `@react-pdf/renderer`
* **Styling**: Tailwind CSS v4

---

## Project Directory Structure

```
application/
├── app/
│   ├── (auth)/               # Clerk sign-in & sign-up routes
│   ├── (dashboard)/          # Authenticated user dashboard routes
│   │   ├── dashboard/        # Dashboard stats, analyses, personas
│   │   └── admin/            # Admin metrics, user list, global analyses
│   ├── api/                  # API endpoints
│   │   ├── admin/            # Admin endpoints (users, stats, global analyses)
│   │   ├── analyses/         # User analyses CRUD
│   │   ├── internal/         # Crawler callback receivers (crawl-complete, crawl-failed)
│   │   ├── personas/         # User custom personas CRUD
│   │   └── webhooks/         # Clerk svix webhook receiver
│   ├── globals.css           # Styling configuration
│   └── layout.tsx            # Main layout wrapper
├── components/
│   ├── landing/              # Hero, Features, FAQ, Floating Nav, Footer
│   ├── dashboard/            # Export PDF, status badges, metrics
│   ├── shared/               # ThemeProvider, ThemeToggle, AgentationWrapper
│   └── ui/                   # Button, modal, text indicators
├── lib/
│   ├── services/             # AI Pipeline services (engine, vision, aggregator, focus-group)
│   ├── validation/           # Zod schema definitions (schemas.ts)
│   ├── auth.ts               # requireAuth validation helper
│   ├── db.ts                 # PrismaClient singleton instance
│   └── rate-limit.ts         # In-memory sliding window rate limiter
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Default prebuilt personas
└── proxy.ts                  # Clerk route protection config
```

---

## Key Features & Architecture

### 1. Authentication & User Sync
Authentication is powered by Clerk. When a user registers or updates their credentials, Clerk sends a Svix webhook payload to `/api/webhooks/clerk` which syncs the email, name, and ID to the PostgreSQL database using a concurrency-safe `upsert`.

### 2. Validation & Security
All incoming REST request payloads are strictly parsed and validated using **Zod** (`lib/validation/schemas.ts`). 
* **SSRF Protection**: Submitting URLs for crawling undergoes a validation filter (`SafeUrl`) blocking private networks, localhost loopbacks (e.g. `127.0.0.1`), Google/AWS metadata endpoints, and non-HTTP/HTTPS protocols.
* **XSS Prevention**: Free-form text fields (e.g. custom persona goals, occupation) have HTML tags and control characters stripped during parsing.

### 3. In-Memory Rate Limiting
A per-process sliding window rate limiter is integrated (`lib/rate-limit.ts`) to prevent API abuse:
* **Analyses Creation**: Capped at `5` creations per hour per user.
* **Persona CRUD**: Capped at `30` calls per minute per user.
* **Crawler Callback Complete**: Capped at `3` attempts per hour per analysis.

### 4. PDF Report Generation
Reports can be exported to PDF via `@react-pdf/renderer` (`components/dashboard/AnalysisPdfReport.tsx`). To prevent Node.js Server Side Rendering canvas library incompatibilities, the download link is dynamically imported as a client component (`ExportPdfButton.tsx`) with `ssr: false`.

### 5. Dark Mode & Theme System
Theme switching is supported via `ThemeProvider` (`components/shared/ThemeProvider.tsx`) and `ThemeToggle` (`components/shared/ThemeToggle.tsx`). The theme state (`light` / `dark`) is persisted in `localStorage` under `pf-theme` and is applied via the `.dark` class to coordinate Tailwind's dark utility classes. A small script is injected into the document head to toggle the class before rendering to prevent visual theme flashes.

### 6. Development Feedback Loop (Agentation)
To help developers and AI agents visually inspect and annotate components, `agentation` is mounted in the root layout. It dynamically mounts as a client component (`AgentationWrapper.tsx`) in development environments only, running a local MCP server for real-time synchronization.

---

## Environment Variables

Create a `.env` file in the `application` folder:

```env
# Database
DATABASE_URL="postgresql://..."

# Clerk Auth
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/dashboard"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/dashboard"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# AI API Keys
GEMINI_API_KEY="AIzaSy..."
GROQ_API_KEY="gsk_..."
OPENROUTER_API_KEY="sk-or-v1..."

# ImageKit (Screenshots CDN)
IMAGEKIT_PUBLIC_KEY="public_..."
IMAGEKIT_PRIVATE_KEY="private_..."
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/..."

# Crawler Integration
CRAWLER_SERVICE_URL="http://localhost:4000"
CRAWLER_SECRET="crawler_shared_auth_key"
INTERNAL_SECRET="application_callback_auth_key"

# App Location
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Getting Started

```bash
# 1. Install dependencies
bun install

# 2. Sync database schema
bunx prisma db push

# 3. Seed prebuilt personas
bunx prisma db seed

# 4. Start Next.js server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application dashboard.

---

## API Route Index

| Route | Method | Access | Description |
|---|---|---|---|
| `/api/analyses` | `GET` | User | List user's analyses |
| `/api/analyses` | `POST` | User | Start new analysis (triggers Playwright worker) |
| `/api/analyses/[id]` | `GET` | User | Fetch single analysis result details |
| `/api/analyses/[id]` | `DELETE` | User | Delete analysis record |
| `/api/analyses/[id]/status` | `GET` | User | Poll current analysis status |
| `/api/personas` | `GET` | User | List prebuilt & custom personas |
| `/api/personas` | `POST` | User | Create custom persona (limit 20 per account) |
| `/api/personas/[id]` | `DELETE` | User | Delete custom persona |
| `/api/internal/crawl-complete` | `POST` | Internal | Callback for crawl data; triggers AI pipeline |
| `/api/internal/crawl-failed` | `POST` | Internal | Callback for failed crawl jobs |
| `/api/webhooks/clerk` | `POST` | Public | Svix webhook syncing Clerk users to DB |
| `/api/admin/stats` | `GET` | Admin | Overall admin dashboard stats |
| `/api/admin/users` | `GET` | Admin | List all registered users |
| `/api/admin/users` | `PATCH` | Admin | Update user access roles (USER/ADMIN) |
| `/api/admin/analyses` | `GET` | Admin | List all platform analyses (paginated) |
| `/api/admin/personas` | `GET` | Admin | List all platform personas |
| `/api/admin/personas` | `POST` | Admin | Create new global prebuilt persona |
| `/api/admin/personas/[id]` | `DELETE` | Admin | Delete global prebuilt persona |
