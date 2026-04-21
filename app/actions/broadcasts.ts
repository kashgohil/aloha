"use server";

import { and, eq, isNull } from "drizzle-orm";
import { Client } from "@upstash/qstash";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/db";
import { broadcasts, sendingDomains, subscribers } from "@/db/schema";
import { generateBroadcastDraft } from "@/lib/ai/broadcast";
import { requireBroadcastEntitlement } from "@/lib/billing/broadcasts";
import { requireMuseAccess } from "@/lib/billing/muse";
import { env } from "@/lib/env";

const qstashClient = new Client({
  token: env.QSTASH_TOKEN,
  baseUrl: env.QSTASH_URL,
});

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function createBroadcastDraft() {
  const userId = await requireUserId();
  await requireBroadcastEntitlement(userId);

  // Seed `fromAddress` with a placeholder. User picks a verified domain in
  // the composer, which flips this to `hello@<domain>`. Storing the domain
  // id separately lets us show which domain was chosen even after the
  // address is edited.
  const [row] = await db
    .insert(broadcasts)
    .values({
      userId,
      subject: "",
      body: "",
      fromAddress: "",
    })
    .returning({ id: broadcasts.id });

  revalidatePath("/app/broadcasts");
  redirect(`/app/broadcasts/${row.id}`);
}

export async function updateBroadcastDraft(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing id");

  const row = await db.query.broadcasts.findFirst({
    where: and(eq(broadcasts.id, id), eq(broadcasts.userId, userId)),
  });
  if (!row) throw new Error("Broadcast not found");
  if (row.status !== "draft") {
    throw new Error("Can't edit a broadcast once it's been sent.");
  }

  const subject = String(formData.get("subject") ?? "").trim();
  const preheader = String(formData.get("preheader") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "");
  const fromName = String(formData.get("fromName") ?? "").trim() || null;
  const replyTo = String(formData.get("replyTo") ?? "").trim() || null;
  const sendingDomainId = String(formData.get("sendingDomainId") ?? "") || null;
  const fromLocalPart = String(formData.get("fromLocalPart") ?? "").trim();

  let fromAddress = row.fromAddress;
  if (sendingDomainId && fromLocalPart) {
    const domain = await db.query.sendingDomains.findFirst({
      where: and(
        eq(sendingDomains.id, sendingDomainId),
        eq(sendingDomains.userId, userId),
      ),
    });
    if (!domain) throw new Error("Pick a domain you own.");
    fromAddress = `${fromLocalPart}@${domain.domain}`;
  }

  await db
    .update(broadcasts)
    .set({
      subject,
      preheader,
      body,
      fromName,
      replyTo,
      sendingDomainId,
      fromAddress,
      updatedAt: new Date(),
    })
    .where(eq(broadcasts.id, id));

  revalidatePath(`/app/broadcasts/${id}`);
  revalidatePath("/app/broadcasts");
}

export async function deleteBroadcast(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const row = await db.query.broadcasts.findFirst({
    where: and(eq(broadcasts.id, id), eq(broadcasts.userId, userId)),
  });
  if (!row) return;
  if (row.status !== "draft") {
    throw new Error("Only drafts can be deleted.");
  }

  await db.delete(broadcasts).where(eq(broadcasts.id, id));
  revalidatePath("/app/broadcasts");
  redirect("/app/broadcasts");
}

export async function draftBroadcastWithMuse(formData: FormData): Promise<{
  subject: string;
  preheader: string;
  body: string;
}> {
  const userId = await requireUserId();
  await requireBroadcastEntitlement(userId);
  await requireMuseAccess(userId);
  const id = String(formData.get("id") ?? "");
  const brief = String(formData.get("brief") ?? "").trim();
  if (!id) throw new Error("Missing id");
  if (!brief) throw new Error("Tell Muse what the email is about.");

  const row = await db.query.broadcasts.findFirst({
    where: and(eq(broadcasts.id, id), eq(broadcasts.userId, userId)),
  });
  if (!row) throw new Error("Broadcast not found");
  if (row.status !== "draft") {
    throw new Error("This broadcast has already been queued.");
  }

  const draft = await generateBroadcastDraft({ userId, brief });

  await db
    .update(broadcasts)
    .set({
      subject: draft.subject,
      preheader: draft.preheader,
      body: draft.body,
      generationId: draft.generationId,
      updatedAt: new Date(),
    })
    .where(eq(broadcasts.id, id));

  revalidatePath(`/app/broadcasts/${id}`);
  return {
    subject: draft.subject,
    preheader: draft.preheader,
    body: draft.body,
  };
}

export async function sendBroadcastNow(formData: FormData) {
  const userId = await requireUserId();
  await requireBroadcastEntitlement(userId);
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing id");

  const row = await db.query.broadcasts.findFirst({
    where: and(eq(broadcasts.id, id), eq(broadcasts.userId, userId)),
  });
  if (!row) throw new Error("Broadcast not found");
  if (row.status !== "draft") {
    throw new Error("This broadcast has already been queued.");
  }

  if (!row.subject.trim()) throw new Error("Add a subject before sending.");
  if (!row.body.trim()) throw new Error("Add a body before sending.");
  if (!row.fromAddress) throw new Error("Pick a From address before sending.");

  // Block unless the selected domain is verified. A broadcast without a
  // verified domain silently fails Resend's acceptance — catch it here so
  // the error shows up in the composer, not in a send log the user never
  // checks.
  if (!row.sendingDomainId) {
    throw new Error("Pick a verified sending domain first.");
  }
  const domain = await db.query.sendingDomains.findFirst({
    where: and(
      eq(sendingDomains.id, row.sendingDomainId),
      eq(sendingDomains.userId, userId),
    ),
  });
  if (!domain || domain.status !== "verified") {
    throw new Error("That domain isn't verified yet. Finish DNS setup first.");
  }

  // Require at least one eligible recipient so we don't flip a broadcast
  // to `sending` with nothing to send.
  const eligible = await db
    .select({ id: subscribers.id })
    .from(subscribers)
    .where(
      and(eq(subscribers.userId, userId), isNull(subscribers.unsubscribedAt)),
    )
    .limit(1);
  if (eligible.length === 0) {
    throw new Error("You don't have any active subscribers yet.");
  }

  await db
    .update(broadcasts)
    .set({ status: "sending", updatedAt: new Date() })
    .where(eq(broadcasts.id, id));

  // Fan-out runs in a QStash worker so slow DB inserts + per-recipient
  // publishJSON calls don't block the request. The worker creates one
  // broadcast_sends row per recipient, then enqueues one send job per row.
  await qstashClient.publishJSON({
    url: `${env.APP_URL}/api/qstash/broadcast-fanout`,
    body: { broadcastId: id },
  });

  revalidatePath(`/app/broadcasts/${id}`);
  revalidatePath("/app/broadcasts");
}
