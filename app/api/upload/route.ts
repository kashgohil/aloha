import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/current-user";
import { env } from "@/lib/env";

// 5MB — matches LinkedIn's image upper bound and is plenty for X's 5MB cap.
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file missing" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: `unsupported type ${file.type}` },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `file too large (max ${MAX_BYTES / 1024 / 1024}MB)` },
      { status: 413 },
    );
  }

  const ext = EXT_BY_MIME[file.type];
  const key = `uploads/${user.id}/${randomUUID()}.${ext}`;
  const blob = await put(key, file, {
    access: "public",
    contentType: file.type,
    token: env.BLOB_READ_WRITE_TOKEN,
  });

  return NextResponse.json({ url: blob.url, mimeType: file.type });
}
