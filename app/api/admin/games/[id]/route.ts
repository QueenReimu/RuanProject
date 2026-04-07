import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminSession } from "@/lib/auth";

const GAME_CONTENT_PREFIX = "game_content:";

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

type GameIdentity = {
  id: number;
  key: string;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function parseServices(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((service) => normalizeText(service)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((service) => service.trim())
      .filter(Boolean);
  }

  return [];
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

async function getGameContent(gameKey: string): Promise<GameContent> {
  if (!gameKey) return emptyGameContent();

  const { data, error } = await supabaseAdmin!
    .from("site_settings")
    .select("key, value")
    .eq("key", gameContentKey(gameKey))
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) return emptyGameContent();
    throw error;
  }

  return parseGameContent((data as SettingRow | null)?.value);
}

async function upsertGameContent(gameKey: string, content: GameContent): Promise<void> {
  if (!gameKey) return;

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

async function deleteGameContent(gameKey: string): Promise<void> {
  if (!gameKey) return;

  const { error } = await supabaseAdmin!
    .from("site_settings")
    .delete()
    .eq("key", gameContentKey(gameKey));

  if (error && !isMissingTable(error)) {
    throw error;
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const gameId = Number(id);
    const body = await request.json();

    const gameIdentity = await supabaseAdmin!
      .from("games")
      .select("id, key")
      .eq("id", gameId)
      .single();
    if (gameIdentity.error) throw gameIdentity.error;

    const current = gameIdentity.data as GameIdentity;
    const previousKey = normalizeText(current.key);

    const updates: Record<string, unknown> = {};
    if (body?.key !== undefined) updates.key = normalizeText(body.key);
    if (body?.label !== undefined) updates.label = normalizeText(body.label);
    if (body?.logo !== undefined) updates.logo = normalizeText(body.logo);
    if (body?.banner !== undefined) updates.banner = normalizeText(body.banner);
    if (body?.tagline !== undefined) updates.tagline = normalizeText(body.tagline);
    if (body?.description !== undefined) updates.description = normalizeText(body.description);
    if (body?.services !== undefined) updates.services = parseServices(body.services);
    if (body?.display_order !== undefined) updates.display_order = Number(body.display_order ?? 0);
    if (body?.is_hidden !== undefined) updates.is_hidden = Boolean(body.is_hidden);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    let result = await supabaseAdmin!
      .from("games")
      .update(updates)
      .eq("id", gameId)
      .select()
      .single();

    if (result.error && isMissingColumn(result.error)) {
      const legacyUpdates: Record<string, unknown> = {};
      if (updates.key !== undefined) legacyUpdates.key = updates.key;
      if (updates.label !== undefined) legacyUpdates.label = updates.label;
      if (updates.logo !== undefined) legacyUpdates.logo = updates.logo;
      if (updates.display_order !== undefined) legacyUpdates.display_order = updates.display_order;
      if (updates.is_hidden !== undefined) legacyUpdates.is_hidden = updates.is_hidden;

      if (Object.keys(legacyUpdates).length > 0) {
        result = await supabaseAdmin!
          .from("games")
          .update(legacyUpdates)
          .eq("id", gameId)
          .select()
          .single();
      }

      if (result.error && isMissingColumn(result.error)) {
        const minimalUpdates: Record<string, unknown> = {};
        if (legacyUpdates.key !== undefined) minimalUpdates.key = legacyUpdates.key;
        if (legacyUpdates.label !== undefined) minimalUpdates.label = legacyUpdates.label;
        if (legacyUpdates.logo !== undefined) minimalUpdates.logo = legacyUpdates.logo;
        if (legacyUpdates.display_order !== undefined) minimalUpdates.display_order = legacyUpdates.display_order;

        if (Object.keys(minimalUpdates).length > 0) {
          result = await supabaseAdmin!
            .from("games")
            .update(minimalUpdates)
            .eq("id", gameId)
            .select()
            .single();
        }
      }
    }

    if (result.error) throw result.error;

    const updated = (result.data ?? {}) as Record<string, unknown>;
    const nextKey = normalizeText(updated.key) || normalizeText(body?.key) || previousKey;
    const hasContentField =
      body?.banner !== undefined ||
      body?.tagline !== undefined ||
      body?.description !== undefined ||
      body?.services !== undefined;

    let finalContent = await getGameContent(previousKey);
    if (hasContentField || nextKey !== previousKey) {
      finalContent = {
        banner: body?.banner !== undefined ? normalizeText(body.banner) : finalContent.banner,
        tagline: body?.tagline !== undefined ? normalizeText(body.tagline) : finalContent.tagline,
        description: body?.description !== undefined ? normalizeText(body.description) : finalContent.description,
        services: body?.services !== undefined ? parseServices(body.services) : finalContent.services,
      };

      await upsertGameContent(nextKey, finalContent);
      if (nextKey !== previousKey) {
        await deleteGameContent(previousKey);
      }
    }

    return NextResponse.json({
      ...updated,
      key: nextKey,
      banner: finalContent.banner || normalizeText(updated.banner),
      tagline: finalContent.tagline || normalizeText(updated.tagline),
      description: finalContent.description || normalizeText(updated.description),
      services: finalContent.services.length > 0 ? finalContent.services : parseServices(updated.services),
    });
  } catch (error) {
    console.error("Admin games PUT error:", error);
    return NextResponse.json({ error: "Failed to update game" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdminSession(_request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const gameId = Number(id);

    const gameIdentity = await supabaseAdmin!
      .from("games")
      .select("id, key")
      .eq("id", gameId)
      .single();
    if (gameIdentity.error) throw gameIdentity.error;

    const game = gameIdentity.data as GameIdentity;
    const { error } = await supabaseAdmin!
      .from("games")
      .delete()
      .eq("id", gameId);

    if (error) throw error;

    await deleteGameContent(normalizeText(game.key));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin games DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete game" }, { status: 500 });
  }
}
