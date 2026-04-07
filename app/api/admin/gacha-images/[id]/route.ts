import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminSession } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body?.src !== undefined) updates.src = String(body.src ?? "").trim();
    if (body?.alt !== undefined) updates.alt = String(body.alt ?? "").trim();
    if (body?.is_hidden !== undefined) updates.is_hidden = Boolean(body.is_hidden);
    if (body?.display_order !== undefined) updates.display_order = Number(body.display_order ?? 0);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin!
      .from("gacha_images")
      .update(updates)
      .eq("id", Number(id))
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to update gacha image" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { error } = await supabaseAdmin!.from("gacha_images").delete().eq("id", Number(id));
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete gacha image" }, { status: 500 });
  }
}
