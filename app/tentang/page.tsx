"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Sparkles, Star, TrendingUp, Users, Zap } from "lucide-react";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import TestimonialsImageGrid from "@/Components/TestimonialsImageGrid";
import { siteConfig } from "@/config/site";
import { useLocale, type Locale } from "@/Components/LocaleProvider";
import WhatsAppIcon from "@/Components/WhatsAppIcon";

const copy: Record<
  Locale,
  {
    label: string;
    title: string;
    desc: string;
    storyTitle: string;
    teamTitle: string;
    ctaTitle: string;
    ctaDesc: string;
    ctaCatalog: string;
    ctaOrder: string;
    milestones: Array<{ value: string; label: string }>;
    story: string[];
    values: Array<{ title: string; description: string }>;
    team: Array<{ role: string; description: string }>;
  }
> = {
  id: {
    label: "About Us",
    title: "Tim yang Fokus pada Layanan Profesional",
    desc: "Ruan Joki dibangun untuk memberi pengalaman order yang sederhana, transparan, dan nyaman untuk pelanggan.",
    storyTitle: "Cerita Singkat Kami",
    teamTitle: "Tim Admin",
    ctaTitle: "Siap Mulai Order?",
    ctaDesc: "Cek katalog layanan dan pilih paket yang sesuai kebutuhan akunmu.",
    ctaCatalog: "Lihat Katalog",
    ctaOrder: "Cara Order",
    milestones: [
      { value: "2.500+", label: "Order berhasil" },
      { value: "1.200+", label: "Pelanggan aktif" },
      { value: "4.9 / 5", label: "Rating kepuasan" },
    ],
    story: [
      "Berawal dari kebutuhan komunitas gamer yang ingin progres akun lebih efisien, kami membangun layanan dengan fokus pada kejelasan proses dan keamanan.",
      "Setiap order ditangani oleh admin secara manual. Kami menjaga komunikasi tetap aktif agar pelanggan selalu tahu status pengerjaan dari awal sampai selesai.",
      "Pendekatan ini membantu kami menjaga kualitas layanan sekaligus membangun kepercayaan pelanggan dalam jangka panjang.",
    ],
    values: [
      { title: "Keamanan Prioritas", description: "Proses manual agar akun tetap aman dan terkontrol." },
      { title: "Komunikasi Cepat", description: "Admin aktif memberi update sehingga pelanggan tidak menunggu tanpa kepastian." },
      { title: "Kualitas Konsisten", description: "Standar pengerjaan rapi, jelas, dan dapat diandalkan untuk order berulang." },
    ],
    team: [
      { role: "Customer Success", description: "Fokus pada konsultasi produk dan penanganan order harian." },
      { role: "Service Specialist", description: "Fokus pada koordinasi progres dan quality check pesanan." },
    ],
  },
  en: {
    label: "About Us",
    title: "A Team Focused on Professional Service",
    desc: "Ruan Joki is built to deliver a simple, transparent, and comfortable ordering experience.",
    storyTitle: "Our Story",
    teamTitle: "Admin Team",
    ctaTitle: "Ready to Start?",
    ctaDesc: "Explore the catalog and choose the package that fits your account needs.",
    ctaCatalog: "View Catalog",
    ctaOrder: "How to Order",
    milestones: [
      { value: "2.500+", label: "Successful orders" },
      { value: "1.200+", label: "Active customers" },
      { value: "4.9 / 5", label: "Satisfaction rating" },
    ],
    story: [
      "We started from gamer community needs for more efficient account progress, then built this service around clear process and security.",
      "Every order is handled manually by admin. We keep communication active so customers always know progress status.",
      "This approach helps us keep quality consistent while building long-term customer trust.",
    ],
    values: [
      { title: "Security First", description: "Manual process keeps accounts safe and controlled." },
      { title: "Fast Communication", description: "Admins provide active updates so customers are never left waiting." },
      { title: "Consistent Quality", description: "Clear and reliable standards for repeat orders." },
    ],
    team: [
      { role: "Customer Success", description: "Focused on package consultation and daily order handling." },
      { role: "Service Specialist", description: "Focused on progress coordination and quality checks." },
    ],
  },
  my: {
    label: "Tentang Kami",
    title: "Pasukan yang Fokus pada Servis Profesional",
    desc: "Ruan Joki dibina untuk memberi pengalaman pesanan yang mudah, telus, dan selesa.",
    storyTitle: "Cerita Ringkas Kami",
    teamTitle: "Pasukan Admin",
    ctaTitle: "Sedia Bermula?",
    ctaDesc: "Lihat katalog servis dan pilih pakej mengikut keperluan akaun anda.",
    ctaCatalog: "Lihat Katalog",
    ctaOrder: "Cara Pesan",
    milestones: [
      { value: "2.500+", label: "Pesanan berjaya" },
      { value: "1.200+", label: "Pelanggan aktif" },
      { value: "4.9 / 5", label: "Rating kepuasan" },
    ],
    story: [
      "Kami bermula daripada keperluan komuniti gamer untuk progres akaun yang lebih efisien, lalu membina servis berasaskan proses jelas dan keselamatan.",
      "Setiap pesanan diurus manual oleh admin. Kami memastikan komunikasi aktif supaya pelanggan sentiasa tahu status progres.",
      "Pendekatan ini membantu mengekalkan kualiti secara konsisten serta membina kepercayaan pelanggan jangka panjang.",
    ],
    values: [
      { title: "Keselamatan Utama", description: "Proses manual memastikan akaun kekal selamat dan terkawal." },
      { title: "Komunikasi Pantas", description: "Admin memberi kemas kini aktif supaya pelanggan tidak menunggu tanpa kepastian." },
      { title: "Kualiti Konsisten", description: "Standard kerja yang jelas dan boleh dipercayai untuk pesanan berulang." },
    ],
    team: [
      { role: "Customer Success", description: "Fokus pada konsultasi pakej dan pengurusan pesanan harian." },
      { role: "Service Specialist", description: "Fokus pada koordinasi progres dan semakan kualiti pesanan." },
    ],
  },
};

