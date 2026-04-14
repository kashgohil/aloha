"use client";

import { useEffect, useId, useState } from "react";

export function TimezoneSelect({
  name,
  initial,
  zones,
}: {
  name: string;
  initial: string | null;
  zones: string[];
}) {
  const id = useId();
  const [value, setValue] = useState(initial ?? "UTC");

  // On mount, if the user hasn't set one yet, align to the browser's IANA zone.
  useEffect(() => {
    if (initial) return;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && zones.includes(tz)) setValue(tz);
    } catch {
      // Intl failures are non-fatal — UTC default stays.
    }
  }, [initial, zones]);

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-ink mb-2"
      >
        Timezone
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full h-12 px-4 rounded-2xl bg-background-elev border border-border-strong text-[15px] text-ink outline-none focus:border-ink transition-colors appearance-none cursor-pointer"
      >
        {zones.map((z) => (
          <option key={z} value={z}>
            {z.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <p className="mt-2 text-[12px] text-ink/50">
        We use this for scheduling, calendar views, and delivery times.
      </p>
    </div>
  );
}
