import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";

export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  let user = await db.user.findUnique({ where: { clerkId: userId } });

  if (!user) {
    user = await db.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        name:
          `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
          null,
      },
    });
  }
  return user;
}

export async function requireAuth() {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