const valueIcons = [Shield, Zap, Sparkles];
const milestoneIcons = [TrendingUp, Users, Star];

type TeamAdmin = {
  id: number;
  key: string;
  name: string;
  image: string;
  wa_number: string;
  role: string;
  description: string;
  display_order: number;
};

function getTeamCardLayoutClass(index: number, total: number): string {
  const classes = ["sm:col-span-2", "lg:col-span-2"];
  const isLast = index === total - 1;
  const isPenultimate = index === total - 2;

  // Tablet (4 cols, card span 2): center single leftover card.
  if (total % 2 === 1 && isLast) {
    classes.push("sm:col-start-2");
  }

  // Desktop (6 cols, card span 2): center 1 or 2 leftover cards in the last row.
  const desktopRemainder = total % 3;
  if (desktopRemainder === 1 && isLast) {
    classes.push("lg:col-start-3");
  } else if (desktopRemainder === 2) {
    if (isPenultimate) classes.push("lg:col-start-2");
    if (isLast) classes.push("lg:col-start-4");
  }

  return classes.join(" ");
}

function mergeCopy(
  base: Record<Locale, (typeof copy)[Locale]>,
  incoming: unknown
): Record<Locale, (typeof copy)[Locale]> {
  if (!incoming || typeof incoming !== "object") return base;
  const source = incoming as Partial<Record<Locale, Partial<(typeof copy)[Locale]>>>;
  return {
    id: { ...base.id, ...(source.id ?? {}) },
    en: { ...base.en, ...(source.en ?? {}) },
    my: { ...base.my, ...(source.my ?? {}) },
  };
}

