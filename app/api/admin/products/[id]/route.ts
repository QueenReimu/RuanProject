import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminSession } from "@/lib/auth";

type ProductRow = {
  id: number;
  category_id: number;
  title: string;
  price: string;
};

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeComparableTitle(title: string) {
  return normalizeToken(
    title
      .replace(/\(\s*\d+\s*if\s*\)/gi, "")
      .replace(/\bif\b/gi, "")
      .trim()
  );
}

function normalizeComparablePrice(price: string) {
  return normalizeToken(price);
}

function isDuplicateProduct(a: { title: string; price: string }, b: { title: string; price: string }) {
  return (
    normalizeComparableTitle(a.title) === normalizeComparableTitle(b.title) &&
    normalizeComparablePrice(a.price) === normalizeComparablePrice(b.price)
  );
}

async function findDuplicateInCategory(categoryId: number, title: string, price: string, excludeId?: number) {
  const { data, error } = await supabaseAdmin!
    .from("products")
    .select("id, title, price")
    .eq("category_id", categoryId);
  if (error) throw error;

  const rows = (data ?? []) as Array<Pick<ProductRow, "id" | "title" | "price">>;
  return rows.find((row) => row.id !== excludeId && isDuplicateProduct({ title, price }, row));
}

// PUT update product
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body?.category_id !== undefined) updates.category_id = Number(body.category_id);
    if (body?.title !== undefined) updates.title = String(body.title).trim();
    if (body?.description !== undefined) updates.description = String(body.description ?? "").trim();
    if (body?.price !== undefined) updates.price = String(body.price).trim();
    if (body?.original_price !== undefined) {
      const originalPrice = String(body.original_price ?? "").trim();
      updates.original_price = originalPrice || null;
    }
    if (body?.discount !== undefined) updates.discount = Number(body.discount ?? 0);
    if (body?.is_bestseller !== undefined) updates.is_bestseller = Boolean(body.is_bestseller);
    if (body?.image !== undefined) updates.image = String(body.image ?? "").trim();
    if (body?.display_order !== undefined) updates.display_order = Number(body.display_order ?? 0);
    if (body?.is_hidden !== undefined) updates.is_hidden = Boolean(body.is_hidden);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const productId = Number(id);
    const { data: current, error: currentError } = await supabaseAdmin!
      .from("products")
      .select("id, category_id, title, price")
      .eq("id", productId)
      .single();
    if (currentError || !current) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const currentRow = current as ProductRow;
    const nextCategoryId = Number(updates.category_id ?? currentRow.category_id);
    const nextTitle = String(updates.title ?? currentRow.title).trim();
    const nextPrice = String(updates.price ?? currentRow.price).trim();

    if (!nextCategoryId || !nextTitle || !nextPrice) {
      return NextResponse.json({ error: "category_id, title, and price are required" }, { status: 400 });
    }

    const duplicate = await findDuplicateInCategory(nextCategoryId, nextTitle, nextPrice, productId);
    if (duplicate) {
      return NextResponse.json(
        { error: "Produk duplikat terdeteksi (judul + harga mirip). Ubah judul atau harga terlebih dulu." },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin!
      .from("products")
      .update(updates)
      .eq("id", productId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { error } = await supabaseAdmin!.from("products").delete().eq("id", Number(id));
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
