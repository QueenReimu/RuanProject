import { NextResponse } from "next/server";
import { readPublicGachaImages } from "@/lib/gacha-images";
export const dynamic = "force-dynamic";
export const revalidate = 0;
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  try {
    const data = await readPublicGachaImages();
    return NextResponse.json(data, { headers: NO_STORE_HEADERS });
  } catch {
    return NextResponse.json({ error: "Failed to fetch gacha images" }, { status: 500 });
  }
}
