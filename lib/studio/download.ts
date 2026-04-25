// Client-side file downloads for Studio's Export button. Fetches the
// file (so external URLs honor the suggested filename), wraps in a
// blob, and triggers the browser's save flow.

import type { ExportFile } from "@/lib/channels/capabilities/types";

async function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

async function downloadUrl(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't fetch ${url} (${res.status})`);
  const blob = await res.blob();
  await downloadBlob(blob, filename);
}

export async function downloadExportFile(file: ExportFile) {
  if (file.kind === "url") {
    return downloadUrl(file.url, file.name);
  }
  const blob = new Blob([file.content], { type: file.mimeType });
  return downloadBlob(blob, file.name);
}

// Browsers serialize download triggers tightly enough that firing them
// back-to-back can drop later files. A small spacing keeps every file
// reliably in the user's download tray.
export async function downloadExportFiles(files: ExportFile[]) {
  for (const f of files) {
    await downloadExportFile(f);
    await new Promise((r) => setTimeout(r, 200));
  }
}

// Best-effort safe filename — trims whitespace, strips characters that
// most filesystems reject, and falls back to a default. The extension
// is always preserved.
export function sanitizeFilename(name: string, fallback = "file"): string {
  const trimmed = name.trim().replace(/[\\/:*?"<>|]+/g, "-").slice(0, 200);
  return trimmed.length > 0 ? trimmed : fallback;
}
