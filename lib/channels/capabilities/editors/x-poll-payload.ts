import type { StudioPayload } from "@/db/schema";

export type XPollPayload = {
  text: string;
  options: string[];
  durationMinutes: number;
};

const MIN_OPTIONS = 2;

export function readXPollPayload(payload: StudioPayload): XPollPayload {
  const text = typeof payload.text === "string" ? payload.text : "";
  const rawOptions = Array.isArray(payload.options)
    ? payload.options.filter((o): o is string => typeof o === "string")
    : [];
  const options =
    rawOptions.length >= MIN_OPTIONS
      ? rawOptions
      : [...rawOptions, ...Array(MIN_OPTIONS - rawOptions.length).fill("")];
  const durationMinutes =
    typeof payload.durationMinutes === "number" ? payload.durationMinutes : 1440;
  return { text, options, durationMinutes };
}
