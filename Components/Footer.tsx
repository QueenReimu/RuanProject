"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Instagram } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useLocale, type Locale } from "@/Components/LocaleProvider";
import { useSiteIdentity } from "@/Components/SiteIdentityProvider";
import WhatsAppIcon from "@/Components/WhatsAppIcon";

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.32 4.37a18.15 18.15 0 0 0-4.53-1.4.07.07 0 0 0-.08.04l-.2.4c-1.73-.26-3.29-.26-5.03 0l-.2-.4a.08.08 0 0 0-.08-.04 18.08 18.08 0 0 0-4.53 1.4.07.07 0 0 0-.03.03C2.74 8.65 2.22 12.8 2.48 16.9a.08.08 0 0 0 .03.06 18.37 18.37 0 0 0 5.56 2.83.08.08 0 0 0 .09-.03l1.11-1.53a.08.08 0 0 0-.04-.12 12.22 12.22 0 0 1-1.69-.8.08.08 0 0 1-.01-.14c.11-.08.22-.16.32-.25a.08.08 0 0 1 .08-.01c3.55 1.62 7.4 1.62 10.9 0a.08.08 0 0 1 .09.01c.1.09.21.17.32.25a.08.08 0 0 1-.02.14c-.54.31-1.11.58-1.69.8a.08.08 0 0 0-.04.12l1.12 1.53a.08.08 0 0 0 .09.03 18.3 18.3 0 0 0 5.55-2.83.08.08 0 0 0 .03-.06c.31-4.74-.52-8.86-2.19-12.52a.08.08 0 0 0-.03-.03ZM9.03 14.42c-1.06 0-1.93-.97-1.93-2.16 0-1.2.86-2.17 1.93-2.17 1.08 0 1.94.98 1.93 2.17 0 1.19-.86 2.16-1.93 2.16Zm5.94 0c-1.06 0-1.93-.97-1.93-2.16 0-1.2.85-2.17 1.93-2.17 1.08 0 1.94.98 1.93 2.17 0 1.19-.85 2.16-1.93 2.16Z" />
    </svg>
  );
}

const copy: Record<
  Locale,
  {
    service: string;
    company: string;
    catalog: string;
    howToOrder: string;
    games: string;
    faq: string;
    about: string;
    contact: string;
    hoursTitle: string;
    policy: string;
    hours: string;
    chat: string;
    closing: string;
    description: string;
  }
> = {
  id: {
    service: "Layanan",
    company: "Perusahaan",
    catalog: "Katalog Harga",
    howToOrder: "Cara Order",
    games: "Game",
    faq: "FAQ",
    about: "Tentang Kami",
    contact: "Kontak Admin",
    hoursTitle: "Jam Operasional",
    policy: "Kebijakan Layanan",
    hours: "Jam Operasional",
    chat: "Chat Admin",
    closing: "Built for a faster, cleaner ordering experience.",
    description: "Layanan joki game dengan proses profesional, harga transparan, dan dukungan admin responsif.",
  },
  en: {
    service: "Services",
    company: "Company",
    catalog: "Pricing Catalog",
    howToOrder: "How to Order",
    games: "Games",
    faq: "FAQ",
    about: "About Us",
    contact: "Contact Admin",
    hoursTitle: "Operating Hours",
    policy: "Service Policy",
    hours: "Operating Hours",
    chat: "Chat Admin",
    closing: "Built for a faster, cleaner ordering experience.",
    description: "Gaming service with professional process, transparent pricing, and responsive admin support.",
  },
  my: {
    service: "Servis",
    company: "Syarikat",
    catalog: "Katalog Harga",
    howToOrder: "Cara Pesan",
    games: "Permainan",
    faq: "FAQ",
    about: "Tentang Kami",
    contact: "Hubungi Admin",
    hoursTitle: "Waktu Operasi",
    policy: "Polisi Servis",
    hours: "Waktu Operasi",
    chat: "Chat Admin",
    closing: "Built for a faster, cleaner ordering experience.",
    description: "Servis permainan dengan proses profesional, harga telus, dan sokongan admin yang responsif.",
  },
};

