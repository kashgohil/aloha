import { db } from "@/db";
import { subscribers, users } from "@/db/schema";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { eq } from "drizzle-orm";
import { unsubscribe } from "./actions";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage(props: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await props.params;
  const subscriberId = verifyUnsubscribeToken(token);

  if (!subscriberId) {
    return <Shell heading="Link expired" body="This unsubscribe link isn't valid. If you meant to stop receiving emails, click the link in the footer of a recent message — that one will always work." />;
  }

  const row = await db
    .select({
      id: subscribers.id,
      email: subscribers.email,
      unsubscribedAt: subscribers.unsubscribedAt,
      workspaceName: users.workspaceName,
      ownerName: users.name,
    })
    .from(subscribers)
    .leftJoin(users, eq(users.id, subscribers.createdByUserId))
    .where(eq(subscribers.id, subscriberId))
    .limit(1);

  const sub = row[0];
  if (!sub) {
    return <Shell heading="Already removed" body="We couldn't find this subscription — you might already be off the list." />;
  }

  const senderLabel = sub.workspaceName ?? sub.ownerName ?? "this list";

  if (sub.unsubscribedAt) {
    return (
      <Shell
        heading="You're off the list"
        body={`${sub.email} won't receive any more broadcasts from ${senderLabel}.`}
      />
    );
  }

  return (
    <Shell
      heading="Unsubscribe?"
      body={`Confirm to stop receiving broadcasts from ${senderLabel}. We'll keep ${sub.email} on record so you aren't accidentally re-added.`}
      action={
        <form action={unsubscribe}>
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            className="inline-flex items-center h-11 px-6 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
          >
            Unsubscribe
          </button>
        </form>
      }
    />
  );
}

function Shell({
  heading,
  body,
  action,
}: {
  heading: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen grid place-items-center px-6 py-16 bg-background text-ink">
      <div className="max-w-md w-full text-center space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Email preferences
        </p>
        <h1 className="font-display text-[36px] leading-[1.05] tracking-[-0.03em]">
          {heading}
        </h1>
        <p className="text-[14.5px] text-ink/70 leading-[1.55]">{body}</p>
        {action ? <div className="pt-4">{action}</div> : null}
      </div>
    </main>
  );
}
