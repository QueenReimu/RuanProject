import crypto from "crypto";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

export const ADMIN_SESSION_COOKIE = "admin_session";
const STATELESS_PREFIX = "v1";

const DEFAULT_SESSION_HOURS = 12;
const FALLBACK_USER_AGENT = "unknown-user-agent";

type AdminSessionRow = {
  id: string;
  expires_at: string;
  ip_address?: string | null;
  user_agent_hash?: string | null;
};

function getSessionSecret(): string {
  const explicitSecret = (process.env.ADMIN_SESSION_SECRET ?? "").trim();
  if (explicitSecret) return explicitSecret;

  const passwordSecret = (process.env.ADMIN_PASSWORD ?? "").trim();
  if (passwordSecret) return passwordSecret;

  return "ruan-joki-fallback-session-secret";
}

function isStrictUserAgentBindingEnabled(): boolean {
  return process.env.ADMIN_STRICT_UA_BINDING === "true";
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function hashSha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function signHmacSha256(value: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function encodeBase64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeBase64UrlJson<T>(value: string): T | null {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

function normalizeIp(rawIp: string | null): string {
  if (!rawIp) return "";
  return rawIp.replace(/^::ffff:/, "").trim();
}

function parseAllowedIps(): string[] {
  return (process.env.ADMIN_ALLOWED_IPS ?? "")
    .split(",")
    .map((item) => normalizeIp(item))
    .filter(Boolean);
}

function isSchemaMismatch(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? (error.code as string | undefined) : undefined;
  if (!maybeCode) return false;
  return maybeCode === "42703" || maybeCode === "42P01" || maybeCode === "PGRST204" || maybeCode === "PGRST205";
}

async function findSessionById(sessionId: string): Promise<AdminSessionRow | null> {
  if (!supabaseAdmin) return null;

  const withSecurityColumns = await supabaseAdmin
    .from("admin_sessions")
    .select("id, expires_at, ip_address, user_agent_hash")
    .eq("id", sessionId)
    .maybeSingle();

  if (!withSecurityColumns.error) {
    return (withSecurityColumns.data as AdminSessionRow | null) ?? null;
  }

  if (isSchemaMismatch(withSecurityColumns.error)) {
    const fallback = await supabaseAdmin
      .from("admin_sessions")
      .select("id, expires_at")
      .eq("id", sessionId)
      .maybeSingle();

    if (!fallback.error) {
      return (fallback.data as AdminSessionRow | null) ?? null;
    }
  }

  return null;
}

async function updateSessionLastSeen(sessionId: string) {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from("admin_sessions").update({ last_seen_at: new Date().toISOString() }).eq("id", sessionId);
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim() || "";
    return normalizeIp(firstIp);
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return normalizeIp(realIp);
  }

  return "";
}

export function getUserAgent(request: Request): string {
  return request.headers.get("user-agent") || FALLBACK_USER_AGENT;
}

export function hashUserAgent(userAgent: string): string {
  return hashSha256(userAgent || FALLBACK_USER_AGENT);
}

export function isIpAllowed(ipAddress: string): boolean {
  const allowedIps = parseAllowedIps();
  if (allowedIps.length === 0) return true;
  if (!ipAddress) return false;
  return allowedIps.includes(normalizeIp(ipAddress));
}

export function createAdminSessionToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashAdminSessionToken(token: string): string {
  return hashSha256(token);
}

type StatelessSessionPayload = {
  exp: number;
  nonce: string;
  ua: string;
  ip?: string;
};

export function isStatelessAdminSessionToken(token: string): boolean {
  return token.startsWith(`${STATELESS_PREFIX}.`);
}

export function createStatelessAdminSessionToken(opts: { expiresAt: Date; userAgentHash: string; ipAddress?: string }): string {
  const payload: StatelessSessionPayload = {
    exp: opts.expiresAt.getTime(),
    nonce: crypto.randomUUID(),
    ua: opts.userAgentHash,
    ip: opts.ipAddress || "",
  };
  const encodedPayload = encodeBase64UrlJson(payload);
  const signature = signHmacSha256(`${STATELESS_PREFIX}.${encodedPayload}`);
  return `${STATELESS_PREFIX}.${encodedPayload}.${signature}`;
}

export function verifyStatelessAdminSessionToken(token: string, request?: Request): boolean {
  if (!isStatelessAdminSessionToken(token)) return false;

  const [prefix, encodedPayload, signature] = token.split(".");
  if (!prefix || !encodedPayload || !signature) return false;
  if (prefix !== STATELESS_PREFIX) return false;

  const expectedSignature = signHmacSha256(`${prefix}.${encodedPayload}`);
  if (!safeCompare(expectedSignature, signature)) return false;

  const payload = decodeBase64UrlJson<StatelessSessionPayload>(encodedPayload);
  if (!payload) return false;
  if (!payload.exp || payload.exp <= Date.now()) return false;

  if (request) {
    const currentUserAgentHash = hashUserAgent(getUserAgent(request));
    if (isStrictUserAgentBindingEnabled() && !safeCompare(payload.ua || "", currentUserAgentHash)) return false;

    const currentIp = getClientIp(request);
    const strictIpBinding = process.env.ADMIN_STRICT_IP_BINDING === "true";
    if (strictIpBinding && payload.ip && currentIp && payload.ip !== currentIp) {
      return false;
    }
  }

  return true;
}

export function getAdminSessionDurationMs(): number {
  const configuredHours = Number(process.env.ADMIN_SESSION_HOURS ?? DEFAULT_SESSION_HOURS);
  const safeHours = Number.isFinite(configuredHours) && configuredHours > 0 ? configuredHours : DEFAULT_SESSION_HOURS;
  return safeHours * 60 * 60 * 1000;
}

export function verifyAdminPassword(inputPassword: string): boolean {
  const hashedPassword = (process.env.ADMIN_PASSWORD_HASH ?? "").trim();

  if (hashedPassword) {
    const [algorithm, arg1, arg2] = hashedPassword.split("$");

    if (algorithm === "sha256" && arg1) {
      const inputHash = hashSha256(inputPassword);
      return safeCompare(inputHash, arg1);
    }

    if (algorithm === "scrypt" && arg1 && arg2) {
      const derived = crypto.scryptSync(inputPassword, arg1, 64).toString("hex");
      return safeCompare(derived, arg2);
    }

    return false;
  }

  const plainPassword = process.env.ADMIN_PASSWORD ?? "";
  return safeCompare(inputPassword, plainPassword);
}

export async function cleanupExpiredAdminSessions() {
  if (!supabaseAdmin) return;
  const result = await supabaseAdmin.from("admin_sessions").delete().lt("expires_at", new Date().toISOString());
  if (result.error && !isSchemaMismatch(result.error)) {
    throw result.error;
  }
}

export async function verifyAdminSession(request?: Request): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!rawToken) return false;

    if (request) {
      const currentIp = getClientIp(request);
      if (!isIpAllowed(currentIp)) return false;
    }

    if (isStatelessAdminSessionToken(rawToken)) {
      return verifyStatelessAdminSessionToken(rawToken, request);
    }

    if (!supabaseAdmin) return false;

    const sessionId = hashAdminSessionToken(rawToken);
    const session = await findSessionById(sessionId);

    if (!session) {
      return false;
    }

    if (new Date(session.expires_at).getTime() <= Date.now()) {
      await supabaseAdmin.from("admin_sessions").delete().eq("id", sessionId);
      return false;
    }

    if (request) {
      const currentIp = getClientIp(request);
      const strictIpBinding = process.env.ADMIN_STRICT_IP_BINDING === "true";
      if (strictIpBinding && session.ip_address && currentIp && session.ip_address !== currentIp) {
        await supabaseAdmin.from("admin_sessions").delete().eq("id", sessionId);
        return false;
      }

      if (session.user_agent_hash) {
        const currentUserAgentHash = hashUserAgent(getUserAgent(request));
        if (isStrictUserAgentBindingEnabled() && !safeCompare(session.user_agent_hash, currentUserAgentHash)) {
          await supabaseAdmin.from("admin_sessions").delete().eq("id", sessionId);
          return false;
        }
      }
    }

    await updateSessionLastSeen(sessionId);
    return true;
  } catch {
    return false;
  }
}
