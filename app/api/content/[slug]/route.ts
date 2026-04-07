import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  CONTENT_SETTING_KEY_MAP,
  SITE_CONTENT_DEFAULTS,
  type AppLocale,
  isContentSlug,
  mergeLocalizedContent,
} from "@/lib/site-content-defaults";

type SettingRow = {
  value: string | null;
};

function isMissingTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? (error.code as string | undefined) : undefined;
  return maybeCode === "42P01" || maybeCode === "PGRST205";
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    if (!isContentSlug(slug)) {
      return NextResponse.json({ error: "Invalid content slug" }, { status: 404 });
    }

    const defaults = SITE_CONTENT_DEFAULTS[slug];

    if (!supabaseAdmin) {
      return NextResponse.json(defaults);
    }

    const settingKey = CONTENT_SETTING_KEY_MAP[slug];
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", settingKey)
      .maybeSingle();

    if (error) {
      if (isMissingTable(error)) {
        return NextResponse.json(defaults);
      }
      throw error;
    }

    const raw = (data as SettingRow | null)?.value;
    if (!raw) return NextResponse.json(defaults);

    try {
      const parsed = JSON.parse(raw) as unknown;
      return NextResponse.json(
        mergeLocalizedContent(
          defaults as Record<AppLocale, Record<string, unknown>>,
          parsed
        )
      );
    } catch {
      return NextResponse.json(defaults);
    }
  } catch (error) {
    console.error("Public content GET error:", error);
    return NextResponse.json({ error: "Failed to fetch page content" }, { status: 500 });
  }
}
