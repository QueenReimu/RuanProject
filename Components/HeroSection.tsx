"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type CarouselImage = {
  id: number;
  src: string;
  alt: string;
  display_order: number;
};

const FALLBACK_IMAGES: CarouselImage[] = [
  { id: 1, src: "/products/Genshin.jpg", alt: "Genshin Impact", display_order: 1 },
  { id: 2, src: "/products/WutheringWaves.jpg", alt: "Wuthering Waves", display_order: 2 },
];

function sanitizeCarouselImages(input: CarouselImage[] | unknown): CarouselImage[] {
  if (!Array.isArray(input)) return FALLBACK_IMAGES;
  const cleaned = input
    .filter((item): item is CarouselImage => Boolean(item && typeof item === "object"))
    .map((item) => ({
      id: Number(item.id ?? 0),
      src: String(item.src ?? "").trim(),
      alt: String(item.alt ?? "Banner"),
      display_order: Number(item.display_order ?? 0),
    }))
    .filter((item) => item.src.length > 0);

  return cleaned.length > 0 ? cleaned : FALLBACK_IMAGES;
}

export default function HeroSection() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeImage, setActiveImage] = useState<CarouselImage | null>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch("/api/gacha-images");
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        setImages(sanitizeCarouselImages(data));
      } catch {
        setImages(FALLBACK_IMAGES);
      } finally {
        setLoaded(true);
      }
    };

    fetchImages();
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!activeImage) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveImage(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeImage]);

  return (
    <section className="relative overflow-hidden px-0 pb-12 pt-0 sm:pb-14">
      <div className="relative mx-auto max-w-7xl px-0 sm:px-6">
        <div
          className="group relative overflow-hidden rounded-none border-y border-[var(--border)] shadow-[var(--shadow-soft)] sm:rounded-3xl sm:border"
          style={{ backgroundColor: "var(--surface)" }}
        >

          {!loaded ? (
            <div className="relative aspect-[16/9] min-h-[220px] bg-[var(--surface-muted)] sm:aspect-[21/9] sm:min-h-[260px] lg:min-h-[340px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand-soft)] border-t-[var(--brand)]" />
              </div>
            </div>
          ) : (
            <>
              <div className="embla" ref={emblaRef}>
                <div className="embla__container">
                  {images.map((image) => (
                    <div key={image.id} className="embla__slide">
                      <button
                        type="button"
                        onClick={() => setActiveImage(image)}
                        className="relative block w-full cursor-zoom-in"
                        aria-label={`Zoom ${image.alt}`}
                      >
                        <div className="relative aspect-[16/9] min-h-[220px] bg-[var(--surface-muted)] sm:aspect-[21/9] sm:min-h-[260px] lg:min-h-[340px]">
                          <img
                            src={image.src}
                            alt={image.alt}
                            loading="lazy"
                            className="h-full w-full object-cover object-center sm:object-contain"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/8 via-transparent to-black/8" />
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => emblaApi?.scrollPrev()}
                className="absolute left-2 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/70 bg-white/60 p-2.5 text-[#4b5f76] shadow-[0_10px_20px_-12px_rgba(0,0,0,0.6)] backdrop-blur transition-all hover:scale-105 hover:bg-white/78 sm:left-4"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => emblaApi?.scrollNext()}
                className="absolute right-2 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/70 bg-white/60 p-2.5 text-[#4b5f76] shadow-[0_10px_20px_-12px_rgba(0,0,0,0.6)] backdrop-blur transition-all hover:scale-105 hover:bg-white/78 sm:right-4"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div
                className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/70 px-3 py-2 shadow-[0_10px_20px_-12px_rgba(0,0,0,0.55)]"
                style={{ backgroundColor: "color-mix(in srgb, var(--surface) 82%, transparent)" }}
              >
                {images.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={`h-2 rounded-full transition-all ${
                      selectedIndex === index ? "w-7 bg-[#1678b3]" : "w-2 bg-[#7ea6be]"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {activeImage ? (
        <div
          className="fixed inset-0 z-[80] bg-black/80 p-4 backdrop-blur-[2px] sm:p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) setActiveImage(null);
          }}
        >
          <button
            type="button"
            onClick={() => setActiveImage(null)}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white transition-colors hover:bg-black/60 sm:right-6 sm:top-6"
            aria-label="Close zoom"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto flex h-full max-w-6xl items-center justify-center">
            <figure className="w-full overflow-hidden rounded-2xl border border-white/20 bg-black/30 shadow-2xl">
              <img
                src={activeImage.src}
                alt={activeImage.alt}
                className="max-h-[84vh] w-full object-contain"
              />
              <figcaption className="border-t border-white/15 bg-black/55 px-4 py-3 text-xs text-white/90 sm:text-sm">
                <p className="font-medium">{activeImage.alt}</p>
              </figcaption>
            </figure>
          </div>
        </div>
      ) : null}
    </section>
  );
}
