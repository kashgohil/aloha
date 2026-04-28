"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, unstable_update } from "@/auth";
import { db } from "@/db";
import { users, workspaceMembers, workspaces } from "@/db/schema";
import { newWorkspaceShortId } from "@/lib/workspaces/short-id";
import { bootstrapDefaultAutomations } from "@/lib/automations/bootstrap";

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

  // Ensure the user has a personal workspace. Mirrors the backfill script
  // so onboarding creates one the same way older users got theirs.
  const [owned] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.ownerUserId, userId))
    .limit(1);

  let workspaceId = owned?.id ?? null;
  let workspaceIsNew = false;
  if (!workspaceId) {
    const [created] = await db
      .insert(workspaces)
      .values({
        name,
        ownerUserId: userId,
        role,
        shortId: newWorkspaceShortId(),
      })
      .returning({ id: workspaces.id });
    workspaceId = created.id;
    workspaceIsNew = true;
  } else {
    // Keep workspace name / role in sync with what onboarding collected.
    await db
      .update(workspaces)
      .set({ name, role, updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId));
  }

  await db
    .insert(workspaceMembers)
    .values({ workspaceId, userId, role: "owner" })
    .onConflictDoNothing({
      target: [workspaceMembers.workspaceId, workspaceMembers.userId],
    });

  await db
    .update(users)
    .set({ activeWorkspaceId: workspaceId })
    .where(eq(users.id, userId));

  if (workspaceIsNew) {
    // Seed the weekly Insights digest. Failures are swallowed inside the
    // bootstrap helper; we don't want a transient QStash hiccup to break
    // onboarding.
    await bootstrapDefaultAutomations({
      workspaceId,
      ownerUserId: userId,
    });
  }

  await unstable_update({ user: {} });
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

  // Propagate timezone to the user's workspace so future workspace-scoped
  // code (scheduling, analytics windows) has it available.
  await db
    .update(workspaces)
    .set({ timezone, updatedAt: new Date() })
    .where(eq(workspaces.ownerUserId, userId));

  await unstable_update({ user: {} });
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
