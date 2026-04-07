import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/Components/ThemeProvider";
import { LocaleProvider } from "@/Components/LocaleProvider";
import AnalyticsTracker from "@/Components/AnalyticsTracker";
import { siteConfig } from "@/config/site";
import { supabaseAdmin } from "@/lib/supabase";

const DEFAULT_ICON = "/4V2.png";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isMissingTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  return maybeCode === "42P01" || maybeCode === "PGRST205";
}

async function readSiteIdentity() {
  const fallback = {
    title: siteConfig.name,
    description: siteConfig.description,
    logo: DEFAULT_ICON,
  };

  if (!supabaseAdmin) return fallback;

  try {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("key, value")
      .in("key", ["site_title", "site_description", "site_logo"]);

    if (error) {
      if (isMissingTable(error)) return fallback;
      throw error;
    }

    const settingMap = ((data ?? []) as Array<{ key: string; value: string | null }>).reduce<Record<string, string>>(
      (acc, row) => {
        acc[row.key] = String(row.value ?? "").trim();
        return acc;
      },
      {}
    );

    return {
      title: settingMap.site_title || fallback.title,
      description: settingMap.site_description || fallback.description,
      logo: settingMap.site_logo || fallback.logo,
    };
  } catch {
    return fallback;
  }
}

function resolveSiteOrigin() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  const withProtocol = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return "http://localhost:3000";
  }
}

function resolveAssetUrl(assetPath: string, origin: string) {
  const normalized = String(assetPath ?? "").trim();
  if (!normalized) return "";

  try {
    return new URL(normalized, origin).toString();
  } catch {
    return "";
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const identity = await readSiteIdentity();
  const origin = resolveSiteOrigin();
  const absoluteLogo = resolveAssetUrl(identity.logo, origin);

  return {
    metadataBase: new URL(origin),
    title: identity.title,
    description: identity.description,
    generator: "Ruan Joki Games",
    icons: {
      icon: absoluteLogo || identity.logo,
      apple: absoluteLogo || identity.logo,
    },
    openGraph: {
      title: identity.title,
      description: identity.description,
      type: "website",
      url: origin,
      siteName: identity.title,
      images: absoluteLogo
        ? [
            {
              url: absoluteLogo,
              alt: identity.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: absoluteLogo ? "summary_large_image" : "summary",
      title: identity.title,
      description: identity.description,
      images: absoluteLogo ? [absoluteLogo] : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&display=swap"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <LocaleProvider>
            <AnalyticsTracker />
            {children}
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
