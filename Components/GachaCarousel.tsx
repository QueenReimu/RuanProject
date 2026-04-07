"use client";

import { useState, useRef, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface GachaImage {
  id: number;
  src: string;
  alt: string;
  display_order: number;
}

export default function GachaCarousel() {
  const [images, setImages] = useState<GachaImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [popupImage, setPopupImage] = useState<{ src: string; alt: string } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Ambil dari DB — semua gambar dikelola via Admin Panel
  useEffect(() => {
    fetch("/api/gacha-images")
      .then((r) => r.json())
      .then((data: GachaImage[]) => {
        if (Array.isArray(data)) setImages(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const prev = () =>
    setIndex((i) => (i === 0 ? Math.max(0, images.length - 2) : i - 1));
  const next = () =>
    setIndex((i) => (i >= images.length - 2 ? 0 : i + 1));

  const handleMouseDown = (e: React.MouseEvent) => setDragStart(e.clientX);
  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStart !== null) {
      const diff = e.clientX - dragStart;
      if (diff > 50) prev();
      else if (diff < -50) next();
    }
    setDragStart(null);
  };
  const handleTouchStart = (e: React.TouchEvent) =>
    setDragStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStart !== null) {
      const diff = e.changedTouches[0].clientX - dragStart;
      if (diff > 50) prev();
      else if (diff < -50) next();
    }
    setDragStart(null);
  };

  const showArrows = images.length > 2;

  return (
    <section className="px-4 mt-20 sm:px-6 bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-[#E4E4E7] transition-colors duration-300">
      <p className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-8 sm:mb-12 text-zinc-900 dark:text-white">
        🔥 Layanan Joki Game Gacha 🔥
      </p>

      {/* Loading spinner */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-[#FF69B4] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && images.length === 0 && (
        <div className="text-center py-16 text-zinc-500 dark:text-zinc-600">
          <p className="text-4xl mb-3">🖼️</p>
          <p className="text-sm">Gambar belum tersedia.</p>
        </div>
      )}

      {/* Carousel & Grid */}
      {!loading && images.length > 0 && (
        <>
          <AnimatePresence mode="wait">
            {!showAll ? (
              <motion.div
                key="carousel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center relative w-full mb-6"
              >
                <div className="relative w-full max-w-[1200px]">
                  {showArrows && (
                    <button
                      onClick={prev}
                      className="absolute -left-6 sm:-left-10 top-1/2 -translate-y-1/2 z-10 p-3 sm:p-4 rounded-full 
                        bg-[#3AC4FF]/20 hover:bg-[#3AC4FF]/40 border border-[#3AC4FF] text-[#3AC4FF]
                        transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(58,196,255,0.3)] text-[20px] sm:text-[24px]"
                    >
                      <FaChevronLeft />
                    </button>
                  )}

                  <div
                    className="overflow-x-auto w-full cursor-grab sm:overflow-hidden"
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    ref={carouselRef}
                  >
                    <div
                      className="flex gap-4 sm:gap-6 transition-transform duration-500"
                      style={{ transform: `translateX(-${index * 50}%)` }}
                    >
                      {images.map((item, i) => (
                        <div
                          key={item.id ?? i}
                          className="flex-shrink-0 w-[80%] sm:w-[50%] aspect-[16/9] relative cursor-pointer transform transition-all duration-300 hover:scale-102 hover:shadow-2xl bg-[#1E1E2E] rounded-2xl"
                          onClick={() => setPopupImage(item)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.src}
                            alt={item.alt}
                            className="relative w-full h-full rounded-2xl border border-[#1E1E2E] shadow-lg object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {showArrows && (
                    <button
                      onClick={next}
                      className="absolute -right-6 sm:-right-10 top-1/2 -translate-y-1/2 z-10 p-3 sm:p-4 rounded-full 
                        bg-[#FF69B4]/20 hover:bg-[#FF69B4]/40 border border-[#FF69B4] text-[#FF69B4]
                        transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(255,105,180,0.3)] text-[20px] sm:text-[24px]"
                    >
                      <FaChevronRight />
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-12"
              >
                {images.map((item, i) => (
                  <div
                    key={item.id ?? i}
                    className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-102 hover:shadow-2xl bg-[#1E1E2E]"
                    onClick={() => setPopupImage(item)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.src}
                      alt={item.alt}
                      className="relative w-full h-full rounded-2xl border border-[#1E1E2E] shadow-lg object-cover"
                    />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-center mb-8 sm:mb-12">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-[#FF69B4] text-[#FFFFFF] font-semibold rounded-xl 
                hover:bg-[#C71585] transition-all duration-300 shadow-lg 
                hover:shadow-[0_0_30px_rgba(255,105,180,0.3)] text-sm sm:text-base"
            >
              {showAll ? "Kembali ke Carousel" : "Lihat Semua Gambar"}
            </button>
          </div>
        </>
      )}

      {/* Popup */}
      {popupImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4"
          onClick={() => setPopupImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={popupImage.src}
            alt={popupImage.alt}
            className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain transform transition-all duration-300 scale-100 hover:scale-105"
          />
        </div>
      )}
    </section>
  );
}
