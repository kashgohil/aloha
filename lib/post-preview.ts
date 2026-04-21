// Resolve display text for a post when the base `content` is empty — falls
// back to the first non-empty per-channel override. Kept in sync between the
// Posts list and Calendar previews.

export type PostPreviewInput = {
	content: string;
	platforms: string[];
	channelContent?: Record<string, { content?: string } | null> | null;
};

export function previewContent(p: PostPreviewInput): string {
	const base = p.content?.trim();
	if (base) return p.content;
	const overrides = p.channelContent ?? {};
	for (const platform of p.platforms) {
		const c = overrides[platform]?.content?.trim();
		if (c) return overrides[platform]!.content!;
	}
	for (const entry of Object.values(overrides)) {
		const c = entry?.content?.trim();
		if (c) return entry!.content!;
	}
	return "";
}
