import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminSession } from "@/lib/auth";

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
    const key = String(body?.key ?? "").trim();
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

    const { data, error } = await supabaseAdmin!
      .from("categories")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
