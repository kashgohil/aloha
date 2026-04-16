import { and, eq, notInArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/current-user";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { Composer } from "./_components/composer";

export const dynamic = "force-dynamic";

export default async function ComposerPage() {
  const user = (await getCurrentUser())!;

  const connected = await db
    .selectDistinct({ provider: accounts.provider })
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, user.id),
        notInArray(accounts.provider, AUTH_ONLY_PROVIDERS),
      ),
    );

  const connectedProviders = connected.map((c) => c.provider);

  return (
    <Composer
      author={{
        name: user.name ?? user.email.split("@")[0],
        email: user.email,
        image: user.image,
        workspaceName: user.workspaceName,
        timezone: user.timezone ?? "UTC",
      }}
      connectedProviders={connectedProviders}
    />
  );
}
