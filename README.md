# PersonaForge — AI Synthetic User Research Platform

PersonaForge is an AI-powered UX research and analysis platform designed to simulate how diverse user personas experience your web products. It headlessly crawls target websites, parses layout hierarchies and DOM metrics, analyzes visual interfaces via Gemini Vision, and conducts simulated focus group discussions with customized user personas to surface friction points before your product ships.

---

## Architecture Overview

PersonaForge is structured as a decoupled multi-service system:

```
                                  +-----------------------------+
                                  |    Clerk Auth Service       |
                                  +--------------+--------------+
                                                 | (Svix Webhook)
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

1. **Next.js Web Application (`/application`)**: The main interface hosting the user dashboard, custom persona wizard, focus group visualizers, and admin dashboards. Built with Next.js 15, Clerk Auth, and Tailwind v4.
2. **Crawler Microservice (`/crawler-service`)**: An isolated Express worker that launches Playwright headless Chromium instances to scrape DOM text and metrics, take full-page/viewport screenshots, upload buffers to ImageKit, and post reports back to the Next.js API.
3. **Database Layer (Prisma & PostgreSQL)**: Relational schema mapping user records, custom personas, crawled pages, uploaded screenshots, and focus group synthesis reports.

---

## Tech Stack

* **Frontend & Web Core**: Next.js 15 (App Router, Server Components)
* **Crawler Engine**: Playwright (headless Chromium) running inside Express
* **Database & ORM**: PostgreSQL + Prisma ORM
* **Authentication**: Clerk Auth (with Svix webhook user sync)
* **AI Engine & Large Language Models**:
  * **Gemini 2.0 Flash**: Powers structural screenshot layout analysis.
  * **Llama-3.3-70b-versatile (via Groq)**: Simulates user evaluations and focus group discussion synthesis.
  * **OpenRouter Fallback**: Serves as a backup completion router in case of Groq/Gemini API rate limiting or outage.
* **PDF Exporter**: `@react-pdf/renderer` (encapsulated client-side to prevent Node.js canvas compilation mismatch)
* **Animations**: Motion (Framer Motion v12)
* **Development Helper**: Agentation (Local MCP visual annotation server)

---

## Project Structure

```
personaforge/
├── application/              # Next.js 15 dashboard app
│   ├── app/                  # Pages, API route handlers, layout
│   ├── components/           # Landing page sections, dashboard cards, PDF export
│   ├── lib/                  # DB connection, rate limiting, validation schemas
│   └── prisma/               # Schema definition and database seeding script
├── crawler-service/          # Playwright crawling server
│   ├── Dockerfile            # Lightweight isolated container build script
│   └── server.js             # Express app managing Playwright worker lifecycle
├── vercel.json               # Serverless function execution times
└── package.json              # Main project package index
```

---

## Local Development Setup

Follow these steps to run both services locally.

### Prerequisites
* [Node.js](https://nodejs.org/) (v20+) or [Bun](https://bun.sh/) (recommended)
* PostgreSQL database instance running locally or hosted (e.g. Neon, Supabase)
* Npnpm or Bun package manager

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

For layer-specific developer documentation, checkout:
* 🖥️ **Next.js Web Application Guide**: See [application/README.md](file:///Users/rahul/Companies/Sopra%20Steria/personaforge/application/README.md) for details on validation schemas, rate limiting, Clerk synchronization, PDF exporters, and theme structures.
* 🕷️ **Crawler Microservice Guide**: See [crawler-service/README.md](file:///Users/rahul/Companies/Sopra%20Steria/personaforge/crawler-service/README.md) for details on Playwright context setup, structural metrics parsing, ImageKit storage integration, and callback payloads.

---

## Contributing

1. Fork this repository and create your feature branch: `git checkout -b feat/your-feature-name`.
2. Follow Next.js Server/Client component boundaries strictly.
3. Ensure Zod schemas are updated for any database or API changes.
4. Run `bunx tsc --noEmit` to verify type safety before submitting a pull request.

---

## License

Distributed under the MIT License. See `LICENSE` for details.
