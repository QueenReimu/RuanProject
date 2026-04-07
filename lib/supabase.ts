import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SUPABASE_TIMEOUT_MS = 30000;
const SUPABASE_MAX_ATTEMPTS = 3;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractErrorText(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (!(error instanceof Error)) return String(error);

  const causeMessage =
    typeof (error as Error & { cause?: unknown }).cause === "object" &&
    (error as Error & { cause?: { message?: unknown } }).cause &&
    "message" in ((error as Error & { cause?: { message?: unknown } }).cause as { message?: unknown })
      ? String(((error as Error & { cause?: { message?: unknown } }).cause as { message?: unknown }).message ?? "")
      : "";
  return `${error.message} ${causeMessage}`.trim();
}

function isRetryableError(error: unknown): boolean {
  const text = extractErrorText(error).toLowerCase();
  const patterns = [
    "fetch failed",
    "connect timeout",
    "und_err_connect_timeout",
    "etimedout",
    "econnreset",
    "enotfound",
    "eai_again",
    "networkerror",
    "failed to fetch",
    "aborted",
  ];
  return patterns.some((pattern) => text.includes(pattern));
}

function shouldRetryStatus(status: number): boolean {
  return [408, 425, 429, 500, 502, 503, 504, 522, 524].includes(status);
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
  if (init.signal) {
    return fetch(input, init);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function resilientFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= SUPABASE_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchWithTimeout(input, init);
      if (attempt < SUPABASE_MAX_ATTEMPTS && shouldRetryStatus(response.status)) {
        await wait(250 * attempt);
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < SUPABASE_MAX_ATTEMPTS && isRetryableError(error)) {
        await wait(350 * attempt);
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Supabase request failed");
}

// Public client - for frontend data fetching (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: resilientFetch },
});

// Admin client - for admin API routes (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
      global: { fetch: resilientFetch },
    })
  : null;
