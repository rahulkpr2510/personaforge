# PersonaForge — AI Synthetic User Research Platform

PersonaForge is an AI-powered UX research and analysis platform designed to simulate how diverse user personas experience your web products. It headlessly crawls target websites, parses layout hierarchies and DOM metrics, analyzes visual interfaces via Gemini Vision, and conducts simulated focus group discussions with customized user personas to surface friction points before your product ships.

---

## Architecture Overview

PersonaForge is structured as a decoupled multi-service system with strict boundary separation between client components, server components, background workers, and AI services:

```
                                   +-----------------------------+
                                   |    Clerk Auth Service       |
                                   +--------------+--------------+
                                                  | (Svix Webhook / 60s Cache)
                                                  v
+-----------------------------+   HTTP REST   +--+--------------------------+
|  Playwright Crawler Worker  +<------------->+   Next.js 15 Web App        |
|  (Express, runs on :4000)   |  (Callbacks)  |   (React, runs on :3000)    |
+--------------+--------------+               +--+--------------+-----------+
               |                                 |              |
               v (Base64 buffers)                v (Prisma)     v (Gemini/Groq SDKs)
      +--------+---------+                 +-----+----+   +-----+----+
      |  ImageKit CDN    |                 | Postgres |   | AI APIs  |
      +------------------+                 +----------+   +----------+
```

1. **Next.js Web Application (`/application`)**: The main interface hosting the user dashboard, custom persona wizard, focus group visualizers, and admin dashboards. Built with Next.js 15, Clerk Auth, and Tailwind v4. It features a centralized, self-healing API layer (`lib/api`) with structured JSON envelopes, request UUID tracking, and exponential backoff retry logic.
2. **Crawler Microservice (`/crawler-service`)**: An isolated Express worker that launches Playwright headless Chromium instances to scrape DOM text and metrics, take full-page/viewport screenshots, upload buffers to ImageKit, and post reports (`crawl-complete`, `crawl-failed`, and real-time `crawl-event` logs) back to the Next.js API.
3. **Database Layer (Prisma & PostgreSQL)**: Relational schema on Neon Serverless PostgreSQL mapping user records, custom personas, crawled pages, uploaded screenshots, and focus group synthesis reports. Includes an in-process connection deduplication layer to prevent connection exhaustion during parallel RSC rendering.

---

## Key Engineering Highlights & Resilience

* **Centralized API Client (`lib/api`)**: All client-to-server communication flows through a unified Axios instance (`client.ts`) with automatic request tracking (`X-Request-ID`), browser-safe `crypto.randomUUID` fallback polyfill, envelope unwrapping (`apiSuccess`/`apiFailure`), and intelligent exponential backoff with jitter (`retry.ts`) for transient HTTP status codes (`429`, `500-504`).
* **Structured AI Quality Gate (`lib/services/quality-gate.ts`)**: Every persona evaluation passes through an automated pre-save validation filter (`0–100` score) that detects contradictory claims, checks scoped vocabulary restrictions, and ensures recommendations are grounded in observed crawl evidence.
* **Master Website Intelligence (`lib/services/website-intelligence.ts`)**: Crawled DOM metrics, visual summaries, and page layout indicators are synthesized once into a single `WebsiteIntelligence` object consumed by all downstream persona engines and focus group moderators, eliminating redundant parsing.
* **In-Process Database Deduplication (`lib/auth.ts` & `lib/db.ts`)**: To accommodate Neon serverless connection limits during high-concurrency Next.js 15 Server Component rendering, user authentication lookups are cached in memory for 60 seconds with automatic stale entry pruning and hot-reload schema versioning.
* **Clean Code Architecture**: The entire codebase adheres to crisp, human-like developer documentation standards—no unnecessary boilerplate or bloated block dividers, maintaining clean and focused domain modules.

---

## Tech Stack

* **Frontend & Web Core**: Next.js 15 (App Router, Server Components)
* **Crawler Engine**: Playwright (headless Chromium) running inside Express
* **Database & ORM**: PostgreSQL + Prisma ORM (Neon Serverless via WebSocket adapter)
* **Authentication**: Clerk Auth (with Svix webhook user sync & per-user in-memory cache)
* **AI Engine & Large Language Models**:
  * **Gemini 2.0 Flash**: Powers structural screenshot layout analysis and visual evaluation.
  * **Llama-3.3-70b-versatile (via Groq)**: Simulates user evaluations, persona reasoning, and focus group discussion synthesis.
  * **OpenRouter Fallback**: Serves as an automated backup completion router during Groq/Gemini API rate limits.
* **PDF Exporter**: `@react-pdf/renderer` (dynamically imported client-side to prevent Node.js canvas compilation mismatches)
* **Animations**: Motion (Framer Motion v12)
* **Development Helper**: Agentation (Local MCP visual annotation server)

---

## Project Structure

