import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/Components/ThemeProvider";
import { LocaleProvider } from "@/Components/LocaleProvider";
import { SiteIdentityProvider } from "@/Components/SiteIdentityProvider";
import AnalyticsTracker from "@/Components/AnalyticsTracker";
import { readSiteIdentity } from "@/lib/site-identity";
export const dynamic = "force-dynamic";
export const revalidate = 0;
const GOOGLE_SITE_VERIFICATION = "zd0RZ-_RnTmeMFTmrxGObnaUeCOpQd8lrpWPXS5zhc8";

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

function withVersionParam(url: string, versionToken?: string) {
  if (!url || !versionToken) return url;

  try {
    const nextUrl = new URL(url);
    nextUrl.searchParams.set("v", versionToken);
    return nextUrl.toString();
  } catch {
    return url;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const identity = await readSiteIdentity();
  const origin = resolveSiteOrigin();
  const absoluteLogo = resolveAssetUrl(identity.logo, origin);
  const versionedLogo = withVersionParam(absoluteLogo, identity.versionToken);

  return {
    metadataBase: new URL(origin),
    alternates: {
      canonical: origin,
    },
    title: identity.title,
    description: identity.description,
    generator: "Ruan Joki Games",
    verification: {
      google: GOOGLE_SITE_VERIFICATION,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    icons: {
      icon: versionedLogo || absoluteLogo || identity.logo,
      apple: versionedLogo || absoluteLogo || identity.logo,
    },
    openGraph: {
      title: identity.title,
      description: identity.description,
      type: "website",
      url: origin,
      siteName: identity.title,
      images: versionedLogo
        ? [
            {
              url: versionedLogo,
              alt: identity.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: versionedLogo ? "summary_large_image" : "summary",
      title: identity.title,
      description: identity.description,
      images: versionedLogo ? [versionedLogo] : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await readSiteIdentity();

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
          <SiteIdentityProvider initialIdentity={identity}>
            <LocaleProvider>
              <AnalyticsTracker />
              {children}
            </LocaleProvider>
          </SiteIdentityProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
