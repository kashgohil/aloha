import { Polar } from "@polar-sh/sdk";
import { env } from "@/lib/env";

// Singleton Polar SDK client. Picks sandbox vs production from POLAR_SERVER.
// POLAR_ACCESS_TOKEN is optional while pricing is disabled; SDK calls made
// without a token will fail at request time, not at module load.
export const polar = new Polar({
	accessToken: env.POLAR_ACCESS_TOKEN ?? "",
	server: env.POLAR_SERVER,
});
