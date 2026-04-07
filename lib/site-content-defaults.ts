export type AppLocale = "id" | "en" | "my";
export type ContentSlug = "games" | "cara-order" | "tentang";

type GamesLocaleContent = {
  label: string;
  title: string;
  desc: string;
  openPricing: string;
  howToOrder: string;
  stats: Array<{ value: string; label: string }>;
  features: Array<{ title: string; text: string }>;
};

type CaraOrderLocaleContent = {
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
  steps: Array<{ title: string; description: string }>;
  faqs: Array<{ q: string; a: string }>;
};

type TentangLocaleContent = {
  label: string;
  title: string;
  desc: string;
  storyTitle: string;
  teamTitle: string;
  ctaTitle: string;
  ctaDesc: string;
  ctaCatalog: string;
  ctaOrder: string;
  milestones: Array<{ value: string; label: string }>;
  story: string[];
  values: Array<{ title: string; description: string }>;
  team: Array<{ role: string; description: string }>;
};

export type SiteContentDefaults = {
  games: Record<AppLocale, GamesLocaleContent>;
  "cara-order": Record<AppLocale, CaraOrderLocaleContent>;
  tentang: Record<AppLocale, TentangLocaleContent>;
};

export const SITE_CONTENT_DEFAULTS: SiteContentDefaults = {
  games: {
    id: {
      label: "Supported Games",
      title: "Game yang Kami Layani",
      desc: "Fokus pada kualitas pengerjaan, keamanan akun, dan komunikasi yang jelas selama proses.",
      openPricing: "Lihat Harga",
      howToOrder: "Cara Order",
      stats: [
        { value: "2.500+", label: "Order terselesaikan" },
        { value: "4.9/5", label: "Rating pelanggan" },
        { value: "100%", label: "Manual process" },
        { value: "< 5 menit", label: "Respon admin" },
      ],
      features: [
        { title: "Aman", text: "Pengerjaan manual oleh admin berpengalaman." },
        { title: "Cepat", text: "Konfirmasi dan komunikasi berlangsung langsung." },
        { title: "Profesional", text: "Layout layanan rapi dan mudah dipahami." },
      ],
    },
    en: {
      label: "Supported Games",
      title: "Games We Support",
      desc: "Focused on quality work, account safety, and clear communication throughout the process.",
      openPricing: "View Pricing",
      howToOrder: "How to Order",
      stats: [
        { value: "2.500+", label: "Completed orders" },
        { value: "4.9/5", label: "Customer rating" },
        { value: "100%", label: "Manual process" },
        { value: "< 5 min", label: "Admin response" },
      ],
      features: [
        { title: "Safe", text: "Manual handling by experienced admins." },
        { title: "Fast", text: "Quick confirmation and direct communication." },
        { title: "Professional", text: "Clean and easy-to-understand service layout." },
      ],
    },
    my: {
      label: "Permainan Disokong",
      title: "Permainan yang Kami Layani",
      desc: "Fokus pada kualiti kerja, keselamatan akaun, dan komunikasi yang jelas sepanjang proses.",
      openPricing: "Lihat Harga",
      howToOrder: "Cara Pesan",
      stats: [
        { value: "2.500+", label: "Pesanan selesai" },
        { value: "4.9/5", label: "Rating pelanggan" },
        { value: "100%", label: "Proses manual" },
        { value: "< 5 minit", label: "Respon admin" },
      ],
      features: [
        { title: "Selamat", text: "Pengendalian manual oleh admin berpengalaman." },
        { title: "Pantas", text: "Pengesahan cepat dan komunikasi terus." },
        { title: "Profesional", text: "Susun atur servis kemas dan mudah difahami." },
      ],
    },
  },
  "cara-order": {
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
  },
  tentang: {
    id: {
      label: "About Us",
      title: "Tim yang Fokus pada Layanan Profesional",
      desc: "Ruan Joki dibangun untuk memberi pengalaman order yang sederhana, transparan, dan nyaman untuk pelanggan.",
      storyTitle: "Cerita Singkat Kami",
      teamTitle: "Tim Admin",
      ctaTitle: "Siap Mulai Order?",
      ctaDesc: "Cek katalog layanan dan pilih paket yang sesuai kebutuhan akunmu.",
      ctaCatalog: "Lihat Katalog",
      ctaOrder: "Cara Order",
      milestones: [
        { value: "2.500+", label: "Order berhasil" },
        { value: "1.200+", label: "Pelanggan aktif" },
        { value: "4.9 / 5", label: "Rating kepuasan" },
      ],
      story: [
        "Berawal dari kebutuhan komunitas gamer yang ingin progres akun lebih efisien, kami membangun layanan dengan fokus pada kejelasan proses dan keamanan.",
        "Setiap order ditangani oleh admin secara manual. Kami menjaga komunikasi tetap aktif agar pelanggan selalu tahu status pengerjaan dari awal sampai selesai.",
        "Pendekatan ini membantu kami menjaga kualitas layanan sekaligus membangun kepercayaan pelanggan dalam jangka panjang.",
      ],
      values: [
        { title: "Keamanan Prioritas", description: "Proses manual agar akun tetap aman dan terkontrol." },
        { title: "Komunikasi Cepat", description: "Admin aktif memberi update sehingga pelanggan tidak menunggu tanpa kepastian." },
        { title: "Kualitas Konsisten", description: "Standar pengerjaan rapi, jelas, dan dapat diandalkan untuk order berulang." },
      ],
      team: [
        { role: "Customer Success", description: "Fokus pada konsultasi produk dan penanganan order harian." },
        { role: "Service Specialist", description: "Fokus pada koordinasi progres dan quality check pesanan." },
      ],
    },
    en: {
      label: "About Us",
      title: "A Team Focused on Professional Service",
      desc: "Ruan Joki is built to deliver a simple, transparent, and comfortable ordering experience.",
      storyTitle: "Our Story",
      teamTitle: "Admin Team",
      ctaTitle: "Ready to Start?",
      ctaDesc: "Explore the catalog and choose the package that fits your account needs.",
      ctaCatalog: "View Catalog",
      ctaOrder: "How to Order",
      milestones: [
        { value: "2.500+", label: "Successful orders" },
        { value: "1.200+", label: "Active customers" },
        { value: "4.9 / 5", label: "Satisfaction rating" },
      ],
      story: [
        "We started from gamer community needs for more efficient account progress, then built this service around clear process and security.",
        "Every order is handled manually by admin. We keep communication active so customers always know progress status.",
        "This approach helps us keep quality consistent while building long-term customer trust.",
      ],
      values: [
        { title: "Security First", description: "Manual process keeps accounts safe and controlled." },
        { title: "Fast Communication", description: "Admins provide active updates so customers are never left waiting." },
        { title: "Consistent Quality", description: "Clear and reliable standards for repeat orders." },
      ],
      team: [
        { role: "Customer Success", description: "Focused on package consultation and daily order handling." },
        { role: "Service Specialist", description: "Focused on progress coordination and quality checks." },
      ],
    },
    my: {
      label: "Tentang Kami",
      title: "Pasukan yang Fokus pada Servis Profesional",
      desc: "Ruan Joki dibina untuk memberi pengalaman pesanan yang mudah, telus, dan selesa.",
      storyTitle: "Cerita Ringkas Kami",
      teamTitle: "Pasukan Admin",
      ctaTitle: "Sedia Bermula?",
      ctaDesc: "Lihat katalog servis dan pilih pakej mengikut keperluan akaun anda.",
      ctaCatalog: "Lihat Katalog",
      ctaOrder: "Cara Pesan",
      milestones: [
        { value: "2.500+", label: "Pesanan berjaya" },
        { value: "1.200+", label: "Pelanggan aktif" },
        { value: "4.9 / 5", label: "Rating kepuasan" },
      ],
      story: [
        "Kami bermula daripada keperluan komuniti gamer untuk progres akaun yang lebih efisien, lalu membina servis berasaskan proses jelas dan keselamatan.",
        "Setiap pesanan diurus manual oleh admin. Kami memastikan komunikasi aktif supaya pelanggan sentiasa tahu status progres.",
        "Pendekatan ini membantu mengekalkan kualiti secara konsisten serta membina kepercayaan pelanggan jangka panjang.",
      ],
      values: [
        { title: "Keselamatan Utama", description: "Proses manual memastikan akaun kekal selamat dan terkawal." },
        { title: "Komunikasi Pantas", description: "Admin memberi kemas kini aktif supaya pelanggan tidak menunggu tanpa kepastian." },
        { title: "Kualiti Konsisten", description: "Standard kerja yang jelas dan boleh dipercayai untuk pesanan berulang." },
      ],
      team: [
        { role: "Customer Success", description: "Fokus pada konsultasi pakej dan pengurusan pesanan harian." },
        { role: "Service Specialist", description: "Fokus pada koordinasi progres dan semakan kualiti pesanan." },
      ],
    },
  },
};

export const CONTENT_SETTING_KEY_MAP: Record<ContentSlug, string> = {
  games: "content_games",
  "cara-order": "content_cara_order",
  tentang: "content_tentang",
};

export function isContentSlug(value: string): value is ContentSlug {
  return value === "games" || value === "cara-order" || value === "tentang";
}

export function mergeLocalizedContent<T extends Record<string, unknown>>(
  defaults: Record<AppLocale, T>,
  incoming: unknown
): Record<AppLocale, T> {
  if (!incoming || typeof incoming !== "object") return defaults;
  const source = incoming as Partial<Record<AppLocale, Partial<T>>>;

  const mergeWithSchema = (base: T, patch: Partial<T> | undefined): T => {
    const next = { ...base } as Record<string, unknown>;
    if (!patch || typeof patch !== "object") return next as T;

    for (const key of Object.keys(base)) {
      if (Object.prototype.hasOwnProperty.call(patch, key)) {
        next[key] = patch[key as keyof T] as unknown;
      }
    }

    return next as T;
  };

  return {
    id: mergeWithSchema(defaults.id, source.id),
    en: mergeWithSchema(defaults.en, source.en),
    my: mergeWithSchema(defaults.my, source.my),
  };
}
