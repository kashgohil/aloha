import { cache } from "react";
import { auth } from "@/auth";

// Memoized per-request. Reads the JWT session directly — no DB hit.
// Fields are populated in the jwt callback on sign-in and refreshed via
// `unstable_update` after profile/workspace/timezone mutations.
export const getCurrentUser = cache(async () => {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;

  // Email is NOT NULL in the users table and is always set on the token
  // during sign-in, so this narrowing is safe.
  if (!user.email) return null;

  return {
    id: user.id,
    name: user.name ?? null,
    email: user.email,
    image: user.image ?? null,
    workspaceName: user.workspaceName,
    role: user.role,
    timezone: user.timezone,
    onboardedAt: user.onboardedAt,
  };
});

export type CurrentUser = NonNullable<
  Awaited<ReturnType<typeof getCurrentUser>>
>;
