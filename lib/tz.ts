// Wall-clock ↔ UTC instant conversions that honor the user's configured
// timezone instead of the browser's. `datetime-local` inputs deal in naked
// "YYYY-MM-DDTHH:mm" strings with no zone; to keep the calendar, composer,
// and publish pipeline in agreement we always treat those strings as the
// user's configured tz.

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

// UTC Date → "YYYY-MM-DDTHH:mm" as it reads in `tz`.
export function utcDateToTzLocalInput(d: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

export function utcIsoToTzLocalInput(iso: string, tz: string): string {
  return utcDateToTzLocalInput(new Date(iso), tz);
}

// "YYYY-MM-DDTHH:mm" in `tz` → UTC Date. Computes the offset at the target
// instant (not "now"), so DST transitions land on the correct UTC moment.
export function tzLocalInputToUtcDate(local: string, tz: string): Date {
  const [date, time] = local.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time ?? "00:00").split(":").map(Number);
  const naiveUtc = Date.UTC(y, m - 1, d, hh, mm);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(naiveUtc));
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const tzHour = get("hour") === 24 ? 0 : get("hour");
  const asIfUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    tzHour,
    get("minute"),
    get("second"),
  );
  const offset = asIfUtc - naiveUtc;
  return new Date(naiveUtc - offset);
}

// Build a "YYYY-MM-DDTHH:mm" string directly from components. The calendar
// widget hands us a Date whose *browser-local* Y/M/D is the picked day, so
// we read those components with getFullYear/Month/Date — no tz conversion —
// and pair them with the user-entered time.
export function buildTzLocalInput(
  year: number,
  month: number,
  day: number,
  time: string,
): string {
  return `${year}-${pad2(month)}-${pad2(day)}T${time}`;
}

// UTC Date → "YYYY-MM-DD" as it reads in `tz`. Use for "what calendar
// day is this instant on, in the user's timezone" — server runtime is UTC
// on Vercel, so naive `getFullYear/getMonth/getDate` calls will report
// the wrong day around midnight for any non-UTC user.
export function tzDateIso(d: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// Ordinal-day date format used across the app, in the user's timezone:
//   { time: false }            -> "9th May, 2026"
//   { time: true }             -> "9th May, 2026, 12:30 PM"
//   { year: false }            -> "9th May"  (compact for tight rows)
//   { year: false, time: true} -> "9th May, 12:30 PM"
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function ordinalSuffix(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function formatTzDateOrdinal(
  d: Date,
  tz: string,
  opts: { time?: boolean; year?: boolean } = {},
): string {
  const { time = false, year = true } = opts;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    ...(time
      ? { hour: "numeric", minute: "2-digit", hour12: true }
      : {}),
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = Number(get("day"));
  const month = MONTHS_LONG[Number(get("month")) - 1];
  const yearStr = get("year");
  const head = `${day}${ordinalSuffix(day)} ${month}`;
  const datePart = year ? `${head}, ${yearStr}` : head;
  if (!time) return datePart;
  const dayPeriod = get("dayPeriod");
  return `${datePart}, ${get("hour")}:${get("minute")} ${dayPeriod}`;
}

// Per-channel timestamp formatting that mimics how each platform's own
// card renders the post date. Used by the campaign inspector preview so
// the timestamp line under the avatar reads the way it actually does on
// Twitter / LinkedIn / etc. Best-effort approximations — the goal is "looks
// right at a glance", not strict fidelity to every edge case.
export function formatChannelTimestamp(
  d: Date,
  tz: string,
  channel: string,
): string {
  const time = (h12: boolean) =>
    new Intl.DateTimeFormat(h12 ? "en-US" : "en-GB", {
      timeZone: tz,
      hour: h12 ? "numeric" : "2-digit",
      minute: "2-digit",
      hour12: h12,
    }).format(d);
  const date = (style: "short" | "medium" | "long") => {
    const opts: Intl.DateTimeFormatOptions = { timeZone: tz };
    if (style === "short") {
      opts.month = "short";
      opts.day = "numeric";
    } else if (style === "medium") {
      opts.month = "short";
      opts.day = "numeric";
      opts.year = "numeric";
    } else {
      opts.month = "long";
      opts.day = "numeric";
      opts.year = "numeric";
    }
    return new Intl.DateTimeFormat("en-US", opts).format(d);
  };

  switch (channel) {
    case "twitter":
    case "x":
      // "1:30 PM · May 9, 2026"
      return `${time(true)} · ${date("medium")}`;
    case "bluesky":
      // "May 9, 2026 at 1:30 PM"
      return `${date("medium")} at ${time(true)}`;
    case "mastodon": {
      // "May 9, 2026, 13:30"
      return `${date("medium")}, ${time(false)}`;
    }
    case "linkedin":
    case "instagram":
    case "threads":
    case "medium":
    case "reddit":
    case "youtube":
      return date("medium");
    case "facebook":
      // "May 9 at 1:30 PM"
      return `${date("short")} at ${time(true)}`;
    case "telegram":
      return time(true);
    case "tiktok": {
      // "5-9" / "5-9-2026" — TikTok shows compact numeric
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        month: "numeric",
        day: "numeric",
        year: "numeric",
      }).formatToParts(d);
      const get = (t: string) =>
        parts.find((p) => p.type === t)?.value ?? "";
      const now = new Date();
      const sameYear =
        new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          year: "numeric",
        }).format(now) === get("year");
      return sameYear
        ? `${get("month")}-${get("day")}`
        : `${get("year")}-${get("month")}-${get("day")}`;
    }
    default:
      return `${date("medium")} · ${time(true)}`;
  }
}

export function formatTzLocalInputForDisplay(
  local: string,
  tz: string,
): string {
  const utc = tzLocalInputToUtcDate(local, tz);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: tz,
  }).format(utc);
}
