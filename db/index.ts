import { env } from "@/lib/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// On Vercel serverless we want one short-lived connection per function
// instance and no prepared-statement handshake — pgBouncer in transaction
// mode (what Vercel's Postgres integration uses) does not support them.
// Locally (long-running dev server) we still benefit from a small pool.
const isServerless = Boolean(process.env.VERCEL);

const queryClient = postgres(env.DATABASE_URL, {
  prepare: false,
  max: isServerless ? 1 : 10,
  idle_timeout: isServerless ? 20 : 60,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });
