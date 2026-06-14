'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '@/lib/utils';

import { api } from '../lib/api';

type Season = Awaited<ReturnType<typeof api.seasons.getAll>>[number];

interface HeroProps {
  seasons: Season[];
}

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  isCurrent: boolean;
}

function mapSeasonsToSlides(seasons: Season[]): Slide[] {
  const sorted = [...seasons].sort((a, b) => {
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    return 0;
  });
  return sorted.map((s) => ({
    id: s.id,
    title: s.name,
    subtitle: s.subtitle || s.description || '',
    image: s.cover_image?.url || '/Frame1.webp',
    link: `/season/${s.slug}`,
    isCurrent: s.is_active,
  }));
}

export default function Hero({ seasons }: HeroProps) {
  const slides = mapSeasonsToSlides(seasons);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const autoplayTimer = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = slides.length;

  const nextSlide = () => {
    setCurrentIdx((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIdx((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (idx: number) => {
    setCurrentIdx(idx);
  };

  useEffect(() => {
    if (!isHovered) {
      autoplayTimer.current = setInterval(() => {
        nextSlide();
      }, 6000); 
    }

    return () => {
      if (autoplayTimer.current) {
        clearInterval(autoplayTimer.current);
      }
    };
  }, [isHovered, currentIdx]);

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-[850px] overflow-hidden text-neutral-100 font-sans"
    >
      <div className="absolute inset-0 w-full h-full">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={cn(
              'absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out',
              idx === currentIdx
                ? 'opacity-100 scale-100 z-10'
                : 'opacity-0 scale-105 z-0'
            )}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={idx === 0}
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        ))}
      </div>

      <div className="absolute top-0 left-0 w-full h-[220px] bg-[linear-gradient(180deg,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0)_100%)] z-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-[320px] bg-[linear-gradient(0deg,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0)_100%)] z-20 pointer-events-none" />

      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={cn(
            'absolute inset-0 space-y-4 flex flex-col items-center justify-end pb-40 text-center px-6 transition-all duration-1000 ease-out z-20',
            idx === currentIdx
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-6 pointer-events-none'
          )}
        >
          <span className="text-white drop-shadow-2xl text-base md:text-lg font-medium select-none">
            {slide.subtitle}
          </span>

          <h1 className="font-handi text-white text-7xl md:text-[100px] drop-shadow-[0_4px_16px_rgba(0,0,0,0.65)] select-none filter transition-transform duration-1000">
            {slide.title}
          </h1>

          <div className="">
            <Link href={slide.link}>
              <Button >
                Explore Now
              </Button>
            </Link>
          </div>
        </div>
      ))}

      <button
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 z-30 p-2 md:p-3 text-neutral-300 hover:text-white bg-black/0 hover:bg-black/10 rounded-full transition-all duration-300 ease-out cursor-pointer hover:scale-110 active:scale-95"
      >
        <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 z-30 p-2 md:p-3 text-neutral-300 hover:text-white bg-black/0 hover:bg-black/10 rounded-full transition-all duration-300 ease-out cursor-pointer hover:scale-110 active:scale-95"
      >
        <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
      </button>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={cn(
              'h-1.5 rounded-full transition-all duration-500 ease-out cursor-pointer',
              idx === currentIdx
                ? 'w-14 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                : 'w-8 bg-white/40 hover:bg-white/60'
            )}
          />
        ))}
      </div>
    </section>
  );
}