import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { readCategoryHiddenMap } from "@/lib/category-hidden-store";
import { readProductThemeImageMap } from "@/lib/product-theme-images";
import { siteConfig } from "@/config/site";

// Use the admin client for server-side data fetching
// The anon key format changed in newer Supabase CLI versions
const db = supabaseAdmin!;
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isMissingColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? (error.code as string | undefined) : undefined;
  return maybeCode === "42703" || maybeCode === "PGRST204";
}

function parsePriceValue(value: string | null | undefined): number {
  const source = String(value ?? "");
  const firstPriceToken = source.match(/\d[\d.,]*/)?.[0] ?? "";
  const digits = firstPriceToken.replace(/[^\d]/g, "");
  return digits ? Number(digits) : Number.MAX_SAFE_INTEGER;
}

function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function normalizeKey(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isMissingTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? (error.code as string | undefined) : undefined;
  return maybeCode === "42P01" || maybeCode === "PGRST205";
}

function toBoolean(value: string | null | undefined): boolean {
  return String(value ?? "").toLowerCase() === "true";
}

function toPercent(value: string | null | undefined, fallback = 10): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), 1), 90);
}

function toMinimumPrice(value: string | null | undefined, fallback = 60000): number {
  const parsed = parsePriceValue(value ?? String(fallback));
  if (!Number.isFinite(parsed) || parsed === Number.MAX_SAFE_INTEGER) return fallback;
  return Math.max(0, Math.round(parsed));
}

function computeDiscountedValue(baseValue: number, percent: number): number {
  return Math.max(500, Math.ceil((baseValue * (100 - percent)) / 100 / 500) * 500);
}

function computeDiscountDayValues(
  priceLabel: string,
  percent: number,
  minimumPrice: number
): { price: string; discount: number } | null {
  const base = parsePriceValue(priceLabel);
  if (!Number.isFinite(base) || base <= 0 || base === Number.MAX_SAFE_INTEGER) return null;
  if (base < minimumPrice) return null;

  const discountedPriceValue = computeDiscountedValue(base, percent);
  if (discountedPriceValue >= base) return null;

  return {
    price: formatRupiah(discountedPriceValue),
    discount: percent,
  };
}

type AdminRecord = {
  key: string;
  name: string;
  image: string;
  wa_number: string;
  role?: string;
  description?: string;
  is_active?: boolean;
  is_hidden?: boolean;
};

type PublicAdminInfo = {
  name: string;
  image: string;
  number: string;
  role: string;
  description: string;
};

function toPublicAdminInfo(
  admin: Partial<AdminRecord> | null | undefined,
  fallbackName: string,
  fallbackNumber = ""
): PublicAdminInfo {
  return {
    name: String(admin?.name ?? fallbackName).trim() || fallbackName,
    image: String(admin?.image ?? "").trim(),
    number: String(admin?.wa_number ?? fallbackNumber).trim(),
    role: String(admin?.role ?? "").trim(),
    description: String(admin?.description ?? "").trim(),
  };
}

function buildPublicAdminData(admins: AdminRecord[]): Record<string, PublicAdminInfo> {
  const fallbackSlots = siteConfig.adminWhatsAppNumbers.map((item, index) => ({
    key: item.key || `admin${index + 1}`,
    label: item.label || `Admin ${index + 1}`,
    number: item.number || "",
  }));

  const publicAdmins: Record<string, PublicAdminInfo> = {};
  const usedAdminIndexes = new Set<number>();

  for (const slot of fallbackSlots) {
    const matchedIndex = admins.findIndex((admin) => normalizeKey(admin.key) === normalizeKey(slot.key));
    if (matchedIndex >= 0) {
      publicAdmins[slot.key] = toPublicAdminInfo(admins[matchedIndex], slot.label, slot.number);
      usedAdminIndexes.add(matchedIndex);
      continue;
    }

    const nextAvailableIndex = admins.findIndex((_, index) => !usedAdminIndexes.has(index));
    if (nextAvailableIndex >= 0) {
      publicAdmins[slot.key] = toPublicAdminInfo(admins[nextAvailableIndex], slot.label, slot.number);
      usedAdminIndexes.add(nextAvailableIndex);
      continue;
    }

    publicAdmins[slot.key] = toPublicAdminInfo(null, slot.label, slot.number);
  }

  admins.forEach((admin, index) => {
    if (usedAdminIndexes.has(index)) return;

    const fallbackLabel =
      siteConfig.adminWhatsAppNumbers.find((item) => normalizeKey(item.key) === normalizeKey(admin.key))?.label ||
      admin.name ||
      admin.key;

    publicAdmins[admin.key] = toPublicAdminInfo(admin, fallbackLabel, admin.wa_number);
  });

  return publicAdmins;
}

