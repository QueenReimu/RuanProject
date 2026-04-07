import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { randomUUID } from "crypto";

type UploadResult = {
  bucket: string;
  path: string;
  publicUrl: string;
};

async function ensureBucketExists(bucket: string) {
  const { data: list, error: listError } = await supabaseAdmin!.storage.listBuckets();
  if (listError) return;
  const exists = (list ?? []).some((item) => item.name === bucket);
  if (exists) return;
  await supabaseAdmin!.storage.createBucket(bucket, { public: true });
}

async function uploadToAnyBucket(file: File, buffer: Buffer, fileName: string): Promise<UploadResult> {
  const preferred = String(process.env.SUPABASE_STORAGE_BUCKET ?? "").trim();
  const candidates = [preferred, "pricelist", "uploads"].filter(Boolean);
  const tried = new Set<string>();
  const finalCandidates = candidates.filter((bucket) => {
    if (tried.has(bucket)) return false;
    tried.add(bucket);
    return true;
  });

  const errors: string[] = [];

  for (const bucket of finalCandidates) {
    const path = bucket === "uploads" ? `pricelist/uploads/${fileName}` : `uploads/${fileName}`;

    const firstTry = await supabaseAdmin!.storage.from(bucket).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (firstTry.error) {
      const message = String(firstTry.error.message ?? "");
      const looksMissingBucket =
        message.toLowerCase().includes("bucket") &&
        (message.toLowerCase().includes("not found") || message.toLowerCase().includes("does not exist"));

      if (looksMissingBucket) {
        await ensureBucketExists(bucket);
        const retry = await supabaseAdmin!.storage.from(bucket).upload(path, buffer, {
          contentType: file.type,
          upsert: false,
        });
        if (retry.error) {
          errors.push(`${bucket}: ${retry.error.message}`);
          continue;
        }
      } else {
        errors.push(`${bucket}: ${firstTry.error.message}`);
        continue;
      }
    }

    const { data: publicData } = supabaseAdmin!.storage.from(bucket).getPublicUrl(path);
    return { bucket, path, publicUrl: publicData.publicUrl };
  }

  throw new Error(errors.join(" | ") || "No storage bucket available");
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: jpeg, png, webp, gif, svg" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 5MB" }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${randomUUID()}.${ext}`;

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadToAnyBucket(file, buffer, fileName);
    return NextResponse.json({ path: uploaded.publicUrl, bucket: uploaded.bucket });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: `Failed to upload file: ${String((error as Error)?.message ?? error)}` }, { status: 500 });
  }
}
