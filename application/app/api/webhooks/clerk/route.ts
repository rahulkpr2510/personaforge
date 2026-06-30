import { Webhook } from "svix";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import type { WebhookEvent } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[clerk-webhook] CLERK_WEBHOOK_SECRET is not set");
    return new Response("Service misconfigured", { status: 500 });
  }

  const body = await req.text();
  const headersList = await headers();

  const svixId = headersList.get("svix-id") ?? "";
  const svixTimestamp = headersList.get("svix-timestamp") ?? "";
  const svixSignature = headersList.get("svix-signature") ?? "";

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const wh = new Webhook(webhookSecret);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("[clerk-webhook] Signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const { id, email_addresses, first_name, last_name } = event.data;
    const email = email_addresses[0]?.email_address;

    if (!email) {
      console.warn(`[clerk-webhook] User ${id} has no email — skipping`);
      return new Response("OK", { status: 200 });
    }

    const name = `${first_name ?? ""} ${last_name ?? ""}`.trim() || null;

    await db.user.upsert({
      where: { clerkId: id },
      create: { clerkId: id, email, name },
      update: { email, name },
    });
  }

  if (event.type === "user.deleted" && event.data.id) {
    // Cascade delete via Prisma schema onDelete rules
    await db.user.deleteMany({ where: { clerkId: event.data.id } });
  }

  return new Response("OK", { status: 200 });
}
