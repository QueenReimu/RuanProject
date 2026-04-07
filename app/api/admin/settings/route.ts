import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

type SettingRow = {
  key: string;
  value: string | null;
};

function isMissingTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? (error.code as string | undefined) : undefined;
  return maybeCode === "42P01" || maybeCode === "PGRST205";
}

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabaseAdmin!.from("site_settings").select("key, value").order("key");
    if (error) {
      if (isMissingTable(error)) {
        return NextResponse.json([]);
      }
      throw error;
    }

    return NextResponse.json((data as SettingRow[]) ?? []);
  } catch (error) {
    console.error("Admin settings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const key = String(body?.key ?? "").trim();
    const value = body?.value === undefined || body?.value === null ? "" : String(body.value);

    if (!key) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin!
      .from("site_settings")
      .upsert(
        {
          key,
          value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )
      .select("key, value")
      .single();

    if (error) {
      if (isMissingTable(error)) {
        return NextResponse.json({ error: "Table site_settings belum dibuat. Jalankan migration terbaru." }, { status: 500 });
      }
      throw error;
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Admin settings PUT error:", error);
    return NextResponse.json({ error: "Failed to save setting" }, { status: 500 });
  }
}
