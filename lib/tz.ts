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
