import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabaseAdmin!
      .from("gacha_images")
      .select("*")
      .order("display_order")
      .order("id");

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: "Failed to fetch gacha images" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const src = String(body?.src ?? "").trim();

    if (!src) {
      return NextResponse.json({ error: "src is required" }, { status: 400 });
    }

    const payload = {
      src,
      alt: String(body?.alt ?? "").trim(),
      is_hidden: Boolean(body?.is_hidden ?? false),
      display_order: Number(body?.display_order ?? 0),
    };

    const { data, error } = await supabaseAdmin!
      .from("gacha_images")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create gacha image" }, { status: 500 });
  }
}
