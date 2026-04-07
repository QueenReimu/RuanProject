import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { siteConfig } from "@/config/site";

type AdminRow = {
  id?: number;
  key?: string;
  name?: string;
  image?: string;
  wa_number?: string;
  role?: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
  is_hidden?: boolean;
};

function isMissingColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? (error.code as string | undefined) : undefined;
  return maybeCode === "42703" || maybeCode === "PGRST204";
}

function mapFallbackFromConfig() {
  return siteConfig.adminWhatsAppNumbers.map((item, index) => ({
    id: index + 1,
    key: item.key,
    name: item.label,
    image: "",
    wa_number: item.number,
    role: "",
    description: "",
    display_order: index + 1,
  }));
}

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(mapFallbackFromConfig());
    }

    const adminsWithHidden = await supabaseAdmin
      .from("admins")
      .select("*")
      .eq("is_active", true)
      .eq("is_hidden", false)
      .order("display_order")
      .order("id");

    const adminsFallback = adminsWithHidden.error && isMissingColumn(adminsWithHidden.error)
      ? await supabaseAdmin
          .from("admins")
          .select("*")
          .eq("is_active", true)
          .order("display_order")
          .order("id")
      : null;

    const adminsError = adminsFallback ? adminsFallback.error : adminsWithHidden.error;
    if (adminsError) throw adminsError;

    const rows = (adminsFallback?.data ?? adminsWithHidden.data ?? []) as AdminRow[];
    const payload = rows
      .map((row, index) => ({
        id: Number(row.id ?? index + 1),
        key: String(row.key ?? "").trim(),
        name: String(row.name ?? "").trim(),
        image: String(row.image ?? "").trim(),
        wa_number: String(row.wa_number ?? "").trim(),
        role: String(row.role ?? "").trim(),
        description: String(row.description ?? "").trim(),
        display_order: Number(row.display_order ?? index),
      }))
      .filter((item) => item.key && item.name && item.wa_number);

    if (payload.length === 0) {
      return NextResponse.json(mapFallbackFromConfig());
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Public admins GET error:", error);
    return NextResponse.json(mapFallbackFromConfig());
  }
}