export async function GET() {
  try {
    // Fetch all visible games
    const gamesWithHidden = await db.from("games").select("*").eq("is_hidden", false).order("display_order");
    const gamesFallback = gamesWithHidden.error && isMissingColumn(gamesWithHidden.error)
      ? await db.from("games").select("*").order("display_order")
      : null;
    const gamesError = gamesFallback ? gamesFallback.error : gamesWithHidden.error;
    if (gamesError) throw gamesError;
    const games = (gamesFallback?.data ?? gamesWithHidden.data ?? []) as Array<{
      id: number;
      key: string;
      label: string;
      logo: string;
      display_order: number;
      is_hidden?: boolean;
    }>;

    // Fetch all visible categories with products
    const categoriesWithHidden = await db
      .from("categories")
      .select(`
        *,
        products (*)
      `)
      .eq("is_hidden", false)
      .order("display_order");
    const categoriesFallback = categoriesWithHidden.error && isMissingColumn(categoriesWithHidden.error)
      ? await db
          .from("categories")
          .select(`
            *,
            products (*)
          `)
          .order("display_order")
      : null;
    const categoriesError = categoriesFallback ? categoriesFallback.error : categoriesWithHidden.error;
    if (categoriesError) throw categoriesError;
    const [categoryHiddenMap, productThemeImageMap] = await Promise.all([
      readCategoryHiddenMap(),
      readProductThemeImageMap(),
    ]);
    const categories = (categoriesFallback?.data ?? categoriesWithHidden.data ?? []) as Array<{
      id: number;
      game_id: number;
      key: string;
      label: string;
      image: string;
      is_hidden?: boolean;
      products: Array<{
        id: number;
        title: string;
        description: string;
        price: string;
        image: string;
        original_price?: string;
        discount?: number;
        is_bestseller?: boolean;
        is_hidden?: boolean;
        display_order: number;
      }>;
    }>;

    // Fetch active + visible admins
    const adminsWithHidden = await db.from("admins").select("*").eq("is_active", true).eq("is_hidden", false).order("display_order");
    const adminsFallback = adminsWithHidden.error && isMissingColumn(adminsWithHidden.error)
      ? await db.from("admins").select("*").eq("is_active", true).order("display_order")
      : null;
    const adminsError = adminsFallback ? adminsFallback.error : adminsWithHidden.error;
    if (adminsError) throw adminsError;
    const admins = (adminsFallback?.data ?? adminsWithHidden.data ?? []) as AdminRecord[];

    const discountSettingRows = await db
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "discount_day_active",
        "discount_day_percent",
        "discount_day_min_price",
        "discount_day_badge_text",
        "site_logo",
        "site_title",
        "site_description",
        "testimonial_channel_url",
      ]);

    if (discountSettingRows.error && !isMissingTable(discountSettingRows.error)) {
      throw discountSettingRows.error;
    }

    const discountSettings = ((discountSettingRows.data ?? []) as Array<{ key: string; value: string | null }>)
      .reduce<Record<string, string | null>>((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

    const discountDayActive = toBoolean(discountSettings.discount_day_active ?? null);
    const discountDayPercent = toPercent(discountSettings.discount_day_percent ?? null, 10);
    const discountDayMinPrice = toMinimumPrice(discountSettings.discount_day_min_price ?? null, 60000);
    const discountDayBadgeText = String(discountSettings.discount_day_badge_text ?? "Hari Diskon Aktif").trim() || "Hari Diskon Aktif";
    const siteSettings = {
      siteLogo: String(discountSettings.site_logo ?? "").trim(),
      siteTitle: String(discountSettings.site_title ?? "").trim(),
      siteDescription: String(discountSettings.site_description ?? "").trim(),
      testimonialChannelUrl: String(discountSettings.testimonial_channel_url ?? "").trim(),
    };

    // Structure data the same way PricingSection expects
    const gameMeta: Record<string, { label: string; logo: string }> = {};
    for (const game of games || []) {
      gameMeta[game.key] = { label: game.label, logo: game.logo };
    }

    const productsData: Record<string, Record<string, {
      label: string;
      image: string;
      products: Array<{
        title: string;
        description: string;
        price: string;
        image: string;
        originalPrice?: string;
        discount?: number;
        bestseller?: boolean;
      }>;
    }>> = {};

    for (const game of games || []) {
      productsData[game.key] = {};
    }

    for (const cat of categories || []) {
      if (cat.is_hidden || categoryHiddenMap[cat.id]) continue;
      const game = games?.find((g: { id: number; key: string }) => g.id === cat.game_id);
      if (!game) continue;

      const sortedProducts = (cat.products || [])
        .filter((p: { is_hidden?: boolean }) => !p.is_hidden)
        .sort((a: { price: string; display_order: number }, b: { price: string; display_order: number }) => {
          const priceDiff = parsePriceValue(a.price) - parsePriceValue(b.price);
          if (priceDiff !== 0) return priceDiff;
          return a.display_order - b.display_order;
        });

      productsData[game.key][cat.key] = {
        label: cat.label,
        image: cat.image,
        products: sortedProducts.map((p: {
          id: number;
          title: string;
          description: string;
          price: string;
          image: string;
          original_price?: string;
          discount?: number;
          is_bestseller?: boolean;
        }) => {
          const promoData = discountDayActive
            ? computeDiscountDayValues(p.price, discountDayPercent, discountDayMinPrice)
            : null;
          const themeImages = productThemeImageMap[p.id] ?? {};
          return {
            title: p.title,
            description: p.description,
            price: promoData?.price ?? p.price,
            image: p.image,
            imageLight: themeImages.light,
            imageDark: themeImages.dark,
            originalPrice: promoData ? p.price : p.original_price,
            discount: promoData?.discount ?? p.discount,
            bestseller: p.is_bestseller,
          };
        }),
      };
    }

    const adminData = buildPublicAdminData(admins || []);

    return NextResponse.json(
      {
        gameMeta,
        products: productsData,
        adminData,
        discountDayActive,
        discountDayPercent,
        discountDayMinPrice,
        discountDayBadgeText,
        siteSettings,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
