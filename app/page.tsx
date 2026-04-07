import dynamic from "next/dynamic";
import Navbar from "@/Components/Navbar";
import HeroSection from "@/Components/HeroSection";
import PricingSection from "@/Components/PricingSection";
import Footer from "@/Components/Footer";
import { readPublicGachaImages } from "@/lib/gacha-images";

const HowItWorks = dynamic(() => import("@/Components/HowItWorks"), {
  loading: () => <DeferredSectionPlaceholder blocks={4} />,
});
const TestimonialsImageGrid = dynamic(() => import("@/Components/TestimonialsImageGrid"), {
  loading: () => <DeferredSectionPlaceholder blocks={6} />,
});
const FAQSection = dynamic(() => import("@/Components/FAQSection"), {
  loading: () => <DeferredSectionPlaceholder blocks={5} />,
});
const CTASection = dynamic(() => import("@/Components/CTASection"), {
  loading: () => <DeferredSectionPlaceholder blocks={2} />,
});

function DeferredSectionPlaceholder({ blocks }: { blocks: number }) {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20" style={{ contentVisibility: "auto", containIntrinsicSize: "900px" }}>
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto h-4 w-28 rounded-full bg-[var(--brand-soft)]/70" />
        <div className="mx-auto mt-4 h-10 w-full max-w-2xl rounded-2xl bg-[var(--surface-muted)]" />
        <div className="mx-auto mt-3 h-4 w-full max-w-xl rounded-full bg-[var(--surface-muted)]" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: blocks }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const heroImages = await readPublicGachaImages();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />
      <HeroSection initialImages={heroImages} />
      <PricingSection />
      <div style={{ contentVisibility: "auto", containIntrinsicSize: "900px" }}>
        <HowItWorks />
      </div>
      <div style={{ contentVisibility: "auto", containIntrinsicSize: "1200px" }}>
        <TestimonialsImageGrid />
      </div>
      <div style={{ contentVisibility: "auto", containIntrinsicSize: "900px" }}>
        <FAQSection />
      </div>
      <div style={{ contentVisibility: "auto", containIntrinsicSize: "700px" }}>
        <CTASection />
      </div>
      <Footer />
    </div>
  );
}
