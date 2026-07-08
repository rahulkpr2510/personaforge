import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";

// ─── Per-userId in-process cache ─────────────────────────────────────────────
// Neon serverless has a strict limit on concurrent connection attempts.
// Every RSC request calls requireAuth() → db.user.upsert(). When Next.js fires
// multiple parallel requests (layout + page + API calls), Neon throws
// "Too many database connection attempts are currently ongoing".
//
// This cache deduplicates DB access: for 60s after a successful lookup,
// any request for the same userId returns immediately without a DB round-trip.
// The cache is invalidated when Clerk user data (email/name) changes.

// Use the full Prisma-inferred type so callers that access user.role etc. work.
type DbUser = NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>>;

interface CachedUser {
  user: DbUser;
  email: string;
  name: string | null;
  expiresAt: number;
}

const USER_CACHE_TTL_MS = 60_000; // 60 seconds
const userCache = new Map<string, CachedUser>();


async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) return null;

  // Resolve Clerk user data first (fast — uses Clerk's edge cache)
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const name =
    `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null;

  // Cache hit: return immediately if data hasn't changed and TTL is valid
  const cached = userCache.get(userId);
  if (
    cached &&
    cached.expiresAt > Date.now() &&
    cached.email === email &&
    cached.name === name
  ) {
    return cached.user;
  }

  // Read first — avoids a write on every request for existing users.
  // Only upsert if the user is new or their profile data has changed.
  const existing = await db.user.findUnique({ where: { clerkId: userId } });

  let dbUser: CachedUser["user"];

  if (existing && existing.email === email && existing.name === name) {
    // No changes — skip the write entirely
    dbUser = existing;
  } else {
    // New user or data changed — do the upsert
    dbUser = await db.user.upsert({
      where: { clerkId: userId },
      create: { clerkId: userId, email, name },
      update: { email, name },
    });
  }

  // Cache the result
  userCache.set(userId, { user: dbUser, email, name, expiresAt: Date.now() + USER_CACHE_TTL_MS });

  // Prune stale entries — prevents unbounded Map growth in long-lived processes
  if (userCache.size > 500) {
    const now = Date.now();
    for (const [key, entry] of userCache.entries()) {
      if (entry.expiresAt <= now) userCache.delete(key);
    }
  }

  return dbUser;
}

export async function requireAuth() {
  const user = await getOrCreateUser();
  if (!user) {
    const err = new Error("Unauthorized");
    (err as NodeJS.ErrnoException).code = "UNAUTHORIZED";
    throw err;
  }
  return user;
}
