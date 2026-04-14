"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

const MAX_NAME_LEN = 60;
const VALID_ROLES = [
  "solo",
  "creator",
  "team",
  "agency",
  "nonprofit",
] as const;

type Role = (typeof VALID_ROLES)[number];
const isRole = (v: unknown): v is Role =>
  typeof v === "string" && (VALID_ROLES as readonly string[]).includes(v);

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/auth/onboarding/workspace");
  }
  return session.user.id;
}

export async function saveWorkspace(formData: FormData) {
  const userId = await requireUserId();

  const name = String(formData.get("workspaceName") ?? "").trim();
  const role = formData.get("role");

  if (!name || name.length > MAX_NAME_LEN) {
    redirect(
      `/auth/onboarding/workspace?error=name&name=${encodeURIComponent(name)}`
    );
  }
  if (!isRole(role)) {
    redirect(
      `/auth/onboarding/workspace?error=role&name=${encodeURIComponent(name)}`
    );
  }

  await db
    .update(users)
    .set({ workspaceName: name, role, updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath("/auth/onboarding", "layout");
  redirect("/auth/onboarding/preferences");
}

export async function finishOnboarding(formData: FormData) {
  const userId = await requireUserId();

  const tz = String(formData.get("timezone") ?? "").trim();
  // Accept anything IANA-shaped or "UTC". Validate via Intl.
  const timezone = isValidTimezone(tz) ? tz : "UTC";

  await db
    .update(users)
    .set({
      timezone,
      onboardedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  revalidatePath("/app", "layout");
  redirect("/app/dashboard");
}

function isValidTimezone(tz: string) {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
