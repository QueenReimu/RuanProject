"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, Menu, Moon, Search, Sun, X } from "lucide-react";
import { useLocale, type Locale } from "@/Components/LocaleProvider";
import { useSiteIdentity } from "@/Components/SiteIdentityProvider";
import { useTheme } from "@/Components/ThemeProvider";

type SearchResult = {
  title: string;
  price: string;
  gameName: string;
  categoryName: string;
  gameKey: string;
  categoryKey: string;
};

const copy: Record<
  Locale,
  {
    brandTagline: string;
    navPricing: string;
    navOrder: string;
    navGame: string;
    navAbout: string;
    chooseLang: string;
    contactAdmin: string;
    searchPlaceholder: string;
    clearSearch: string;
    noResult: string;
    selectResult: string;
    toggleTheme: string;
    openMenu: string;
  }
> = {
  id: {
    brandTagline: "Layanan Profesional",
    navPricing: "Harga",
    navOrder: "Cara Order",
    navGame: "Game",
    navAbout: "Tentang",
    chooseLang: "Pilih Bahasa",
    contactAdmin: "Hubungi Admin",
    searchPlaceholder: "Cari produk atau game",
    clearSearch: "Hapus pencarian",
    noResult: "Produk tidak ditemukan",
    selectResult: "Pilih untuk langsung ke katalog",
    toggleTheme: "Ganti tema",
    openMenu: "Buka menu",
  },
  en: {
    brandTagline: "Professional Service",
    navPricing: "Pricing",
    navOrder: "How to Order",
    navGame: "Games",
    navAbout: "About",
    chooseLang: "Choose language",
    contactAdmin: "Contact Admin",
    searchPlaceholder: "Search product or game",
    clearSearch: "Clear search",
    noResult: "No product found",
    selectResult: "Click to open catalog",
    toggleTheme: "Toggle theme",
    openMenu: "Open menu",
  },
  my: {
    brandTagline: "Perkhidmatan Profesional",
    navPricing: "Harga",
    navOrder: "Cara Pesan",
    navGame: "Permainan",
    navAbout: "Tentang",
    chooseLang: "Pilih Bahasa",
    contactAdmin: "Hubungi Admin",
    searchPlaceholder: "Cari produk atau permainan",
    clearSearch: "Padam carian",
    noResult: "Produk tidak dijumpai",
    selectResult: "Klik untuk terus ke katalog",
    toggleTheme: "Tukar tema",
    openMenu: "Buka menu",
  },
};

