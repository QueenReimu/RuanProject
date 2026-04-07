import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminSession } from "@/lib/auth";

const GAME_CONTENT_PREFIX = "game_content:";

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

const FALLBACK_GAME_CONTENT: Record<string, GameContent> = {
  genshin: {
    banner: "/products/Genshin.jpg",
    tagline: "Primo, explorasi, quest, rawat akun, benerin akun, aplikasi premium.",
    description:
      "Layanan lengkap untuk kebutuhan harian maupun progres akun. Cocok untuk player yang ingin progres cepat namun tetap aman.",
    services: ["Primogem", "Explorasi", "Quest", "Rawat Akun", "Benerin Akun", "Aplikasi Premium"],
  },
  wuwa: {
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

function parseServices(value: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(value)) {
    const parsed = value.map((service) => normalizeText(service)).filter(Boolean);
    return parsed.length > 0 ? parsed : fallback;
  }

  if (typeof value === "string") {
    const parsed = value
      .split(/\r?\n|,/)
      .map((service) => service.trim())
      .filter(Boolean);
    return parsed.length > 0 ? parsed : fallback;
  }

  return fallback;
}

function emptyGameContent(): GameContent {
  return { banner: "", tagline: "", description: "", services: [] };
}

function parseGameContent(value: string | null | undefined): GameContent {
  if (!value) return emptyGameContent();

  try {
    const parsed = JSON.parse(value) as Partial<GameContent>;
    return {
      banner: normalizeText(parsed?.banner),
      tagline: normalizeText(parsed?.tagline),
      description: normalizeText(parsed?.description),
      services: parseServices(parsed?.services),
    };
  } catch {
    return emptyGameContent();
  }
}

function gameContentKey(gameKey: string): string {
  return `${GAME_CONTENT_PREFIX}${gameKey}`;
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

async function fetchGameContentMap(): Promise<Record<string, GameContent>> {
  const { data, error } = await supabaseAdmin!
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

async function upsertGameContent(gameKey: string, content: GameContent): Promise<void> {
  const { error } = await supabaseAdmin!
    .from("site_settings")
    .upsert(
      {
        key: gameContentKey(gameKey),
        value: JSON.stringify(content),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

  if (error && !isMissingTable(error)) {
    throw error;
  }
}

function mergeGameWithContent(game: GameRow, contentMap: Record<string, GameContent>): GameRow {
  const stored = contentMap[game.key] ?? emptyGameContent();
  const fallback = FALLBACK_GAME_CONTENT[game.key] ?? emptyGameContent();

  return {
    ...game,
    banner: normalizeText(stored.banner) || normalizeText(game.banner) || fallback.banner,
    tagline: normalizeText(stored.tagline) || normalizeText(game.tagline) || fallback.tagline,
    description: normalizeText(stored.description) || normalizeText(game.description) || fallback.description,
    services: stored.services.length > 0 ? stored.services : parseServices(game.services, fallback.services),
  };
}

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [gamesResult, contentMap] = await Promise.all([
      supabaseAdmin!.from("games").select("*").order("display_order").order("id"),
      fetchGameContentMap(),
    ]);

    if (gamesResult.error) throw gamesResult.error;
    const games = (gamesResult.data ?? []) as GameRow[];

    return NextResponse.json(games.map((game) => mergeGameWithContent(game, contentMap)));
  } catch (error) {
    console.error("Admin games GET error:", error);
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const key = normalizeText(body?.key);
    const label = normalizeText(body?.label);

    if (!key || !label) {
      return NextResponse.json({ error: "key and label are required" }, { status: 400 });
    }

    const content: GameContent = {
      banner: normalizeText(body?.banner),
      tagline: normalizeText(body?.tagline),
      description: normalizeText(body?.description),
      services: parseServices(body?.services),
    };

    const payload: Record<string, unknown> = {
      key,
      label,
      logo: normalizeText(body?.logo),
      banner: content.banner,
      tagline: content.tagline,
      description: content.description,
      services: content.services,
      display_order: Number(body?.display_order ?? 0),
      is_hidden: Boolean(body?.is_hidden ?? false),
    };

    let result = await supabaseAdmin!.from("games").insert(payload).select().single();
    if (result.error && isMissingColumn(result.error)) {
      const legacyPayload: Record<string, unknown> = {
        key,
        label,
        logo: payload.logo,
        display_order: payload.display_order,
        is_hidden: payload.is_hidden,
      };
      result = await supabaseAdmin!.from("games").insert(legacyPayload).select().single();
      if (result.error && isMissingColumn(result.error)) {
        const minimalPayload: Record<string, unknown> = {
          key,
          label,
          logo: payload.logo,
          display_order: payload.display_order,
        };
        result = await supabaseAdmin!.from("games").insert(minimalPayload).select().single();
      }
    }

    if (result.error) throw result.error;

    const insertedGame = (result.data ?? {}) as Partial<GameRow>;
    const insertedKey = normalizeText(insertedGame.key) || key;
    await upsertGameContent(insertedKey, content);

    return NextResponse.json(
      {
        ...insertedGame,
        banner: content.banner || normalizeText(insertedGame.banner),
        tagline: content.tagline || normalizeText(insertedGame.tagline),
        description: content.description || normalizeText(insertedGame.description),
        services: content.services.length > 0 ? content.services : parseServices(insertedGame.services),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin games POST error:", error);
    return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
  }
}