```
personaforge/
├── application/              # Next.js 15 dashboard app & API routes
│   ├── app/                  # App Router pages, API handlers, layout
│   ├── components/           # Landing sections, dashboard cards, PDF export, modals
│   ├── hooks/                # Custom React hooks (e.g. useAnalysisStatus polling)
│   ├── lib/                  # Centralized API client, AI services, auth, DB, rate limiting
│   └── prisma/               # Schema definition and database seeding script
├── crawler-service/          # Playwright crawling server
│   ├── Dockerfile            # Lightweight isolated container build script
│   └── server.js             # Express app managing Playwright worker lifecycle
├── vercel.json               # Serverless function execution timeouts & config
└── package.json              # Main project package index
```

---

## Local Development Setup

Follow these steps to run both services locally.

### Prerequisites
* [Node.js](https://nodejs.org/) (v20+) or [Bun](https://bun.sh/) (recommended)
* PostgreSQL database instance running locally or hosted (e.g. Neon, Supabase)
* Npm, pnpm, or Bun package manager

---

### Step 1: Database Setup

Ensure PostgreSQL is running and update the `DATABASE_URL` parameter inside `application/.env`.

```bash
cd application

# Install app dependencies
bun install

# Apply database schemas
bunx prisma db push

# Seed prebuilt user personas
bunx prisma db seed
```

---

### Step 2: Configure Environment Files

#### NextJS Application (`application/.env`)
Create a `.env` file in the `application` folder matching this template:

```env
DATABASE_URL="postgresql://..."

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

GEMINI_API_KEY="AIzaSy..."
GROQ_API_KEY="gsk_..."
OPENROUTER_API_KEY="sk-or-v1..."

IMAGEKIT_PUBLIC_KEY="public_..."
IMAGEKIT_PRIVATE_KEY="private_..."
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/..."

CRAWLER_SERVICE_URL="http://localhost:4000"
CRAWLER_INTERNAL_API_KEY="crawler_shared_auth_key"
CRAWLER_SECRET="crawler_shared_auth_key"
INTERNAL_SECRET="application_callback_auth_key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### Crawler Service (`crawler-service/.env`)
Create a `.env` file in the `crawler-service` folder:

```env
PORT=4000
NEXT_APP_URL="http://localhost:3000"
INTERNAL_SECRET="application_callback_auth_key"
CRAWLER_SECRET="crawler_shared_auth_key"

IMAGEKIT_PUBLIC_KEY="public_..."
IMAGEKIT_PRIVATE_KEY="private_..."
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/..."
```

---

### Step 3: Run the Services

Open two terminal split shells:

#### Terminal 1: Next.js Frontend
```bash
cd application
bun run dev
```
Serves the web portal on [http://localhost:3000](http://localhost:3000).

#### Terminal 2: Crawler Service
```bash
cd crawler-service
bun install
bunx playwright install chromium
bun run dev
```
Listens for crawling jobs on [http://localhost:4000](http://localhost:4000).

---

### Step 4: Clerk Webhook Tunneling (Local Development)

Because Clerk webhooks are triggered from Clerk's cloud servers, they cannot reach `localhost:3000` directly. Use **Ngrok** to create a public HTTPS tunnel:

```bash
# In a new terminal window
bunx ngrok http 3000
```
1. Copy the generated HTTPS URL (e.g., `https://xxxx.ngrok-free.app`).
2. Go to your **Clerk Dashboard → Webhooks → Add Endpoint**.
3. Set the Endpoint URL to `https://xxxx.ngrok-free.app/api/webhooks/clerk`.
4. Subscribe to the events: `user.created`, `user.updated`, `user.deleted`.
5. Copy the Clerk **Signing Secret** into `CLERK_WEBHOOK_SECRET` inside your `application/.env`.

---

## Detailed Developer Guides

For layer-specific developer documentation, check out:
* 🖥️ **Next.js Web Application Guide**: See [application/README.md](file:///Users/rahul/Companies/Sopra%20Steria/personaforge/application/README.md) for details on the API client layer, AI service orchestration, quality gates, rate limiting, Clerk synchronization, PDF exporters, and dark mode theme architecture.
* 🕷️ **Crawler Microservice Guide**: See [crawler-service/README.md](file:///Users/rahul/Companies/Sopra%20Steria/personaforge/crawler-service/README.md) for details on Playwright Chromium context setup, DOM metric harvesting, ImageKit CDN storage integration, real-time event logging (`crawl-event`), and callback payloads.

---

## Contributing

1. Fork this repository and create your feature branch: `git checkout -b feat/your-feature-name`.
2. Follow Next.js Server/Client component boundaries strictly (`"use client"` where required).
3. Ensure Zod schemas (`lib/validation/schemas.ts`) and TypeScript types (`lib/types.ts`) are updated for any database or API changes.
4. Keep comments crisp and developer-friendly; avoid unnecessary boilerplate or excessive header dividers.
5. Run `bun run build` to verify type safety before submitting a pull request.

---

## License

Distributed under the MIT License. See `LICENSE` for details.