type AdminContact = {
  key: string;
  label: string;
  number: string;
};

export default function Footer() {
  const { locale } = useLocale();
  const { identity, setIdentity } = useSiteIdentity();
  const text = copy[locale];

  const { name, copyright, socialLinks, operationalHours, adminWhatsAppNumbers } = siteConfig;
  const [admins, setAdmins] = useState<AdminContact[]>(adminWhatsAppNumbers);
  const mainAdmin = admins[0];
  const discordLink = (socialLinks as { discord?: string }).discord;

  useEffect(() => {
    const fetchAdminList = async () => {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
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

        const adminEntries = Object.entries(
          (data?.adminData ?? {}) as Record<string, { name?: string; number?: string }>
        );

        if (adminEntries.length === 0) return;

        const normalized = adminEntries
          .map(([key, admin]) => ({
            key,
            label: String(admin?.name ?? key).trim() || key,
            number: String(admin?.number ?? "").trim(),
          }))
          .filter((admin) => Boolean(admin.number));

        if (normalized.length > 0) {
          setAdmins(normalized);
        }
      } catch {
        // use fallback config
      }
    };

    fetchAdminList();
  }, [identity.description, identity.logo, identity.title, name, setIdentity]);

  const footerSections = [
    {
      title: text.service,
      links: [
        { label: text.catalog, href: "/#pricing" },
        { label: text.howToOrder, href: "/cara-order" },
        { label: text.games, href: "/games" },
        { label: text.faq, href: "/#faq" },
      ],
    },
    {
      title: text.company,
      links: [
        { label: text.about, href: "/tentang" },
        { label: text.contact, href: "/#cta" },
        { label: text.hours, href: "/#footer-hours" },
        { label: text.policy, href: "/tentang" },
      ],
    },
  ];
  const footerDescription = identity.description.trim() || text.description;
  const displayTitle = identity.title.trim() || name;
  const displayLogo = identity.logo.trim();

  return (
    <footer className="border-t border-[var(--border)]" style={{ backgroundColor: "var(--surface)" }}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-4">
          <div className="space-y-5 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <img src={displayLogo} alt={displayTitle} className="h-10 w-10 rounded-xl object-cover" />
              <span className="text-base font-semibold text-[var(--foreground)]">{displayTitle}</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-[var(--foreground-muted)]">{footerDescription}</p>

            <div className="flex items-center gap-2.5">
              <a
                href={mainAdmin ? `https://wa.me/${mainAdmin.number}` : socialLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--whatsapp)] text-white transition-transform hover:-translate-y-0.5 hover:bg-[#1fae53]"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>

              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white transition-transform hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, var(--instagram-start), var(--instagram-mid), var(--instagram-end))" }}
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>

              {discordLink && (
                <a
                  href={discordLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(88,101,242,0.16)] text-[var(--discord)] transition-transform hover:-translate-y-0.5"
                  aria-label="Discord"
                >
                  <DiscordIcon className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">{section.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--brand)]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div
            id="footer-hours"
            className="rounded-2xl border border-[var(--border)] p-5"
            style={{ backgroundColor: "var(--surface-muted)" }}
          >
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{text.hoursTitle}</h3>
            <p className="mt-3 text-sm text-[var(--foreground-muted)]">{operationalHours.days}</p>
            <p className="text-sm font-semibold text-[var(--foreground)]">{operationalHours.hours}</p>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">{operationalHours.note}</p>

            {mainAdmin && (
              <a
                href={`https://wa.me/${mainAdmin.number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--whatsapp)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1fae53]"
              >
                <WhatsAppIcon className="h-4 w-4" />
                {text.chat}
              </a>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-[var(--border)] pt-5 text-xs text-[var(--foreground-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>{copyright}</p>
          <p>{text.closing}</p>
        </div>
      </div>
    </footer>
  );
}
