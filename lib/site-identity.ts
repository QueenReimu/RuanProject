import { siteConfig } from "@/config/site";
import { supabaseAdmin } from "@/lib/supabase";

export const DEFAULT_SITE_ICON = "/4V2.png";

export type SiteIdentity = {
  title: string;
  description: string;
  logo: string;
  versionToken?: string;
};

function isMissingTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  return maybeCode === "42P01" || maybeCode === "PGRST205";
}

function createVersionToken(input: string): string {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

export async function readSiteIdentity(): Promise<SiteIdentity> {
  const fallback: SiteIdentity = {
    title: siteConfig.name,
    description: siteConfig.description,
    logo: DEFAULT_SITE_ICON,
    versionToken: createVersionToken(`${siteConfig.name}|${siteConfig.description}|${DEFAULT_SITE_ICON}`),
  };

  if (!supabaseAdmin) return fallback;

  try {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("key, value, updated_at")
      .in("key", ["site_title", "site_description", "site_logo"]);

    if (error) {
      if (isMissingTable(error)) return fallback;
      throw error;
    }

    const rows = (data ?? []) as Array<{ key: string; value: string | null; updated_at?: string | null }>;
    const settingMap = rows.reduce<Record<string, string>>((acc, row) => {
      acc[row.key] = String(row.value ?? "").trim();
      return acc;
    }, {});

    const title = settingMap.site_title || fallback.title;
    const description = settingMap.site_description || fallback.description;
    const logo = settingMap.site_logo || fallback.logo;
    const latestUpdatedAt = rows
      .map((row) => String(row.updated_at ?? "").trim())
      .filter(Boolean)
      .sort()
      .at(-1);

    return {
      title,
      description,
      logo,
      versionToken: createVersionToken(`${title}|${description}|${logo}|${latestUpdatedAt ?? ""}`),
    };
  } catch {
    return fallback;
  }
}
