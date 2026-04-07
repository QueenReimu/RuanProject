"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import {
  CONTENT_SETTING_KEY_MAP,
  SITE_CONTENT_DEFAULTS,
  type AppLocale,
  type ContentSlug,
} from "@/lib/site-content-defaults";
import { pushSiteIdentityUpdate } from "@/Components/SiteIdentityProvider";
import { useTheme } from "@/Components/ThemeProvider";

// ---- Types ----
interface Product {
  id: number;
  category_id: number;
  title: string;
  description: string;
  price: string;
  original_price: string | null;
  discount: number | null;
  is_bestseller: boolean;
  is_hidden: boolean;
  image: string;
  display_order: number;
  categories?: { id: number; key: string; label: string; games: { key: string; label: string } };
}

interface Category {
  id: number;
  game_id: number;
  key: string;
  label: string;
  image: string;
  display_order: number;
  is_hidden: boolean;
  games?: { id: number; key: string; label: string };
}

interface AdminWA {
  id: number;
  key: string;
  name: string;
  image: string;
  wa_number: string;
  role: string;
  description: string;
  is_active: boolean;
  is_hidden: boolean;
  display_order: number;
}

interface GachaImage {
  id: number;
  src: string;
  alt: string;
  is_hidden: boolean;
  display_order: number;
}

interface Game {
  id: number;
  key: string;
  label: string;
  logo: string | null;
  banner: string | null;
  tagline: string | null;
  description: string | null;
  services: string[] | null;
  display_order: number;
  is_hidden: boolean;
}

interface Testimonial {
  id: number;
  src: string;
  alt: string;
  caption: string;
  is_hidden: boolean;
  display_order: number;
}

interface AnalyticsData {
  visitors: { daily: number; weekly: number; monthly: number };
  pageViews: { daily: number; weekly: number; monthly: number };
}

type Tab = "games" | "products" | "categories" | "admins" | "gacha" | "testimonials" | "settings" | "content";
type DashboardDataKey = "games" | "products" | "categories" | "admins" | "gacha" | "testimonials" | "analytics" | "settings";

const TAB_VALUES: Tab[] = ["games", "products", "categories", "admins", "gacha", "testimonials", "settings", "content"];
const ALL_DATA_KEYS: DashboardDataKey[] = ["games", "products", "categories", "admins", "gacha", "testimonials", "analytics", "settings"];

function isTab(value: string): value is Tab {
  return TAB_VALUES.includes(value as Tab);
}

function normalizeImageSrc(value: unknown): string {
  return String(value ?? "").trim();
}

function parsePriceNumber(value: string | null | undefined): number {
  const source = String(value ?? "");
  const firstPriceToken = source.match(/\d[\d.,]*/)?.[0] ?? "";
  const digits = firstPriceToken.replace(/[^\d]/g, "");
  return digits ? Number(digits) : Number.MAX_SAFE_INTEGER;
}

function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function computeGlobalDiscountPreview(priceLabel: string, percent: number, minPrice: number): { price: string; discount: number } | null {
  const base = parsePriceNumber(priceLabel);
  if (!Number.isFinite(base) || base <= 0 || base === Number.MAX_SAFE_INTEGER) return null;
  if (base < minPrice) return null;

  const discounted = Math.max(500, Math.ceil((base * (100 - percent)) / 100 / 500) * 500);
  if (discounted >= base) return null;

  return {
    price: formatRupiah(discounted),
    discount: percent,
  };
}

