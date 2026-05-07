// Helpers for building URLs that open or transition the compose dialog
// without leaving the user's current page. The dialog reads `?compose`
// from any URL inside /app, so callers preserve the current pathname +
// other query params and just swap that one.

export function composeHref(
  current: { pathname: string; search: URLSearchParams },
  target:
    | { mode: "new"; ideaId?: string | null; day?: string | null }
    | { mode: "edit"; postId: string }
    | { mode: "close" },
): string {
  const next = new URLSearchParams(current.search.toString());
  next.delete("compose");
  // Strip the legacy alias too — older URLs may still carry it.
  next.delete("studio");
  next.delete("idea");
  next.delete("day");

  if (target.mode === "new") {
    next.set("compose", "new");
    if (target.ideaId) next.set("idea", target.ideaId);
    if (target.day) next.set("day", target.day);
  } else if (target.mode === "edit") {
    next.set("compose", target.postId);
  }

  const qs = next.toString();
  return qs ? `${current.pathname}?${qs}` : current.pathname;
}
