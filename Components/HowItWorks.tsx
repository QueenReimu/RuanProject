"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock3, Lock, MessageSquare, Shield, Zap } from "lucide-react";
import { useLocale, type Locale } from "@/Components/LocaleProvider";

const copy: Record<
  Locale,
  {
    label: string;
    title: string;
    desc: string;
    steps: Array<{ title: string; description: string }>;
    badges: Array<{ title: string; text: string }>;
  }
> = {
  id: {
    label: "How It Works",
    title: "Proses Order yang Ringkas",
    desc: "Alur dirancang sederhana agar kamu bisa order cepat tanpa langkah yang membingungkan.",
    steps: [
      { title: "Pilih Layanan", description: "Buka katalog, pilih game dan paket yang ingin kamu order." },
      { title: "Konfirmasi Admin", description: "Klik beli, cek ringkasan pesanan, lalu pilih admin yang melayani." },
      { title: "Proses Pengerjaan", description: "Admin mulai mengerjakan order dan memberi update progres berkala." },
      { title: "Selesai dan Review", description: "Pesanan dinyatakan selesai setelah kamu cek hasilnya." },
    ],
    badges: [
      { title: "Data Aman", text: "Penanganan akun secara privat." },
      { title: "Estimasi Jelas", text: "Timeline diinformasikan di awal." },
      { title: "Tanpa Bot", text: "Semua proses dikerjakan manual." },
    ],
  },
  en: {
    label: "How It Works",
    title: "Simple Order Flow",
    desc: "The process is designed so you can place an order quickly without confusion.",
    steps: [
      { title: "Choose Service", description: "Open catalog, choose game and package you need." },
      { title: "Admin Confirmation", description: "Click buy, review details, then choose your admin." },
      { title: "Work in Progress", description: "Admin starts the work and sends regular progress updates." },
      { title: "Done and Review", description: "Order is marked done after you verify the result." },
    ],
    badges: [
      { title: "Secure Data", text: "Private handling for account access." },
      { title: "Clear Estimate", text: "Timeline is shared from the beginning." },
      { title: "No Bot", text: "Everything is done manually." },
    ],
  },
  my: {
    label: "Cara Kerja",
    title: "Aliran Pesanan Ringkas",
    desc: "Proses direka supaya anda boleh membuat pesanan dengan cepat tanpa kekeliruan.",
    steps: [
      { title: "Pilih Servis", description: "Buka katalog, pilih permainan dan pakej yang diperlukan." },
      { title: "Pengesahan Admin", description: "Klik beli, semak butiran, kemudian pilih admin." },
      { title: "Proses Berjalan", description: "Admin mula kerja dan beri kemas kini progres secara berkala." },
      { title: "Selesai dan Semak", description: "Pesanan selesai selepas anda semak hasil." },
    ],
    badges: [
      { title: "Data Selamat", text: "Pengendalian akaun secara peribadi." },
      { title: "Anggaran Jelas", text: "Timeline diberi dari awal." },
      { title: "Tanpa Bot", text: "Semua proses dilakukan secara manual." },
    ],
  },
};

export default function HowItWorks() {
  const { locale } = useLocale();
  const text = copy[locale];

  const icons = [MessageSquare, Shield, Zap, CheckCircle2];
  const badgeIcons = [Lock, Clock3, Shield];

  return (
    <section id="how-it-works" className="px-4 py-16 sm:px-6 sm:py-20" style={{ backgroundColor: "var(--surface)" }}>
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.35 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{text.label}</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">{text.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">{text.desc}</p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {text.steps.map((step, index) => {
            const Icon = icons[index] || MessageSquare;
            return (
              <motion.article
                key={step.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="rounded-3xl border border-[var(--border)] p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-soft)]">
                  <Icon className="h-5 w-5 text-[var(--brand)]" />
                </div>
                <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">{step.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">{step.description}</p>
              </motion.article>
            );
          })}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {text.badges.map((badge, index) => {
            const Icon = badgeIcons[index] || Shield;
            return (
              <div
                key={badge.title}
                className="rounded-2xl border border-[var(--border)] p-4 text-center"
                style={{ backgroundColor: "var(--surface-muted)" }}
              >
                <Icon className="mx-auto h-4 w-4 text-[var(--brand)]" />
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{badge.title}</p>
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">{badge.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
