import { supabaseAdmin } from "@/lib/supabase";

export type TestimonialItem = {
  id: number;
  src: string;
  alt: string;
  caption: string;
  is_hidden: boolean;
  display_order: number;
};

type CreatePayload = {
  src: string;
  alt: string;
  caption: string;
  is_hidden: boolean;
  display_order: number;
};

type UpdatePayload = Partial<CreatePayload>;

type StoreMode = "table" | "settings";

const SETTINGS_KEY = "testimonials_json";

export const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  { id: 1, src: "/testi/1.jpeg", alt: "Testimonial 1", caption: "", is_hidden: false, display_order: 1 },
  { id: 2, src: "/testi/2.jpeg", alt: "Testimonial 2", caption: "", is_hidden: false, display_order: 2 },
  { id: 3, src: "/testi/3.jpeg", alt: "Testimonial 3", caption: "", is_hidden: false, display_order: 3 },
];

function isMissingTestimonialsTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const message = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    message.includes("public.testimonials") ||
    message.toLowerCase().includes("table 'public.testimonials'")
  );
}

function normalizeItem(input: Partial<TestimonialItem>, index: number): TestimonialItem {
  const rawId = Number(input.id ?? 0);
  return {
    id: rawId > 0 ? rawId : index + 1,
    src: String(input.src ?? "").trim(),
    alt: String(input.alt ?? "").trim(),
    caption: String(input.caption ?? "").trim(),
    is_hidden: Boolean(input.is_hidden ?? false),
    display_order: Number(input.display_order ?? index + 1),
  };
}

function sortItems(items: TestimonialItem[]) {
  return [...items].sort((a, b) => a.display_order - b.display_order || a.id - b.id);
}

async function resolveMode(): Promise<StoreMode> {
  const probe = await supabaseAdmin!.from("testimonials").select("id").limit(1);
  if (!probe.error) return "table";
  if (isMissingTestimonialsTable(probe.error)) return "settings";
  throw probe.error;
}

async function readFromSettings(): Promise<TestimonialItem[]> {
  const { data, error } = await supabaseAdmin!
    .from("site_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();
  if (error) throw error;

  const raw = data?.value;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return [];
    return sortItems(
      parsed
        .map((item, index) => normalizeItem(item as Partial<TestimonialItem>, index))
        .filter((item) => item.src.length > 0)
    );
  } catch {
    return [];
  }
}

async function writeToSettings(items: TestimonialItem[]) {
  const payload = {
    key: SETTINGS_KEY,
    value: JSON.stringify(sortItems(items)),
  };
  const { error } = await supabaseAdmin!.from("site_settings").upsert(payload, { onConflict: "key" });
  if (error) throw error;
}

function normalizeForCreate(payload: CreatePayload) {
  return {
    src: String(payload.src ?? "").trim(),
    alt: String(payload.alt ?? "").trim(),
    caption: String(payload.caption ?? "").trim(),
    is_hidden: Boolean(payload.is_hidden ?? false),
    display_order: Number(payload.display_order ?? 0),
  };
}

export async function getTestimonials(_seedIfEmpty = false): Promise<TestimonialItem[]> {
  const mode = await resolveMode();

  if (mode === "table") {
    const { data, error } = await supabaseAdmin!
      .from("testimonials")
      .select("*")
      .order("display_order")
      .order("id");
    if (error) throw error;

    const rows = (data ?? []).map((row, index) => normalizeItem(row as Partial<TestimonialItem>, index));
    return rows;
  }

  const items = await readFromSettings();
  return items;
}

export async function createTestimonial(payload: CreatePayload): Promise<TestimonialItem> {
  const mode = await resolveMode();
  const normalized = normalizeForCreate(payload);

  if (!normalized.src) {
    throw new Error("src is required");
  }

  if (mode === "table") {
    const { data, error } = await supabaseAdmin!.from("testimonials").insert(normalized).select("*").single();
    if (error) throw error;
    return normalizeItem(data as Partial<TestimonialItem>, 0);
  }

  const current = await readFromSettings();
  const nextId = current.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const created: TestimonialItem = {
    id: nextId,
    ...normalized,
  };
  await writeToSettings([...current, created]);
  return created;
}

export async function updateTestimonial(id: number, updates: UpdatePayload): Promise<TestimonialItem> {
  const mode = await resolveMode();

  if (mode === "table") {
    const { data, error } = await supabaseAdmin!
      .from("testimonials")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return normalizeItem(data as Partial<TestimonialItem>, 0);
  }

  const current = await readFromSettings();
  const index = current.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Testimonial not found");

  const next = [...current];
  next[index] = normalizeItem(
    {
      ...next[index],
      ...updates,
      id,
    },
    index
  );
  await writeToSettings(next);
  return next[index];
}

export async function deleteTestimonial(id: number): Promise<void> {
  const mode = await resolveMode();

  if (mode === "table") {
    const { error } = await supabaseAdmin!.from("testimonials").delete().eq("id", id);
    if (error) throw error;
    return;
  }

  const current = await readFromSettings();
  await writeToSettings(current.filter((item) => item.id !== id));
}
