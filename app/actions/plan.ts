"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { CostCapExceededError } from "@/lib/ai/cost-cap";
import { generatePlan, loadPlan, markIdeaAccepted } from "@/lib/ai/plan";
import { getCurrentUser } from "@/lib/current-user";

function parseStringList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createPlanAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const goal = String(formData.get("goal") ?? "").trim();
  if (!goal) throw new Error("Goal is required.");

  const themes = parseStringList(String(formData.get("themes") ?? ""));
  const channels = formData
    .getAll("channels")
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (channels.length === 0) throw new Error("Pick at least one channel.");

  const frequency = Math.max(
    1,
    Math.min(14, Number(formData.get("frequency") ?? 5)),
  );
  const rangeStartStr = String(formData.get("rangeStart") ?? "").trim();
  const rangeEndStr = String(formData.get("rangeEnd") ?? "").trim();
  if (!rangeStartStr || !rangeEndStr) throw new Error("Pick a date range.");
  const rangeStart = new Date(`${rangeStartStr}T00:00:00Z`);
  const rangeEnd = new Date(`${rangeEndStr}T23:59:59Z`);

  let planId: string;
  try {
    const plan = await generatePlan({
      userId: user.id,
      goal,
      themes,
      channels,
      frequency,
      rangeStart,
      rangeEnd,
    });
    planId = plan.planId;
  } catch (err) {
    if (err instanceof CostCapExceededError) throw err;
    throw err;
  }

  revalidatePath("/app/calendar/plan");
  redirect(`/app/calendar/plan?id=${planId}`);
}

// Accepts one or more ideas from a plan: creates a draft `posts` row per
// accepted idea, scheduled for noon UTC on the proposed date (user can
// adjust in the composer), and back-refs the draft into the plan.
export async function acceptPlanIdeasAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const planId = String(formData.get("planId") ?? "");
  const ideaIds = formData
    .getAll("ideaIds")
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (!planId || ideaIds.length === 0) {
    throw new Error("Pick at least one idea to accept.");
  }

  const plan = await loadPlan(user.id, planId);
  if (!plan) throw new Error("Plan not found.");

  for (const idea of plan.ideas) {
    if (!ideaIds.includes(idea.id)) continue;
    if (idea.accepted) continue;

    // Noon UTC on the proposed day — a neutral default; the user tunes the
    // exact minute in the composer.
    const scheduledAt = new Date(`${idea.date}T12:00:00Z`);
    const content = idea.title + (idea.angle ? `\n\n${idea.angle}` : "");
    const [post] = await db
      .insert(posts)
      .values({
        userId: user.id,
        content,
        platforms: [idea.channel],
        status: "draft",
        scheduledAt,
      })
      .returning({ id: posts.id });
    await markIdeaAccepted(planId, idea.id, post.id);
  }

  revalidatePath("/app/calendar/plan");
  redirect(`/app/calendar/plan?id=${planId}&accepted=1`);
}
