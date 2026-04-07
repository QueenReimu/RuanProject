"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, MessageCircle, ShieldCheck, Sparkles, X, Zap } from "lucide-react";
import { useLocale, type Locale } from "@/Components/LocaleProvider";

type ProductItem = {
  title: string;
  description: string;
  price: string;
  image: string;
  originalPrice?: string;
  discount?: number;
  bestseller?: boolean;
};

type Category = { label: string; image: string; products: ProductItem[] };
type GameData = Record<string, Category>;
type ProductsData = Record<string, GameData>;
type AdminInfo = { name: string; image: string; number: string };

type PricingCopy = {
  sectionLabel: string;
  sectionTitle: string;
  sectionDesc: string;
  loading: string;
  retry: string;
  empty: string;
  transparent: string;
  transparentDesc: string;
  buy: string;
  popular: string;
  confirmTitle: string;
  confirmSub: string;
  chooseAdmin: string;
  cancel: string;
  chat: string;
  safeTitle: string;
  safeDesc: string;
  fastTitle: string;
  fastDesc: string;
  guaranteeTitle: string;
  guaranteeDesc: string;
  consult: string;
};

const copy: Record<Locale, PricingCopy> = {
  id: {
    sectionLabel: "Catalog",
    sectionTitle: "Pilih Layanan Sesuai Kebutuhan",
    sectionDesc: "Semua harga transparan. Pilih game, pilih kategori, lalu lanjutkan pembelian langsung ke admin.",
    loading: "Memuat katalog produk...",
    retry: "Muat Ulang",
    empty: "Belum ada produk pada kategori ini.",
    transparent: "Harga Transparan",
    transparentDesc: "Butuh bantuan memilih paket? Klik salah satu produk dan konsultasikan kebutuhanmu langsung.",
    buy: "Beli",
    popular: "Terlaris",
    confirmTitle: "Konfirmasi Pesanan",
    confirmSub: "Pilih admin lalu lanjut ke WhatsApp",
    chooseAdmin: "Pilih Admin",
    cancel: "Batal",
    chat: "Chat",
    safeTitle: "Proses Aman",
    safeDesc: "Akun ditangani langsung oleh admin berpengalaman.",
    fastTitle: "Respon Cepat",
    fastDesc: "Konfirmasi order dan update progres via WhatsApp.",
    guaranteeTitle: "Jaminan Layanan",
    guaranteeDesc: "Dukungan penuh sampai pesanan dinyatakan selesai.",
    consult: "Konsultasi Dulu",
  },
  en: {
    sectionLabel: "Catalog",
    sectionTitle: "Choose Services That Fit Your Needs",
    sectionDesc: "Transparent pricing. Pick game, pick category, then continue order directly to admin.",
    loading: "Loading product catalog...",
    retry: "Reload",
    empty: "No product in this category yet.",
    transparent: "Transparent Pricing",
    transparentDesc: "Need help choosing? Tap any product and consult directly with admin.",
    buy: "Buy",
    popular: "Terlaris",
    confirmTitle: "Order Confirmation",
    confirmSub: "Choose admin and continue to WhatsApp",
    chooseAdmin: "Choose Admin",
    cancel: "Cancel",
    chat: "Chat",
    safeTitle: "Secure Process",
    safeDesc: "Handled directly by experienced admins.",
    fastTitle: "Fast Response",
    fastDesc: "Order confirmation and progress update via WhatsApp.",
    guaranteeTitle: "Service Guarantee",
    guaranteeDesc: "Support until your order is completed.",
    consult: "Consult First",
  },
  my: {
    sectionLabel: "Katalog",
    sectionTitle: "Pilih Servis Mengikut Keperluan",
    sectionDesc: "Harga telus. Pilih permainan, pilih kategori, kemudian teruskan pesanan kepada admin.",
    loading: "Memuatkan katalog produk...",
    retry: "Muat Semula",
    empty: "Tiada produk untuk kategori ini lagi.",
    transparent: "Harga Telus",
    transparentDesc: "Perlu bantuan pilih pakej? Klik produk dan berbincang terus dengan admin.",
    buy: "Beli",
    popular: "Terlaris",
    confirmTitle: "Pengesahan Pesanan",
    confirmSub: "Pilih admin kemudian terus ke WhatsApp",
    chooseAdmin: "Pilih Admin",
    cancel: "Batal",
    chat: "Chat",
    safeTitle: "Proses Selamat",
    safeDesc: "Diurus terus oleh admin berpengalaman.",
    fastTitle: "Respon Pantas",
    fastDesc: "Pengesahan pesanan dan kemas kini progres melalui WhatsApp.",
    guaranteeTitle: "Jaminan Servis",
    guaranteeDesc: "Sokongan penuh sehingga pesanan selesai.",
    consult: "Konsultasi Dulu",
  },
};

