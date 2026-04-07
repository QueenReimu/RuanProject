import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { createTestimonial, getTestimonials } from "@/lib/testimonials-store";

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await getTestimonials();
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Testimonials GET error:", error);
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const src = String(body?.src ?? "").trim();

    if (!src) {
      return NextResponse.json({ error: "src is required" }, { status: 400 });
    }

    const payload = {
      src,
      alt: String(body?.alt ?? "").trim(),
      caption: String(body?.caption ?? "").trim(),
      is_hidden: Boolean(body?.is_hidden ?? false),
      display_order: Number(body?.display_order ?? 0),
    };

    const data = await createTestimonial(payload);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Testimonials POST error:", error);
    return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
  }
}
