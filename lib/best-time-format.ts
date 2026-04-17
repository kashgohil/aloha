// Client-safe types + formatters for best-time windows. Server-only code
// (DB queries) lives in `./best-time.ts`. Splitting these avoids pulling
// the postgres driver into client bundles when client components need to
// type-annotate a prop or render a formatted label.

export type BestWindow = {
  dayOfWeek: number; // 0 = Sun, 6 = Sat
  hourStart: number; // 0-22, two-hour band
  hourEnd: number; // hourStart + 2
  samples: number;
  deltaPct: number; // % above the user's own baseline for that platform
};

export const DAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

// Formats a window like "Tue 9–11am". Pure string math — safe in client bundles.
export function formatWindow(w: BestWindow): string {
  const day = DAY_LABELS[w.dayOfWeek];
  const from = formatHour(w.hourStart);
  const to = formatHour(w.hourEnd);
  return `${day} ${from}–${to}`;
}

function formatHour(h24: number): string {
  if (h24 === 0) return "12am";
  if (h24 === 12) return "12pm";
  const period = h24 < 12 ? "am" : "pm";
  const h = h24 % 12;
  return `${h}${period}`;
}
