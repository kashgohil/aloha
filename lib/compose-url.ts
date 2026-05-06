// Helpers for building URLs that open or transition the composer dialog
// without leaving the user's current page. The dialog reads `?compose`
// and `?studio` params from any URL in /app, so callers preserve the
// current pathname + other query params and just swap these two.

export function composeHref(
  current: { pathname: string; search: URLSearchParams },
  target:
    | { mode: "new"; ideaId?: string | null; day?: string | null }
    | { mode: "edit"; postId: string }
    | { mode: "studio"; postId: string }
    | { mode: "close" },
): string {
  const next = new URLSearchParams(current.search.toString());
  next.delete("compose");
  next.delete("studio");
  next.delete("idea");
  next.delete("day");

  if (target.mode === "new") {
    next.set("compose", "new");
    if (target.ideaId) next.set("idea", target.ideaId);
    if (target.day) next.set("day", target.day);
  } else if (target.mode === "edit") {
    next.set("compose", target.postId);
  } else if (target.mode === "studio") {
    next.set("studio", target.postId);
  }

  const qs = next.toString();
  return qs ? `${current.pathname}?${qs}` : current.pathname;
}
