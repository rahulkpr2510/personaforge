import { z } from "zod";

/** Strip HTML tags and control characters from all free-text fields */
function sanitizeText(val: string): string {
  return val
    .replace(/<[^>]*>/g, "") // strip HTML tags → XSS prevention
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip control chars
    .trim();
}

const SafeText = (min: number, max: number) =>
  z
    .string()
    .min(min)
    .max(max)
    .transform(sanitizeText)
    .refine((v) => v.length >= min, {
      message: `Must be at least ${min} characters after sanitization`,
    });

/**
 * URL validator with full SSRF protection.
 * Blocks: localhost, 127.x, RFC-1918 private ranges, .local mDNS,
 * cloud metadata endpoints, and all non-HTTP/HTTPS protocols.
 */
const SafeUrl = z
  .string()
  .url("Must be a valid URL")
  .max(2048, "URL too long")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) return false;

        const host = parsed.hostname.toLowerCase();
        const blockedHosts = [
          "localhost",
          "127.0.0.1",
          "0.0.0.0",
          "::1",
          "[::1]",
        ];
        if (blockedHosts.includes(host)) return false;

        const privateRanges =
          /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/;
        if (privateRanges.test(host)) return false;

        if (host.endsWith(".local")) return false;
        if (["169.254.169.254", "metadata.google.internal"].includes(host))
          return false;

        return true;
      } catch {
        return false;
      }
    },
    {
      message:
        "URL must be a public HTTP/HTTPS address (private networks not allowed)",
    },
  );

const TechnicalLevel = z.enum(["LOW", "MEDIUM", "HIGH"]);
const DeviceType = z.enum(["DESKTOP", "MOBILE"]);

// ─── Persona ──────────────────────────────────────────────────────────────────

export const CustomPersonaSchema = z.object({
  name: SafeText(2, 80),
  age: z.number().int().min(13).max(120),
  occupation: SafeText(2, 100),
  technicalLevel: TechnicalLevel,
  goals: SafeText(10, 500),
  frustrations: SafeText(10, 500),
  tags: z.array(z.string().max(30)).max(10).optional().default([]),
});

export type CustomPersonaInput = z.infer<typeof CustomPersonaSchema>;

// ─── Analysis creation ────────────────────────────────────────────────────────

export const CreateAnalysisSchema = z
  .object({
    url: SafeUrl,
    personaIds: z.array(z.string().cuid()).max(5).optional().default([]),
    customPersonas: z
      .array(
        z.object({
          name: SafeText(2, 80),
          age: z.number().int().min(13).max(120),
          occupation: SafeText(2, 100),
          technicalLevel: TechnicalLevel,
          goals: SafeText(10, 500),
          frustrations: SafeText(10, 500),
        }),
      )
      .max(5)
      .optional()
      .default([]),
    deviceType: DeviceType.optional().default("DESKTOP"),
  })
  .refine((d) => d.personaIds.length + d.customPersonas.length >= 1, {
    message: "At least 1 persona is required",
    path: ["personaIds"],
  })
  .refine((d) => d.personaIds.length + d.customPersonas.length <= 5, {
    message: "Maximum 5 personas allowed",
    path: ["personaIds"],
  });

export type CreateAnalysisInput = z.infer<typeof CreateAnalysisSchema>;

// ─── Internal crawl-complete payload ─────────────────────────────────────────

const PageMetricsSchema = z.object({
  formsCount: z.number().int().min(0).max(1000),
  buttonsCount: z.number().int().min(0).max(5000),
  linksCount: z.number().int().min(0).max(10000),
  textLength: z.number().int().min(0),
  hasAuthForm: z.boolean(),
  primaryActionLabel: z.string().max(200).nullable(),
  navStructure: z
    .array(
      z.object({
        text: z.string().max(200).optional(),
        href: z.string().max(2048),
      }),
    )
    .max(50),
});

const CrawledPageSchema = z.object({
  url: z.string().url().max(2048),
  depth: z.number().int().min(0).max(10),
  title: z.string().max(500),
  content: z.string().max(10000),
  metrics: PageMetricsSchema,
  links: z.array(z.string().url().max(2048)).max(100),
  screenshots: z
    .array(
      z.object({
        cdnUrl: z.string().url().max(2048),
        type: z.enum(["FULL_PAGE", "VIEWPORT"]),
      }),
    )
    .max(4),
});

export const CrawlCompletePayloadSchema = z.object({
  analysisId: z.string().cuid(),
  result: z.object({
    pages: z.array(CrawledPageSchema).min(1).max(20),
  }),
});

export type CrawlCompletePayload = z.infer<typeof CrawlCompletePayloadSchema>;
