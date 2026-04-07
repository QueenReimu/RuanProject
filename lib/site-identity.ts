import { siteConfig } from "@/config/site";
import { supabaseAdmin } from "@/lib/supabase";

export const DEFAULT_SITE_ICON = "/4V2.png";

export type SiteIdentity = {
  title: string;
  description: string;
  logo: string;
};

function isMissingTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  return maybeCode === "42P01" || maybeCode === "PGRST205";
}

export async function readSiteIdentity(): Promise<SiteIdentity> {
  const fallback: SiteIdentity = {
    title: siteConfig.name,
    description: siteConfig.description,
    logo: DEFAULT_SITE_ICON,
  };

  if (!supabaseAdmin) return fallback;

  try {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("key, value")
      .in("key", ["site_title", "site_description", "site_logo"]);

    if (error) {
      if (isMissingTable(error)) return fallback;
      throw error;
    }

    const settingMap = ((data ?? []) as Array<{ key: string; value: string | null }>).reduce<Record<string, string>>(
      (acc, row) => {
        acc[row.key] = String(row.value ?? "").trim();
        return acc;
      },
      {}
    );

    return {
      title: settingMap.site_title || fallback.title,
      description: settingMap.site_description || fallback.description,
      logo: settingMap.site_logo || fallback.logo,
    };
  } catch {
    return fallback;
  }
}
