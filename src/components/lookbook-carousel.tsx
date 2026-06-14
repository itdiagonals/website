'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LookbookItem {
  id: number;
  productName: string;
  price: string;
  image: string;
  href: string;
}

interface LookbookCarouselProps {
  items?: LookbookItem[];
}

const DEFAULT_ITEMS: LookbookItem[] = [
  {
    id: 1,
    productName: "Beige Puffer & Beanie",
    price: "Rp. 1,423,500",
    image: "/lookbook-placeholder.webp",
    href: "/products"
  },
  {
    id: 2,
    productName: "Vintage Casual Jacket",
    price: "Rp. 899,000",
    image: "/lookbook-placeholder.webp",
    href: "/products"
  },
  {
    id: 3,
    productName: "Heritage Football Kit",
    price: "Rp. 1,123,500",
    image: "/lookbook-placeholder.webp",
    href: "/products"
  }
];

export default function LookbookCarousel({ items = DEFAULT_ITEMS }: LookbookCarouselProps) {
  const effectiveItems = items.length > 0 ? items : DEFAULT_ITEMS;
  const [currentIdx, setCurrentIdx] = useState(0);
  const length = effectiveItems.length;

  const nextSlide = () => {
    setCurrentIdx((prev) => (prev + 1) % length);
  };

  const prevSlide = () => {
    setCurrentIdx((prev) => (prev - 1 + length) % length);
  };

  const activeItem = effectiveItems[currentIdx];

  return (
    <section className="relative w-full h-[560px] sm:h-[660px] md:h-[760px] lg:h-[800px] bg-neutral-100 overflow-hidden py-12 flex flex-col justify-between select-none">
      <div className="relative z-20 max-w-full md:max-w-[1440px] w-full mx-auto px-6 md:px-12 lg:px-20 flex flex-col md:flex-row items-start justify-between">
        <div className="flex flex-col">
          <h2 className="font-heading text-xl sm:text-[24px] md:text-[28px] lg:text-[34px] font-bold text-black uppercase tracking-wider">
            Lookbook
          </h2>

          <Link
            href={activeItem.href}
            className="flex items-center gap-6 mt-4 group cursor-pointer"
          >
            <div className="flex flex-col">
              <h3 className="font-sans text-[13px] sm:text-[15px] font-bold text-neutral-800 uppercase tracking-wide group-hover:text-black transition-colors">
                {activeItem.productName}
              </h3>
              <p className="font-sans text-[11px] sm:text-[13px] text-neutral-500 font-semibold mt-1 group-hover:text-neutral-700 transition-colors">
                {activeItem.price}
              </p>
            </div>

            <button
              aria-label={`Explore ${activeItem.productName}`}
              className="flex items-center justify-center w-10 h-10 border border-black bg-transparent text-black group-hover:bg-black group-hover:text-white transition-all duration-300 rounded-none cursor-pointer hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>

      <div className="relative w-full h-[300px] sm:h-[360px] md:h-[400px] lg:h-[460px]  flex items-center justify-center overflow-visible [--shift-x:110px] sm:[--shift-x:180px] md:[--shift-x:280px] lg:[--shift-x:340px]">
        {effectiveItems.map((item, idx) => {
          let offset = idx - currentIdx;
          if (offset < -1) offset += length;
          if (offset > 1) offset -= length;

          const isActive = offset === 0;
          const isLeft = offset === -1;
          const isRight = offset === 1;

          let translateX = '0px';
          let scale = 1;
          let opacity = 1;
          let zIndex = 20;
          let blur = '0px';

          if (isActive) {
            translateX = '0px';
            scale = 1;
            opacity = 1;
            zIndex = 20;
            blur = '0px';
          } else if (isLeft) {
            translateX = 'calc(-1 * var(--shift-x))';
            scale = 0.72;
            opacity = 0.12;
            zIndex = 10;
            blur = '0.5px';
          } else if (isRight) {
            translateX = 'var(--shift-x)';
            scale = 0.72;
            opacity = 0.12;
            zIndex = 10;
            blur = '0.5px';
          }

          return (
            <div
              key={item.id}
              style={{
                transform: `translate3d(calc(-50% + ${translateX}), -50%, 0) scale(${scale})`,
                opacity: opacity,
                zIndex: zIndex,
                filter: blur !== '0px' ? `blur(${blur})` : 'none',
                transition: 'transform 850ms cubic-bezier(0.16, 1, 0.3, 1), opacity 850ms cubic-bezier(0.16, 1, 0.3, 1), filter 850ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="absolute left-1/2 top-1/2 h-[400px] sm:h-[520px] md:h-[670px] w-full pointer-events-none"
            >
              <Link
                href={item.href}
                className={cn(
                  "relative w-full h-full transition-transform duration-700 block",
                  isActive ? "pointer-events-auto" : "pointer-events-none"
                )}
              >
                <Image
                  src={item.image}
                  alt={item.productName}
                  fill
                  className={cn(
                    "object-contain filter transition-all duration-850 ease-out",
                    isActive ? "drop-shadow-[0_25px_30px_rgba(0,0,0,0.14)]" : "drop-shadow-none"
                  )}
                  priority={isActive}
                />
              </Link>
            </div>
          );
        })}
      </div>

      <button
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 z-30 p-3 text-neutral-800 hover:text-black transition-all duration-300 hover:scale-125 active:scale-90 cursor-pointer"
      >
        <ChevronLeft className="w-8 h-8 md:w-10 md:h-10 stroke-[1.25]" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 z-30 p-3 text-neutral-800 hover:text-black transition-all duration-300 hover:scale-125 active:scale-90 cursor-pointer"
      >
        <ChevronRight className="w-8 h-8 md:w-10 md:h-10 stroke-[1.25]" />
      </button>

      <div className="relative z-20 max-w-[1440px] w-full mx-auto px-6 flex justify-center items-center gap-2 mt-4">
        {effectiveItems.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIdx(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={cn(
              "h-1 transition-all duration-500 rounded-none cursor-pointer",
              idx === currentIdx ? "w-10 bg-black" : "w-4 bg-black/20 hover:bg-black/40"
            )}
          />
        ))}
      </div>
      <Image src="/bg4.webp" alt='' height={149} width={1440} sizes="100vw" className="object-cover w-full h-auto absolute -bottom-10" />
    </section>
  );
}
