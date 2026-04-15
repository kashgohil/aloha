import { Polar } from "@polar-sh/sdk";
import { env } from "@/lib/env";

// Singleton Polar SDK client. Picks sandbox vs production from POLAR_SERVER.
export const polar = new Polar({
	accessToken: env.POLAR_ACCESS_TOKEN,
	server: env.POLAR_SERVER,
});
