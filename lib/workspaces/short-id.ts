import "server-only";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { workspaces } from "@/db/schema";

// 12 chars from a 32-char lowercase alphabet (Crockford-ish base32 minus
// confusable chars). 60 bits of entropy — more than enough for a
// per-workspace alias that's both URL-safe and email-local-part-safe.
// We avoid `0`, `1`, `i`, `l`, `o` so the printed alias doesn't get
// re-typed wrong when a creator reads it off a screen.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function generateShortId(length = 12): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

// Returns the workspace's shortId, lazily generating + persisting one if
// the row was created before the column landed. The retry loop covers
// the rare case of a uniqueness collision under concurrent backfill.
export async function ensureWorkspaceShortId(
  workspaceId: string,
): Promise<string> {
  const [row] = await db
    .select({ shortId: workspaces.shortId })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  if (!row) throw new Error("Workspace not found");
  if (row.shortId) return row.shortId;

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateShortId();
    try {
      const [updated] = await db
        .update(workspaces)
        .set({ shortId: candidate, updatedAt: new Date() })
        .where(eq(workspaces.id, workspaceId))
        .returning({ shortId: workspaces.shortId });
      if (updated?.shortId) return updated.shortId;
    } catch (err) {
      // Unique violation — retry with a fresh candidate.
      if (
        err instanceof Error &&
        /unique|duplicate/i.test(err.message)
      ) {
        continue;
      }
      throw err;
    }
  }
  throw new Error("Couldn't generate a unique workspace short id.");
}

// For new-workspace flows that want to set the id at insert time, no
// DB roundtrip needed — collision risk is negligible at 60 bits and any
// rare clash surfaces as a unique-violation we can retry on.
export function newWorkspaceShortId(): string {
  return generateShortId();
}
