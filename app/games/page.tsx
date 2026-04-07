"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import { useLocale, type Locale } from "@/Components/LocaleProvider";

const copy: Record<
  Locale,
  {
    label: string;
    title: string;
    desc: string;
    openPricing: string;
    howToOrder: string;
    stats: Array<{ value: string; label: string }>;
    features: Array<{ title: string; text: string }>;
  }
> = {
  id: {
    label: "Supported Games",
    title: "Game yang Kami Layani",
    desc: "Fokus pada kualitas pengerjaan, keamanan akun, dan komunikasi yang jelas selama proses.",
    openPricing: "Lihat Harga",
    howToOrder: "Cara Order",
    stats: [
      { value: "2.500+", label: "Order terselesaikan" },
      { value: "4.9/5", label: "Rating pelanggan" },
      { value: "100%", label: "Manual process" },
      { value: "< 5 menit", label: "Respon admin" },
    ],
    features: [
      { title: "Aman", text: "Pengerjaan manual oleh admin berpengalaman." },
      { title: "Cepat", text: "Konfirmasi dan komunikasi berlangsung langsung." },
      { title: "Profesional", text: "Layout layanan rapi dan mudah dipahami." },
    ],
  },
  en: {
    label: "Supported Games",
    title: "Games We Support",
    desc: "Focused on quality work, account safety, and clear communication throughout the process.",
    openPricing: "View Pricing",
    howToOrder: "How to Order",
    stats: [
      { value: "2.500+", label: "Completed orders" },
      { value: "4.9/5", label: "Customer rating" },
      { value: "100%", label: "Manual process" },
      { value: "< 5 min", label: "Admin response" },
    ],
    features: [
      { title: "Safe", text: "Manual handling by experienced admins." },
      { title: "Fast", text: "Quick confirmation and direct communication." },
      { title: "Professional", text: "Clean and easy-to-understand service layout." },
    ],
  },
  my: {
    label: "Permainan Disokong",
    title: "Permainan yang Kami Layani",
    desc: "Fokus pada kualiti kerja, keselamatan akaun, dan komunikasi yang jelas sepanjang proses.",
    openPricing: "Lihat Harga",
    howToOrder: "Cara Pesan",
    stats: [
      { value: "2.500+", label: "Pesanan selesai" },
      { value: "4.9/5", label: "Rating pelanggan" },
      { value: "100%", label: "Proses manual" },
      { value: "< 5 minit", label: "Respon admin" },
    ],
    features: [
      { title: "Selamat", text: "Pengendalian manual oleh admin berpengalaman." },
      { title: "Pantas", text: "Pengesahan cepat dan komunikasi terus." },
      { title: "Profesional", text: "Susun atur servis kemas dan mudah difahami." },
    ],
  },
};

type GameCard = {
  key: string;
  name: string;
  logo: string | null;
  banner: string | null;
  tagline: string;
  description: string;
  services: string[];
};

const FALLBACK_GAMES: GameCard[] = [
  {
    key: "genshin",
    name: "Genshin Impact",
    logo: "/products/Primogem.png",
    banner: "/products/Genshin.jpg",
    tagline: "Primo, explorasi, quest, rawat akun, benerin akun, aplikasi premium.",
    description:
      "Layanan lengkap untuk kebutuhan harian maupun progres akun. Cocok untuk player yang ingin progres cepat namun tetap aman.",
    services: ["Primogem", "Explorasi", "Quest", "Rawat Akun", "Benerin Akun", "Aplikasi Premium"],
  },
  {
    key: "wuwa",
    name: "Wuthering Waves",
    logo: "/products/Asterite.png",
    banner: "/products/WutheringWaves.jpg",
    tagline: "Astrite, exploration, quest, rawat akun, benerin akun.",
    description:
      "Tim admin menangani order Wuthering Waves dengan alur yang jelas dan update berkala dari order awal hingga selesai.",
    services: ["Astrite", "Explore", "Quest", "Rawat Akun", "Benerin Akun", "Build Character"],
  },
];

const FALLBACK_GAMES_BY_KEY: Record<string, GameCard> = FALLBACK_GAMES.reduce<Record<string, GameCard>>((acc, game) => {
  acc[game.key] = game;
  return acc;
}, {});

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeServices(value: unknown, fallback: string[]): string[] {
  if (Array.isArray(value)) {
    const parsed = value.map((item) => normalizeText(item)).filter(Boolean);
    return parsed.length > 0 ? parsed : fallback;
  }

  if (typeof value === "string") {
    const parsed = value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
    return parsed.length > 0 ? parsed : fallback;
  }

  return fallback;
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

function normalizeGame(raw: unknown): GameCard | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;

  const key = normalizeText(value.key);
  const fallback = FALLBACK_GAMES_BY_KEY[key];
  const name = normalizeText(value.name ?? value.label) || fallback?.name || "";

  if (!key || !name) return null;

  const resolvedLogo = normalizeText(value.logo) || fallback?.logo || null;
  const resolvedBanner = normalizeText(value.banner) || resolvedLogo || fallback?.banner || null;

  return {
    key,
    name,
    logo: resolvedLogo,
    banner: resolvedBanner,
    tagline: normalizeText(value.tagline) || fallback?.tagline || "",
    description: normalizeText(value.description) || fallback?.description || "",
    services: normalizeServices(value.services, fallback?.services ?? []),
  };
}

