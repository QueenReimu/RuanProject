"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ChevronDown, Clock3, MessageCircle, Shield, ShoppingCart, UserCheck } from "lucide-react";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import { useLocale, type Locale } from "@/Components/LocaleProvider";

type StepItem = { title: string; description: string };

const copy: Record<
  Locale,
  {
    label: string;
    title: string;
    desc: string;
    guaranteeLabel: string;
    stepLabel: string;
    stepTitle: string;
    faqLabel: string;
    faqTitle: string;
    ctaTitle: string;
    ctaDesc: string;
    ctaButton: string;
    guarantees: Array<{ title: string; description: string }>;
    steps: StepItem[];
    faqs: Array<{ q: string; a: string }>;
  }
> = {
  id: {
    label: "Order Guide",
    title: "Cara Order yang Cepat dan Jelas",
    desc: "Semua dirancang agar kamu bisa memesan layanan hanya dalam beberapa langkah sederhana.",
    guaranteeLabel: "Highlights",
    stepLabel: "Step By Step",
    stepTitle: "Alur Pemesanan",
    faqLabel: "FAQ",
    faqTitle: "Pertanyaan yang Sering Muncul",
    ctaTitle: "Siap Mulai Order?",
    ctaDesc: "Buka katalog sekarang dan konsultasi langsung dengan admin.",
    ctaButton: "Lihat Katalog",
    guarantees: [
      { title: "Keamanan Akun", description: "Proses manual dan data digunakan hanya untuk pengerjaan." },
      { title: "Estimasi Jelas", description: "Timeline disampaikan di awal saat konfirmasi order." },
      { title: "Dukungan Aktif", description: "Admin siap membantu selama jam operasional." },
    ],
    steps: [
      { title: "Pilih Produk", description: "Buka katalog, pilih game, lalu pilih paket yang paling sesuai kebutuhan." },
      { title: "Konfirmasi Pesanan", description: "Klik tombol beli untuk cek detail pesanan dan pilih admin yang melayani." },
      { title: "Chat Admin", description: "WhatsApp terbuka otomatis dengan ringkasan order agar proses lebih cepat." },
      { title: "Pengerjaan Selesai", description: "Admin menyelesaikan pesanan dan memberi update sampai selesai." },
    ],
    faqs: [
      {
        q: "Apakah saya perlu membuat akun dulu?",
        a: "Tidak perlu. Kamu bisa langsung pilih paket lalu lanjut ke WhatsApp admin.",
      },
      {
        q: "Berapa lama admin merespons?",
        a: "Biasanya dalam hitungan menit saat jam operasional aktif.",
      },
      {
        q: "Apakah saya bisa konsultasi sebelum order?",
        a: "Bisa, konsultasi awal sangat disarankan agar paket yang dipilih lebih tepat.",
      },
      {
        q: "Bagaimana jika ada revisi saat proses?",
        a: "Sampaikan ke admin agar ditangani segera selama proses pengerjaan berjalan.",
      },
    ],
  },
  en: {
    label: "Order Guide",
    title: "Fast and Clear Ordering Flow",
    desc: "Everything is designed so you can place an order in just a few simple steps.",
    guaranteeLabel: "Highlights",
    stepLabel: "Step By Step",
    stepTitle: "Order Flow",
    faqLabel: "FAQ",
    faqTitle: "Frequently Asked Questions",
    ctaTitle: "Ready to Order?",
    ctaDesc: "Open the catalog now and consult with admin directly.",
    ctaButton: "Open Catalog",
    guarantees: [
      { title: "Account Security", description: "Manual process and data is only used during service." },
      { title: "Clear Estimate", description: "Timeline is shared at the start of confirmation." },
      { title: "Active Support", description: "Admins are available during operating hours." },
    ],
    steps: [
      { title: "Choose Product", description: "Open the catalog, select game, and pick the package you need." },
      { title: "Confirm Order", description: "Click buy to review order details and choose an admin." },
      { title: "Chat Admin", description: "WhatsApp opens automatically with order summary for faster process." },
      { title: "Order Completed", description: "Admin completes the order and provides progress updates." },
    ],
    faqs: [
      { q: "Do I need to register first?", a: "No. You can directly choose a package and continue via WhatsApp." },
      { q: "How fast is admin response?", a: "Usually within minutes during operating hours." },
      { q: "Can I consult before ordering?", a: "Yes, pre-order consultation is recommended to choose the right package." },
      { q: "What if I need revision during process?", a: "Tell the admin and it will be handled during the ongoing process." },
    ],
  },
  my: {
    label: "Panduan Pesanan",
    title: "Cara Pesan yang Cepat dan Jelas",
    desc: "Semua direka supaya anda boleh membuat pesanan hanya dalam beberapa langkah mudah.",
    guaranteeLabel: "Sorotan",
    stepLabel: "Langkah Demi Langkah",
    stepTitle: "Aliran Pesanan",
    faqLabel: "FAQ",
    faqTitle: "Soalan Lazim",
    ctaTitle: "Sedia Untuk Pesan?",
    ctaDesc: "Buka katalog sekarang dan berbincang terus dengan admin.",
    ctaButton: "Lihat Katalog",
    guarantees: [
      { title: "Keselamatan Akaun", description: "Proses manual dan data digunakan hanya semasa servis." },
      { title: "Anggaran Jelas", description: "Timeline diberikan pada awal pengesahan." },
      { title: "Sokongan Aktif", description: "Admin sedia membantu semasa waktu operasi." },
    ],
    steps: [
      { title: "Pilih Produk", description: "Buka katalog, pilih permainan, kemudian pilih pakej yang diperlukan." },
      { title: "Sahkan Pesanan", description: "Klik beli untuk semak butiran pesanan dan pilih admin." },
      { title: "Chat Admin", description: "WhatsApp terbuka automatik dengan ringkasan pesanan." },
      { title: "Pesanan Selesai", description: "Admin menyiapkan pesanan dan beri kemas kini progres." },
    ],
    faqs: [
      { q: "Perlu daftar akaun dahulu?", a: "Tidak perlu. Anda boleh terus pilih pakej dan chat admin." },
      { q: "Berapa cepat admin respon?", a: "Biasanya dalam beberapa minit semasa waktu operasi." },
      { q: "Boleh konsultasi sebelum pesan?", a: "Boleh, konsultasi awal sangat digalakkan." },
      { q: "Bagaimana jika perlu semakan semasa proses?", a: "Maklumkan admin dan ia akan ditangani semasa proses berjalan." },
    ],
  },
};

