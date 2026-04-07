import { supabaseAdmin } from "@/lib/supabase";

const CATEGORY_HIDDEN_KEY = "categories_hidden_json";

type SettingRow = {
  value: string | null;
};

function isMissingTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  return maybeCode === "42P01" || maybeCode === "PGRST205";
}

function normalizeHiddenMap(value: unknown): Record<number, boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.entries(value as Record<string, unknown>).reduce<Record<number, boolean>>((acc, [key, rawValue]) => {
    const id = Number(key);
    if (!Number.isFinite(id) || id <= 0) return acc;
    if (Boolean(rawValue)) {
      acc[id] = true;
    }
    return acc;
  }, {});
}

export async function readCategoryHiddenMap(): Promise<Record<number, boolean>> {
  if (!supabaseAdmin) return {};

  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", CATEGORY_HIDDEN_KEY)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) return {};
    throw error;
  }

  const raw = (data as SettingRow | null)?.value;
  if (!raw) return {};

  try {
    return normalizeHiddenMap(JSON.parse(String(raw)));
  } catch {
    return {};
  }
}

async function writeCategoryHiddenMap(hiddenMap: Record<number, boolean>) {
  if (!supabaseAdmin) return;

  const { error } = await supabaseAdmin
    .from("site_settings")
    .upsert(
      {
        key: CATEGORY_HIDDEN_KEY,
        value: JSON.stringify(hiddenMap),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

  if (error && !isMissingTable(error)) {
    throw error;
  }
}

export async function setCategoryHiddenState(categoryId: number, isHidden: boolean): Promise<void> {
  const currentMap = await readCategoryHiddenMap();
  if (isHidden) {
    currentMap[categoryId] = true;
  } else {
    delete currentMap[categoryId];
  }

  await writeCategoryHiddenMap(currentMap);
}

export async function removeCategoryHiddenState(categoryId: number): Promise<void> {
  const currentMap = await readCategoryHiddenMap();
  if (!(categoryId in currentMap)) return;

  delete currentMap[categoryId];
  await writeCategoryHiddenMap(currentMap);
}
