// LinkedIn OAuth scope helpers. The granted scope string on the
// `accounts` row is space-separated (LinkedIn returns it that way).
// Read endpoints under /rest/socialActions need `r_member_social`,
// which is gated behind LinkedIn's Community Management API product —
// "Sign In with LinkedIn" + "Share on LinkedIn" alone don't grant it.

export function hasLinkedInScope(
  scope: string | null | undefined,
  needed: string,
): boolean {
  if (!scope) return false;
  return scope.split(/\s+/).includes(needed);
}

// Convenience: the scope required to read likes/comments counters and
// the comments list off a member's shares.
export const LINKEDIN_SOCIAL_READ_SCOPE = "r_member_social";
