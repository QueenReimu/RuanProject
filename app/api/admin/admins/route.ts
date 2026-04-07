import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminSession } from "@/lib/auth";

function isMissingColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? (error.code as string | undefined) : undefined;
  return maybeCode === "42703" || maybeCode === "PGRST204";
}

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabaseAdmin!
      .from("admins")
      .select("*")
      .order("display_order")
      .order("id");

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const key = String(body?.key ?? "").trim();
    const name = String(body?.name ?? "").trim();
    const waNumber = String(body?.wa_number ?? "").trim();

    if (!key || !name || !waNumber) {
      return NextResponse.json({ error: "key, name, and wa_number are required" }, { status: 400 });
    }

    const payload = {
      key,
      name,
      image: String(body?.image ?? "").trim(),
      wa_number: waNumber,
      role: String(body?.role ?? "").trim(),
      description: String(body?.description ?? "").trim(),
      is_active: Boolean(body?.is_active ?? true),
      is_hidden: Boolean(body?.is_hidden ?? false),
      display_order: Number(body?.display_order ?? 0),
    };

    const createWithProfile = await supabaseAdmin!
      .from("admins")
      .insert(payload)
      .select()
      .single();

    if (!createWithProfile.error) {
      return NextResponse.json(createWithProfile.data, { status: 201 });
    }

    if (!isMissingColumn(createWithProfile.error)) {
      throw createWithProfile.error;
    }

    const fallbackPayload = {
      key: payload.key,
      name: payload.name,
      image: payload.image,
      wa_number: payload.wa_number,
      is_active: payload.is_active,
      is_hidden: payload.is_hidden,
      display_order: payload.display_order,
    };

    const fallbackCreate = await supabaseAdmin!
      .from("admins")
      .insert(fallbackPayload)
      .select()
      .single();

    if (fallbackCreate.error) throw fallbackCreate.error;
    return NextResponse.json(fallbackCreate.data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}