const languageList: Array<{ code: Locale; label: string; short: string }> = [
  { code: "id", label: "Bahasa Indonesia", short: "ID" },
  { code: "en", label: "English", short: "EN" },
  { code: "my", label: "Bahasa Melayu", short: "MY" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { locale, setLocale } = useLocale();
  const { identity, setIdentity } = useSiteIdentity();
  const { resolvedTheme, setTheme } = useTheme();

  const text = copy[locale];
  const isDark = resolvedTheme === "dark";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState<SearchResult[]>([]);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const publicSettings = (data?.siteSettings ?? {}) as {
          siteLogo?: string;
          siteTitle?: string;
          siteDescription?: string;
        };

        const nextLogo = String(publicSettings.siteLogo ?? "").trim();
        const nextTitle = String(publicSettings.siteTitle ?? "").trim();
        const nextDescription = String(publicSettings.siteDescription ?? "").trim();

        if (nextLogo || nextTitle || nextDescription) {
          setIdentity({
            logo: nextLogo || identity.logo,
            title: nextTitle || identity.title,
            description: nextDescription || identity.description,
          });
        }

        const results: SearchResult[] = [];

        Object.entries(data.products || {}).forEach(([gameKey, gameData]: [string, unknown]) => {
          const gameMeta = data.gameMeta?.[gameKey];
          Object.entries(gameData as Record<string, unknown>).forEach(([categoryKey, categoryData]) => {
            const category = categoryData as { label: string; products: Array<{ title: string; price: string }> };
            category.products?.forEach((product) => {
              results.push({
                title: product.title,
                price: product.price,
                gameName: gameMeta?.label || gameKey,
                categoryName: category.label,
                gameKey,
                categoryKey,
              });
            });
          });
        });

        setAllProducts(results);
      } catch {
        setAllProducts([]);
      }
    };

    fetchProducts();
  }, [identity.description, identity.logo, identity.title, setIdentity]);

  useEffect(() => {
    const title = identity.title.trim();
    if (title) {
      document.title = title;
    }

    const description = identity.description.trim();
    if (!description) return;

    const currentMeta = document.querySelector('meta[name="description"]');
    if (currentMeta) {
      currentMeta.setAttribute("content", description);
      return;
    }

    const meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute("content", description);
    document.head.appendChild(meta);
  }, [identity.description, identity.title]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return allProducts
      .filter((item) => [item.title, item.gameName, item.categoryName].some((field) => field.toLowerCase().includes(query)))
      .slice(0, 6);
  }, [allProducts, searchQuery]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedLanguage = useMemo(
    () => languageList.find((language) => language.code === locale) || languageList[0],
    [locale]
  );
  const displayTitle = identity.title.trim() || " ";
  const displayLogo = identity.logo.trim();

  const navItems = useMemo(
    () => [
      { label: text.navPricing, href: "/#pricing", isPage: false },
      { label: text.navOrder, href: "/cara-order", isPage: true },
      { label: text.navGame, href: "/games", isPage: true },
      { label: text.navAbout, href: "/tentang", isPage: true },
    ],
    [text]
  );

  const scrollToAnchor = (href: string) => {
    const [, hashPart] = href.split("#");
    if (!hashPart) return;
    const selector = `#${hashPart}`;
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSectionLink = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.includes("#")) return;

    const [pathPart] = href.split("#");
    const onHome = pathname === "/";
    const linksToHome = pathPart === "/" || pathPart === "";

    if (onHome && linksToHome) {
      event.preventDefault();
      scrollToAnchor(href);
      setMobileOpen(false);
    }
  };

  const openSearchSelection = (result: SearchResult) => {
    const params = new URLSearchParams();
    params.set("game", result.gameKey);
    params.set("category", result.categoryKey);
    const queryString = params.toString();
    const targetUrl = `/${queryString ? `?${queryString}` : ""}#pricing`;

    if (pathname === "/") {
      window.history.replaceState({}, "", targetUrl);
      window.dispatchEvent(
        new CustomEvent("pricing:focus-selection", {
          detail: { gameKey: result.gameKey, categoryKey: result.categoryKey },
        })
      );
      document.querySelector("#pricing")?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.assign(targetUrl);
    }

    setSearchFocused(false);
    setSearchQuery("");
    setMobileOpen(false);
  };

  const handleToggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b border-transparent transition-all duration-200 ${
        scrolled ? "shadow-[var(--shadow-card)]" : ""
      }`}
      style={{ backgroundColor: "var(--surface)" }}
    >
      <nav className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="shrink-0"
          onClick={(event) => {
            if (pathname === "/") {
              event.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
            setMobileOpen(false);
          }}
        >
          <div className="flex items-center gap-2.5">
            <img src={displayLogo} alt={displayTitle} className="h-9 w-9 rounded-xl object-cover" />
            <div className="hidden sm:block min-w-[120px]">
              <p className="text-sm font-semibold text-[var(--foreground)]">{displayTitle}</p>
              <p className="text-xs text-[var(--foreground-muted)]">{text.brandTagline}</p>
            </div>
          </div>
        </Link>

        <div ref={searchRef} className="relative mx-auto hidden max-w-md flex-1 lg:block">
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors ${
              searchFocused ? "border-[var(--brand)]" : "border-[var(--border)]"
            }`}
            style={{ backgroundColor: "var(--surface-muted)" }}
          >
            <Search className="h-4 w-4 text-[var(--foreground-muted)]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder={text.searchPlaceholder}
              className="w-full bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-md p-0.5 text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                aria-label={text.clearSearch}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {searchFocused && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.16 }}
                className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-[var(--border)] shadow-[var(--shadow-soft)]"
                style={{ backgroundColor: "var(--surface)" }}
              >
                {searchResults.length === 0 ? (
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-[var(--foreground)]">{text.noResult}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">{text.selectResult}</p>
                  </div>
                ) : (
                  searchResults.map((result, index) => (
                    <button
                      key={`${result.title}-${index}`}
                      type="button"
                      onClick={() => openSearchSelection(result)}
                      className="flex w-full items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3 text-left last:border-b-0"
                      style={{ backgroundColor: "transparent" }}
                    >
                      <span>
                        <span className="block text-sm font-semibold text-[var(--foreground)]">{result.title}</span>
                        <span className="block text-xs text-[var(--foreground-muted)]">
                          {result.gameName} - {result.categoryName}
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-[var(--brand)]">{result.price}</span>
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const isActive = item.isPage && pathname === item.href;
            const baseStyle = "rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-200";
            const activeStyle = isActive
              ? "bg-[var(--brand-soft)] text-[var(--brand)]"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]";

            if (item.isPage) {
              return (
                <Link key={item.href} href={item.href} className={`${baseStyle} ${activeStyle}`} onClick={() => setMobileOpen(false)}>
                  {item.label}
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${baseStyle} ${activeStyle}`}
                onClick={(event) => handleSectionLink(event, item.href)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleTheme}
            className="rounded-xl border border-[var(--border)] p-2 text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
            aria-label={text.toggleTheme}
            style={{ backgroundColor: "var(--surface)" }}
          >
            <Sun className="hidden h-4 w-4 dark:block" />
            <Moon className="h-4 w-4 dark:hidden" />
          </button>

          <div ref={langRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setLangOpen((open) => !open)}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-2.5 py-2 text-xs font-semibold text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
              style={{ backgroundColor: "var(--surface)" }}
              aria-label={text.chooseLang}
            >
              <Globe className="h-4 w-4" />
              {selectedLanguage.short}
            </button>

            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-[var(--border)] p-1 shadow-[var(--shadow-soft)]"
                  style={{ backgroundColor: "var(--surface)" }}
                >
                  {languageList.map((language) => (
                    <button
                      key={language.code}
                      type="button"
                      onClick={() => {
                        setLocale(language.code);
                        setLangOpen(false);
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                        language.code === locale
                          ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand)]"
                          : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {language.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/#cta"
            onClick={(event) => handleSectionLink(event, "/#cta")}
            className="hidden rounded-xl px-3.5 py-2 text-sm font-semibold text-white transition-all hover:brightness-105 sm:inline-flex"
            style={{
              backgroundColor: "var(--brand)",
              boxShadow: "0 8px 20px -12px rgba(124,58,237,0.95)",
            }}
          >
            {text.contactAdmin}
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-xl border border-[var(--border)] p-2 text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)] lg:hidden"
            style={{ backgroundColor: "var(--surface)" }}
            aria-expanded={mobileOpen}
            aria-label={text.openMenu}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[var(--border)] lg:hidden"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <div className="mx-auto max-w-7xl space-y-2 px-4 py-4 sm:px-6">
              <div className="rounded-xl border border-[var(--border)] px-3 py-2" style={{ backgroundColor: "var(--surface-muted)" }}>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-[var(--foreground-muted)]" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={text.searchPlaceholder}
                    className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-muted)]"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {searchResults.slice(0, 3).map((result, index) => (
                      <button
                        key={`${result.title}-mobile-${index}`}
                        type="button"
                        onClick={() => openSearchSelection(result)}
                        className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-[var(--foreground-muted)]"
                        style={{ backgroundColor: "var(--surface)" }}
                      >
                        <span className="block font-semibold text-[var(--foreground)]">{result.title}</span>
                        <span className="block">
                          {result.gameName} - {result.categoryName}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {navItems.map((item) => {
                const isActive = item.isPage && pathname === item.href;
                const classes = isActive
                  ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]";

                if (item.isPage) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block rounded-xl px-4 py-3 text-sm font-semibold ${classes}`}
                    >
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(event) => {
                      handleSectionLink(event, item.href);
                      setMobileOpen(false);
                    }}
                    className={`block rounded-xl px-4 py-3 text-sm font-semibold ${classes}`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="grid grid-cols-2 gap-2">
                {languageList.map((language) => (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => setLocale(language.code)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                      locale === language.code
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                        : "border-[var(--border)] text-[var(--foreground-muted)]"
                    }`}
                  >
                    {language.short}
                  </button>
                ))}
              </div>

              <Link
                href="/#cta"
                onClick={(event) => {
                  handleSectionLink(event, "/#cta");
                  setMobileOpen(false);
                }}
                className="mt-1 block rounded-xl px-4 py-3 text-center text-sm font-semibold text-white"
                style={{
                  backgroundColor: "var(--brand)",
                  boxShadow: "0 8px 20px -12px rgba(124,58,237,0.95)",
                }}
              >
                {text.contactAdmin}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

