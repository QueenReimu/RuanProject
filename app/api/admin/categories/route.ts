import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminSession } from "@/lib/auth";

function isMissingColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  return maybeCode === "42703" || maybeCode === "PGRST204";
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  return maybeCode === "23505";
}

function normalizeKey(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabaseAdmin!
      .from("categories")
      .select("*, games(id, key, label)")
      .order("display_order")
      .order("id");

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const gameId = Number(body?.game_id ?? 0);
    const key = normalizeKey(body?.key);
    const label = String(body?.label ?? "").trim();

    if (!gameId || !key || !label) {
      return NextResponse.json({ error: "game_id, key, and label are required" }, { status: 400 });
    }

    const payload = {
      game_id: gameId,
      key,
      label,
      image: String(body?.image ?? "").trim(),
      display_order: Number(body?.display_order ?? 0),
      is_hidden: Boolean(body?.is_hidden ?? false),
    };

    let result = await supabaseAdmin!
      .from("categories")
      .insert(payload)
      .select()
      .single();

    if (result.error && isMissingColumn(result.error)) {
      const legacyPayload = { ...payload };
      delete (legacyPayload as Record<string, unknown>).is_hidden;
      result = await supabaseAdmin!
        .from("categories")
        .insert(legacyPayload)
        .select()
        .single();
    }

    if (result.error) {
      if (isUniqueViolation(result.error)) {
        return NextResponse.json(
          { error: "Kategori dengan key ini sudah ada untuk game yang dipilih." },
          { status: 409 }
        );
      }
      throw result.error;
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("Admin categories POST error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
