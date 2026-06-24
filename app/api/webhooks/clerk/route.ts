import { Webhook } from "svix";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import type { WebhookEvent } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const svix_id = headersList.get("svix-id") ?? "";
  const svix_timestamp = headersList.get("svix-timestamp") ?? "";
  const svix_signature = headersList.get("svix-signature") ?? "";

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const { id, email_addresses, first_name, last_name } = event.data;
    const email = email_addresses[0]?.email_address;
    if (!email) return new Response("No email", { status: 400 });

    await db.user.upsert({
      where: { clerkId: id },
      create: {
        clerkId: id,
        email,
        name: `${first_name ?? ""} ${last_name ?? ""}`.trim() || null,
      },
      update: {
        email,
        name: `${first_name ?? ""} ${last_name ?? ""}`.trim() || null,
      },
    });
  }

  if (event.type === "user.deleted" && event.data.id) {
    await db.user.deleteMany({ where: { clerkId: event.data.id } });
  }

  return new Response("OK", { status: 200 });
}
