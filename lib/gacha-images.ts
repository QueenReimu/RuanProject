import { supabaseAdmin } from "@/lib/supabase";

export type PublicGachaImage = {
  id: number;
  src: string;
  alt: string;
  display_order: number;
};

export const FALLBACK_GACHA_IMAGES: PublicGachaImage[] = [
  { id: 1, src: "/products/Genshin.jpg", alt: "Genshin Impact", display_order: 1 },
  { id: 2, src: "/products/WutheringWaves.jpg", alt: "Wuthering Waves", display_order: 2 },
];

function sanitizeCarouselImages(input: PublicGachaImage[] | unknown): PublicGachaImage[] {
  if (!Array.isArray(input)) return FALLBACK_GACHA_IMAGES;

  const cleaned = input
    .filter((item): item is PublicGachaImage => Boolean(item && typeof item === "object"))
    .map((item) => ({
      id: Number(item.id ?? 0),
      src: String(item.src ?? "").trim(),
      alt: String(item.alt ?? "Banner").trim() || "Banner",
      display_order: Number(item.display_order ?? 0),
    }))
    .filter((item) => item.src.length > 0)
    .sort((a, b) => a.display_order - b.display_order || a.id - b.id);

  return cleaned.length > 0 ? cleaned : FALLBACK_GACHA_IMAGES;
}

export async function readPublicGachaImages(): Promise<PublicGachaImage[]> {
  if (!supabaseAdmin) return FALLBACK_GACHA_IMAGES;

  try {
    const { data, error } = await supabaseAdmin
      .from("gacha_images")
      .select("id, src, alt, display_order")
      .eq("is_hidden", false)
      .order("display_order");

    if (error) throw error;
    return sanitizeCarouselImages(data ?? []);
  } catch {
    return FALLBACK_GACHA_IMAGES;
  }
}
