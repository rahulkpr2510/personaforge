# PersonaForge Crawler Service

An isolated Express microservice designed to crawl target websites headlessly via Playwright Chromium, harvest structural DOM metrics and accessibility features, capture viewport and full-page screenshots, upload media to ImageKit CDN, and stream real-time progress events back to the primary Next.js backend.

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture & Workflow](#architecture--workflow)
- [Real-Time Event Streaming (`crawl-event`)](#real-time-event-streaming-crawl-event)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [API Reference](#api-reference)
- [Docker Deployment](#docker-deployment)

---

## Overview

The Crawler Service acts as the visual and data-gathering engine of PersonaForge. When an analysis is initiated, the Next.js application queues a job by hitting `POST /crawl`. The worker immediately returns a `started` acknowledgement (preventing HTTP gateway timeouts) and spawns an asynchronous Playwright browser context.

As the crawler navigates internal links up to the specified `maxDepth` and `maxPages`, it harvests DOM text, button counts, input element tags, heading hierarchies (`H1`-`H6`), navigation links, and primary call-to-action (CTA) copy. Simultaneously, it captures screenshots and streams real-time status updates back to the frontend (`/api/internal/crawl-event`) before posting the complete harvested dataset to `/api/internal/crawl-complete`.

---

## Tech Stack

* **Runtime**: [Node.js](https://nodejs.org/) (v20+ or [Bun](https://bun.sh/))
* **Framework**: [Express](https://expressjs.com/) (REST server & background job coordinator)
* **Crawler Engine**: [Playwright](https://playwright.dev/) (Headless Chromium)
* **Media Uploader**: [ImageKit SDK](https://imagekit.io/) for CDN screenshot storage

---

## Architecture & Workflow

```
[Next.js App] ---> (POST /crawl) ---> [Express Server (Crawler)]
                                              | (Asynchronous Worker)
                                              v
                                      [Playwright Context]
                                              |
               +------------------------------+------------------------------+
               |                              |                              |
               v                              v                              v
    [Harvest DOM Metrics]          [Capture Screenshots]          [Stream Progress Events]
     (Forms, CTAs, Headings)        (Viewport & Full Page)         (POST /crawl-event)
               |                              |                              |
               +--------------+---------------+                              v
                              |                                      [Next.js Backend]
                              v                                      (Live UI Polling)
                   [Upload to ImageKit CDN]
                              |
                              v
                (POST /api/internal/crawl-complete)
                              |
                              v
                     [Next.js Backend]
                    (Triggers AI Engine)
```

1. **Job Queueing**: Next.js hits `POST /crawl` with analysis configuration parameters.
2. **Immediate Acknowledgment**: Returns `{"status": "started"}` right away to unblock the client request.
3. **Execution**: Spawns a Playwright Chromium context configured with `--no-sandbox` and appropriate viewport dimensions matching `DESKTOP` (`1280x800`) or `MOBILE` (`375x667`) device profiles.
4. **Real-Time Progress Streaming**: As the browser navigates, checks auth screens, and crawls links, it emits structured event logs to `POST /api/internal/crawl-event` on the Next.js server.
5. **Metric & DOM Harvesting**: Evaluates the page DOM to extract:
   - Word count and readable text content.
   - Interactive elements (`buttonsCount`, `formsCount`, `linksCount`, `inputsCount`).
   - Call-to-action labels and button copy (`ctaTexts`, `primaryActionLabel`).
   - Heading hierarchy structure (`headingStructure`, `hasH1`).
   - Authentication form detection (`hasAuthForm`).
6. **CDN Media Upload**: Converts screenshot buffers into base64 payloads and uploads them to the `/personaforge/screenshots` folder in ImageKit, retrieving public CDN URLs.
7. **Final Delivery**: Posts the complete `CrawlResult` payload to `POST /api/internal/crawl-complete` (or `POST /api/internal/crawl-failed` if the crawl encountered fatal errors).

---

## Real-Time Event Streaming (`crawl-event`)

During job execution, the crawler posts progress updates to `POST /api/internal/crawl-event` on the Next.js app, authenticated via the `x-internal-api-key` header. These events are transformed by `toFriendlyLogMessage` into human-friendly updates on the live dashboard:

| Event Type | Description | Dashboard Display Message |
|---|---|---|
| `job_started` | Worker begins initializing browser context | `🔍 Setting up your analysis environment...` |
| `auth_form_detected` | Crawler discovers a login or authentication screen | `🔐 Detected a login screen — attempting to sign in...` |
| `auth_attempted` | Crawler attempts to bypass/handle authentication | `🔑 Trying to access the full product experience...` |
| `page_crawling` | Active extraction of a specific URL (`data.url`) | `📄 Analyzing page: <url>...` |
| `screenshots_captured` | Viewport and full-page captures taken | `📸 Capturing UI layout and visual elements...` |
| `job_completed` | All pages processed and uploaded successfully | `✅ Web data collected — starting AI evaluation...` |
| `job_failed` | Job encountered a terminal failure | `❌ Crawl encountered an error: <message>` |

---

## Environment Variables

Create a `.env` file inside the `crawler-service` directory:

```env
# Server Port
PORT=4000

# NextJS App Callback URL & Shared Authentication Secrets
NEXT_APP_URL="http://localhost:3000"
INTERNAL_SECRET="application_callback_auth_key"
CRAWLER_INTERNAL_API_KEY="crawler_shared_auth_key"
CRAWLER_SECRET="crawler_shared_auth_key"

# ImageKit CDN Credentials
IMAGEKIT_PUBLIC_KEY="public_..."
IMAGEKIT_PRIVATE_KEY="private_..."
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/..."
```

---

## Local Development Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v20+) or [Bun](https://bun.sh/)
* Headless Chromium binaries (installed automatically via Playwright CLI)

### Steps

```bash
# 1. Install microservice dependencies
bun install   # or npm install

# 2. Install Playwright Chromium binaries & OS dependencies
bunx playwright install chromium

# 3. Start development server
bun run dev   # Executes "node server.js"
```

The crawler worker will listen on [http://localhost:4000](http://localhost:4000).

---

## API Reference

### Health Check
`GET /health`
* **Auth**: None
* **Response**: `{"status": "ok"}`

### Trigger Crawl Job
`POST /crawl`
* **Auth Header**: `x-crawler-secret: <CRAWLER_SECRET>`
* **Request Body**:
```json
{
  "url": "https://example.com",
  "analysisId": "cmrbpvfnv004msmoq6umf17c2",
  "maxDepth": 2,
  "maxPages": 8,
  "deviceType": "DESKTOP"
}
```
* **Response**:
```json
{
  "status": "started",
  "analysisId": "cmrbpvfnv004msmoq6umf17c2"
}
```

---

## Docker Deployment

A lightweight `Dockerfile` is provided for containerized deployment in staging or production Docker/Kubernetes environments:

```bash
# Build container image
docker build -t personaforge-crawler .

# Run container with environment file
docker run -d -p 4000:4000 --env-file .env --name crawler-worker personaforge-crawler
```