const genshinRequired = [
  { key: "primo", label: { id: "Primogem", en: "Primogem", my: "Primogem" }, image: "/products/Primogem.png" },
  { key: "explore", label: { id: "Explore", en: "Explore", my: "Explore" }, image: "/pricelist/story-quest.webp" },
  { key: "quest", label: { id: "Quest", en: "Quest", my: "Quest" }, image: "/pricelist/story-quest.webp" },
  { key: "rawatakun", label: { id: "Rawat Akun", en: "Account Care", my: "Penjagaan Akaun" }, image: "/pricelist/buling.png" },
  { key: "benerinakun", label: { id: "Benerin Akun", en: "Fix Account", my: "Baiki Akaun" }, image: "/pricelist/buling.png" },
  {
    key: "aplikasipremium",
    label: { id: "Aplikasi Premium", en: "Premium Apps", my: "Aplikasi Premium" },
    image: "/pricelist/buling.png",
  },
] as const;

const FALLBACK_IMAGES = {
  product: "/pricelist/1.jpg",
  category: "/pricelist/story-quest.webp",
  game: "/products/Genshin.jpg",
  admin: "/pricelist/admin1.jpeg",
} as const;

function safeImageSrc(value: string | null | undefined, fallback: string) {
  const src = typeof value === "string" ? value.trim() : "";
  return src.length > 0 ? src : fallback;
}

const CATEGORY_ALIAS_GROUPS: Record<string, string[]> = {
  primo: ["primo", "primogem", "primos", "genesiscrystal"],
  explore: ["explore", "explorasi", "exploration"],
  quest: ["quest", "storyquest"],
  rawatakun: ["rawatakun", "rawatakun", "accountcare"],
  benerinakun: ["benerinakun", "fixakun", "fixaccount", "repairaccount"],
  aplikasipremium: ["aplikasipremium", "premiumapps", "premiumapp"],
};

function normalizeToken(value: string | null | undefined) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function canonicalCategoryKey(rawKey: string, label: string) {
  const tokens = [normalizeToken(rawKey), normalizeToken(label)].filter(Boolean);
  for (const token of tokens) {
    const canonical = Object.entries(CATEGORY_ALIAS_GROUPS).find(([, aliases]) => aliases.includes(token))?.[0];
    if (canonical) return canonical;
  }
  return tokens[0] || "";
}

function normalizeProductTitleForSimilarity(title: string) {
  const withoutIf = title
    .replace(/\(\s*\d+\s*if\s*\)/gi, "")
    .replace(/\bif\b/gi, "")
    .trim();
  return normalizeToken(withoutIf);
}

function dedupeProducts(items: ProductItem[]) {
  const seenExact = new Set<string>();
  const seenSimilar = new Set<string>();
  const result: ProductItem[] = [];

  for (const item of items) {
    const normalizedImage = normalizeToken(safeImageSrc(item.image, FALLBACK_IMAGES.product));
    const exactKey = [
      normalizeToken(item.title),
      normalizeToken(item.price),
      normalizeToken(item.description),
      normalizedImage,
    ].join("|");
    if (seenExact.has(exactKey)) continue;
    seenExact.add(exactKey);

    // Prevent visually duplicated entries like "1600 Primogem" and "1600 Primogem (10 IF)"
    // when they share the same effective package name and price.
    const similarKey = `${normalizeProductTitleForSimilarity(item.title)}|${normalizeToken(item.price)}`;
    if (seenSimilar.has(similarKey)) continue;
    seenSimilar.add(similarKey);

    result.push({
      ...item,
      image: safeImageSrc(item.image, FALLBACK_IMAGES.product),
    });
  }

  return result;
}

