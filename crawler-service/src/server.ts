// crawler/src/server.ts
import "dotenv/config";
import express from "express";
import { executeCrawlJob } from "./run-job.js";
import type { CrawlJobInput } from "./index.js";

const app = express();
app.use(express.json({ limit: "2mb" }));

const INTERNAL_API_KEY = process.env.CRAWLER_INTERNAL_API_KEY;

if (!INTERNAL_API_KEY) {
	throw new Error("Missing CRAWLER_INTERNAL_API_KEY");
}

app.get("/health", (_req, res) => {
	res.json({ ok: true, service: "personaforge-crawler" });
});

app.post("/crawl", async (req, res) => {
	const apiKey = req.header("x-internal-api-key");
	if (apiKey !== INTERNAL_API_KEY) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const body = req.body as Partial<CrawlJobInput>;

	if (!body.analysisId || !body.url || !body.callbackBaseUrl) {
		return res.status(400).json({
			error: "Missing required fields: analysisId, url, callbackBaseUrl",
		});
	}

	const job: CrawlJobInput = {
		analysisId: body.analysisId,
		url: body.url,
		deviceType: body.deviceType ?? "DESKTOP",
		maxDepth: body.maxDepth ?? 2,
		maxPages: body.maxPages ?? 8,
		credentials: body.credentials,
		callbackBaseUrl: body.callbackBaseUrl,
		internalApiKey: INTERNAL_API_KEY,
	};

	res.status(202).json({
		accepted: true,
		analysisId: job.analysisId,
	});

	executeCrawlJob(job).catch((err: unknown) => {
		console.error(`Crawl job failed for ${job.analysisId}:`, err);
	});
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
	console.log(`Crawler listening on port ${port}`);
});
