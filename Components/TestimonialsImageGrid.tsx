"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useLocale, type Locale } from "@/Components/LocaleProvider";

type TestimonialItem = {
  id: number;
  src: string;
  alt: string;
  caption: string;
};

const PAGE_SIZE = 12;

const copy: Record<
  Locale,
  {
    label: string;
    title: string;
    desc: string;
    loadMore: string;
    collapse: string;
    showing: string;
    viewAll: string;
  }
> = {
  id: {
    label: "Testimoni",
    title: "Bukti Order dari Customer",
    desc: "Screenshot real dari pelanggan. Gallery ini otomatis menyesuaikan jika data testimoni bertambah banyak.",
    loadMore: "Lihat Lebih Banyak",
    collapse: "Tampilkan Lebih Sedikit",
    showing: "Menampilkan",
    viewAll: "Lihat Semua Testimoni",
  },
  en: {
    label: "Testimonials",
    title: "Real Customer Proof",
    desc: "Real screenshots from customers. This gallery automatically scales for larger testimonial data.",
    loadMore: "Load More",
    collapse: "Show Less",
    showing: "Showing",
    viewAll: "View All Testimonials",
  },
  my: {
    label: "Testimoni",
    title: "Bukti Pesanan Pelanggan",
    desc: "Tangkap layar sebenar daripada pelanggan. Galeri ini menyesuaikan automatik untuk data testimoni yang banyak.",
    loadMore: "Lihat Lagi",
    collapse: "Paparkan Kurang",
    showing: "Memaparkan",
    viewAll: "Lihat Semua Testimoni",
  },
};

function safeImageSrc(value: string | null | undefined) {
  const src = String(value ?? "").trim();
  return src.length > 0 ? src : "/testi/1.jpeg";
}

function getGalleryLayoutClass(itemCount: number): string {
  if (itemCount <= 1) return "max-w-md columns-1";
  if (itemCount === 2) return "max-w-3xl columns-2";
  if (itemCount === 3) return "max-w-5xl columns-2 md:columns-3 xl:columns-3";
  return "max-w-7xl columns-2 md:columns-3 xl:columns-4";
}

export default function TestimonialsImageGrid() {
  const { locale } = useLocale();
  const text = copy[locale];

  const [items, setItems] = useState<TestimonialItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeItem, setActiveItem] = useState<TestimonialItem | null>(null);
  const [channelUrl, setChannelUrl] = useState<string>("");

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch("/api/testimonials");
        if (!response.ok) {
          setItems([]);
          return;
        }

        const payload = await response.json();
        const data: Array<{ id: number; src: string; alt?: string; caption?: string }> = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];

        const channel = String(payload?.channelUrl ?? "").trim();
        if (channel) setChannelUrl(channel);
        if (data.length === 0) {
          setItems([]);
          return;
        }

        const mapped = data
          .map((row: { id: number; src: string; alt?: string; caption?: string }) => ({
            id: Number(row.id),
            src: safeImageSrc(row.src),
            alt: String(row.alt || "Testimonial"),
            caption: String(row.caption || ""),
          }))
          .filter((row: { src: string }) => row.src.length > 0);

        if (mapped.length > 0) {
          setItems(mapped);
        }
      } catch {
        setItems([]);
      }
    };

    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (!activeItem) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveItem(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeItem]);

  const shownItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;
  const galleryLayoutClass = useMemo(() => getGalleryLayoutClass(shownItems.length), [shownItems.length]);

  return (
    <section id="testimonials" className="px-4 py-16 sm:px-6 sm:py-20" style={{ backgroundColor: "var(--surface)" }}>
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{text.label}</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">{text.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--foreground-muted)] sm:text-base">{text.desc}</p>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--foreground-muted)] sm:text-sm">
          {text.showing} {Math.min(shownItems.length, items.length)} / {items.length}
        </p>

        <div className={`mx-auto mt-5 gap-3 ${galleryLayoutClass}`}>
          {shownItems.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.24, delay: Math.min(index * 0.03, 0.24) }}
              className="group mb-3 break-inside-avoid overflow-hidden rounded-2xl border border-[var(--border)] shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
              style={{ backgroundColor: "var(--surface-muted)" }}
            >
              <button
                type="button"
                onClick={() => setActiveItem(item)}
                className="relative w-full overflow-hidden text-left cursor-zoom-in"
                aria-label={`Zoom ${item.alt}`}
              >
                <img
                  src={safeImageSrc(item.src)}
                  alt={item.alt}
                  loading="lazy"
                  className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent" />
                {item.caption ? (
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3">
                    <p className="line-clamp-2 rounded-lg bg-black/55 px-2.5 py-1.5 text-[10px] text-white sm:text-xs">{item.caption}</p>
                  </div>
                ) : null}
              </button>
            </motion.article>
          ))}
        </div>

        {items.length > PAGE_SIZE || channelUrl ? (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {hasMore ? (
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, items.length))}
                className="rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
              >
                {text.loadMore}
              </button>
            ) : (
              items.length > PAGE_SIZE ? (
                <button
                  type="button"
                  onClick={() => setVisibleCount(PAGE_SIZE)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
                >
                  {text.collapse}
                </button>
              ) : null
            )}

            {channelUrl ? (
              <a
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
              >
                {text.viewAll}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {activeItem ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[80] bg-black/80 p-4 backdrop-blur-[2px] sm:p-6"
            onClick={(event) => {
              if (event.target === event.currentTarget) setActiveItem(null);
            }}
          >
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white transition-colors hover:bg-black/60 sm:right-6 sm:top-6"
              aria-label="Close zoom"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-full max-w-5xl items-center justify-center">
              <motion.figure
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full overflow-hidden rounded-2xl border border-white/20 bg-black/30 shadow-2xl"
              >
                <img
                  src={safeImageSrc(activeItem.src)}
                  alt={activeItem.alt}
                  className="max-h-[82vh] w-full object-contain"
                />
                {(activeItem.alt || activeItem.caption) && (
                  <figcaption className="border-t border-white/15 bg-black/55 px-4 py-3 text-xs text-white/90 sm:text-sm">
                    <p className="font-medium">{activeItem.alt}</p>
                    {activeItem.caption ? <p className="mt-1 text-white/75">{activeItem.caption}</p> : null}
                  </figcaption>
                )}
              </motion.figure>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