function mergeEquivalentCategories(categories: GameData) {
  const merged: GameData = {};
  const primaryByCanonical = new Map<string, string>();

  for (const [rawKey, category] of Object.entries(categories)) {
    const canonical = canonicalCategoryKey(rawKey, category.label);
    const primaryKey = primaryByCanonical.get(canonical);

    if (!primaryKey) {
      primaryByCanonical.set(canonical, rawKey);
      merged[rawKey] = {
        ...category,
        image: safeImageSrc(category.image, FALLBACK_IMAGES.category),
        products: dedupeProducts(category.products || []),
      };
      continue;
    }

    const existing = merged[primaryKey];
    merged[primaryKey] = {
      ...existing,
      image: safeImageSrc(existing.image || category.image, FALLBACK_IMAGES.category),
      products: dedupeProducts([...(existing.products || []), ...(category.products || [])]),
    };
  }

  return merged;
}

function ensureGenshinRequiredCategories(categories: GameData, locale: Locale) {
  const next = { ...categories };
  const existingCanonicals = new Set(
    Object.entries(next)
      .map(([key, value]) => canonicalCategoryKey(key, value.label))
      .filter(Boolean)
  );

  for (const required of genshinRequired) {
    if (existingCanonicals.has(required.key)) continue;
    next[required.key] = {
      label: required.label[locale] || required.label.id,
      image: required.image,
      products: [],
    };
  }

  return next;
}

function ProductCard({
  item,
  gameName,
  onBuy,
  buyLabel,
  popularLabel,
}: {
  item: ProductItem;
  gameName: string;
  onBuy: (item: ProductItem, gameName: string) => void;
  buyLabel: string;
  popularLabel: string;
}) {
  const productImage = safeImageSrc(item.image, FALLBACK_IMAGES.product);

  return (
    <article
      className="group overflow-hidden rounded-2xl border border-[var(--border)] shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] sm:rounded-3xl"
      style={{ backgroundColor: "var(--surface)" }}
    >
      <div className="relative h-32 overflow-hidden bg-[var(--surface-muted)] sm:h-44">
        <img
          src={productImage}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute left-2 top-2 flex gap-1.5 sm:left-3 sm:top-3 sm:gap-2">
          {item.bestseller && (
            <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand)] sm:px-2.5 sm:py-1 sm:text-[11px]">
              {popularLabel}
            </span>
          )}
          {item.discount && item.discount > 0 && (
            <span className="rounded-full bg-[rgba(37,211,102,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[var(--whatsapp)] sm:px-2.5 sm:py-1 sm:text-[11px]">
              -{item.discount}%
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2.5 p-2.5 sm:space-y-4 sm:p-5">
        <div>
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-[var(--foreground)] sm:text-lg">{item.title}</h3>
          <p className="mt-1 min-h-[3.1rem] line-clamp-3 text-[11px] leading-relaxed text-[var(--foreground-muted)] sm:mt-2 sm:min-h-[5.4rem] sm:line-clamp-4 sm:text-sm">
            {item.description}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <div>
            {item.originalPrice && (
              <p className="text-[10px] text-[var(--foreground-muted)] line-through sm:text-xs">{item.originalPrice}</p>
            )}
            <p className="text-base font-bold text-[var(--foreground)] sm:text-2xl">{item.price}</p>
          </div>
          <button
            type="button"
            onClick={() => onBuy(item, gameName)}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--whatsapp)] px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#1fae53] sm:w-auto sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {buyLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

