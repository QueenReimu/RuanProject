import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

type VisitRow = { visitor_hash: string };

function toUtcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function uniqueVisitorCount(rows: VisitRow[] | null): number {
  const set = new Set((rows ?? []).map((row) => row.visitor_hash));
  return set.size;
}

function isMissingTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? (error.code as string | undefined) : undefined;
  return maybeCode === "42P01" || maybeCode === "PGRST205";
}

async function fetchRows(fromDate: string, toDate?: string): Promise<VisitRow[]> {
  if (!supabaseAdmin) return [];
  let query = supabaseAdmin.from("site_visits").select("visitor_hash").gte("visit_date", fromDate);
  if (toDate) query = query.lte("visit_date", toDate);
  const { data, error } = await query;
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return (data as VisitRow[] | null) ?? [];
}

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = startOfUtcDay(new Date());
    const todayString = toUtcDateString(today);

    const weekStart = new Date(today);
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);
    const weekStartString = toUtcDateString(weekStart);

    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const monthStartString = toUtcDateString(monthStart);

    const [dailyRows, weeklyRows, monthlyRows] = await Promise.all([
      fetchRows(todayString, todayString),
      fetchRows(weekStartString, todayString),
      fetchRows(monthStartString, todayString),
    ]);

    return NextResponse.json({
      visitors: {
        daily: uniqueVisitorCount(dailyRows),
        weekly: uniqueVisitorCount(weeklyRows),
        monthly: uniqueVisitorCount(monthlyRows),
      },
      pageViews: {
        daily: dailyRows.length,
        weekly: weeklyRows.length,
        monthly: monthlyRows.length,
      },
      range: {
        today: todayString,
        weekStart: weekStartString,
        monthStart: monthStartString,
      },
    });
  } catch (error) {
    console.error("Admin analytics GET error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
