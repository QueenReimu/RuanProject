import { NextResponse } from "next/server";
import { getTestimonials } from "@/lib/testimonials-store";
import { supabaseAdmin } from "@/lib/supabase";
import { siteConfig } from "@/config/site";

type SettingRow = {
  value: string | null;
};

function isMissingTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? (error.code as string | undefined) : undefined;
  return maybeCode === "42P01" || maybeCode === "PGRST205";
}

async function getTestimonialChannelUrl(): Promise<string> {
  const fallback = String(siteConfig.socialLinks.whatsapp ?? "").trim();
  if (!supabaseAdmin) return fallback;

  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "testimonial_channel_url")
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) return fallback;
    throw error;
  }

  const raw = (data as SettingRow | null)?.value;
  const url = String(raw ?? "").trim();
  return url || fallback;
}

export async function GET() {
  try {
    const [data, channelUrl] = await Promise.all([
      getTestimonials(),
      getTestimonialChannelUrl(),
    ]);

    const items = data
      .filter((item) => !item.is_hidden)
      .sort((a, b) => a.display_order - b.display_order || a.id - b.id)
      .map((item) => ({
        id: item.id,
        src: item.src,
        alt: item.alt,
        caption: item.caption,
        display_order: item.display_order,
      }));

    return NextResponse.json({
      items,
      channelUrl,
    });
  } catch (error) {
    console.error("Public testimonials GET error:", error);
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}
