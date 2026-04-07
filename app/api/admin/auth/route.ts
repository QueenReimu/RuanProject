import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  ADMIN_SESSION_COOKIE,
  cleanupExpiredAdminSessions,
  createAdminSessionToken,
  createStatelessAdminSessionToken,
  getAdminSessionDurationMs,
  getClientIp,
  getUserAgent,
  hashAdminSessionToken,
  hashUserAgent,
  isStatelessAdminSessionToken,
  isIpAllowed,
  verifyAdminPassword,
} from "@/lib/auth";

const MAX_LOGIN_ATTEMPTS = Number(process.env.ADMIN_MAX_ATTEMPTS ?? 7);
const LOGIN_BLOCK_MINUTES = Number(process.env.ADMIN_BLOCK_MINUTES ?? 15);

type LoginAttemptRow = {
  ip_address: string;
  attempts: number;
  blocked_until: string | null;
};

function isSchemaMismatch(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? (error.code as string | undefined) : undefined;
  if (!maybeCode) return false;
  return maybeCode === "42703" || maybeCode === "42P01" || maybeCode === "PGRST204" || maybeCode === "PGRST205";
}

function normalizeLimits(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function getLoginAttempt(ipAddress: string): Promise<LoginAttemptRow | null> {
  if (!supabaseAdmin || !ipAddress) return null;

  const { data, error } = await supabaseAdmin
    .from("admin_login_attempts")
    .select("ip_address, attempts, blocked_until")
    .eq("ip_address", ipAddress)
    .maybeSingle();

  if (error) {
    if (isSchemaMismatch(error)) return null;
    throw error;
  }

  return (data as LoginAttemptRow | null) ?? null;
}

async function recordFailedLogin(ipAddress: string) {
  if (!supabaseAdmin || !ipAddress) return;

  const safeMaxAttempts = normalizeLimits(MAX_LOGIN_ATTEMPTS, 7);
  const safeBlockMinutes = normalizeLimits(LOGIN_BLOCK_MINUTES, 15);
  const now = new Date();

  try {
    const current = await getLoginAttempt(ipAddress);
    const nextAttempts = (current?.attempts ?? 0) + 1;
    const shouldBlock = nextAttempts >= safeMaxAttempts;

    const payload = {
      ip_address: ipAddress,
      attempts: nextAttempts,
      blocked_until: shouldBlock ? new Date(now.getTime() + safeBlockMinutes * 60 * 1000).toISOString() : null,
      last_attempt_at: now.toISOString(),
    };

    await supabaseAdmin.from("admin_login_attempts").upsert(payload, { onConflict: "ip_address" });
  } catch (error) {
    if (!isSchemaMismatch(error)) {
      throw error;
    }
  }
}

async function clearLoginAttempts(ipAddress: string) {
  if (!supabaseAdmin || !ipAddress) return;
  const result = await supabaseAdmin.from("admin_login_attempts").delete().eq("ip_address", ipAddress);
  if (result.error && !isSchemaMismatch(result.error)) {
    throw result.error;
  }
}

async function isIpTemporarilyBlocked(ipAddress: string): Promise<{ blocked: boolean; retryAfter: number }> {
  if (!ipAddress) return { blocked: false, retryAfter: 0 };

  const current = await getLoginAttempt(ipAddress);
  if (!current?.blocked_until) return { blocked: false, retryAfter: 0 };

  const until = new Date(current.blocked_until).getTime();
  const now = Date.now();
  if (until <= now) return { blocked: false, retryAfter: 0 };

  return { blocked: true, retryAfter: Math.ceil((until - now) / 1000) };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const password = typeof body?.password === "string" ? body.password : "";

    if (!password) {
      return NextResponse.json({ error: "Password wajib diisi" }, { status: 400 });
    }

    const ipAddress = getClientIp(request);
    if (!isIpAllowed(ipAddress)) {
      return NextResponse.json({ error: "Akses dashboard ditolak dari IP ini" }, { status: 403 });
    }

    const blockState = await isIpTemporarilyBlocked(ipAddress);
    if (blockState.blocked) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan login. Coba lagi sebentar.", retryAfter: blockState.retryAfter },
        { status: 429 }
      );
    }

    const passwordValid = verifyAdminPassword(password);
    if (!passwordValid) {
      await recordFailedLogin(ipAddress);
      return NextResponse.json({ error: "Password salah" }, { status: 401 });
    }

    await clearLoginAttempts(ipAddress);

    const rawToken = createAdminSessionToken();
    const hashedToken = hashAdminSessionToken(rawToken);
    const expiresAt = new Date(Date.now() + getAdminSessionDurationMs());
    const userAgentHash = hashUserAgent(getUserAgent(request));
    let cookieToken = rawToken;
    let persistedSession = false;

    if (supabaseAdmin) {
      const secureInsert = await supabaseAdmin.from("admin_sessions").insert({
        id: hashedToken,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress || null,
        user_agent_hash: userAgentHash,
        last_seen_at: new Date().toISOString(),
      });

      if (secureInsert.error && isSchemaMismatch(secureInsert.error)) {
        const fallbackInsert = await supabaseAdmin.from("admin_sessions").insert({
          id: hashedToken,
          expires_at: expiresAt.toISOString(),
        });
        if (!fallbackInsert.error) {
          persistedSession = true;
        } else if (!isSchemaMismatch(fallbackInsert.error)) {
          throw fallbackInsert.error;
        }
      } else if (secureInsert.error) {
        throw secureInsert.error;
      } else {
        persistedSession = true;
      }

      if (persistedSession) {
        await cleanupExpiredAdminSessions();
      }
    }

    if (!persistedSession) {
      cookieToken = createStatelessAdminSessionToken({
        expiresAt,
        userAgentHash,
        ipAddress,
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: cookieToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

    if (rawToken && supabaseAdmin && !isStatelessAdminSessionToken(rawToken)) {
      const hashedToken = hashAdminSessionToken(rawToken);
      const result = await supabaseAdmin.from("admin_sessions").delete().in("id", [hashedToken, rawToken]);
      if (result.error && !isSchemaMismatch(result.error)) {
        throw result.error;
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
