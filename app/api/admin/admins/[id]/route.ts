import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminSession } from "@/lib/auth";

function isMissingColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? (error.code as string | undefined) : undefined;
  return maybeCode === "42703" || maybeCode === "PGRST204";
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body?.key !== undefined) updates.key = String(body.key).trim();
    if (body?.name !== undefined) updates.name = String(body.name).trim();
    if (body?.image !== undefined) updates.image = String(body.image ?? "").trim();
    if (body?.wa_number !== undefined) updates.wa_number = String(body.wa_number).trim();
    if (body?.role !== undefined) updates.role = String(body.role ?? "").trim();
    if (body?.description !== undefined) updates.description = String(body.description ?? "").trim();
    if (body?.is_active !== undefined) updates.is_active = Boolean(body.is_active);
    if (body?.is_hidden !== undefined) updates.is_hidden = Boolean(body.is_hidden);
    if (body?.display_order !== undefined) updates.display_order = Number(body.display_order ?? 0);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updateWithProfile = await supabaseAdmin!
      .from("admins")
      .update(updates)
      .eq("id", Number(id))
      .select()
      .single();

    if (!updateWithProfile.error) {
      return NextResponse.json(updateWithProfile.data);
    }

    if (!isMissingColumn(updateWithProfile.error)) {
      throw updateWithProfile.error;
    }

    const fallbackUpdates = { ...updates };
    delete fallbackUpdates.role;
    delete fallbackUpdates.description;

    if (Object.keys(fallbackUpdates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update (run latest migration)" }, { status: 400 });
    }

    const fallbackUpdate = await supabaseAdmin!
      .from("admins")
      .update(fallbackUpdates)
      .eq("id", Number(id))
      .select()
      .single();

    if (fallbackUpdate.error) throw fallbackUpdate.error;
    return NextResponse.json(fallbackUpdate.data);
  } catch {
    return NextResponse.json({ error: "Failed to update admin" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { error } = await supabaseAdmin!.from("admins").delete().eq("id", Number(id));
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete admin" }, { status: 500 });
  }
}
