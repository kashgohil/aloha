import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { env } from "@/lib/env";
import { requireActiveWorkspaceId } from "@/lib/workspaces/resolve";

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

  const workspaceId = await requireActiveWorkspaceId(user.id);
  const [row] = await db
    .insert(assets)
    .values({
      createdByUserId: user.id,
      workspaceId,
      source: "upload",
      url: blob.url,
      mimeType: file.type,
      metadata: { originalName: file.name, size: file.size },
    })
    .returning({ id: assets.id });

  return NextResponse.json({ id: row.id, url: blob.url, mimeType: file.type });
}
