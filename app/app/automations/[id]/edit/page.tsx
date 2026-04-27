import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { automations } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { getCurrentContext } from "@/lib/current-context";
import { hasRole, ROLES } from "@/lib/workspaces/roles";
import { Builder, type BuilderStepValues } from "../../_components/builder";
import {
  TEMPLATES,
  templateIsComingSoon,
  type AutomationKind,
} from "../../_lib/templates";
import { resolveSteps } from "../../_lib/steps";
import { updateAutomationFromBuilder } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditAutomationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Automations hidden in production; preserved for re-enable.
  if (true as boolean) notFound();
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");
  const ctx = await getCurrentContext();
  if (!ctx) redirect("/auth/signin");
  if (!hasRole(ctx.role, ROLES.ADMIN)) {
    redirect("/app/dashboard");
  }
  const { workspace } = ctx;

  const [row] = await db
    .select()
    .from(automations)
    .where(and(eq(automations.id, id), eq(automations.workspaceId, workspace.id)))
    .limit(1);
  if (!row) notFound();

  const kind = row.kind as AutomationKind;
  const template = TEMPLATES[kind];
  if (!template) notFound();

  // Block editing of templates whose backing integration hasn't shipped.
  // The save action would throw anyway; redirect before rendering the
  // builder so the user isn't handed a dead-end form.
  if (templateIsComingSoon(kind)) {
    redirect(`/app/automations?id=${id}`);
  }

  const storedSteps = resolveSteps(row);
  const initialStepValues: BuilderStepValues = {};
  template.nodes.forEach((n, i) => {
    const stepId = `${kind}:${i}`;
    const stored = storedSteps[i]?.config ?? {};
    initialStepValues[stepId] = stored;
  });

  return (
    <Builder
      mode="edit"
      kind={kind}
      initialName={row.name}
      initialStepValues={initialStepValues}
      action={updateAutomationFromBuilder}
      automationId={row.id}
    />
  );
}
