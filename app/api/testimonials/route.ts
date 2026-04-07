import { NextResponse } from "next/server";
import { getTestimonials } from "@/lib/testimonials-store";
import { supabaseAdmin } from "@/lib/supabase";
import { siteConfig } from "@/config/site";
export const dynamic = "force-dynamic";
export const revalidate = 0;
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

type SettingRow = {
  key?: string | null;
  value: string | null;
};

type TestimonialChannel = {
  key: string;
  label: string;
  url: string;
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

async function getTestimonialChannels(): Promise<TestimonialChannel[]> {
  const fallbackPrimaryUrl = await getTestimonialChannelUrl();
  const defaultChannels: TestimonialChannel[] = [
    { key: "channel1", label: "Saluran 1", url: fallbackPrimaryUrl },
    { key: "channel2", label: "Saluran 2", url: "" },
    { key: "channel3", label: "Saluran 3", url: "" },
  ];

  if (!supabaseAdmin) return defaultChannels;

  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select("key, value")
    .in("key", [
      "testimonial_channel_url",
      "testimonial_channel_1_url",
      "testimonial_channel_2_url",
      "testimonial_channel_3_url",
    ]);

  if (error) {
    if (isMissingTable(error)) return defaultChannels;
    throw error;
  }

  const settingsMap = ((data ?? []) as SettingRow[]).reduce<Record<string, string>>((acc, row) => {
    const key = String(row.key ?? "").trim();
    if (!key) return acc;
    acc[key] = String(row.value ?? "").trim();
    return acc;
  }, {});

  return [
    {
      key: "channel1",
      label: "Saluran 1",
      url: settingsMap.testimonial_channel_1_url || settingsMap.testimonial_channel_url || fallbackPrimaryUrl,
    },
    {
      key: "channel2",
      label: "Saluran 2",
      url: settingsMap.testimonial_channel_2_url || "",
    },
    {
      key: "channel3",
      label: "Saluran 3",
      url: settingsMap.testimonial_channel_3_url || "",
    },
  ];
}

export async function GET() {
  try {
    const [data, channels] = await Promise.all([
      getTestimonials(),
      getTestimonialChannels(),
    ]);
    const channelUrl = channels.find((item) => item.url)?.url ?? "";

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

    return NextResponse.json(
      {
        items,
        channelUrl,
        channels,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Public testimonials GET error:", error);
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}
