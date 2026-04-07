import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminSession } from "@/lib/auth";
import { readProductThemeImageMap, updateProductThemeImages } from "@/lib/product-theme-images";

type ProductRow = {
  id: number;
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

  const rows = (data ?? []) as ProductRow[];
  return rows.find((row) => row.id !== excludeId && isDuplicateProduct({ title, price }, row));
}

// GET all products
export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [{ data, error }, productThemeImageMap] = await Promise.all([
      supabaseAdmin!
        .from("products")
        .select(`
          *,
          categories (id, key, label, game_id,
            games (id, key, label)
          )
        `)
        .order("display_order")
        .order("id"),
      readProductThemeImageMap(),
    ]);

    if (error) throw error;
    return NextResponse.json(
      (data ?? []).map((product) => ({
        ...product,
        image_light: productThemeImageMap[Number(product.id)]?.light ?? "",
        image_dark: productThemeImageMap[Number(product.id)]?.dark ?? "",
      }))
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST create product
export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const categoryId = Number(body?.category_id ?? 0);
    const title = String(body?.title ?? "").trim();
    const price = String(body?.price ?? "").trim();

    if (!categoryId || !title || !price) {
      return NextResponse.json({ error: "category_id, title, and price are required" }, { status: 400 });
    }

    const duplicate = await findDuplicateInCategory(categoryId, title, price);
    if (duplicate) {
      return NextResponse.json(
        { error: "Produk duplikat terdeteksi (judul + harga mirip). Ubah judul atau harga terlebih dulu." },
        { status: 409 }
      );
    }

    const payload = {
      category_id: categoryId,
      title,
      description: String(body?.description ?? "").trim(),
      price,
      original_price: String(body?.original_price ?? "").trim() || null,
      discount: Number(body?.discount ?? 0),
      is_bestseller: Boolean(body?.is_bestseller ?? false),
      image: String(body?.image ?? "").trim(),
      display_order: Number(body?.display_order ?? 0),
      is_hidden: Boolean(body?.is_hidden ?? false),
    };

    const { data, error } = await supabaseAdmin!
      .from("products")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    await updateProductThemeImages(Number(data.id), {
      light: body?.image_light,
      dark: body?.image_dark,
    });

    return NextResponse.json(
      {
        ...data,
        image_light: String(body?.image_light ?? "").trim(),
        image_dark: String(body?.image_dark ?? "").trim(),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
