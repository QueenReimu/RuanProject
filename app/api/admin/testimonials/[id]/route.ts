import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { deleteTestimonial, updateTestimonial } from "@/lib/testimonials-store";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body?.src !== undefined) {
      const src = String(body.src ?? "").trim();
      if (!src) {
        return NextResponse.json({ error: "src is required" }, { status: 400 });
      }
      updates.src = src;
    }
    if (body?.alt !== undefined) updates.alt = String(body.alt ?? "").trim();
    if (body?.caption !== undefined) updates.caption = String(body.caption ?? "").trim();
    if (body?.is_hidden !== undefined) updates.is_hidden = Boolean(body.is_hidden);
    if (body?.display_order !== undefined) updates.display_order = Number(body.display_order ?? 0);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const data = await updateTestimonial(Number(id), updates);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Testimonials PUT error:", error);
    return NextResponse.json({ error: "Failed to update testimonial" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await deleteTestimonial(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Testimonials DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete testimonial" }, { status: 500 });
  }
}