function ConfirmModal({
  product,
  gameName,
  adminData,
  onClose,
  text,
}: {
  product: ProductItem;
  gameName: string;
  adminData: Record<string, AdminInfo>;
  onClose: () => void;
  text: PricingCopy;
}) {
  const adminKeys = Object.keys(adminData);
  const [selectedAdmin, setSelectedAdmin] = useState(adminKeys[0] || "");

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const currentAdmin = adminData[selectedAdmin];
  const productImage = safeImageSrc(product.image, FALLBACK_IMAGES.product);

  const handleConfirm = () => {
    if (!currentAdmin) return;
    const message = encodeURIComponent(
      `Halo ${currentAdmin.name}, saya ingin beli:\n\nGame: ${gameName}\nProduk: ${product.title}\nHarga: ${product.price}\n\nMohon info lebih lanjut.`
    );
    window.open(`https://wa.me/${currentAdmin.number}?text=${message}`, "_blank");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(15,23,42,0.45)] p-0 sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.2 }}
        className="w-full overflow-hidden rounded-t-3xl border border-[var(--border)] shadow-[var(--shadow-soft)] sm:max-w-lg sm:rounded-3xl"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--brand-soft)] p-2">
              <ShieldCheck className="h-5 w-5 text-[var(--brand)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{text.confirmTitle}</p>
              <p className="text-xs text-[var(--foreground-muted)]">{text.confirmSub}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
            <img src={productImage} alt={product.title} className="h-16 w-16 rounded-xl border border-[var(--border)] object-cover" />
            <div className="min-w-0">
              <p className="text-xs text-[var(--foreground-muted)]">{gameName}</p>
              <p className="line-clamp-2 text-sm font-semibold text-[var(--foreground)]">{product.title}</p>
              <p className="mt-1 text-base font-bold text-[var(--foreground)]">{product.price}</p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">{text.chooseAdmin}</p>
            <div className="grid grid-cols-2 gap-3">
              {adminKeys.map((key) => {
                const admin = adminData[key];
                if (!admin) return null;
                const adminImage = safeImageSrc(admin.image, FALLBACK_IMAGES.admin);

                const active = selectedAdmin === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedAdmin(key)}
                    className={`rounded-2xl border p-3 text-center transition-all duration-200 hover:scale-[1.01] ${
                      active
                        ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                        : "border-[var(--border)] hover:bg-[var(--surface-muted)]"
                    }`}
                    style={{ backgroundColor: active ? undefined : "var(--surface)" }}
                  >
                    <img
                      src={adminImage}
                      alt={admin.name}
                      className="mx-auto h-14 w-14 rounded-xl border border-[var(--border)] object-cover"
                    />
                    <p className={`mt-2 text-sm font-semibold ${active ? "text-[var(--brand)]" : "text-[var(--foreground)]"}`}>
                      {admin.name}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)]">{admin.number.replace(/^62/, "0")}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground-muted)] hover:bg-[var(--surface-muted)]"
            >
              {text.cancel}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!currentAdmin}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--whatsapp)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1fae53] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MessageCircle className="h-4 w-4" />
              {text.chat} {currentAdmin?.name || "Admin"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function PricingSection() {
  const { locale } = useLocale();
  const text = copy[locale];

  const [game, setGame] = useState("");
  const [category, setCategory] = useState("");
  const [products, setProducts] = useState<ProductsData>({});
  const [gameMeta, setGameMeta] = useState<Record<string, { label: string; logo: string }>>({});
  const [adminData, setAdminData] = useState<Record<string, AdminInfo>>({});
  const [discountDayActive, setDiscountDayActive] = useState(false);
  const [discountDayPercent, setDiscountDayPercent] = useState(0);
  const [discountDayMinPrice, setDiscountDayMinPrice] = useState(60000);
  const [discountDayBadgeText, setDiscountDayBadgeText] = useState("Hari Diskon Aktif");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [buyProduct, setBuyProduct] = useState<{ item: ProductItem; gameName: string } | null>(null);

  const applySelection = useCallback(
    (nextGame?: string | null, nextCategory?: string | null) => {
      const gameKey = nextGame && products[nextGame] ? nextGame : Object.keys(products)[0];
      if (!gameKey) return;

      const categories = Object.keys(products[gameKey] || {});
      const categoryKey =
        nextCategory && products[gameKey][nextCategory] ? nextCategory : categories[0] || "";

      setGame(gameKey);
      setCategory(categoryKey);
    },
    [products]
  );

  const readSelectionFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const nextGame = params.get("game");
    const nextCategory = params.get("category");
    applySelection(nextGame, nextCategory);
  }, [applySelection]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load");

        const data = await res.json();
        const fetchedProducts: ProductsData = data.products || {};
        const fetchedGameMeta = data.gameMeta || {};
        const fetchedAdmins: Record<string, AdminInfo> = data.adminData || {};
        const fetchedDiscountDayActive = Boolean(data.discountDayActive);
        const fetchedDiscountDayPercent = Number(data.discountDayPercent ?? 0);
        const fetchedDiscountDayMinPrice = Number(data.discountDayMinPrice ?? 60000);
        const fetchedDiscountDayBadgeText = String(data.discountDayBadgeText ?? "").trim();

        const normalizedProducts: ProductsData = Object.fromEntries(
          Object.entries(fetchedProducts).map(([gameKey, categories]) => {
            const mergedCategories = mergeEquivalentCategories(categories || {});
            const finalCategories = gameKey.toLowerCase().includes("genshin")
              ? ensureGenshinRequiredCategories(mergedCategories, locale)
              : mergedCategories;
            return [gameKey, finalCategories];
          })
        );

        setProducts(normalizedProducts);
        setGameMeta(fetchedGameMeta);
        setAdminData(fetchedAdmins);
        setDiscountDayActive(fetchedDiscountDayActive);
        setDiscountDayPercent(Number.isFinite(fetchedDiscountDayPercent) ? fetchedDiscountDayPercent : 0);
        setDiscountDayMinPrice(Number.isFinite(fetchedDiscountDayMinPrice) ? fetchedDiscountDayMinPrice : 60000);
        setDiscountDayBadgeText(fetchedDiscountDayBadgeText || "Hari Diskon Aktif");
      } catch {
        setApiError("Katalog belum bisa dimuat. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locale]);

  useEffect(() => {
    if (loading) return;
    readSelectionFromUrl();
  }, [loading, readSelectionFromUrl]);

  useEffect(() => {
    const onFocusSelection = (event: Event) => {
      const customEvent = event as CustomEvent<{ gameKey?: string; categoryKey?: string }>;
      applySelection(customEvent.detail?.gameKey, customEvent.detail?.categoryKey);
    };

    const onPopState = () => readSelectionFromUrl();

    window.addEventListener("pricing:focus-selection", onFocusSelection as EventListener);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("pricing:focus-selection", onFocusSelection as EventListener);
      window.removeEventListener("popstate", onPopState);
    };
  }, [applySelection, readSelectionFromUrl]);

  useEffect(() => {
    if (!game || !products[game]) return;
    if (!products[game][category]) {
      const fallback = Object.keys(products[game])[0];
      if (fallback) setCategory(fallback);
    }
  }, [game, category, products]);

  const selectedCategory = products[game]?.[category];
  const gameNames = Object.keys(gameMeta);

  const trustItems = useMemo(
    () => [
      { icon: ShieldCheck, title: text.safeTitle, text: text.safeDesc },
      { icon: Zap, title: text.fastTitle, text: text.fastDesc },
      { icon: BadgeCheck, title: text.guaranteeTitle, text: text.guaranteeDesc },
    ],
    [text]
  );

  const discountBadgeLabel = useMemo(() => {
    const minPriceText = `Rp${discountDayMinPrice.toLocaleString("id-ID")}`;
    const template = String(discountDayBadgeText ?? "").trim() || "Hari Diskon Aktif";
    if (template.includes("{percent}") || template.includes("{minPrice}")) {
      return template
        .replaceAll("{percent}", `${discountDayPercent}%`)
        .replaceAll("{minPrice}", minPriceText);
    }

    // Keep custom badge text exactly as typed by admin.
    // Only default label gets the auto detail suffix.
    if (template.toLowerCase() !== "hari diskon aktif") {
      return template;
    }

    return `${template} -${discountDayPercent}% (min. ${minPriceText})`;
  }, [discountDayBadgeText, discountDayMinPrice, discountDayPercent]);

  if (loading) {
    return (
      <section id="pricing" className="flex min-h-[48vh] items-center justify-center px-4 py-20">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand-soft)] border-t-[var(--brand)]" />
          <p className="mt-3 text-sm text-[var(--foreground-muted)]">{text.loading}</p>
        </div>
      </section>
    );
  }

  if (apiError || gameNames.length === 0) {
    return (
      <section id="pricing" className="px-4 py-20">
        <div
          className="mx-auto max-w-xl rounded-3xl border border-[var(--border)] p-8 text-center shadow-[var(--shadow-card)]"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <p className="text-sm font-semibold text-[var(--foreground)]">{apiError || "Data katalog tidak tersedia."}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
          >
            {text.retry}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="bg-[var(--surface-muted)] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{text.sectionLabel}</p>
          <h2 className="text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">{text.sectionTitle}</h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">{text.sectionDesc}</p>
          {discountDayActive ? (
            <p
              className="mx-auto inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-center text-xs font-extrabold leading-snug sm:text-sm"
              style={{
                backgroundColor: "var(--promo-badge-bg)",
                borderColor: "var(--promo-badge-border)",
                color: "var(--promo-badge-text)",
                boxShadow: "var(--promo-badge-shadow)",
              }}
            >
              <Sparkles className="h-4 w-4" style={{ color: "var(--promo-badge-icon)" }} />
              {discountBadgeLabel}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-center gap-2.5">
          {gameNames.map((gameKey) => {
            const active = game === gameKey;
            const gameLogo = safeImageSrc(gameMeta[gameKey]?.logo, FALLBACK_IMAGES.game);
            return (
              <button
                key={gameKey}
                type="button"
                onClick={() => {
                  const nextCategory = Object.keys(products[gameKey] || {})[0] || "";
                  const params = new URLSearchParams(window.location.search);
                  params.set("game", gameKey);
                  if (nextCategory) params.set("category", nextCategory);
                  window.history.replaceState({}, "", `/?${params.toString()}#pricing`);
                  setGame(gameKey);
                  setCategory(nextCategory);
                }}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "border-[var(--brand)] bg-[var(--brand)] text-white shadow-[var(--shadow-card)]"
                    : "border-[var(--border)] text-[var(--foreground-muted)] hover:-translate-y-0.5 hover:text-[var(--foreground)]"
                }`}
                style={{ backgroundColor: active ? undefined : "var(--surface)" }}
              >
                <img src={gameLogo} alt={gameMeta[gameKey]?.label} className="h-5 w-5 rounded-md object-cover" />
                {gameMeta[gameKey]?.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {Object.entries(products[game] || {}).map(([key, categoryItem]) => {
            const active = category === key;
            const categoryImage = safeImageSrc(categoryItem.image, FALLBACK_IMAGES.category);
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(window.location.search);
                  params.set("game", game);
                  params.set("category", key);
                  window.history.replaceState({}, "", `/?${params.toString()}#pricing`);
                  setCategory(key);
                }}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "border-[var(--border)] text-[var(--foreground-muted)] hover:-translate-y-0.5 hover:text-[var(--foreground)]"
                }`}
                style={{ backgroundColor: active ? undefined : "var(--surface)" }}
              >
                <img src={categoryImage} alt={categoryItem.label} className="h-4 w-4 rounded-sm object-cover" />
                {categoryItem.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${game}-${category}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4"
          >
            {(selectedCategory?.products || []).map((item, index) => (
              <motion.div
                key={`${item.title}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
              >
                <ProductCard
                  item={item}
                  gameName={gameMeta[game]?.label || game}
                  onBuy={(product, gameName) => setBuyProduct({ item: product, gameName })}
                  buyLabel={text.buy}
                  popularLabel={text.popular}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {(selectedCategory?.products || []).length === 0 && (
          <div className="rounded-3xl border border-dashed border-[var(--border)] p-8 text-center" style={{ backgroundColor: "var(--surface)" }}>
            <p className="text-sm text-[var(--foreground-muted)]">{text.empty}</p>
            <a
              href="https://wa.me/6283857809571"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--whatsapp)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1fae53]"
            >
              <MessageCircle className="h-4 w-4" />
              {text.consult}
            </a>
          </div>
        )}

        <div className="grid gap-3 border-t border-[var(--border)] pt-8 sm:grid-cols-3">
          {trustItems.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[var(--border)] p-4" style={{ backgroundColor: "var(--surface)" }}>
              <item.icon className="h-5 w-5 text-[var(--brand)]" />
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-muted)]">{item.text}</p>
            </div>
          ))}
        </div>

        <div
          className="rounded-3xl border border-[var(--border)] p-6 text-center shadow-[var(--shadow-card)]"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
            <Sparkles className="h-3.5 w-3.5" />
            {text.transparent}
          </div>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--foreground-muted)]">{text.transparentDesc}</p>
        </div>
      </div>

      <AnimatePresence>
        {buyProduct && (
          <ConfirmModal
            product={buyProduct.item}
            gameName={buyProduct.gameName}
            adminData={adminData}
            onClose={() => setBuyProduct(null)}
            text={text}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
