// Thrown by publishers when a platform call fails. The category maps to
// how we should react: retry, surface to user as reauth, or mark failed.

export type PublishErrorCategory =
	| "needs_reauth" // 401 after refresh attempt — user must reconnect
	| "rate_limited" // 429 — should retry later
	| "forbidden" // 403 — content / scope issue, don't retry
	| "invalid_content" // 4xx content-specific — don't retry
	| "transient"; // 5xx / network — safe to retry

export class PublishError extends Error {
	constructor(
		public category: PublishErrorCategory,
		message: string,
		public cause?: unknown,
	) {
		super(message);
		this.name = "PublishError";
	}
}

export function categorizeHttpStatus(status: number): PublishErrorCategory {
	if (status === 401) return "needs_reauth";
	if (status === 403) return "forbidden";
	if (status === 429) return "rate_limited";
	if (status >= 500) return "transient";
	return "invalid_content";
}
