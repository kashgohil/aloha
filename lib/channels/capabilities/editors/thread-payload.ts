import type { PostMedia, StudioPayload } from "@/db/schema";

export type ThreadPart = {
  text: string;
  media: PostMedia[];
};

export type ThreadPayload = {
  parts: ThreadPart[];
  spoilerText?: string;
};

export function readThreadPayload(payload: StudioPayload): ThreadPayload {
  const raw = Array.isArray(payload.parts) ? payload.parts : null;
  const spoilerText =
    typeof payload.spoilerText === "string" ? payload.spoilerText : undefined;
  if (!raw || raw.length === 0) {
    return { parts: [{ text: "", media: [] }], spoilerText };
  }
  const parts: ThreadPart[] = raw.map((p) => {
    const part = p as Partial<ThreadPart>;
    return {
      text: typeof part.text === "string" ? part.text : "",
      media: Array.isArray(part.media) ? (part.media as PostMedia[]) : [],
    };
  });
  return { parts, spoilerText };
}

export function splitIntoThreadParts(content: string): ThreadPart[] {
  const chunks = content
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (chunks.length === 0) return [{ text: "", media: [] }];
  return chunks.map((text) => ({ text, media: [] }));
}

export function joinThreadParts(parts: ThreadPart[]): string {
  return parts
    .map((p) => p.text.trim())
    .filter(Boolean)
    .join("\n\n");
}
