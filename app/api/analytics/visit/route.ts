import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const VISITOR_COOKIE = "site_visitor_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function hashSha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sanitizePath(pathValue: unknown): string {
  const raw = typeof pathValue === "string" ? pathValue.trim() : "/";
  if (!raw.startsWith("/")) return "/";
  return raw.length > 250 ? raw.slice(0, 250) : raw;
}

function isBotTraffic(userAgent: string): boolean {
  return /bot|crawler|spider|slurp|preview|facebookexternalhit|whatsapp/i.test(userAgent);
}

function isMissingTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? (error.code as string | undefined) : undefined;
  return maybeCode === "42P01" || maybeCode === "PGRST205";
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const body = await request.json().catch(() => ({}));
    const pagePath = sanitizePath(body?.path);
    const userAgent = request.headers.get("user-agent") || "unknown-agent";

    if (isBotTraffic(userAgent)) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const cookieStore = await cookies();
    let visitorId = cookieStore.get(VISITOR_COOKIE)?.value;
    let createdVisitorCookie = false;

    if (!visitorId) {
      visitorId = `${crypto.randomUUID()}-${crypto.randomBytes(8).toString("hex")}`;
      createdVisitorCookie = true;
    }

    const visitDate = new Date().toISOString().slice(0, 10);
    const visitorHash = hashSha256(`${visitorId}:${userAgent.slice(0, 200)}`);

    const { error } = await supabaseAdmin.from("site_visits").upsert(
      {
        visit_date: visitDate,
        visitor_hash: visitorHash,
        page_path: pagePath,
      },
      {
        onConflict: "visit_date,visitor_hash,page_path",
        ignoreDuplicates: true,
      }
    );

    if (error && !isMissingTable(error)) {
      throw error;
    }

    const response = NextResponse.json({ success: true });
    if (createdVisitorCookie) {
      response.cookies.set({
        name: VISITOR_COOKIE,
        value: visitorId,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ONE_YEAR_SECONDS,
      });
    }

    return response;
  } catch (error) {
    console.error("Analytics visit tracking error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
