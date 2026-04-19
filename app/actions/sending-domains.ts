"use server";

import "server-only";
import { Resend } from "resend";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db";
import { sendingDomains } from "@/db/schema";
import { requireBroadcastEntitlement } from "@/lib/billing/broadcasts";
import { env } from "@/lib/env";
import { dispatchEvent } from "@/lib/automations/dispatch";

const resend = new Resend(env.RESEND_API_KEY);

// RFC-ish sanity check. Full validation lives on Resend's side; we just
// reject obvious garbage before burning an API call.
const DOMAIN_RE =
  /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// Resend returns a richer status set than we persist. `not_started` /
// `temporary_failure` both mean "DNS hasn't propagated yet, try again" —
// collapse them into `pending` for our UI.
function mapStatus(
  status: string | undefined,
): "pending" | "verified" | "failed" {
  if (status === "verified") return "verified";
  if (status === "failed") return "failed";
  return "pending";
}

function normalizeRecords(
  records: Array<{ name: string; type: string; value: string }> | undefined,
) {
  if (!records) return [];
  return records.map((r) => ({ name: r.name, type: r.type, value: r.value }));
}

export async function addSendingDomain(formData: FormData) {
  const userId = await requireUserId();
  await requireBroadcastEntitlement(userId);
  const domain = String(formData.get("domain") ?? "")
    .trim()
    .toLowerCase();

  if (!DOMAIN_RE.test(domain)) {
    throw new Error(
      "Enter a bare domain like send.yourco.com — no https:// or paths.",
    );
  }

  const existing = await db.query.sendingDomains.findFirst({
    where: and(
      eq(sendingDomains.userId, userId),
      eq(sendingDomains.domain, domain),
    ),
  });
  if (existing) {
    throw new Error("You've already added that domain.");
  }

  // New domains start with tracking off — privacy-first default. Users opt
  // in on the detail view after the domain is live.
  const { data, error } = await resend.domains.create({
    name: domain,
    openTracking: false,
    clickTracking: false,
  });
  if (error || !data) {
    throw new Error(`Resend rejected the domain: ${error?.message ?? "unknown error"}`);
  }

  await db.insert(sendingDomains).values({
    userId,
    domain,
    resendDomainId: data.id,
    status: mapStatus(data.status),
    dkimRecords: normalizeRecords(data.records),
    lastCheckedAt: new Date(),
  });

  revalidatePath("/app/audience/sending");
}

export async function updateSendingDomainTracking(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing id");

  const row = await db.query.sendingDomains.findFirst({
    where: and(eq(sendingDomains.id, id), eq(sendingDomains.userId, userId)),
  });
  if (!row) throw new Error("Domain not found.");
  if (!row.resendDomainId) {
    throw new Error("Domain is missing a Resend id; remove and re-add it.");
  }

  // Checkbox form inputs are absent when unchecked. Read both as booleans
  // so toggling either off propagates to Resend.
  const openTracking = formData.get("openTracking") === "on";
  const clickTracking = formData.get("clickTracking") === "on";

  const { error } = await resend.domains.update({
    id: row.resendDomainId,
    openTracking,
    clickTracking,
  });
  if (error) {
    throw new Error(`Couldn't update tracking: ${error.message}`);
  }

  await db
    .update(sendingDomains)
    .set({
      openTracking,
      clickTracking,
      updatedAt: new Date(),
    })
    .where(eq(sendingDomains.id, id));

  revalidatePath("/app/audience/sending");
}

export async function verifySendingDomain(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const row = await db.query.sendingDomains.findFirst({
    where: and(eq(sendingDomains.id, id), eq(sendingDomains.userId, userId)),
  });
  if (!row) throw new Error("Domain not found.");
  if (!row.resendDomainId) {
    throw new Error("Domain is missing a Resend id; remove and re-add it.");
  }

  // `verify` tells Resend to re-check DNS now. It returns only { id }, so
  // we follow up with `get` to read the freshened status + records.
  await resend.domains.verify(row.resendDomainId);
  const { data, error } = await resend.domains.get(row.resendDomainId);
  if (error || !data) {
    throw new Error(`Couldn't read domain status: ${error?.message ?? "unknown"}`);
  }

  const status = mapStatus(data.status);
  const justVerified = status === "verified" && row.status !== "verified";
  await db
    .update(sendingDomains)
    .set({
      status,
      dkimRecords: normalizeRecords(data.records),
      verifiedAt: status === "verified" ? row.verifiedAt ?? new Date() : null,
      lastCheckedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(sendingDomains.id, id));

  if (justVerified) {
    dispatchEvent({
      triggerKind: "domain_verified",
      userId,
      payload: { domainId: row.id, domain: row.domain },
    }).catch((err) =>
      console.error("[automations] domain_verified dispatch failed", err),
    );
  }

  revalidatePath("/app/audience/sending");
}

export async function deleteSendingDomain(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const row = await db.query.sendingDomains.findFirst({
    where: and(eq(sendingDomains.id, id), eq(sendingDomains.userId, userId)),
  });
  if (!row) return;

  if (row.resendDomainId) {
    // Best-effort — if Resend already purged it, don't block local delete.
    try {
      await resend.domains.remove(row.resendDomainId);
    } catch {}
  }

  await db.delete(sendingDomains).where(eq(sendingDomains.id, id));
  revalidatePath("/app/audience/sending");
}
