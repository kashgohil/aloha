import { requireContext, type CurrentContext, type WorkspaceRole } from "@/lib/current-context";
import { PermissionError } from "@/lib/workspaces/roles";

// Role guard. Load context, verify the caller has one of the roles in
// `required`, return context for the action body to use. Throws with a
// structured error so UI layers can distinguish "not signed in" from
// "not allowed" when they catch.
export async function assertRole(
  required: readonly WorkspaceRole[],
): Promise<CurrentContext> {
  const ctx = await requireContext();
  if (!required.includes(ctx.role)) {
    throw new PermissionError(required, ctx.role);
  }
  return ctx;
}

// Curried wrapper for server actions. Hides the role check in one line
// at the top of the action:
//
//   export const deletePost = withRole(ROLES.ADMIN, async (ctx, id) => {
//     await db.delete(posts).where(eq(posts.id, id));
//   });
//
// The handler receives `ctx` as its first arg followed by whatever
// arguments the caller passed. `"use server"` files wrap their
// exported actions with this; pages/components call the result just
// like any other server action.
export function withRole<Args extends unknown[], R>(
  required: readonly WorkspaceRole[],
  handler: (ctx: CurrentContext, ...args: Args) => Promise<R>,
): (...args: Args) => Promise<R> {
  return async (...args: Args) => {
    const ctx = await assertRole(required);
    return handler(ctx, ...args);
  };
}
