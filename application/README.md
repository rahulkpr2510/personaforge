# PersonaForge Application

The primary Next.js 15 web application and dashboard for PersonaForge. This app handles user authentication, dashboard analytics, custom persona management, PDF report generation, and coordinates the modular AI evaluation pipeline.

## Table of Contents
- [Tech Stack](#tech-stack)
- [Project Directory Structure](#project-directory-structure)
- [Key Features & Architecture](#key-features--architecture)
  - [1. Centralized API Communication Layer](#1-centralized-api-communication-layer)
  - [2. Modular AI Pipeline & Quality Gate](#2-modular-ai-pipeline--quality-gate)
  - [3. Authentication & DB Connection Deduplication](#3-authentication--db-connection-deduplication)
  - [4. Validation & Security](#4-validation--security)
  - [5. In-Memory Rate Limiting](#5-in-memory-rate-limiting)
  - [6. PDF Report Generation](#6-pdf-report-generation)
  - [7. Dark Mode & Theme System](#7-dark-mode--theme-system)
  - [8. Development Feedback Loop (Agentation)](#8-development-feedback-loop-agentation)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [API Route Index](#api-route-index)

---

## Tech Stack

* **Framework**: Next.js 15 (App Router with Server Components & Server Actions)
* **Auth**: Clerk (ClerkProvider + ClerkMiddleware with in-process RSC lookup cache)
* **Database**: PostgreSQL (via Prisma ORM & `@prisma/adapter-neon` WebSocket driver)
* **AI Orchestration**: Groq SDK (`Llama-3.3-70b-versatile`) + Google Generative AI (`Gemini 2.0 Flash`) + OpenRouter fallback
* **HTTP Client Layer**: Centralized Axios (`lib/api/client.ts`) with custom retry engine (`lib/api/retry.ts`)
* **PDF Engine**: `@react-pdf/renderer` (dynamically loaded client component)
* **Styling & UI**: Tailwind CSS v4 + Framer Motion (`motion/react`) + Lucide Icons

---

## Project Directory Structure

```
application/
├── app/
│   ├── (auth)/               # Clerk sign-in & sign-up routes
│   ├── (dashboard)/          # Authenticated user dashboard routes
│   │   ├── dashboard/        # Dashboard stats, analyses, new-analysis wizard, personas
│   │   └── admin/            # Admin metrics, user management, global analyses
│   ├── api/                  # REST API endpoints
│   │   ├── admin/            # Admin endpoints (users, stats, global analyses)
│   │   ├── analyses/         # User analyses CRUD & status polling
│   │   ├── internal/         # Crawler callback receivers (crawl-complete, crawl-failed, crawl-event)
│   │   ├── personas/         # User custom personas CRUD
│   │   └── webhooks/         # Clerk Svix webhook receiver
│   ├── globals.css           # Styling configuration & design system tokens
│   └── layout.tsx            # Main application root layout
├── components/
│   ├── landing/              # Hero, Features, FAQ, Floating Nav, Footer
│   ├── dashboard/            # Analysis cards, live polling view, PDF reports, developer debug panel
│   ├── shared/               # ThemeProvider, ThemeToggle, AgentationWrapper
│   └── ui/                   # Button, modal, text indicators, input controls
├── hooks/
│   └── useAnalysisStatus.ts  # Observability hook managing real-time status polling & offline detection
├── lib/
│   ├── api/                  # Centralized HTTP layer (client.ts, retry.ts, errors.ts, analyses.ts, personas.ts, response.ts)
│   ├── config/               # AI provider configuration & fallback strategies (ai-providers.ts)
│   ├── services/             # AI Pipeline services
│   │   ├── vision/           # Gemini & OpenRouter vision providers and image intelligence
│   │   ├── aggregator.ts     # Executive scorecard calculation & UX category weighting
│   │   ├── focus-group-service.ts      # Multi-persona simulated discussion moderation & conflict matrix
│   │   ├── persona-analysis-service.ts # Parallel persona execution & evaluation engine
│   │   ├── persona-engine-internals.ts # Pure prompt builder & persona vocabulary constraints
│   │   ├── quality-gate.ts             # Pre-save AI output validation & anti-hallucination score
│   │   └── website-intelligence.ts     # Unified DOM/metrics intelligence builder
│   ├── validation/           # Zod schema definitions with SSRF & XSS safeguards (schemas.ts)
│   ├── auth.ts               # requireAuth validation helper with 60s in-process lookup cache
│   ├── db.ts                 # PrismaClient singleton instance with hot-reload version check
│   ├── rate-limit.ts         # Sliding window rate limiter for Serverless endpoints
│   └── types.ts              # Core TypeScript interfaces across the entire platform
├── prisma/
│   ├── schema.prisma         # Relational database schema
│   └── seed.ts               # Default prebuilt personas seeding script
└── proxy.ts                  # Clerk route protection & middleware logic
```

---

## Key Features & Architecture

### 1. Centralized API Communication Layer
All frontend client components communicate with backend REST endpoints exclusively via the centralized `lib/api` modules rather than raw `fetch` calls:
* **`client.ts`**: Configured Axios instance with automatic request tracing (`X-Request-ID`, `X-Timestamp`, `X-Client-Version`), browser-safe `crypto.randomUUID` fallback polyfill, and automated envelope unwrapping (`ApiSuccessResponse`).
* **`retry.ts`**: Exponential backoff with jitter (`calcRetryDelay`, `shouldRetry`) that automatically retries safe, transient network or server errors (`429`, `500`, `502-504`) up to 3 times while immediately failing on validation or auth errors (`400-409`).
* **`errors.ts` & `response.ts`**: Standardized `AppError` and `classifyError` handlers ensuring clean, non-leaking user-facing error messages (`apiSuccess`, `apiFailure`) with structured HTTP status classification.
* **Typed Domain APIs (`analyses.ts`, `personas.ts`)**: Encapsulates endpoints (`AnalysisApi.create`, `PersonaApi.list`, etc.) with strict TypeScript return signatures.

### 2. Modular AI Pipeline & Quality Gate
When the crawler completes a job (`POST /api/internal/crawl-complete`), it triggers the multi-stage AI analysis pipeline (`lib/services`):
1. **Master Website Intelligence (`website-intelligence.ts`)**: Synthesizes the raw crawl DOM metrics, heading hierarchies, call-to-action buttons, and full-page vision analysis summaries into a single immutable `WebsiteIntelligence` payload.
2. **Parallel Persona Execution (`persona-analysis-service.ts` & `persona-engine-internals.ts`)**: Evaluates the intelligence object against selected user personas concurrently. Enforces domain-scoped vocabulary constraints (e.g., student vs. developer vs. marketer terminology) during prompt generation.
3. **Automated Quality Gate (`quality-gate.ts`)**: Before any persona evaluation is saved, `QualityGate` grades the output (`0–100`). It blocks absolute absence hallucinations (e.g., falsely claiming "no pricing page" when the crawler proved one exists) and verifies recommendations cite observed metrics.
4. **Focus Group Moderation (`focus-group-service.ts`)**: Conducts a simulated multi-turn discussion where personas debate top findings, reference each other's pain points, and generate an agreement/disagreement matrix (`FocusGroupResult`).
5. **Insights Aggregator (`aggregator.ts`)**: Calculates an executive scorecard featuring a weighted 10-category UX score (`navigation`, `accessibility`, `trustSignals`, etc.), UX maturity level (`Emerging` to `Advanced`), opportunity matrix, and conversion/accessibility risk indices.

### 3. Authentication & DB Connection Deduplication
Authentication is powered by Clerk (`requireAuth` in `lib/auth.ts`). When a user registers or updates their credentials, Clerk sends a Svix webhook payload (`/api/webhooks/clerk`) syncing user profile data via Prisma `upsert`.
* **In-Process Lookup Cache**: Because Neon Serverless PostgreSQL has strict concurrency limits, Next.js 15 parallel Server Component rendering across layouts, pages, and API calls can cause connection spikes. `requireAuth` incorporates a 60-second in-memory `userCache` to deduplicate database lookups per `userId`, preventing connection exhaustion.

### 4. Validation & Security
All incoming REST request payloads are strictly parsed and validated using **Zod** (`lib/validation/schemas.ts`).
* **SSRF Protection**: `SafeUrl` validates URLs submitted for analysis, blocking private RFC-1918 networks, localhost loopbacks (`127.0.0.1`, `0.0.0.0`), cloud instance metadata IP endpoints (`169.254.169.254`), `.local` mDNS domains, and non-HTTP/HTTPS schemes.
* **XSS Prevention**: `SafeText` strips HTML tags and control characters (`\x00-\x1F`) from all free-form text fields.

### 5. In-Memory Rate Limiting
A per-process sliding window rate limiter (`lib/rate-limit.ts`) prevents API abuse:
* **Analyses Creation**: Capped at `5` creations per window per user (`Limits.createAnalysis`).
* **Persona CRUD**: Capped at `30` requests per window per user (`Limits.personaCrud`).
* **Crawler Callbacks**: Capped at `3` attempts per analysis (`Limits.internalCrawlComplete`).

### 6. PDF Report Generation
Comprehensive executive reports are exported to PDF via `@react-pdf/renderer` (`components/dashboard/AnalysisPdfReport.tsx`). To prevent Node.js Server-Side Rendering canvas mismatches, download triggers are isolated inside client components with `ssr: false`.

### 7. Dark Mode & Theme System
Theme switching is supported via `ThemeProvider` and `ThemeToggle` (`components/shared/`). Theme preference (`light` / `dark`) is stored in `localStorage` under `pf-theme` and toggles the `.dark` class on the root HTML element without visual flashing.

### 8. Development Feedback Loop (Agentation)
In development environments, the root layout dynamically mounts `AgentationWrapper` (`components/shared/AgentationWrapper.tsx`), enabling visual UI annotations and live inspection via a local MCP server.

---

## Environment Variables

Create a `.env` file in the `application` folder:

```env
# Database (Neon Serverless PostgreSQL connection string)
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
CRAWLER_INTERNAL_API_KEY="crawler_shared_auth_key"
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

# 2. Sync database schema to PostgreSQL
bunx prisma db push

# 3. Seed default user personas
bunx prisma db seed

# 4. Start Next.js development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application dashboard.

---

## API Route Index

All user-facing endpoints return structured JSON envelopes (`ApiSuccessResponse` or `ApiFailureResponse`) and include request trace headers (`X-Request-ID`, `X-Timestamp`, `X-Client-Version`).

| Route | Method | Access | Description |
|---|---|---|---|
| `/api/analyses` | `GET` | User | List current user's analyses with summary metrics |
| `/api/analyses` | `POST` | User | Start a new analysis (validates URL via SSRF check & triggers Playwright job) |
| `/api/analyses/[id]` | `GET` | User | Fetch single analysis details including crawled pages, personas, and focus group |
| `/api/analyses/[id]` | `DELETE` | User | Delete analysis record and associated evaluations |
| `/api/analyses/[id]/status` | `GET` | User | Poll current status (`PENDING`, `CRAWLING`, `ANALYZING`, `COMPLETED`, `FAILED`) |
| `/api/personas` | `GET` | User | List all prebuilt and custom personas for current user |
| `/api/personas` | `POST` | User | Create custom persona (AI description generation runs non-blocking) |
| `/api/personas/[id]` | `PATCH` | User | Update an existing custom persona |
| `/api/personas/[id]` | `DELETE` | User | Delete a custom persona |
| `/api/internal/crawl-complete` | `POST` | Internal | Secured callback receiving harvested crawl data; initiates AI evaluation pipeline |
| `/api/internal/crawl-failed` | `POST` | Internal | Secured callback recording crawl job failure reasons |
| `/api/internal/crawl-event` | `POST` | Internal | Real-time log streaming endpoint capturing active crawler progress events |
| `/api/webhooks/clerk` | `POST` | Public | Svix webhook syncing Clerk users to Postgres DB |
| `/api/admin/stats` | `GET` | Admin | Overall system metrics and operational dashboard stats |
| `/api/admin/users` | `GET` | Admin | List all registered users across the platform |
| `/api/admin/users` | `PATCH` | Admin | Update user role permissions (`USER` / `ADMIN`) |
| `/api/admin/analyses` | `GET` | Admin | List all platform analyses (paginated overview) |
| `/api/admin/personas` | `GET` | Admin | List all platform prebuilt and custom personas |
| `/api/admin/personas` | `POST` | Admin | Create a new global prebuilt persona |
| `/api/admin/personas/[id]` | `DELETE` | Admin | Delete a global prebuilt persona |
