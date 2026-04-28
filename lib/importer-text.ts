// Source-material importers for non-URL inputs. Mirrors the shape of
// `extractFromUrl` so the import route can branch by input kind without
// invasive changes to the fanout pipeline.

import { extractText, getDocumentProxy } from "unpdf";
import type { ImportedContent } from "./importer";
import { ImporterError } from "./importer";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_BYTES = 25 * 1024 * 1024; // 25MB cap on imported source files

// Pulls a fully-formed `ImportedContent` out of pasted long-form text.
// `title` is the first non-empty line if not provided, capped to 120 chars.
// `excerpt` is the first 200 chars of the body. `url` is null because the
// content didn't come from one — the fanout prompt tolerates an empty URL.
export function extractFromText(args: {
  title?: string | null;
  content: string;
}): ImportedContent {
  const content = args.content.trim();
  if (!content) throw new ImporterError("Paste some text first.");

  const firstLine =
    content.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "Untitled";
  const title = (args.title?.trim() || firstLine).slice(0, 120);

  const excerpt = content.slice(0, 200);

  return {
    url: "",
    title,
    excerpt,
    content,
    ogImage: null,
  };
}

// Fetches a public Vercel Blob URL (or any HTTP url we control) and returns
// the body as bytes. Used by both the text-asset path and PDF path. The
// asset row is created by /api/upload before we ever read the file, so by
// the time we hit this helper the URL is already trusted (workspace-owned).
async function fetchAssetBytes(url: string): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new ImporterError(`Couldn't read uploaded file (${res.status}).`);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new ImporterError("Upload returned no body.");
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        throw new ImporterError(`File exceeds the ${MAX_BYTES / 1024 / 1024}MB cap.`);
      }
      chunks.push(value);
    }
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.byteLength;
    }
    return merged.buffer;
  } catch (err) {
    if (err instanceof ImporterError) throw err;
    if ((err as { name?: string })?.name === "AbortError") {
      throw new ImporterError("Reading the uploaded file timed out.");
    }
    throw new ImporterError("Couldn't read the uploaded file.");
  } finally {
    clearTimeout(timer);
  }
}

export async function extractFromTextAsset(args: {
  url: string;
  filename?: string | null;
}): Promise<ImportedContent> {
  const buf = await fetchAssetBytes(args.url);
  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(buf).trim();
  if (!decoded) {
    throw new ImporterError("That file looks empty after decoding.");
  }
  return extractFromText({
    title: args.filename ?? null,
    content: decoded,
  });
}

// PDF extraction via `unpdf` (pdfjs wrapper, ESM, runs in Node/Edge). We
// stitch all page strings into a single body separated by blank lines so
// the fanout prompt sees a normal article-shaped input. If the PDF is
// scanned (no text layer), `extractText` returns empty pages — caller
// surfaces the empty-content error so users know to pre-OCR.
export async function extractFromPdfAsset(args: {
  url: string;
  filename?: string | null;
}): Promise<ImportedContent> {
  const buf = await fetchAssetBytes(args.url);
  let pages: string[];
  try {
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const result = await extractText(pdf, { mergePages: false });
    pages = Array.isArray(result.text) ? result.text : [result.text ?? ""];
  } catch (err) {
    throw new ImporterError(
      err instanceof Error
        ? `Couldn't read that PDF (${err.message}).`
        : "Couldn't read that PDF.",
    );
  }
  const content = pages.map((p) => p.trim()).filter(Boolean).join("\n\n");
  if (!content) {
    throw new ImporterError(
      "No text found in that PDF. If it's a scan, run it through OCR first.",
    );
  }
  return extractFromText({
    title: args.filename ?? null,
    content,
  });
}
