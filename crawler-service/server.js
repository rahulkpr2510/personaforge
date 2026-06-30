import "dotenv/config";
import express from "express";
import { chromium } from "playwright";
import ImageKit from "imagekit";

const app = express();
app.use(express.json({ limit: "10mb" }));

const imagekit = new ImageKit({
	publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
	privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
	urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Auth guard — internal service only
app.use((req, res, next) => {
	const secret = req.headers["x-crawler-secret"];
	if (secret !== process.env.CRAWLER_SECRET) {
		return res.status(401).json({ error: "Unauthorized" });
	}
	next();
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.post("/crawl", async (req, res) => {
	const {
		url,
		analysisId,
		maxDepth = 2,
		maxPages = 8,
		deviceType = "DESKTOP",
	} = req.body;

	if (!url || !analysisId) {
		return res.status(400).json({ error: "url and analysisId required" });
	}

	console.log(`\n[crawler] ▶ START analysisId=${analysisId} url=${url} device=${deviceType}`);

	// Acknowledge immediately, process async
	res.json({ status: "started", analysisId });

	try {
		console.log(`[crawler] 🌐 Launching browser for ${url}...`);
		const result = await crawlAndUpload(url, analysisId, {
			maxDepth,
			maxPages,
			deviceType,
		});
		console.log(`[crawler] ✅ Crawl done — ${result.pages.length} page(s) captured`);

		// POST result back to Next.js callback
		console.log(`[crawler] 📤 Posting results to ${process.env.NEXT_APP_URL}/api/internal/crawl-complete`);
		const callbackRes = await fetch(`${process.env.NEXT_APP_URL}/api/internal/crawl-complete`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-internal-secret": process.env.INTERNAL_SECRET,
			},
			body: JSON.stringify({ analysisId, result }),
		});
		const callbackBody = await callbackRes.text();
		console.log(`[crawler] 📥 Callback response: ${callbackRes.status} ${callbackBody}`);
	} catch (err) {
		console.error(`[crawler] ❌ Error for ${analysisId}:`, err.message ?? err);
		try {
			const failRes = await fetch(`${process.env.NEXT_APP_URL}/api/internal/crawl-failed`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-internal-secret": process.env.INTERNAL_SECRET,
				},
				body: JSON.stringify({ analysisId, error: String(err) }),
			});
			console.log(`[crawler] 📥 Fail callback: ${failRes.status}`);
		} catch (cbErr) {
			console.error("[crawler] ❌ Fail callback also failed:", cbErr.message);
		}
	}
});

async function crawlAndUpload(url, analysisId, opts) {
	const { maxDepth, maxPages, deviceType } = opts;
	const DESKTOP_VP = { width: 1280, height: 800 };
	const MOBILE_VP = { width: 390, height: 844 };

	const browser = await chromium.launch({
		headless: true,
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-dev-shm-usage",
		],
	});

	const context = await browser.newContext({
		viewport: deviceType === "MOBILE" ? MOBILE_VP : DESKTOP_VP,
		userAgent:
			deviceType === "MOBILE"
				? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
				: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
	});

	const visited = new Set();
	const pages = [];
	const origin = new URL(url).origin;

	async function crawlPage(pageUrl, depth) {
		if (visited.size >= maxPages || depth > maxDepth || visited.has(pageUrl))
			return;
		visited.add(pageUrl);

		const page = await context.newPage();
		try {
			await page.goto(pageUrl, {
				waitUntil: "domcontentloaded",
				timeout: 30000,
			});
			await page.waitForTimeout(1500);

			const [fullBuf, vpBuf] = await Promise.all([
				page.screenshot({ fullPage: true }),
				page.screenshot({ fullPage: false }),
			]);

			const [title, content, metrics, links] = await Promise.all([
				page.title(),
				page.evaluate(() => document.body?.innerText?.slice(0, 5000) ?? ""),
				page.evaluate(() => ({
					formsCount: document.querySelectorAll("form").length,
					buttonsCount: document.querySelectorAll(
						"button,[role=button],input[type=submit]",
					).length,
					linksCount: document.querySelectorAll("a[href]").length,
					textLength: document.body?.innerText?.length ?? 0,
					hasAuthForm: !!document.querySelector("[type=password]"),
					primaryActionLabel:
						document
							.querySelector("button[type=submit],.cta")
							?.textContent?.trim() ?? null,
					navStructure: Array.from(document.querySelectorAll("nav a"))
						.map((a) => ({ text: a.textContent?.trim(), href: a.href }))
						.slice(0, 30),
				})),
				page.evaluate(
					(origin) =>
						Array.from(document.querySelectorAll("a[href]"))
							.map((a) => a.href)
							.filter(
								(h) =>
									h.startsWith(origin) &&
									!h.includes("#") &&
									!h.match(/\.(pdf|png|jpg|zip)$/i),
							)
							.slice(0, 20),
					origin,
				),
			]);

			// Upload to ImageKit
			const slug = `${analysisId}-p${visited.size}`;
			const [fullUrl, vpUrl] = await Promise.all([
				uploadBuffer(fullBuf, `${slug}-full.png`),
				uploadBuffer(vpBuf, `${slug}-vp.png`),
			]);

			pages.push({
				url: pageUrl,
				depth,
				title,
				content,
				metrics,
				links,
				screenshots: [
					{ cdnUrl: fullUrl, type: "FULL_PAGE" },
					{ cdnUrl: vpUrl, type: "VIEWPORT" },
				],
			});

			if (depth < maxDepth) {
				for (const link of links) await crawlPage(link, depth + 1);
			}
		} catch (err) {
			console.warn(`[crawlPage] ${pageUrl}:`, err.message);
		} finally {
			await page.close();
		}
	}

	await crawlPage(url, 0);
	await browser.close();
	return { pages, origin };
}

async function uploadBuffer(buffer, fileName) {
	const result = await imagekit.upload({
		file: buffer.toString("base64"),
		fileName,
		folder: "/personaforge/screenshots",
		useUniqueFileName: true,
	});
	return result.url;
}

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`[crawler-service] Running on :${PORT} — ready to receive crawl jobs`));

server.on("error", (err) => {
	if (err.code === "EADDRINUSE") {
		console.error(`[crawler-service] ❌ Port ${PORT} is already in use. Kill the other process and restart.`);
	} else {
		console.error("[crawler-service] ❌ Server error:", err);
	}
	process.exit(1);
});

process.on("uncaughtException", (err) => {
	console.error("[crawler-service] ❌ Uncaught exception:", err);
	process.exit(1);
});
