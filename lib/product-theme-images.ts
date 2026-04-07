import { supabaseAdmin } from "@/lib/supabase";

const PRODUCT_THEME_IMAGES_KEY = "product_theme_images_json";

type SettingRow = {
  value: string | null;
};

export type ProductThemeImages = {
  light?: string;
  dark?: string;
};

function isMissingTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  return maybeCode === "42P01" || maybeCode === "PGRST205";
}

function normalizeImageValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeProductThemeImageMap(value: unknown): Record<number, ProductThemeImages> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.entries(value as Record<string, unknown>).reduce<Record<number, ProductThemeImages>>((acc, [key, rawValue]) => {
    const productId = Number(key);
    if (!Number.isFinite(productId) || productId <= 0) return acc;
    if (!rawValue || typeof rawValue !== "object" || Array.isArray(rawValue)) return acc;

    const light = normalizeImageValue((rawValue as { light?: unknown }).light);
    const dark = normalizeImageValue((rawValue as { dark?: unknown }).dark);

    if (!light && !dark) return acc;

    acc[productId] = {
      ...(light ? { light } : {}),
      ...(dark ? { dark } : {}),
    };

    return acc;
  }, {});
}

export async function readProductThemeImageMap(): Promise<Record<number, ProductThemeImages>> {
  if (!supabaseAdmin) return {};

  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", PRODUCT_THEME_IMAGES_KEY)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) return {};
    throw error;
  }

  const raw = (data as SettingRow | null)?.value;
  if (!raw) return {};

  try {
    return normalizeProductThemeImageMap(JSON.parse(String(raw)));
  } catch {
    return {};
  }
}

async function writeProductThemeImageMap(imageMap: Record<number, ProductThemeImages>) {
  if (!supabaseAdmin) return;

  const { error } = await supabaseAdmin
    .from("site_settings")
    .upsert(
      {
        key: PRODUCT_THEME_IMAGES_KEY,
        value: JSON.stringify(imageMap),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

  if (error && !isMissingTable(error)) {
    throw error;
  }
}

export async function updateProductThemeImages(
  productId: number,
  updates: {
    light?: string | null;
    dark?: string | null;
  }
): Promise<void> {
  const currentMap = await readProductThemeImageMap();
  const currentEntry = currentMap[productId] ?? {};

  const nextLight = updates.light !== undefined ? normalizeImageValue(updates.light) : normalizeImageValue(currentEntry.light);
  const nextDark = updates.dark !== undefined ? normalizeImageValue(updates.dark) : normalizeImageValue(currentEntry.dark);

  if (!nextLight && !nextDark) {
    delete currentMap[productId];
  } else {
    currentMap[productId] = {
      ...(nextLight ? { light: nextLight } : {}),
      ...(nextDark ? { dark: nextDark } : {}),
    };
  }

  await writeProductThemeImageMap(currentMap);
}

export async function removeProductThemeImages(productId: number): Promise<void> {
  const currentMap = await readProductThemeImageMap();
  if (!(productId in currentMap)) return;

  delete currentMap[productId];
  await writeProductThemeImageMap(currentMap);
}
