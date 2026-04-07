"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { useLocale, type Locale } from "@/Components/LocaleProvider";
import WhatsAppIcon from "@/Components/WhatsAppIcon";

const copy: Record<
  Locale,
  {
    label: string;
    title: string;
    desc: string;
    chat: string;
  }
> = {
  id: {
    label: "Ready To Start",
    title: "Butuh Bantuan Memilih Paket?",
    desc: "Hubungi admin kapan saja untuk konsultasi cepat sebelum melakukan order.",
    chat: "Chat",
  },
  en: {
    label: "Ready To Start",
    title: "Need Help Choosing a Package?",
    desc: "Contact admin anytime for a quick consultation before placing an order.",
    chat: "Chat",
  },
  my: {
    label: "Sedia Bermula",
    title: "Perlu Bantuan Pilih Pakej?",
    desc: "Hubungi admin bila-bila masa untuk konsultasi pantas sebelum membuat pesanan.",
    chat: "Chat",
  },
};

type AdminContact = {
  key: string;
  label: string;
  number: string;
};

export default function CTASection() {
  const { locale } = useLocale();
  const text = copy[locale];
  const [admins, setAdmins] = useState<AdminContact[]>(siteConfig.adminWhatsAppNumbers);

  useEffect(() => {
    const fetchAdminList = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) return;
        const data = await response.json();

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
        // fallback to config values
      }
    };

    fetchAdminList();
  }, []);

  const [admin1, admin2] = admins;

  const buildWALink = (number: string, label: string) => {
    const message = encodeURIComponent(`Halo ${label}, saya ingin tanya tentang layanan Ruan Joki.`);
    return `https://wa.me/${number}?text=${message}`;
  };

  return (
    <section id="cta" className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-soft)] sm:p-10"
          style={{ backgroundColor: "var(--surface-muted)" }}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-80px] top-[-70px] h-48 w-48 rounded-full bg-[var(--brand-soft)] blur-3xl" />
            <div className="absolute bottom-[-80px] right-[-70px] h-48 w-48 rounded-full bg-[var(--brand-soft)] blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{text.label}</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">{text.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">{text.desc}</p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              {admin1 && (
                <a
                  href={buildWALink(admin1.number, admin1.label)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--whatsapp)] px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.01] hover:bg-[#1fae53]"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  {text.chat} {admin1.label}
                </a>
              )}
              {admin2 && (
                <a
                  href={buildWALink(admin2.number, admin2.label)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--whatsapp)] px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.01] hover:bg-[#1fae53]"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  {text.chat} {admin2.label}
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
