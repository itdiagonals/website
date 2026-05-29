"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
}

export default function ProductGallery({ images }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
  }, []);

  const goNext = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isLightboxOpen, closeLightbox, goNext, goPrev]);

  if (images.length === 0) return null;

  return (
    <div className="flex flex-col gap-[27px] w-full md:w-[567px] md:shrink-0">
      <button
        onClick={() => openLightbox(selectedIndex)}
        aria-label="Open image gallery"
        className="relative bg-neutral-300 w-full aspect-[3/4] md:h-[586px] md:aspect-auto overflow-hidden cursor-zoom-in"
      >
        <Image
          src={images[selectedIndex]}
          alt="Product main image"
          fill
          className="object-cover"
          priority
        />
      </button>
      {images.length > 1 && (
        <div className="flex gap-[23px] items-center overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedIndex(idx);
                openLightbox(idx);
              }}
              aria-label={`View image ${idx + 1}`}
              className={`relative w-[80px] h-[70px] md:w-[95px] md:h-[87px] overflow-hidden rounded-[5px] shrink-0 border-2 transition cursor-pointer ${
                idx === selectedIndex
                  ? "border-primary-500"
                  : "border-transparent"
              }`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLightbox();
          }}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 md:top-6 md:right-6 text-white/80 hover:text-white transition cursor-pointer z-10"
            aria-label="Close lightbox"
          >
            <X size={32} strokeWidth={2} />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition cursor-pointer z-10 bg-black/30 hover:bg-black/50 rounded-full p-2"
                aria-label="Previous image"
              >
                <ChevronLeft size={28} strokeWidth={2} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition cursor-pointer z-10 bg-black/30 hover:bg-black/50 rounded-full p-2"
                aria-label="Next image"
              >
                <ChevronRight size={28} strokeWidth={2} />
              </button>
            </>
          )}

          <div className="relative w-[90vw] h-[80vh] md:w-[80vw] md:h-[85vh]">
            <Image
              src={images[lightboxIndex]}
              alt={`Gallery image ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              priority
            />
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition cursor-pointer ${
                    idx === lightboxIndex ? "bg-white" : "bg-white/40"
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          )}

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/60 text-sm font-body">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
