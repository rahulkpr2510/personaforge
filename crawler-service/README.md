# PersonaForge Crawler Service

An isolated microservice designed to crawl target websites headlessly, collect key accessibility and layout metrics, take full-page and viewport screenshots, upload them to CDN (ImageKit), and post back results to the main application backend.

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [How it Works](#how-it-works)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [API Reference](#api-reference)
- [Docker Deployment](#docker-deployment)

---

## Overview

The Crawler Service acts as the visual and data-gathering worker of PersonaForge. It accepts jobs via an HTTP API, runs an instance of headless Chromium via Playwright, crawls internal links recursively up to specified depth/page limits, grabs UI structure, and captures layout screenshots. Once finished, it uploads the media to ImageKit and updates the primary backend with the payload.

---

## Tech Stack

* **Runtime**: [Node.js](https://nodejs.org/) (runs with Node or [Bun](https://bun.sh/))
* **Framework**: [Express](https://expressjs.com/) (REST endpoints)
* **Crawler Engine**: [Playwright](https://playwright.dev/) (Headless Chromium)
* **Media Uploader**: [ImageKit SDK](https://imagekit.io/)

---

## How it Works

```
[Next.js App] ---> (POST /crawl) ---> [Express Server (Crawler)]
                                              | (asynchronous thread)
                                              v
                                      [Playwright Context]
                                              |
                                      +-------+-------+
                                      |               |
                                      v               v
                             [Full/Viewport Screen] [DOM Parser]
                                      |               |
                                      v               v
                             [ImageKit CDN]     [Harvest Metrics]
                                      \               /
                                       \             /
                                    (POST /crawl-complete)
                                             |
                                             v
                                      [Next.js Backend]
```

1. **Job Queueing**: NextJS backend hits `POST /crawl` with configuration params.
2. **Immediate Acknowledgment**: The crawler returns a `started` response immediately to avoid NextJS gateway timeouts, triggering the crawl asynchronously.
3. **Execution**: Playwright runs headless Chromium with specific parameters (`--no-sandbox`, viewport matching based on device profiles).
4. **Data Harvesting**: Evaluates DOM to gather text, form inputs count, buttons count, link locations, and CTA copy.
5. **Screenshots**: Takes full-page and viewport screenshots and uploads them to the `/personaforge/screenshots` folder in ImageKit.
6. **Report**: Sends data payloads back to `/api/internal/crawl-complete` or `/api/internal/crawl-failed` on the Next.js application.

---

## Environment Variables

Create a `.env` file in the `crawler-service` directory:

```env
# Server Port
PORT=4000

# NextJS App URL & secrets for callback routes
NEXT_APP_URL="http://localhost:3000"
INTERNAL_SECRET="your_shared_internal_callback_secret"

# Auth secret between Next.js and Crawler Service
CRAWLER_SECRET="your_shared_crawler_trigger_secret"

# ImageKit credentials
IMAGEKIT_PUBLIC_KEY="public_..."
IMAGEKIT_PRIVATE_KEY="private_..."
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/..."
```

---

## Local Development Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v20+) or [Bun](https://bun.sh/)
* Headless Chromium binaries installed (handled by Playwright installer)

### Steps

```bash
# 1. Install dependencies
bun install   # or npm install

# 2. Install Playwright Chromium binaries
bunx playwright install chromium

# 3. Start the service
bun run dev   # Runs "node server.js"
```

The server will spin up on [http://localhost:4000](http://localhost:4000).

---

## API Reference

### Health Check
`GET /health`
* **Auth**: None
* **Response**: `{"status": "ok"}`

### Trigger Crawl
`POST /crawl`
* **Auth Header**: `x-crawler-secret: <CRAWLER_SECRET>`
* **Body parameters**:
```json
{
  "url": "https://example.com",
  "analysisId": "cuid_id_from_db",
  "maxDepth": 2,
  "maxPages": 8,
  "deviceType": "DESKTOP" // or "MOBILE"
}
```
* **Response**:
```json
{
  "status": "started",
  "analysisId": "cuid_id_from_db"
}
```

---

## Docker Deployment

A lightweight `Dockerfile` is provided for isolated staging.

```bash
# Build image
docker build -t personaforge-crawler .

# Run container
docker run -p 4000:4000 --env-file .env personaforge-crawler
```
