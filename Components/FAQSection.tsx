"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useLocale, type Locale } from "@/Components/LocaleProvider";

type FAQItem = { q: string; a: string };

const copy: Record<
  Locale,
  {
    label: string;
    title: string;
    desc: string;
    faqs: FAQItem[];
  }
> = {
  id: {
    label: "FAQ",
    title: "Pertanyaan Umum",
    desc: "Jawaban singkat untuk pertanyaan yang paling sering ditanyakan.",
    faqs: [
      {
        q: "Apakah akun saya aman saat di-joki?",
        a: "Aman. Proses dikerjakan manual oleh admin tanpa bot, dan data hanya dipakai selama pengerjaan.",
      },
      {
        q: "Berapa lama waktu pengerjaan?",
        a: "Durasi bergantung pada layanan. Admin akan memberi estimasi yang jelas saat konfirmasi order.",
      },
      {
        q: "Bagaimana cara memantau progres?",
        a: "Kamu bisa meminta update kapan saja lewat WhatsApp, termasuk status pekerjaan terbaru.",
      },
      {
        q: "Saya harus chat ke Admin 1 atau Admin 2?",
        a: "Keduanya aktif. Admin 1 dan Admin 2 sama-sama bisa membantu order, kamu bisa pilih yang paling cepat merespons.",
      },
      {
        q: "Nomor WhatsApp Admin 1 dan Admin 2 berapa?",
        a: "Admin 1: 0838-5780-9571. Admin 2: 0831-4426-4995.",
      },
    ],
  },
  en: {
    label: "FAQ",
    title: "Frequently Asked Questions",
    desc: "Quick answers for the most common questions.",
    faqs: [
      {
        q: "Is my account safe during service?",
        a: "Yes. Everything is handled manually by admin without bots, and account data is only used during the process.",
      },
      {
        q: "How long does the process take?",
        a: "Duration depends on service type. Admin will share a clear estimate during confirmation.",
      },
      {
        q: "How can I track progress?",
        a: "You can request progress updates anytime via WhatsApp.",
      },
      {
        q: "Should I contact Admin 1 or Admin 2?",
        a: "Both are active. Admin 1 and Admin 2 can handle your order, choose whichever responds faster.",
      },
      {
        q: "What are Admin 1 and Admin 2 WhatsApp numbers?",
        a: "Admin 1: 0838-5780-9571. Admin 2: 0831-4426-4995.",
      },
    ],
  },
  my: {
    label: "FAQ",
    title: "Soalan Lazim",
    desc: "Jawapan ringkas untuk soalan yang paling kerap ditanya.",
    faqs: [
      {
        q: "Adakah akaun saya selamat semasa servis?",
        a: "Ya. Proses dilakukan secara manual oleh admin tanpa bot, dan data akaun digunakan hanya semasa proses berjalan.",
      },
      {
        q: "Berapa lama tempoh proses?",
        a: "Tempoh bergantung pada jenis servis. Admin akan beri anggaran jelas semasa pengesahan.",
      },
      {
        q: "Bagaimana saya semak progres?",
        a: "Anda boleh minta kemas kini progres bila-bila masa melalui WhatsApp.",
      },
      {
        q: "Perlu chat Admin 1 atau Admin 2?",
        a: "Kedua-duanya aktif. Admin 1 dan Admin 2 boleh urus pesanan anda, pilih yang paling cepat respon.",
      },
      {
        q: "Nombor WhatsApp Admin 1 dan Admin 2?",
        a: "Admin 1: 0838-5780-9571. Admin 2: 0831-4426-4995.",
      },
    ],
  },
};

export default function FAQSection() {
  const { locale } = useLocale();
  const text = copy[locale];
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-[var(--surface-muted)] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{text.label}</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">{text.title}</h2>
          <p className="mt-3 text-sm text-[var(--foreground-muted)] sm:text-base">{text.desc}</p>
        </div>

        <div className="mt-8 space-y-3">
          {text.faqs.map((faq, index) => {
            const open = openIndex === index;

            return (
              <article
                key={faq.q}
                className={`overflow-hidden rounded-2xl border transition-colors ${
                  open ? "border-[var(--brand)]" : "border-[var(--border)]"
                }`}
                style={{ backgroundColor: "var(--surface)" }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  aria-expanded={open}
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
  );
}