export default function TentangPage() {
  const { locale } = useLocale();
  const [copyState, setCopyState] = useState(copy);
  const [copyLoaded, setCopyLoaded] = useState(false);
  const text = copyState[locale];
  const fallbackTeamAdmins = useMemo<TeamAdmin[]>(
    () =>
      siteConfig.adminWhatsAppNumbers.map((admin, index) => ({
        id: index + 1,
        key: admin.key,
        name: admin.label,
        image: "",
        wa_number: admin.number,
        role: text.team[index]?.role ?? "",
        description: text.team[index]?.description ?? "",
        display_order: index + 1,
      })),
    [text.team]
  );
  const [teamAdmins, setTeamAdmins] = useState<TeamAdmin[]>([]);
  const [adminsLoaded, setAdminsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadCopy = async () => {
      try {
        const response = await fetch("/api/content/tentang", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (isMounted) {
          setCopyState(mergeCopy(copy, payload));
        }
      } catch (error) {
        console.error("Failed to load tentang copy:", error);
      } finally {
        if (isMounted) {
          setCopyLoaded(true);
        }
      }
    };

    void loadCopy();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTeamAdmins = async () => {
      try {
        const response = await fetch("/api/admins", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch admins");

        const payload = await response.json();
        if (!Array.isArray(payload)) throw new Error("Invalid admins payload");

        const normalized = payload
          .map((item, index) => ({
            id: Number(item?.id ?? index + 1),
            key: String(item?.key ?? "").trim(),
            name: String(item?.name ?? "").trim(),
            image: String(item?.image ?? "").trim(),
            wa_number: String(item?.wa_number ?? "").trim(),
            role: String(item?.role ?? "").trim(),
            description: String(item?.description ?? "").trim(),
            display_order: Number(item?.display_order ?? index),
          }))
          .filter((item) => item.key && item.name && item.wa_number);

        if (isMounted) {
          setTeamAdmins(normalized.length > 0 ? normalized : fallbackTeamAdmins);
        }
      } catch {
        if (isMounted) {
          setTeamAdmins(fallbackTeamAdmins);
        }
      } finally {
        if (isMounted) {
          setAdminsLoaded(true);
        }
      }
    };

    void loadTeamAdmins();

    return () => {
      isMounted = false;
    };
  }, [fallbackTeamAdmins]);

  const isReady = copyLoaded && adminsLoaded;

  return (
    <div className="min-h-screen text-[var(--foreground)]" style={{ backgroundColor: "var(--background)" }}>
      <Navbar />

      <section className="px-4 pb-14 pt-14 sm:px-6 sm:pb-16 sm:pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
            {text.label}
          </span>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">{text.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">{text.desc}</p>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 sm:pb-12">
        {!isReady ? (
          <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-[var(--border)] p-5"
                style={{ backgroundColor: "var(--surface-muted)" }}
              >
                <div className="mx-auto h-5 w-5 rounded bg-[var(--surface)]" />
                <div className="mx-auto mt-2 h-7 w-20 rounded bg-[var(--surface)]" />
                <div className="mx-auto mt-2 h-3 w-24 rounded bg-[var(--surface)]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-3">
          {text.milestones.map((item, index) => {
            const Icon = milestoneIcons[index] || TrendingUp;
            return (
              <div
                key={item.label}
                className="rounded-2xl border border-[var(--border)] p-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
                style={{ backgroundColor: "var(--surface-muted)" }}
              >
                <Icon className="mx-auto h-5 w-5 text-[var(--brand)]" />
                <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{item.value}</p>
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">{item.label}</p>
              </div>
            );
          })}
          </div>
        )}
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-16" style={{ backgroundColor: "var(--surface-muted)" }}>
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
            <motion.article
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border border-[var(--border)] p-7 shadow-[var(--shadow-card)]"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">{text.storyTitle}</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-[var(--foreground-muted)]">
                {text.story.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </motion.article>

            <div className="space-y-3">
              {text.values.map((value, index) => {
                const Icon = valueIcons[index] || Shield;
                return (
                  <motion.article
                    key={value.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    className="rounded-2xl border border-[var(--border)] p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5"
                    style={{ backgroundColor: "var(--surface)" }}
                  >
                    <Icon className="h-5 w-5 text-[var(--brand)]" />
                    <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{value.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-muted)]">{value.description}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">{text.teamTitle}</h2>
          {!isReady ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {[0, 1].map((item) => (
                <article
                  key={item}
                  className="sm:col-span-2 lg:col-span-2 animate-pulse rounded-3xl border border-[var(--border)] p-6"
                  style={{ backgroundColor: "var(--surface)" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-[var(--surface-muted)]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-28 rounded bg-[var(--surface-muted)]" />
                      <div className="h-4 w-24 rounded bg-[var(--surface-muted)]" />
                    </div>
                  </div>
                  <div className="mt-3 h-4 w-full rounded bg-[var(--surface-muted)]" />
                  <div className="mt-2 h-4 w-10/12 rounded bg-[var(--surface-muted)]" />
                  <div className="mt-4 h-10 w-32 rounded-xl bg-[var(--surface-muted)]" />
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {teamAdmins.map((admin, index) => (
              <article
                key={admin.key}
                className={`${getTeamCardLayoutClass(index, teamAdmins.length)} rounded-3xl border border-[var(--border)] p-6 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5`}
                style={{ backgroundColor: "var(--surface)" }}
              >
                <div className="flex items-start gap-3">
                  {admin.image ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={admin.image} alt={admin.name} className="h-12 w-12 rounded-xl border border-[var(--border)] object-cover" />
                    </>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-sm font-semibold text-[var(--foreground-muted)]">
                      {admin.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-semibold text-[var(--foreground)]">{admin.name}</p>
                    <p className="mt-1 text-sm text-[var(--brand)]">{admin.role || text.team[index]?.role}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">{admin.description || text.team[index]?.description}</p>
                <a
                  href={`https://wa.me/${admin.wa_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--whatsapp)] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] hover:bg-[#1fae53]"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Chat {admin.name}
                </a>
              </article>
            ))}
            </div>
          )}
        </div>
      </section>

      <TestimonialsImageGrid />

      <section className="px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-16">
        <div
          className="mx-auto max-w-3xl rounded-3xl border border-[var(--border)] p-8 text-center shadow-[var(--shadow-card)]"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <h2 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">{text.ctaTitle}</h2>
          <p className="mt-3 text-sm text-[var(--foreground-muted)] sm:text-base">{text.ctaDesc}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.01] hover:bg-[var(--brand-hover)]"
            >
              {text.ctaCatalog}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/cara-order"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition-all hover:scale-[1.01]"
              style={{ backgroundColor: "var(--surface)" }}
            >
              {text.ctaOrder}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
