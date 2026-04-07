import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const db = supabaseAdmin!;
const GAME_CONTENT_PREFIX = "game_content:";
export const dynamic = "force-dynamic";
export const revalidate = 0;
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

type GameRow = {
  id: number;
  key: string;
  label: string;
  logo?: string | null;
  banner?: string | null;
  tagline?: string | null;
  description?: string | null;
  services?: string[] | string | null;
  display_order: number;
  is_hidden?: boolean;
};

type GameContent = {
  banner: string;
  tagline: string;
  description: string;
  services: string[];
};

type SettingRow = {
  key: string;
  value: string | null;
};

const FALLBACK_GAME_CONTENT: Record<string, {
  logo: string;
  banner: string;
  tagline: string;
  description: string;
  services: string[];
}> = {
  genshin: {
    logo: "/products/Primogem.png",
    banner: "/products/Genshin.jpg",
    tagline: "Primo, explorasi, quest, rawat akun, benerin akun, aplikasi premium.",
    description:
      "Layanan lengkap untuk kebutuhan harian maupun progres akun. Cocok untuk player yang ingin progres cepat namun tetap aman.",
    services: ["Primogem", "Explorasi", "Quest", "Rawat Akun", "Benerin Akun", "Aplikasi Premium"],
  },
  wuwa: {
    logo: "/products/Asterite.png",
    banner: "/products/WutheringWaves.jpg",
    tagline: "Astrite, exploration, quest, rawat akun, benerin akun.",
    description:
      "Tim admin menangani order Wuthering Waves dengan alur yang jelas dan update berkala dari order awal hingga selesai.",
    services: ["Astrite", "Explore", "Quest", "Rawat Akun", "Benerin Akun", "Build Character"],
  },
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeServices(value: unknown, fallback: string[]): string[] {
  if (Array.isArray(value)) {
    const parsed = value.map((item) => normalizeText(item)).filter(Boolean);
    return parsed.length > 0 ? parsed : fallback;
  }

  if (typeof value === "string") {
    const parsed = value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
    return parsed.length > 0 ? parsed : fallback;
  }

  return fallback;
}

function isMissingColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? (error.code as string | undefined) : undefined;
  return maybeCode === "42703" || maybeCode === "PGRST204";
}

function isMissingTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? (error.code as string | undefined) : undefined;
  return maybeCode === "42P01" || maybeCode === "PGRST205";
}

function parseGameContent(value: string | null | undefined): GameContent {
  if (!value) {
    return { banner: "", tagline: "", description: "", services: [] };
  }

  try {
    const parsed = JSON.parse(value) as Partial<GameContent>;
    return {
      banner: normalizeText(parsed?.banner),
      tagline: normalizeText(parsed?.tagline),
      description: normalizeText(parsed?.description),
      services: normalizeServices(parsed?.services, []),
    };
  } catch {
    return { banner: "", tagline: "", description: "", services: [] };
  }
}

async function fetchGameContentMap(): Promise<Record<string, GameContent>> {
  const { data, error } = await db
    .from("site_settings")
    .select("key, value")
    .like("key", `${GAME_CONTENT_PREFIX}%`);

  if (error) {
    if (isMissingTable(error)) return {};
    throw error;
  }

  const map: Record<string, GameContent> = {};
  for (const row of (data ?? []) as SettingRow[]) {
    if (!row.key?.startsWith(GAME_CONTENT_PREFIX)) continue;
    const key = row.key.slice(GAME_CONTENT_PREFIX.length);
    map[key] = parseGameContent(row.value);
  }
  return map;
}

export async function GET() {
  try {
    const gamesWithHidden = await db.from("games").select("*").eq("is_hidden", false).order("display_order").order("id");
    const gamesFallback = gamesWithHidden.error && isMissingColumn(gamesWithHidden.error)
      ? await db.from("games").select("*").order("display_order").order("id")
      : null;
    const gamesError = gamesFallback ? gamesFallback.error : gamesWithHidden.error;
    if (gamesError) throw gamesError;

    const [games, contentMap] = await Promise.all([
      (gamesFallback?.data ?? gamesWithHidden.data ?? []) as GameRow[],
      fetchGameContentMap(),
    ]);

    const payload = games.map((game) => {
      const fallback = FALLBACK_GAME_CONTENT[game.key] ?? {
        logo: "",
        banner: "",
        tagline: "",
        description: "",
        services: [],
      };
      const stored = contentMap[game.key] ?? { banner: "", tagline: "", description: "", services: [] };

      const resolvedLogo = normalizeText(game.logo) || fallback.logo;
      const resolvedBanner = normalizeText(stored.banner) || normalizeText(game.banner) || resolvedLogo || fallback.banner;
      const resolvedTagline = normalizeText(stored.tagline) || normalizeText(game.tagline) || fallback.tagline;
      const resolvedDescription = normalizeText(stored.description) || normalizeText(game.description) || fallback.description;
      const resolvedServices =
        stored.services.length > 0
          ? stored.services
          : normalizeServices(game.services, fallback.services);

      return {
        id: game.id,
        key: game.key,
        name: game.label,
        logo: resolvedLogo,
        banner: resolvedBanner,
        tagline: resolvedTagline,
        description: resolvedDescription,
        services: resolvedServices,
      };
    });

    return NextResponse.json(payload, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Public games GET error:", error);
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
  }
}
