import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";

type DbUser = NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>>;

interface CachedUser {
  user: DbUser;
  email: string;
  name: string | null;
  expiresAt: number;
}

// 60s in-process cache to deduplicate DB lookups across parallel RSC requests.
const USER_CACHE_TTL_MS = 60_000;
const userCache = new Map<string, CachedUser>();

async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const name =
    `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null;

  const cached = userCache.get(userId);
  if (
    cached &&
    cached.expiresAt > Date.now() &&
    cached.email === email &&
    cached.name === name
  ) {
    return cached.user;
  }

  const existing = await db.user.findUnique({ where: { clerkId: userId } });

  let dbUser: CachedUser["user"];

  if (existing && existing.email === email && existing.name === name) {
    dbUser = existing;
  } else {
    dbUser = await db.user.upsert({
      where: { clerkId: userId },
      create: { clerkId: userId, email, name },
      update: { email, name },
    });
  }

  userCache.set(userId, { user: dbUser, email, name, expiresAt: Date.now() + USER_CACHE_TTL_MS });

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
