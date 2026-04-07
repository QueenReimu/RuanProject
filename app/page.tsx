import Navbar from "@/Components/Navbar";
import HeroSection from "@/Components/HeroSection"; // Carousel dari gacha_images
import PricingSection from "@/Components/PricingSection";
import HowItWorks from "@/Components/HowItWorks";
import TestimonialsImageGrid from "@/Components/TestimonialsImageGrid";
import FAQSection from "@/Components/FAQSection";
import CTASection from "@/Components/CTASection";
import Footer from "@/Components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />
      <HeroSection />
      <PricingSection />
      <HowItWorks />
      <TestimonialsImageGrid />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
