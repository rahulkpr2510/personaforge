import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";

async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const name =
    `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null;

  return db.user.upsert({
    where: { clerkId: userId },
    create: { clerkId: userId, email, name },
    update: { email, name },
  });
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
