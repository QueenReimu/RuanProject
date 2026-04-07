import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin!
      .from("gacha_images")
      .select("id, src, alt, display_order")
      .eq("is_hidden", false)
      .order("display_order");

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch gacha images" }, { status: 500 });
  }
}
