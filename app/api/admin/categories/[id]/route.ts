import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminSession } from "@/lib/auth";
import { removeCategoryHiddenState, setCategoryHiddenState } from "@/lib/category-hidden-store";

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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body?.game_id !== undefined) updates.game_id = Number(body.game_id);
    if (body?.key !== undefined) updates.key = normalizeKey(body.key);
    if (body?.label !== undefined) updates.label = String(body.label).trim();
    if (body?.image !== undefined) updates.image = String(body.image ?? "").trim();
    if (body?.display_order !== undefined) updates.display_order = Number(body.display_order ?? 0);
    if (body?.is_hidden !== undefined) updates.is_hidden = Boolean(body.is_hidden);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    let result = await supabaseAdmin!
      .from("categories")
      .update(updates)
      .eq("id", Number(id))
      .select()
      .single();

    if (result.error && isMissingColumn(result.error) && "is_hidden" in updates) {
      const legacyUpdates = { ...updates };
      delete legacyUpdates.is_hidden;

      if (Object.keys(legacyUpdates).length > 0) {
        result = await supabaseAdmin!
          .from("categories")
          .update(legacyUpdates)
          .eq("id", Number(id))
          .select()
          .single();
      } else {
        const current = await supabaseAdmin!
          .from("categories")
          .select("*")
          .eq("id", Number(id))
          .single();
        result = current;
      }
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

    if ("is_hidden" in updates) {
      await setCategoryHiddenState(Number(id), Boolean(updates.is_hidden));
    }

    return NextResponse.json({
      ...(result.data as Record<string, unknown> | null),
      is_hidden: "is_hidden" in updates ? Boolean(updates.is_hidden) : (result.data as { is_hidden?: boolean } | null)?.is_hidden,
    });
  } catch (error) {
    console.error("Admin categories PUT error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { error } = await supabaseAdmin!.from("categories").delete().eq("id", Number(id));
    if (error) throw error;
    await removeCategoryHiddenState(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin categories DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