// ---- Main Dashboard ----
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("games");
  const [games, setGames] = useState<Game[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [admins, setAdmins] = useState<AdminWA[]>([]);
  const [gachaImages, setGachaImages] = useState<GachaImage[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    visitors: { daily: 0, weekly: 0, monthly: 0 },
    pageViews: { daily: 0, weekly: 0, monthly: 0 },
  });
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const applyData = useCallback((key: DashboardDataKey, payload: unknown) => {
    switch (key) {
      case "games":
        setGames(Array.isArray(payload) ? payload as Game[] : []);
        return;
      case "products":
        setProducts(Array.isArray(payload) ? payload as Product[] : []);
        return;
      case "categories":
        setCategories(Array.isArray(payload) ? payload as Category[] : []);
        return;
      case "admins":
        setAdmins(Array.isArray(payload) ? payload as AdminWA[] : []);
        return;
      case "gacha":
        setGachaImages(Array.isArray(payload) ? payload as GachaImage[] : []);
        return;
      case "testimonials":
        setTestimonials(Array.isArray(payload) ? payload as Testimonial[] : []);
        return;
      case "analytics": {
        const analyticsData = payload as Partial<AnalyticsData> | null;
        setAnalytics({
          visitors: {
            daily: Number(analyticsData?.visitors?.daily ?? 0),
            weekly: Number(analyticsData?.visitors?.weekly ?? 0),
            monthly: Number(analyticsData?.visitors?.monthly ?? 0),
          },
          pageViews: {
            daily: Number(analyticsData?.pageViews?.daily ?? 0),
            weekly: Number(analyticsData?.pageViews?.weekly ?? 0),
            monthly: Number(analyticsData?.pageViews?.monthly ?? 0),
          },
        });
        return;
      }
      case "settings": {
        const settingsRows = payload as Array<{ key?: string; value?: string }> | null;
        const nextSettings =
          Array.isArray(settingsRows)
            ? settingsRows.reduce<Record<string, string>>((acc, row) => {
                if (row?.key) acc[row.key] = String(row.value ?? "");
                return acc;
              }, {})
            : {};
        setSettings(nextSettings);
      }
    }
  }, []);

  const fetchData = useCallback(async (keys: DashboardDataKey[], options?: { silent?: boolean; preserveScroll?: boolean }) => {
    const silent = options?.silent ?? false;
    const preserveScroll = options?.preserveScroll ?? false;
    const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
    if (!silent) setLoading(true);
    try {
      const endpointMap: Record<DashboardDataKey, string> = {
        games: "/api/admin/games",
        products: "/api/admin/products",
        categories: "/api/admin/categories",
        admins: "/api/admin/admins",
        gacha: "/api/admin/gacha-images",
        testimonials: "/api/admin/testimonials",
        analytics: "/api/admin/analytics",
        settings: "/api/admin/settings",
      };

      const entries = await Promise.all(
        keys.map(async (key) => {
          const response = await fetch(endpointMap[key]);
          return [key, response] as const;
        })
      );

      if (entries.some(([, response]) => response.status === 401)) {
        router.push("/admin");
        return;
      }

      await Promise.all(
        entries.map(async ([key, response]) => {
          const payload = await response.json();
          applyData(key, payload);
        })
      );
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setLoading(false);
      if (preserveScroll && typeof window !== "undefined") {
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollY, behavior: "auto" });
        });
      }
    }
  }, [applyData, router]);

  const fetchAll = useCallback(async (options?: { silent?: boolean; preserveScroll?: boolean }) => {
    await fetchData(ALL_DATA_KEYS, options);
  }, [fetchData]);

  const refreshTabFast = useCallback((tab: Tab) => {
    const keysByTab: Record<Tab, DashboardDataKey[]> = {
      games: ["games", "categories", "products"],
      products: ["products", "settings"],
      categories: ["categories", "products"],
      admins: ["admins"],
      gacha: ["gacha"],
      testimonials: ["testimonials"],
      settings: ["settings"],
      content: ["settings"],
    };
    void fetchData(keysByTab[tab], { silent: true, preserveScroll: true });
  }, [fetchData]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("admin-active-tab");
    if (stored && isTab(stored)) {
      setActiveTab(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("admin-active-tab", activeTab);
  }, [activeTab]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin");
  };

  return (
    <div className="min-h-screen bg-[var(--surface-muted)] text-[var(--foreground)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl px-6 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              <Sun className="hidden h-4 w-4 dark:block" />
              <Moon className="h-4 w-4 dark:hidden" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--surface-muted)]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          {[
            { label: "Games", value: games.length },
            { label: "Produk", value: products.length },
            { label: "Kategori", value: categories.length },
            { label: "Admin WA", value: admins.length },
            { label: "Hero", value: gachaImages.length },
            { label: "Testimoni", value: testimonials.length },
            { label: "Visitor Harian", value: analytics.visitors.daily },
            { label: "Visitor Mingguan", value: analytics.visitors.weekly },
          ].map((stat) => (
            <div key={stat.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
              <p className="text-[var(--foreground-muted)] text-xs font-medium mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <p className="text-[var(--foreground-muted)] text-xs font-medium mb-1">Visitor Bulanan</p>
            <p className="text-2xl font-bold text-[var(--foreground)]">{analytics.visitors.monthly}</p>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <p className="text-[var(--foreground-muted)] text-xs font-medium mb-1">Page Views Bulanan</p>
            <p className="text-2xl font-bold text-[var(--foreground)]">{analytics.pageViews.monthly}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-[var(--surface)] rounded-xl p-1 mb-6 w-fit">
          {([
            { key: "games", label: "Games" },
            { key: "products", label: "Produk" },
            { key: "categories", label: "Kategori" },
            { key: "admins", label: "Admin WA" },
            { key: "gacha", label: "Gacha Carousel" },
            { key: "testimonials", label: "Testimoni" },
            { key: "settings", label: "Pengaturan" },
            { key: "content", label: "Konten Halaman" },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.key
                  ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {activeTab === "games" && (
              <GamesTab games={games} onRefresh={() => refreshTabFast("games")} />
            )}
            {activeTab === "products" && (
              <ProductsTab products={products} categories={categories} settings={settings} onRefresh={() => refreshTabFast("products")} />
            )}
            {activeTab === "categories" && (
              <CategoriesTab categories={categories} games={games} onRefresh={() => refreshTabFast("categories")} />
            )}
            {activeTab === "admins" && (
              <AdminsTab admins={admins} onRefresh={() => refreshTabFast("admins")} />
            )}
            {activeTab === "gacha" && (
              <GachaImagesTab gachaImages={gachaImages} onRefresh={() => refreshTabFast("gacha")} />
            )}
            {activeTab === "testimonials" && <TestimonialsTab testimonials={testimonials} onRefresh={() => refreshTabFast("testimonials")} />}
            {activeTab === "settings" && <SettingsTab settings={settings} onRefresh={() => refreshTabFast("settings")} />}
            {activeTab === "content" && <ContentTab settings={settings} onRefresh={() => refreshTabFast("content")} />}
          </>
        )}
      </div>
    </div>
  );
}

// ---- ProductsTab ----
function ProductsTab({ products, categories, settings, onRefresh }: {
  products: Product[];
  categories: Category[];
  settings: Record<string, string>;
  onRefresh: () => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterGame, setFilterGame] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const emptyForm = {
    category_id: categories[0]?.id ?? 1,
    title: "", description: "", price: "", original_price: "",
    discount: 0, is_bestseller: false, is_hidden: false, image: "", display_order: 0,
  };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [discountDayActive, setDiscountDayActive] = useState(false);
  const [discountDayPercent, setDiscountDayPercent] = useState(10);
  const [discountDayMinPrice, setDiscountDayMinPrice] = useState(60000);
  const [discountDayBadgeText, setDiscountDayBadgeText] = useState("Hari Diskon Aktif");
  const [savingDiscountDay, setSavingDiscountDay] = useState(false);

  const games = Array.from(new Set(categories.map(c => c.games?.key).filter((k): k is string => Boolean(k))));
  const categoriesForGame = filterGame === "all"
    ? categories
    : categories.filter(c => c.games?.key === filterGame);
  const filteredProducts = products
    .filter((p) => {
      if (filterGame !== "all" && p.categories?.games?.key !== filterGame) return false;
      if (filterCategory !== "all" && p.category_id !== Number(filterCategory)) return false;
      return true;
    })
    .sort((a, b) => {
      const priceDiff = parsePriceNumber(a.price) - parsePriceNumber(b.price);
      if (priceDiff !== 0) return priceDiff;
      const orderDiff = a.display_order - b.display_order;
      if (orderDiff !== 0) return orderDiff;
      return a.id - b.id;
    });
  const filteredIds = filteredProducts.map((item) => item.id);
  const selectedCount = selectedIds.length;
  const selectedFilteredCount = filteredIds.filter((id) => selectedIds.includes(id)).length;
  const allFilteredSelected = filteredIds.length > 0 && selectedFilteredCount === filteredIds.length;

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => products.some((item) => item.id === id)));
  }, [products]);

  useEffect(() => {
    setDiscountDayActive(String(settings.discount_day_active ?? "").toLowerCase() === "true");
    const parsedPercent = Number(settings.discount_day_percent ?? 10);
    setDiscountDayPercent(Number.isFinite(parsedPercent) ? Math.min(Math.max(parsedPercent, 1), 90) : 10);
    const parsedMin = parsePriceNumber(settings.discount_day_min_price ?? "60000");
    setDiscountDayMinPrice(Number.isFinite(parsedMin) && parsedMin !== Number.MAX_SAFE_INTEGER ? parsedMin : 60000);
    const settingLabel = String(settings.discount_day_badge_text ?? "").trim();
    setDiscountDayBadgeText(settingLabel || "Hari Diskon Aktif");
  }, [settings.discount_day_active, settings.discount_day_percent, settings.discount_day_min_price, settings.discount_day_badge_text]);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openEdit = (p: Product) => {
    setForm({
      category_id: p.category_id,
      title: p.title,
      description: p.description,
      price: p.price,
      original_price: p.original_price ?? "",
      discount: p.discount ?? 0,
      is_bestseller: p.is_bestseller,
      is_hidden: p.is_hidden,
      image: p.image,
      display_order: p.display_order,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Gagal menyimpan produk.");
      }
      setShowForm(false);
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menyimpan produk.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus produk ini?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    onRefresh();
  };

  const handleToggleHidden = async (p: Product) => {
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_hidden: !p.is_hidden }),
    });
    onRefresh();
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectFiltered = () => {
    setSelectedIds((prev) => {
      if (allFilteredSelected) {
        return prev.filter((id) => !filteredIds.includes(id));
      }
      const next = new Set(prev);
      filteredIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Hapus ${selectedIds.length} produk terpilih?`)) return;

    const results = await Promise.all(
      selectedIds.map((id) => fetch(`/api/admin/products/${id}`, { method: "DELETE" }))
    );
    const failed = results.filter((res) => !res.ok).length;
    if (failed > 0) {
      alert(`${failed} produk gagal dihapus. Coba lagi.`);
    }
    setSelectedIds([]);
    onRefresh();
  };

  const saveDiscountDaySettings = async (
    activeValue: boolean,
    percentValue: number,
    minPriceValue?: number,
    badgeTextValue?: string
  ) => {
    const normalizedPercent = Number.isFinite(percentValue) ? percentValue : 10;
    const clampedPercent = Math.min(Math.max(Math.round(normalizedPercent), 1), 90);
    const normalizedMinPrice = Number.isFinite(minPriceValue ?? discountDayMinPrice)
      ? Math.max(0, Math.round(minPriceValue ?? discountDayMinPrice))
      : 60000;
    const normalizedBadgeText = String(badgeTextValue ?? discountDayBadgeText ?? "").trim() || "Hari Diskon Aktif";
    setSavingDiscountDay(true);
    try {
      const saveSetting = async (key: string, value: string) => {
        const response = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(String(payload?.error ?? "Gagal menyimpan mode Hari Diskon."));
        }
      };

      await Promise.all([
        saveSetting("discount_day_active", activeValue ? "true" : "false"),
        saveSetting("discount_day_percent", String(clampedPercent)),
        saveSetting("discount_day_min_price", String(normalizedMinPrice)),
        saveSetting("discount_day_badge_text", normalizedBadgeText),
      ]);
      setDiscountDayActive(activeValue);
      setDiscountDayPercent(clampedPercent);
      setDiscountDayMinPrice(normalizedMinPrice);
      setDiscountDayBadgeText(normalizedBadgeText);
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menyimpan mode Hari Diskon.");
    } finally {
      setSavingDiscountDay(false);
    }
  };

  const handleToggleDiscountDay = async () => {
    await saveDiscountDaySettings(!discountDayActive, discountDayPercent);
  };

  const handleSaveDiscountDayPercent = async () => {
    await saveDiscountDaySettings(discountDayActive, discountDayPercent);
  };

  const handleSaveDiscountDayBadgeText = async () => {
    await saveDiscountDaySettings(discountDayActive, discountDayPercent, discountDayMinPrice, discountDayBadgeText);
  };

  const handleSaveDiscountDayMinPrice = async () => {
    await saveDiscountDaySettings(discountDayActive, discountDayPercent, discountDayMinPrice, discountDayBadgeText);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {["all", ...games].map((g) => (
            <button
              key={g}
              onClick={() => { setFilterGame(g); setFilterCategory("all"); }}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                filterGame === g ? "bg-emerald-500 text-white" : "bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {g === "all" ? "Semua" : g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
          {/* Category filter dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1 text-xs rounded-lg font-medium bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] outline-none focus:border-emerald-500 transition-all"
          >
            <option value="all">Semua Kategori</option>
            {categoriesForGame.map((c) => (
              <option key={c.id} value={c.id}>
                {c.games?.label ? `${c.games.label} — ${c.label}` : c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-1">
            <span className="text-[11px] font-medium text-[var(--foreground-muted)]">Diskon Hari Ini (%)</span>
            <input
              type="number"
              min={1}
              max={90}
              value={discountDayPercent}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                setDiscountDayPercent(Number.isFinite(parsed) ? parsed : 10);
              }}
              className="w-16 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-xs text-[var(--foreground)]"
            />
            <button
              type="button"
              onClick={handleSaveDiscountDayPercent}
              disabled={savingDiscountDay}
              className="rounded-md bg-[var(--brand)] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--brand-soft)] bg-[var(--surface)] px-2 py-1">
            <span className="text-[11px] font-semibold text-[var(--foreground)]">Teks Badge</span>
            <input
              type="text"
              value={discountDayBadgeText}
              onChange={(e) => setDiscountDayBadgeText(e.target.value)}
              placeholder="Contoh: Promo Event Ramadan"
              className="w-56 rounded-md border border-[var(--brand-soft)] bg-[var(--surface-muted)] px-2 py-1 text-xs font-medium text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand)]"
            />
            <button
              type="button"
              onClick={handleSaveDiscountDayBadgeText}
              disabled={savingDiscountDay}
              className="rounded-md bg-[var(--brand)] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
          <button
            type="button"
            onClick={handleToggleDiscountDay}
            disabled={savingDiscountDay}
            className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              discountDayActive
                ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
                : "border border-[var(--brand-soft)] bg-[var(--brand-soft)] text-[var(--brand)] hover:brightness-95"
            } disabled:opacity-50`}
          >
            Hari Diskon: {discountDayActive ? "ON" : "OFF"}
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-1">
            <span className="text-[11px] font-medium text-[var(--foreground-muted)]">Batas harga diskon (Rp)</span>
            <input
              type="number"
              min={0}
              step={500}
              value={discountDayMinPrice}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                setDiscountDayMinPrice(Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0);
              }}
              className="w-28 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-xs text-[var(--foreground)]"
            />
            <button
              type="button"
              onClick={handleSaveDiscountDayMinPrice}
              disabled={savingDiscountDay}
              className="rounded-md bg-[var(--brand)] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
          <button
            type="button"
            onClick={toggleSelectFiltered}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
          >
            {allFilteredSelected ? "Batal Pilih Filter" : `Pilih Semua Filter (${filteredIds.length})`}
          </button>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={selectedCount === 0}
            className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hapus Terpilih ({selectedCount})
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Produk
          </button>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <Modal title={editingId ? "Edit Produk" : "Tambah Produk"} onClose={() => setShowForm(false)}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Kategori</Label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
                className={inputCls}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.games?.label} — {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2"><Label>Judul</Label>
              <input className={inputCls} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="col-span-2"><Label>Deskripsi</Label>
              <textarea rows={3} className={`${inputCls} resize-none`} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Harga</Label>
              <input className={inputCls} value={form.price} placeholder="Rp15.000" onChange={e => setForm({ ...form, price: e.target.value })} /></div>
            <div><Label>Harga Original</Label>
              <input className={inputCls} value={form.original_price} placeholder="Rp20.000" onChange={e => setForm({ ...form, original_price: e.target.value })} /></div>
            <div><Label>Diskon (%)</Label>
              <input type="number" className={inputCls} value={form.discount} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} /></div>
            <div><Label>Urutan</Label>
              <input type="number" className={inputCls} value={form.display_order} onChange={e => setForm({ ...form, display_order: Number(e.target.value) })} /></div>
            <div className="col-span-2">
              <ImageUpload
                label="Gambar Produk"
                value={form.image}
                onChange={(path) => setForm({ ...form, image: path })}
              />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <input type="checkbox" id="bestseller" checked={form.is_bestseller}
                onChange={e => setForm({ ...form, is_bestseller: e.target.checked })}
                className="w-4 h-4 accent-emerald-500" />
              <label htmlFor="bestseller" className="text-sm text-[var(--foreground)]">Tandai sebagai Bestseller</label>
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="hidden_product"
                checked={form.is_hidden}
                onChange={e => setForm({ ...form, is_hidden: e.target.checked })}
                className="w-4 h-4 accent-emerald-500"
              />
              <label htmlFor="hidden_product" className="text-sm text-[var(--foreground)]">Sembunyikan produk di website</label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-5 bg-[var(--surface-muted)] hover:bg-[var(--surface-muted)] text-[var(--foreground)] rounded-xl transition-all">
              Batal
            </button>
          </div>
        </Modal>
      )}

      {/* Product cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((p) => {
          const promoPreview = discountDayActive
            ? computeGlobalDiscountPreview(p.price, discountDayPercent, discountDayMinPrice)
            : null;
          const cardPrice = promoPreview?.price ?? p.price;
          const cardOriginalPrice = promoPreview ? p.price : p.original_price;
          const cardDiscount = promoPreview?.discount ?? p.discount;

          return (
          <div key={p.id} className={`border rounded-2xl overflow-hidden transition-all group ${
            p.is_hidden ? "bg-black border-red-500/50" : "bg-[var(--surface)] border-[var(--border)] hover:border-emerald-500/30"
          }`}>
            <div className={`relative h-36 ${p.is_hidden ? "bg-black" : "bg-[var(--surface)]"}`}>
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt={p.title} className={`w-full h-full object-contain p-3 ${p.is_hidden ? "opacity-20 grayscale" : ""}`} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--foreground-muted)]">No Image</div>
              )}
              {p.is_hidden && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">HIDDEN</span>
                </div>
              )}
              {!p.is_hidden && p.is_bestseller && (
                <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">BESTSELLER</span>
              )}
              {cardDiscount ? (
                <span className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">-{cardDiscount}%</span>
              ) : null}
            </div>
            <div className={`p-4 ${p.is_hidden ? "opacity-40" : ""}`}>
              <label className="mb-2 inline-flex cursor-pointer items-center gap-2 text-[11px] text-[var(--foreground-muted)]">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(p.id)}
                  onChange={() => toggleSelection(p.id)}
                  className="h-4 w-4 accent-emerald-500"
                />
                Pilih item
              </label>
              <p className="text-xs text-[var(--foreground-muted)] mb-1">{p.categories?.games?.label} ? {p.categories?.label}</p>
              <h3 className="font-semibold text-[var(--foreground)] text-sm mb-1">{p.title}</h3>
              <p className="text-xs text-[var(--foreground-muted)] line-clamp-2 mb-3">{p.description}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-emerald-400 font-bold">{cardPrice}</span>
                {cardOriginalPrice && (
                  <span className="text-[var(--foreground-muted)] text-xs line-through">{cardOriginalPrice}</span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)}
                  className="flex-1 text-xs bg-[var(--surface-muted)] hover:bg-[var(--surface-muted)] text-[var(--foreground)] py-2 rounded-lg transition-all">
                  Edit
                </button>
                <button onClick={() => handleToggleHidden(p)}
                  className={`flex-1 text-xs py-2 rounded-lg transition-all ${
                    p.is_hidden
                      ? "bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400"
                      : "bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400"
                  }`}>
                  {p.is_hidden ? "Unhide" : "Hide"}
                </button>
                <button onClick={() => handleDelete(p.id)}
                  className="flex-1 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 py-2 rounded-lg transition-all">
                  Hapus
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- CategoriesTab ----
function CategoriesTab({ categories, games, onRefresh }: { categories: Category[]; games: Game[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const emptyForm = { game_id: games[0]?.id ?? 1, key: "", label: "", image: "", display_order: 0, is_hidden: false };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setForm({ game_id: games[0]?.id ?? 1, key: "", label: "", image: "", display_order: 0, is_hidden: false });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (c: Category) => {
    setForm({ game_id: c.game_id, key: c.key, label: c.label, image: c.image, display_order: c.display_order, is_hidden: c.is_hidden });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories";
      const method = editingId ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(String(payload?.error ?? "Gagal menyimpan kategori."));
      }
      setShowForm(false);
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menyimpan kategori.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus kategori ini beserta semua produknya?")) return;
    const response = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      alert(String(payload?.error ?? "Gagal menghapus kategori."));
      return;
    }
    onRefresh();
  };

  const handleToggleHidden = async (id: number, currentStatus: boolean) => {
    const response = await fetch(`/api/admin/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_hidden: !currentStatus }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      alert(String(payload?.error ?? "Gagal mengubah status kategori."));
      return;
    }
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Kategori
        </button>
      </div>

      {showForm && (
        <Modal title={editingId ? "Edit Kategori" : "Tambah Kategori"} onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            <div><Label>Game</Label>
              <select value={form.game_id} onChange={e => setForm({ ...form, game_id: Number(e.target.value) })} className={inputCls}>
                {games.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
              </select>
              </div>
              <div><Label>Key (slug)</Label>
                <input className={inputCls} value={form.key} placeholder="astrite" onChange={e => setForm({ ...form, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })} /></div>
            <div><Label>Label</Label>
              <input className={inputCls} value={form.label} placeholder="Astrite" onChange={e => setForm({ ...form, label: e.target.value })} /></div>
            <div>
              <ImageUpload
                label="Gambar Kategori"
                value={form.image}
                onChange={(path) => setForm({ ...form, image: path })}
              />
            </div>
            <div><Label>Urutan</Label>
              <input type="number" className={inputCls} value={form.display_order} onChange={e => setForm({ ...form, display_order: Number(e.target.value) })} /></div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hidden_category"
                checked={form.is_hidden}
                onChange={e => setForm({ ...form, is_hidden: e.target.checked })}
                className="w-4 h-4 accent-emerald-500"
              />
              <label htmlFor="hidden_category" className="text-sm text-[var(--foreground)]">Sembunyikan kategori di website</label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-5 bg-[var(--surface-muted)] hover:bg-[var(--surface-muted)] text-[var(--foreground)] rounded-xl transition-all">Batal</button>
          </div>
        </Modal>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <div key={c.id} className={`bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-violet-500/30 transition-all ${c.is_hidden ? "opacity-60" : ""}`}>
            <div className="relative h-28 bg-[var(--surface)]">
              {c.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt={c.label} className="w-full h-full object-contain p-2" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--foreground-muted)] text-2xl">??</div>
              )}
            </div>
            <div className="p-4">
              <p className="text-xs text-[var(--foreground-muted)] mb-1">{c.games?.label}</p>
              <h3 className="font-semibold text-[var(--foreground)] mb-0.5 flex items-center gap-2">
                {c.label}
                {c.is_hidden && <span className="text-[10px] bg-zinc-600/40 text-zinc-200 px-1.5 py-0.5 rounded-full">hidden</span>}
              </h3>
              <p className="text-xs text-[var(--foreground-muted)] mb-4">key: <code className="text-emerald-400">{c.key}</code></p>
              <div className="flex gap-2">
                <button onClick={() => openEdit(c)}
                  className="flex-1 text-xs bg-[var(--surface-muted)] hover:bg-[var(--surface-muted)] text-[var(--foreground)] py-2 rounded-lg transition-all">Edit</button>
                <button onClick={() => handleToggleHidden(c.id, c.is_hidden)}
                  className={`flex-1 text-xs py-2 rounded-lg transition-all ${c.is_hidden ? "bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300" : "bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300"}`}>
                  {c.is_hidden ? "Tampilkan" : "Sembunyikan"}
                </button>
                <button onClick={() => handleDelete(c.id)}
                  className="flex-1 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 py-2 rounded-lg transition-all">Hapus</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- AdminsTab ----
function AdminsTab({ admins, onRefresh }: { admins: AdminWA[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const emptyForm = {
    key: "",
    name: "",
    image: "",
    wa_number: "",
    role: "",
    description: "",
    is_active: true,
    is_hidden: false,
    display_order: 0,
  };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openEdit = (a: AdminWA) => {
    setForm({
      key: a.key,
      name: a.name,
      image: a.image,
      wa_number: a.wa_number,
      role: a.role ?? "",
      description: a.description ?? "",
      is_active: a.is_active,
      is_hidden: a.is_hidden,
      display_order: a.display_order,
    });
    setEditingId(a.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/admins/${editingId}` : "/api/admin/admins";
      const method = editingId ? "PUT" : "POST";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setShowForm(false);
      onRefresh();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus admin WA ini?")) return;
    await fetch(`/api/admin/admins/${id}`, { method: "DELETE" });
    onRefresh();
  };

  const handleToggleHidden = async (id: number, currentStatus: boolean) => {
    await fetch(`/api/admin/admins/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_hidden: !currentStatus }),
    });
    onRefresh();
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    await fetch(`/api/admin/admins/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !currentStatus }),
    });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Admin WA
        </button>
      </div>

      {showForm && (
        <Modal title={editingId ? "Edit Admin WA" : "Tambah Admin WA"} onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            <div><Label>Key</Label>
              <input className={inputCls} value={form.key} placeholder="admin1" onChange={e => setForm({ ...form, key: e.target.value })} /></div>
            <div><Label>Nama</Label>
              <input className={inputCls} value={form.name} placeholder="Admin 1" onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Nomor WA (format: 628xxx)</Label>
              <input className={inputCls} value={form.wa_number} placeholder="6283857809571" onChange={e => setForm({ ...form, wa_number: e.target.value })} /></div>
            <div><Label>Role (untuk section Tentang)</Label>
              <input className={inputCls} value={form.role} placeholder="Customer Success" onChange={e => setForm({ ...form, role: e.target.value })} /></div>
            <div><Label>Deskripsi Role</Label>
              <textarea rows={3} className={`${inputCls} resize-none`} value={form.description} placeholder="Fokus pada konsultasi produk dan penanganan order harian." onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <ImageUpload
                label="Foto Admin"
                value={form.image}
                onChange={(path) => setForm({ ...form, image: path })}
              />
            </div>
            <div><Label>Urutan</Label>
              <input type="number" className={inputCls} value={form.display_order} onChange={e => setForm({ ...form, display_order: Number(e.target.value) })} /></div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="active" checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 accent-emerald-500" />
              <label htmlFor="active" className="text-sm text-[var(--foreground)]">Admin Aktif (tampil di modal beli)</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hidden_admin"
                checked={form.is_hidden}
                onChange={e => setForm({ ...form, is_hidden: e.target.checked })}
                className="w-4 h-4 accent-emerald-500"
              />
              <label htmlFor="hidden_admin" className="text-sm text-[var(--foreground)]">Sembunyikan admin di website</label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-5 bg-[var(--surface-muted)] hover:bg-[var(--surface-muted)] text-[var(--foreground)] rounded-xl transition-all">Batal</button>
          </div>
        </Modal>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {admins.map((a) => (
          <div key={a.id} className={`bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-amber-500/30 transition-all ${a.is_hidden ? "opacity-60" : ""}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-[var(--surface-muted)] overflow-hidden flex-shrink-0">
                {a.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.image} alt={a.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">??</div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                  {a.name}
                  {!a.is_active && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Nonaktif</span>}
                  {a.is_hidden && <span className="text-xs bg-zinc-600/40 text-zinc-200 px-2 py-0.5 rounded-full">Hidden</span>}
                </h3>
                {a.role ? <p className="text-xs text-[var(--brand)] truncate">{a.role}</p> : null}
                <p className="text-sm text-[var(--foreground-muted)] truncate">{a.wa_number}</p>
                <p className="text-xs text-[var(--foreground-muted)]">key: <code className="text-amber-400">{a.key}</code></p>
                {a.description ? <p className="mt-1 text-xs text-[var(--foreground-muted)] line-clamp-2">{a.description}</p> : null}
              </div>
            </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(a)}
                  className="flex-1 text-xs bg-[var(--surface-muted)] hover:bg-[var(--surface-muted)] text-[var(--foreground)] py-2 rounded-lg transition-all">Edit</button>
                <button onClick={() => handleToggleActive(a.id, a.is_active)}
                  className={`flex-1 text-xs py-2 rounded-lg transition-all ${a.is_active ? "bg-orange-500/20 hover:bg-orange-500/40 text-orange-300" : "bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300"}`}>
                  {a.is_active ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button onClick={() => handleToggleHidden(a.id, a.is_hidden)}
                  className={`flex-1 text-xs py-2 rounded-lg transition-all ${a.is_hidden ? "bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300" : "bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300"}`}>
                  {a.is_hidden ? "Tampilkan" : "Sembunyikan"}
                </button>
                <button onClick={() => handleDelete(a.id)}
                  className="flex-1 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 py-2 rounded-lg transition-all">Hapus</button>
              </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Reusable UI ----
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--foreground)]">{title}</h2>
          <button onClick={onClose} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1.5">{children}</label>;
}

const inputCls = "w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--foreground)] placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all [&_option]:bg-[var(--surface)]";

// ---- ImageUpload Component ----
function ImageUpload({ label, value, onChange }: { label: string; value: string; onChange: (path: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Upload gagal");
        return;
      }
      const { path } = await res.json();
      onChange(path);
    } catch {
      alert("Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label>{label}</Label>
        <div className="flex gap-1">
          <button type="button" onClick={() => setMode("upload")}
            className={`text-[10px] px-2 py-0.5 rounded-md transition-all ${mode === "upload" ? "bg-emerald-500/20 text-emerald-400" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"}`}>
            Upload
          </button>
          <button type="button" onClick={() => setMode("url")}
            className={`text-[10px] px-2 py-0.5 rounded-md transition-all ${mode === "url" ? "bg-emerald-500/20 text-emerald-400" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"}`}>
            URL
          </button>
        </div>
      </div>

      {mode === "upload" ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            dragOver ? "border-emerald-500 bg-emerald-500/10" : "border-[var(--border)] hover:border-[var(--border)] bg-[var(--surface)]"
          }`}
        >
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-[var(--foreground-muted)]">Uploading...</span>
            </div>
          ) : value ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="preview" className="w-16 h-16 object-contain rounded-lg bg-[var(--surface)]" />
              <div className="text-left flex-1 min-w-0">
                <p className="text-xs text-[var(--foreground-muted)] truncate">{value}</p>
                <p className="text-[10px] text-[var(--foreground-muted)] mt-0.5">Klik atau drag untuk ganti</p>
              </div>
            </div>
          ) : (
            <div className="py-3">
              <svg className="w-8 h-8 mx-auto text-[var(--foreground-muted)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs text-[var(--foreground-muted)]">Klik atau drag gambar ke sini</p>
              <p className="text-[10px] text-[var(--foreground-muted)] mt-1">JPG, PNG, WebP, GIF — Max 5MB</p>
            </div>
          )}
        </div>
      ) : (
        <input
          className={inputCls}
          value={value}
          placeholder="/pricelist/..."
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

// ---- GachaImagesTab ----
function GachaImagesTab({ gachaImages, onRefresh }: {
  gachaImages: GachaImage[];
  onRefresh: () => void;
}) {
  const emptyForm = { src: "", alt: "", is_hidden: false, display_order: 0 };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openEdit = (img: GachaImage) => {
    setForm({ src: img.src, alt: img.alt, is_hidden: img.is_hidden, display_order: img.display_order });
    setEditingId(img.id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/gacha-images/${editingId}` : "/api/admin/gacha-images";
      const method = editingId ? "PUT" : "POST";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      onRefresh();
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus gambar ini?")) return;
    await fetch(`/api/admin/gacha-images/${id}`, { method: "DELETE" });
    onRefresh();
  };

  const handleToggleHide = async (id: number, currentStatus: boolean) => {
    await fetch(`/api/admin/gacha-images/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_hidden: !currentStatus }),
    });
    onRefresh();
  };

  const labelCls = "block text-xs font-medium text-[var(--foreground-muted)] mb-1";
  const inputCls = "w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors";

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-[var(--foreground)]">Gacha Carousel Images ({gachaImages.length})</h2>
        <button onClick={openAdd}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors">
          + Tambah Gambar
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">{editingId ? "Edit Gambar" : "Tambah Gambar"}</h3>

          <div>
            <label className={labelCls}>Gambar (URL/path)</label>
            <ImageUpload
              label=""
              value={form.src}
              onChange={(v: string) => setForm((f) => ({ ...f, src: v }))}
            />
          </div>

          <div>
            <label className={labelCls}>Alt Text</label>
            <input className={inputCls} value={form.alt}
              placeholder="Contoh: Genshin Impact"
              onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))} />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className={labelCls}>Urutan (display_order)</label>
              <input className={inputCls} type="number" value={form.display_order}
                onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-[var(--foreground)]">
                <input type="checkbox" checked={form.is_hidden}
                  onChange={(e) => setForm((f) => ({ ...f, is_hidden: e.target.checked }))}
                  className="accent-emerald-500" />
                Sembunyikan
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
              {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambahkan"}
            </button>
            <button type="button" onClick={closeForm}
              className="px-4 py-2 bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[var(--foreground)] rounded-lg text-sm transition-colors">
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Image Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {gachaImages.map((img) => (
          <div key={img.id} className={`bg-[var(--surface)] border rounded-xl overflow-hidden transition-all ${img.is_hidden ? "border-red-500/30 opacity-60" : "border-[var(--border)]"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt={img.alt} className="w-full aspect-video object-cover bg-black/20" />
            <div className="p-3">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">{img.alt || <span className="text-[var(--foreground-muted)] italic">No alt text</span>}</p>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5 truncate">{img.src}</p>
              <div className="flex gap-1 mt-1">
                <span className="text-[10px] text-[var(--foreground-muted)] bg-[var(--surface)] px-1.5 py-0.5 rounded">order: {img.display_order}</span>
                {img.is_hidden && <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">hidden</span>}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(img)}
                  className="flex-1 text-xs py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors">
                  Edit
                </button>
                <button onClick={() => handleToggleHide(img.id, img.is_hidden)}
                  className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${img.is_hidden ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400" : "bg-orange-500/10 hover:bg-orange-500/20 text-orange-400"}`}>
                  {img.is_hidden ? "Tampilkan" : "Sembunyikan"}
                </button>
                <button onClick={() => handleDelete(img.id)}
                  className="flex-1 text-xs py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
        {gachaImages.length === 0 && (
          <p className="col-span-full text-center text-[var(--foreground-muted)] text-sm py-8">Belum ada gambar. Klik &quot;Tambah Gambar&quot; untuk memulai.</p>
        )}
      </div>
    </div>
  );
}

function TestimonialsTab({ testimonials, onRefresh }: { testimonials: Testimonial[]; onRefresh: () => void }) {
  const emptyForm = { src: "", alt: "", caption: "", is_hidden: false, display_order: 0 };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => testimonials.some((item) => item.id === id)));
  }, [testimonials]);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
  const openEdit = (item: Testimonial) => {
    setForm({
      src: item.src,
      alt: item.alt,
      caption: item.caption,
      is_hidden: item.is_hidden,
      display_order: item.display_order,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    const normalizedSrc = normalizeImageSrc(form.src);
    if (!normalizedSrc) {
      alert("Gambar testimoni wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/admin/testimonials/${editingId}` : "/api/admin/testimonials";
      const method = editingId ? "PUT" : "POST";
      const payload = { ...form, src: normalizedSrc };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Gagal menyimpan testimoni.");
      }
      setShowForm(false);
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menyimpan testimoni.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus testimoni ini?")) return;
    const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      alert(payload?.error || "Gagal menghapus testimoni.");
      return;
    }
    onRefresh();
  };

  const handleToggleHidden = async (id: number, currentStatus: boolean) => {
    const res = await fetch(`/api/admin/testimonials/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_hidden: !currentStatus }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      alert(payload?.error || "Gagal mengubah status testimoni.");
      return;
    }
    onRefresh();
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === testimonials.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(testimonials.map((item) => item.id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Hapus ${selectedIds.length} testimoni terpilih?`)) return;

    let failed = 0;
    for (const id of selectedIds) {
      const response = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
      if (!response.ok) {
        failed += 1;
      }
    }
    if (failed > 0) {
      alert(`${failed} testimoni gagal dihapus. Coba lagi.`);
    }
    setSelectedIds([]);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-[var(--foreground)]">Testimoni ({testimonials.length})</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
          >
            {selectedIds.length === testimonials.length && testimonials.length > 0 ? "Batal Pilih Semua" : "Pilih Semua"}
          </button>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={selectedIds.length === 0}
            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hapus Terpilih ({selectedIds.length})
          </button>
          <button onClick={openAdd} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors">
            + Tambah Testimoni
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {testimonials.map((item) => (
          <div key={item.id} className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden ${item.is_hidden ? "opacity-60" : ""}`}>
            {normalizeImageSrc(item.src) ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={normalizeImageSrc(item.src)} alt={item.alt || "testimoni"} className="w-full aspect-[4/5] object-cover bg-black/20" />
              </>
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center bg-[var(--surface-muted)] text-xs text-[var(--foreground-muted)]">
                Tidak ada gambar
              </div>
            )}
            <div className="p-3">
              <label className="mb-2 inline-flex cursor-pointer items-center gap-2 text-[11px] text-[var(--foreground-muted)]">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleSelection(item.id)}
                  className="h-4 w-4 accent-emerald-500"
                />
                Pilih item
              </label>
              <p className="text-sm font-medium text-[var(--foreground)]">{item.alt || "Testimoni"}</p>
              <p className="text-xs text-[var(--foreground-muted)] line-clamp-2 mt-1">{item.caption || "Tanpa caption"}</p>
              <div className="text-[11px] text-[var(--foreground-muted)] mt-1">order: {item.display_order}</div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <button onClick={() => openEdit(item)} className="text-xs py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-lg transition-colors">
                  Edit
                </button>
                <button
                  onClick={() => handleToggleHidden(item.id, item.is_hidden)}
                  className={`text-xs py-1.5 rounded-lg transition-colors ${item.is_hidden ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300" : "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300"}`}
                >
                  {item.is_hidden ? "Show" : "Hide"}
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-xs py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg transition-colors">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <Modal title={editingId ? "Edit Testimoni" : "Tambah Testimoni"} onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            <ImageUpload label="Gambar Testimoni" value={form.src} onChange={(path) => setForm((prev) => ({ ...prev, src: path }))} />
            <div>
              <Label>Alt Text</Label>
              <input className={inputCls} value={form.alt} onChange={(e) => setForm((prev) => ({ ...prev, alt: e.target.value }))} />
            </div>
            <div>
              <Label>Caption</Label>
              <textarea
                rows={3}
                className={`${inputCls} resize-none`}
                value={form.caption}
                onChange={(e) => setForm((prev) => ({ ...prev, caption: e.target.value }))}
              />
            </div>
            <div>
              <Label>Display Order</Label>
              <input
                type="number"
                className={inputCls}
                value={form.display_order}
                onChange={(e) => setForm((prev) => ({ ...prev, display_order: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hidden_testimoni"
                checked={form.is_hidden}
                onChange={(e) => setForm((prev) => ({ ...prev, is_hidden: e.target.checked }))}
                className="w-4 h-4 accent-emerald-500"
              />
              <label htmlFor="hidden_testimoni" className="text-sm text-[var(--foreground)]">Sembunyikan testimoni di website</label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 bg-[var(--surface-muted)] hover:bg-[var(--surface-muted)] text-[var(--foreground)] rounded-xl transition-all">
              Batal
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="h-3 w-16 rounded bg-[var(--surface-muted)]" />
            <div className="mt-3 h-8 w-14 rounded bg-[var(--surface-muted)]" />
          </div>
        ))}
      </div>

      <div className="w-fit rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-9 w-24 rounded-lg bg-[var(--surface-muted)]" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="h-36 bg-[var(--surface-muted)]" />
            <div className="space-y-3 p-4">
              <div className="h-3 w-24 rounded bg-[var(--surface-muted)]" />
              <div className="h-5 w-2/3 rounded bg-[var(--surface-muted)]" />
              <div className="h-3 w-full rounded bg-[var(--surface-muted)]" />
              <div className="h-3 w-3/4 rounded bg-[var(--surface-muted)]" />
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="h-8 rounded bg-[var(--surface-muted)]" />
                <div className="h-8 rounded bg-[var(--surface-muted)]" />
                <div className="h-8 rounded bg-[var(--surface-muted)]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab({ settings, onRefresh }: { settings: Record<string, string>; onRefresh: () => void }) {
  const [siteLogo, setSiteLogo] = useState(settings.site_logo ?? "");
  const [siteTitle, setSiteTitle] = useState(settings.site_title ?? "");
  const [siteDescription, setSiteDescription] = useState(settings.site_description ?? "");
  const [testimonialChannel1Url, setTestimonialChannel1Url] = useState(
    settings.testimonial_channel_1_url ?? settings.testimonial_channel_url ?? ""
  );
  const [testimonialChannel2Url, setTestimonialChannel2Url] = useState(settings.testimonial_channel_2_url ?? "");
  const [testimonialChannel3Url, setTestimonialChannel3Url] = useState(settings.testimonial_channel_3_url ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSiteLogo(settings.site_logo ?? "");
    setSiteTitle(settings.site_title ?? "");
    setSiteDescription(settings.site_description ?? "");
    setTestimonialChannel1Url(settings.testimonial_channel_1_url ?? settings.testimonial_channel_url ?? "");
    setTestimonialChannel2Url(settings.testimonial_channel_2_url ?? "");
    setTestimonialChannel3Url(settings.testimonial_channel_3_url ?? "");
  }, [
    settings.site_logo,
    settings.site_title,
    settings.site_description,
    settings.testimonial_channel_url,
    settings.testimonial_channel_1_url,
    settings.testimonial_channel_2_url,
    settings.testimonial_channel_3_url,
  ]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saveSetting = async (key: string, value: string) => {
        const response = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(String(payload?.error ?? "Gagal menyimpan pengaturan."));
        }
      };

        await Promise.all([
          saveSetting("site_logo", siteLogo),
          saveSetting("site_title", siteTitle),
          saveSetting("site_description", siteDescription),
          saveSetting("testimonial_channel_url", testimonialChannel1Url),
          saveSetting("testimonial_channel_1_url", testimonialChannel1Url),
          saveSetting("testimonial_channel_2_url", testimonialChannel2Url),
          saveSetting("testimonial_channel_3_url", testimonialChannel3Url),
        ]);
        pushSiteIdentityUpdate({
          logo: siteLogo,
          title: siteTitle,
          description: siteDescription,
        });
        onRefresh();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Gagal menyimpan pengaturan.");
      } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-lg font-bold text-[var(--foreground)]">Pengaturan</h2>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
        <ImageUpload label="Logo Website" value={siteLogo} onChange={setSiteLogo} />
        <div>
          <Label>Judul Website</Label>
          <input
            className={inputCls}
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
            placeholder="Contoh: Ruan Joki"
          />
        </div>
        <div>
          <Label>Deskripsi Website</Label>
          <textarea
            rows={3}
            className={`${inputCls} resize-none`}
            value={siteDescription}
            onChange={(e) => setSiteDescription(e.target.value)}
            placeholder="Deskripsi singkat website kamu."
          />
        </div>
        <div>
          <Label>Link Saluran Testimoni 1</Label>
          <input
            className={inputCls}
            value={testimonialChannel1Url}
            onChange={(e) => setTestimonialChannel1Url(e.target.value)}
            placeholder="https://whatsapp.com/channel/..."
          />
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            Tombol &quot;Lihat Semua Testimoni&quot; akan membuka popup pilihan saluran ini.
          </p>
        </div>
        <div>
          <Label>Link Saluran Testimoni 2</Label>
          <input
            className={inputCls}
            value={testimonialChannel2Url}
            onChange={(e) => setTestimonialChannel2Url(e.target.value)}
            placeholder="https://whatsapp.com/channel/..."
          />
        </div>
        <div>
          <Label>Link Saluran Testimoni 3</Label>
          <input
            className={inputCls}
            value={testimonialChannel3Url}
            onChange={(e) => setTestimonialChannel3Url(e.target.value)}
            placeholder="https://whatsapp.com/channel/..."
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </div>
  );
}

type LocalizedEditorData = Record<AppLocale, Record<string, unknown>>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function prettifyKey(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeContentForEditor(slug: ContentSlug, payload: unknown): LocalizedEditorData {
  const defaults = SITE_CONTENT_DEFAULTS[slug] as unknown as LocalizedEditorData;
  const parsed = isPlainObject(payload) ? payload : {};

  const result = {
    id: { ...defaults.id } as Record<string, unknown>,
    en: { ...defaults.en } as Record<string, unknown>,
    my: { ...defaults.my } as Record<string, unknown>,
  };

  (["id", "en", "my"] as const).forEach((locale) => {
    const incoming = parsed[locale];
    if (isPlainObject(incoming)) {
      Object.keys(defaults[locale] ?? {}).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(incoming, key)) {
          result[locale][key] = incoming[key];
        }
      });
    }
  });

  return cloneJson(result);
}

function ContentTab({ settings, onRefresh }: { settings: Record<string, string>; onRefresh: () => void }) {
  const [activePage, setActivePage] = useState<ContentSlug>("games");
  const [activeLocale, setActiveLocale] = useState<AppLocale>("id");
  const [editorData, setEditorData] = useState<LocalizedEditorData>(
    normalizeContentForEditor("games", SITE_CONTENT_DEFAULTS.games)
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const settingKey = CONTENT_SETTING_KEY_MAP[activePage];

  const loadFromApi = useCallback(async (slug: ContentSlug) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/content/${slug}`, { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(String(payload?.error ?? "Gagal memuat konten."));
      }

      const payload = await response.json();
      setEditorData(normalizeContentForEditor(slug, payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat konten.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFromApi(activePage);
  }, [activePage, loadFromApi, settings[settingKey]]);

  const handleUseDefault = () => {
    setEditorData(normalizeContentForEditor(activePage, SITE_CONTENT_DEFAULTS[activePage]));
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: settingKey,
          value: JSON.stringify(editorData),
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(String(payload?.error ?? "Gagal menyimpan konten."));
      }

      onRefresh();
      await loadFromApi(activePage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan konten.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (fieldKey: string, value: unknown) => {
    setEditorData((current) => ({
      ...current,
      [activeLocale]: {
        ...current[activeLocale],
        [fieldKey]: value,
      },
    }));
  };

  const currentLocaleData = (editorData[activeLocale] ?? {}) as Record<string, unknown>;
  const templateLocaleData = (SITE_CONTENT_DEFAULTS[activePage] as unknown as LocalizedEditorData)[activeLocale] ?? {};

  const buildArrayObjectTemplate = (fieldKey: string): Record<string, unknown> => {
    const fromCurrent = currentLocaleData[fieldKey];
    if (Array.isArray(fromCurrent) && fromCurrent.length > 0 && isPlainObject(fromCurrent[0])) {
      return Object.keys(fromCurrent[0]).reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = "";
        return acc;
      }, {});
    }

    const fromTemplate = templateLocaleData[fieldKey];
    if (Array.isArray(fromTemplate) && fromTemplate.length > 0 && isPlainObject(fromTemplate[0])) {
      return Object.keys(fromTemplate[0]).reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = "";
        return acc;
      }, {});
    }

    return {};
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Konten Halaman</h2>
          <p className="text-xs text-[var(--foreground-muted)]">Form ini dibuat sederhana. Tinggal isi field, tambah/hapus item, lalu simpan.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            { key: "games", label: "Games" },
            { key: "cara-order", label: "Cara Order" },
            { key: "tentang", label: "Tentang" },
          ] as const).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActivePage(item.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activePage === item.key
                  ? "bg-violet-500 text-white"
                  : "bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[var(--foreground-muted)]">
            Setting key: <span className="font-mono text-[var(--foreground)]">{settingKey}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {([
              { key: "id", label: "Indonesia" },
              { key: "en", label: "English" },
              { key: "my", label: "Melayu" },
            ] as const).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveLocale(item.key)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeLocale === item.key
                    ? "bg-emerald-500 text-white"
                    : "bg-[var(--surface-muted)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]">
            Memuat konten...
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(currentLocaleData).map(([fieldKey, rawValue]) => {
              if (Array.isArray(rawValue)) {
                const isObjectArray = rawValue.length > 0 && isPlainObject(rawValue[0]);
                const title = prettifyKey(fieldKey);

                if (isObjectArray) {
                  const items = rawValue as Array<Record<string, unknown>>;
                  return (
                    <div key={fieldKey} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-[var(--foreground)]">{title}</p>
                        <button
                          type="button"
                          onClick={() => {
                            const template = buildArrayObjectTemplate(fieldKey);
                            updateField(fieldKey, [...items, template]);
                          }}
                          className="rounded-md bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-600"
                        >
                          + Tambah Item
                        </button>
                      </div>

                      {items.map((item, itemIndex) => (
                        <div key={`${fieldKey}-${itemIndex}`} className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2">
                          {Object.entries(item).map(([subKey, subValue]) => {
                            const subText = String(subValue ?? "");
                            const useTextarea =
                              subText.length > 100 ||
                              subKey.toLowerCase().includes("desc") ||
                              subKey.toLowerCase().includes("description") ||
                              subKey.toLowerCase().includes("story");
                            return (
                              <div key={subKey}>
                                <label className="mb-1 block text-[11px] text-[var(--foreground-muted)]">{prettifyKey(subKey)}</label>
                                {useTextarea ? (
                                  <textarea
                                    rows={3}
                                    value={subText}
                                    onChange={(e) => {
                                      const next = [...items];
                                      next[itemIndex] = { ...next[itemIndex], [subKey]: e.target.value };
                                      updateField(fieldKey, next);
                                    }}
                                    className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-2 text-sm"
                                  />
                                ) : (
                                  <input
                                    value={subText}
                                    onChange={(e) => {
                                      const next = [...items];
                                      next[itemIndex] = { ...next[itemIndex], [subKey]: e.target.value };
                                      updateField(fieldKey, next);
                                    }}
                                    className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-2 text-sm"
                                  />
                                )}
                              </div>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => {
                              const next = items.filter((_, idx) => idx !== itemIndex);
                              updateField(fieldKey, next);
                            }}
                            className="rounded-md bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                          >
                            Hapus Item
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                }

                const values = rawValue.map((item) => String(item ?? ""));
                return (
                  <div key={fieldKey} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[var(--foreground)]">{prettifyKey(fieldKey)}</p>
                      <button
                        type="button"
                        onClick={() => updateField(fieldKey, [...values, ""])}
                        className="rounded-md bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-600"
                      >
                        + Tambah
                      </button>
                    </div>
                    {values.map((item, index) => (
                      <div key={`${fieldKey}-${index}`} className="flex items-center gap-2">
                        <input
                          value={item}
                          onChange={(e) => {
                            const next = [...values];
                            next[index] = e.target.value;
                            updateField(fieldKey, next);
                          }}
                          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = values.filter((_, idx) => idx !== index);
                            updateField(fieldKey, next);
                          }}
                          className="rounded-md bg-red-500/10 px-2.5 py-2 text-[11px] font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                );
              }

              const value = String(rawValue ?? "");
              const useTextarea =
                value.length > 100 ||
                fieldKey.toLowerCase().includes("desc") ||
                fieldKey.toLowerCase().includes("description") ||
                fieldKey.toLowerCase().includes("story");

              return (
                <div key={fieldKey}>
                  <label className="mb-1 block text-xs text-[var(--foreground-muted)]">{prettifyKey(fieldKey)}</label>
                  {useTextarea ? (
                    <textarea
                      rows={3}
                      value={value}
                      onChange={(e) => updateField(fieldKey, e.target.value)}
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm"
                    />
                  ) : (
                    <input
                      value={value}
                      onChange={(e) => updateField(fieldKey, e.target.value)}
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {error ? <p className="text-xs text-red-400">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Konten"}
          </button>
          <button
            type="button"
            onClick={() => void loadFromApi(activePage)}
            disabled={saving || loading}
            className="rounded-lg bg-[var(--surface-muted)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)] disabled:opacity-50"
          >
            Reload
          </button>
          <button
            type="button"
            onClick={handleUseDefault}
            disabled={saving || loading}
            className="rounded-lg bg-violet-500/20 px-4 py-2 text-sm font-medium text-violet-300 transition-colors hover:bg-violet-500/30 disabled:opacity-50"
          >
            Gunakan Default
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- GamesTab ----
function GamesTab({ games, onRefresh }: { games: Game[]; onRefresh: () => void }) {
  const emptyForm = {
    key: "",
    label: "",
    logo: "",
    banner: "",
    tagline: "",
    description: "",
    services: [] as string[],
    display_order: 0,
    is_hidden: false,
  };
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newServiceInput, setNewServiceInput] = useState("");
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setNewServiceInput("");
    setShowForm(true);
  };
  const openEdit = (g: Game) => {
    setForm({
      key: g.key,
      label: g.label,
      logo: g.logo ?? "",
      banner: g.banner ?? "",
      tagline: g.tagline ?? "",
      description: g.description ?? "",
      services: Array.isArray(g.services) ? g.services : [],
      display_order: g.display_order,
      is_hidden: g.is_hidden,
    });
    setNewServiceInput("");
    setEditingId(g.id);
    setShowForm(true);
  };

  const handleServiceChange = (index: number, value: string) => {
    setForm((current) => {
      const next = [...current.services];
      next[index] = value;
      return { ...current, services: next };
    });
  };

  const handleAddService = () => {
    const value = newServiceInput.trim();
    if (!value) return;
    setForm((current) => ({ ...current, services: [...current.services, value] }));
    setNewServiceInput("");
  };

  const handleRemoveService = (index: number) => {
    setForm((current) => ({
      ...current,
      services: current.services.filter((_, idx) => idx !== index),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/admin/games/${editingId}` : "/api/admin/games";
      const payload = {
        ...form,
        services: form.services.map((service) => service.trim()).filter(Boolean),
      };
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(String(err?.error ?? "Gagal menyimpan game."));
      }
      setShowForm(false);
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menyimpan game.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus game ini? Semua kategori & produk terkait mungkin terpengaruh.")) return;
    await fetch(`/api/admin/games/${id}`, { method: "DELETE" });
    onRefresh();
  };

  const handleToggleHidden = async (id: number, currentStatus: boolean) => {
    await fetch(`/api/admin/games/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_hidden: !currentStatus }),
    });
    onRefresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Manajemen Games</h2>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
          + Tambah Game
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-6 space-y-4">
          <h3 className="font-semibold text-sm text-[var(--foreground)]">{editingId ? "Edit Game" : "Tambah Game Baru"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--foreground-muted)] mb-1">Key (unik, huruf kecil)</label>
              <input required value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value.toLowerCase().replace(/\s+/g, "_") }))}
                placeholder="mlbb" className="w-full bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground-muted)] mb-1">Label (nama tampilan)</label>
              <input required value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="Mobile Legends" className="w-full bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground-muted)] mb-1">Display Order</label>
              <input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                className="w-full bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground-muted)] mb-1">Tagline</label>
              <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                placeholder="Contoh: Primo, explorasi, quest, rawat akun..."
                className="w-full bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="hidden_game"
                checked={form.is_hidden}
                onChange={e => setForm(f => ({ ...f, is_hidden: e.target.checked }))}
                className="w-4 h-4 accent-emerald-500"
              />
              <label htmlFor="hidden_game" className="text-sm text-[var(--foreground)]">Sembunyikan game di website</label>
            </div>
            <div>
              <ImageUpload
                label="Logo"
                value={form.logo}
                onChange={(path) =>
                  setForm((f) => ({
                    ...f,
                    logo: path,
                    // If banner is empty, reuse logo so admin can control the main card image from here.
                    banner: f.banner?.trim() ? f.banner : path,
                  }))
                }
              />
            </div>
            <div>
              <ImageUpload label="Banner Game" value={form.banner} onChange={(path) => setForm((f) => ({ ...f, banner: path }))} />
              <p className="mt-1 text-[11px] text-[var(--foreground-muted)]">Kosongkan banner jika ingin pakai gambar logo sebagai gambar utama kartu game.</p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-[var(--foreground-muted)] mb-1">Deskripsi</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Deskripsi singkat game untuk section Games."
                className="w-full bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-[var(--foreground-muted)] mb-1">Daftar Layanan</label>
              <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <div className="flex gap-2">
                  <input
                    value={newServiceInput}
                    onChange={(e) => setNewServiceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddService();
                      }
                    }}
                    placeholder="Tambah layanan baru"
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
                  >
                    Tambah
                  </button>
                </div>

                {form.services.length > 0 ? (
                  <div className="space-y-2">
                    {form.services.map((service, index) => (
                      <div key={`${index}-${service}`} className="flex items-center gap-2">
                        <input
                          value={service}
                          onChange={(e) => handleServiceChange(index, e.target.value)}
                          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveService(index)}
                          className="rounded-md bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--foreground-muted)]">Belum ada layanan. Tambah dari input di atas.</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {saving ? "Menyimpan..." : editingId ? "Update" : "Simpan"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[var(--foreground)] rounded-lg text-sm transition-colors">
              Batal
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {games.map(g => (
          <div key={g.id} className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3 ${g.is_hidden ? "opacity-60" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {g.banner ? (
              <img src={g.banner} alt={g.label} className="h-24 w-full rounded-lg object-cover border border-[var(--border)]" />
            ) : null}
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {g.logo ? <img src={g.logo} alt={g.label} className="w-10 h-10 object-contain rounded" />
                : <div className="w-10 h-10 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">?</div>}
              <div className="min-w-0">
                <p className="font-semibold text-sm text-[var(--foreground)] truncate flex items-center gap-2">
                  {g.label}
                  {g.is_hidden && <span className="text-[10px] bg-zinc-600/40 text-zinc-200 px-1.5 py-0.5 rounded-full">hidden</span>}
                </p>
                <p className="text-xs text-[var(--foreground-muted)] font-mono">{g.key}</p>
              </div>
            </div>
            {g.tagline ? (
              <p className="text-xs text-[var(--brand)] line-clamp-2">{g.tagline}</p>
            ) : null}
            {g.description ? (
              <p className="text-xs text-[var(--foreground-muted)] line-clamp-3">{g.description}</p>
            ) : null}
            {Array.isArray(g.services) && g.services.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {g.services.slice(0, 4).map((service) => (
                  <span key={`${g.id}-${service}`} className="text-[10px] bg-[var(--surface-muted)] border border-[var(--border)] px-2 py-0.5 rounded-full text-[var(--foreground-muted)]">
                    {service}
                  </span>
                ))}
                {g.services.length > 4 ? (
                  <span className="text-[10px] text-[var(--foreground-muted)]">+{g.services.length - 4} lagi</span>
                ) : null}
              </div>
            ) : null}
            <div className="text-xs text-[var(--foreground-muted)]">Order: {g.display_order}</div>
            <div className="flex gap-2 mt-auto">
              <button onClick={() => openEdit(g)}
                className="flex-1 text-xs py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors">Edit</button>
              <button onClick={() => handleToggleHidden(g.id, g.is_hidden)}
                className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${g.is_hidden ? "bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300" : "bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300"}`}>
                {g.is_hidden ? "Tampilkan" : "Sembunyikan"}
              </button>
              <button onClick={() => handleDelete(g.id)}
                className="flex-1 text-xs py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">Hapus</button>
            </div>
          </div>
        ))}
        {games.length === 0 && (
          <p className="col-span-full text-center text-[var(--foreground-muted)] text-sm py-8">
            Belum ada game. Klik &quot;Tambah Game&quot; untuk memulai.
          </p>
        )}
      </div>
    </div>
  );
}


