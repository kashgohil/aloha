import { and, eq, notInArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/current-user";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";
import { db } from "@/db";
import { accounts, ideas } from "@/db/schema";
import { getBestWindowsForUser } from "@/lib/best-time";
import { getEffectiveStatesForUser } from "@/lib/channel-state";
import { Composer } from "./_components/composer";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function ComposerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = (await getCurrentUser())!;
  const params = await searchParams;
  const ideaId = first(params.idea) ?? null;

  const timezone = user.timezone ?? "UTC";

  const [connected, bestWindows, channelStates] = await Promise.all([
    db
      .selectDistinct({ provider: accounts.provider })
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, user.id),
          notInArray(accounts.provider, AUTH_ONLY_PROVIDERS),
        ),
      ),
    getBestWindowsForUser(user.id, timezone),
    getEffectiveStatesForUser(user.id),
  ]);

  // If the composer was opened from an idea, pull the body so the editor
  // starts populated. We don't auto-flip the idea to "drafted" here — the
  // user might abandon; they can archive explicitly from /app/ideas.
  let initialContent = "";
  if (ideaId) {
    const [idea] = await db
      .select({ id: ideas.id, body: ideas.body })
      .from(ideas)
      .where(and(eq(ideas.id, ideaId), eq(ideas.userId, user.id)))
      .limit(1);
    if (idea) initialContent = idea.body;
  }

  const connectedProviders = connected.map((c) => c.provider);

  return (
    <Composer
      author={{
        name: user.name ?? user.email.split("@")[0],
        email: user.email,
        image: user.image,
        workspaceName: user.workspaceName,
        timezone,
      }}
      connectedProviders={connectedProviders}
      bestWindows={bestWindows}
      channelStates={channelStates}
      initialContent={initialContent}
    />
  );
}
