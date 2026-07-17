import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { NextRequest } from "next/server";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { error: "Image uploads are not configured. Set up Vercel Blob storage and add BLOB_READ_WRITE_TOKEN." },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const folder = (formData.get("folder") as string) || "uploads";

  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return Response.json({ error: "Only JPEG, PNG, WebP and GIF images are allowed" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: "File must be under 5 MB" }, { status: 400 });
  }

  try {
    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const blob = await put(filename, file, { access: "public", contentType: file.type });
    return Response.json({ url: blob.url });
  } catch (err) {
    console.error("Blob upload error:", err);
    return Response.json(
      { error: "Upload failed: " + (err instanceof Error ? err.message : "Unknown error") },
      { status: 500 }
    );
  }
}