const stepIcons = [ShoppingCart, MessageCircle, UserCheck, CheckCircle2];
const guaranteeIcons = [Shield, Clock3, MessageCircle];

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

export default function CaraOrderPage() {
  const { locale } = useLocale();
  const [copyState, setCopyState] = useState(copy);
  const text = copyState[locale];
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    let isMounted = true;

    const loadCopy = async () => {
      try {
        const response = await fetch("/api/content/cara-order", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (isMounted) {
          setCopyState(mergeCopy(copy, payload));
        }
      } catch (error) {
        console.error("Failed to load cara-order copy:", error);
      }
    };

    void loadCopy();
    return () => {
      isMounted = false;
    };
  }, []);

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
        <div className="mx-auto mb-4 max-w-5xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">{text.guaranteeLabel}</p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-3">
          {text.guarantees.map((item, index) => {
            const Icon = guaranteeIcons[index] || Shield;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-[var(--border)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
                style={{ backgroundColor: "var(--surface-muted)" }}
              >
                <Icon className="h-5 w-5 text-[var(--brand)]" />
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-muted)]">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-16" style={{ backgroundColor: "var(--surface-muted)" }}>
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{text.stepLabel}</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{text.stepTitle}</h2>
          </div>

          <div className="relative mt-10">
            <div className="absolute left-5 top-0 hidden h-full w-[2px] rounded-full bg-[var(--brand-soft)] sm:block" />
            <div className="space-y-4">
              {text.steps.map((step, index) => {
                const Icon = stepIcons[index] || ShoppingCart;
                return (
                  <motion.article
                    key={step.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                    className="relative rounded-3xl border border-[var(--border)] p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5"
                    style={{ backgroundColor: "var(--surface)" }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)]">
                        <Icon className="h-5 w-5 text-[var(--brand)]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
                          Step {index + 1}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">{step.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">{step.description}</p>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{text.faqLabel}</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{text.faqTitle}</h2>
          </div>

          <div className="mt-8 space-y-3">
            {text.faqs.map((faq, index) => {
              const open = openFaq === index;
              return (
                <article
                  key={faq.q}
                  className="overflow-hidden rounded-2xl border border-[var(--border)]"
                  style={{ backgroundColor: "var(--surface)" }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : index)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <span className={`text-sm font-semibold sm:text-base ${open ? "text-[var(--brand)]" : "text-[var(--foreground)]"}`}>
                      {faq.q}
                    </span>
                    <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
                      <ChevronDown className={`h-4 w-4 ${open ? "text-[var(--brand)]" : "text-[var(--foreground-muted)]"}`} />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="border-t border-[var(--border)] px-5 py-4">
                          <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">{faq.a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div
          className="mx-auto max-w-3xl rounded-3xl border border-[var(--border)] p-8 text-center shadow-[var(--shadow-card)]"
          style={{ backgroundColor: "var(--surface-muted)" }}
        >
          <h2 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">{text.ctaTitle}</h2>
          <p className="mt-3 text-sm text-[var(--foreground-muted)] sm:text-base">{text.ctaDesc}</p>
          <Link
            href="/#pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.01] hover:bg-[var(--brand-hover)]"
          >
            {text.ctaButton}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