export default function GamesPage() {
  const { locale } = useLocale();
  const [copyState, setCopyState] = useState(copy);
  const [copyLoaded, setCopyLoaded] = useState(false);
  const text = copyState[locale];
  const [games, setGames] = useState<GameCard[]>([]);
  const [gamesLoaded, setGamesLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadCopy = async () => {
      try {
        const response = await fetch("/api/content/games", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (isMounted) {
          setCopyState(mergeCopy(copy, payload));
        }
      } catch (error) {
        console.error("Failed to load games copy:", error);
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

    const loadGames = async () => {
      try {
        const response = await fetch("/api/games", { cache: "no-store" });
        if (!response.ok) return;

        const payload = await response.json();
        if (!Array.isArray(payload)) return;

        const normalized = payload
          .map((item) => normalizeGame(item))
          .filter((item): item is GameCard => Boolean(item));

        if (isMounted && normalized.length > 0) {
          setGames(normalized);
        }
      } catch (error) {
        console.error("Failed to load games section data:", error);
        if (isMounted) {
          setGames(FALLBACK_GAMES);
        }
      } finally {
        if (isMounted) {
          setGamesLoaded(true);
        }
      }
    };

    void loadGames();
    return () => {
      isMounted = false;
    };
  }, []);

  const isReady = copyLoaded && gamesLoaded;

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
        <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-4">
          {text.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[var(--border)] p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
              style={{ backgroundColor: "var(--surface-muted)" }}
            >
              <p className="text-2xl font-semibold text-[var(--foreground)]">{stat.value}</p>
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-16" style={{ backgroundColor: "var(--surface-muted)" }}>
        {!isReady ? (
          <div className="mx-auto max-w-6xl space-y-5">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-3xl border border-[var(--border)]"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <div className="grid lg:grid-cols-[280px_1fr]">
                  <div className="h-56 bg-[var(--surface-muted)] lg:h-full" />
                  <div className="space-y-4 p-6 sm:p-7">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-xl bg-[var(--surface-muted)]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-6 w-40 rounded bg-[var(--surface-muted)]" />
                        <div className="h-4 w-56 rounded bg-[var(--surface-muted)]" />
                      </div>
                    </div>
                    <div className="h-4 w-full rounded bg-[var(--surface-muted)]" />
                    <div className="h-4 w-11/12 rounded bg-[var(--surface-muted)]" />
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[0, 1, 2, 3].map((service) => (
                        <div key={service} className="h-4 rounded bg-[var(--surface-muted)]" />
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <div className="h-10 w-28 rounded-xl bg-[var(--surface-muted)]" />
                      <div className="h-10 w-28 rounded-xl bg-[var(--surface-muted)]" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-6xl space-y-5">
          {games.map((game, index) => (
            <motion.article
              key={game.key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.22 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group overflow-hidden rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <div className="grid lg:grid-cols-[280px_1fr]">
                <div className="relative h-56 lg:h-full">
                  {game.banner ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={game.banner}
                        alt={game.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--surface-muted)] text-sm text-[var(--foreground-muted)]">
                      {game.name}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                </div>

                <div className="p-6 sm:p-7">
                  <div className="flex items-start gap-3">
                    {game.logo ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={game.logo} alt={game.name} className="h-12 w-12 rounded-xl border border-[var(--border)] object-cover" />
                      </>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-sm font-semibold text-[var(--foreground-muted)]">
                        {game.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-semibold text-[var(--foreground)]">{game.name}</h2>
                      <p className="mt-1 text-sm text-[var(--brand)]">{game.tagline}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-[var(--foreground-muted)]">{game.description}</p>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {game.services.map((service) => (
                      <div key={service} className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                        <CheckCircle2 className="h-4 w-4 text-[var(--brand)]" />
                        {service}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href="/#pricing"
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[var(--brand-hover)]"
                    >
                      {text.openPricing}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/cara-order"
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-all duration-200 hover:scale-[1.01]"
                      style={{ backgroundColor: "var(--surface)" }}
                    >
                      {text.howToOrder}
                    </Link>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}

          {games.length === 0 ? (
            <div className="rounded-3xl border border-[var(--border)] p-6 text-center text-sm text-[var(--foreground-muted)]" style={{ backgroundColor: "var(--surface)" }}>
              Belum ada game yang ditampilkan.
            </div>
          ) : null}
          </div>
        )}
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-3">
          {[ShieldCheck, Zap, Sparkles].map((Icon, index) => (
            <div
              key={text.features[index]?.title}
              className="rounded-2xl border border-[var(--border)] p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <Icon className="h-5 w-5 text-[var(--brand)]" />
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{text.features[index]?.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-muted)]">{text.features[index]?.text}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
