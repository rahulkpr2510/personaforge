import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./db";
import { UserRole } from "@prisma/client";

export async function syncUserWithDatabase() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.emailAddresses[0]?.emailAddress ??
    `missing-email-${clerkUser.id}@local`;
  const name =
    `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();

  const user = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email,
      name,
    },
    create: {
      clerkId: clerkUser.id,
      email,
      name,
      role: UserRole.USER, // you can manually promote to ADMIN via DB later
    },
  });

  return user;
}

export async function requireUser() {
  const user = await syncUserWithDatabase();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export function isAdmin(user: { role: UserRole }) {
  return user.role === "ADMIN";
}
