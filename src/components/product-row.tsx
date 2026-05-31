'use client';

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: string;
  image: string;
  slug?: string;
}

interface ProductRowProps {
  products: Product[];
}

export default function ProductRow({ products }: ProductRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group w-full px-6">
      <button
        onClick={scrollLeft}
        aria-label="Scroll Left"
        className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 border border-neutral-300/60 flex items-center justify-center cursor-pointer shadow-md hover:bg-white active:scale-95 transition-all duration-300 hidden md:flex opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft size={18} className="text-black" />
      </button>
      <div
        ref={scrollRef}
        className="flex flex-row overflow-x-auto gap-6 scrollbar-none scroll-smooth snap-x snap-mandatory pb-4"
        style={{ scrollbarWidth: 'none' }}
      >
        {products.map((product) => (
          <Link
            href={`/products/${product.slug ?? product.id}`}
            key={product.id}
            className="flex flex-col gap-8 cursor-pointer flex-shrink-0 w-[260px] sm:w-[calc(50%-12px)] md:w-[calc(33.33%-16px)] lg:w-[calc(25%-18px)] snap-start"
          >
            <div className="aspect-square flex items-center justify-center hover:scale-110 transition duration-600">
              <Image
                src={product.image}
                alt={product.name}
                width={200}
                height={200}
                className="h-auto max-h-full object-contain"
                unoptimized
              />
            </div>
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-2">
                <span className="text-primary-1000 text-base font-bold leading-tight font-sans hover:opacity-60 transition duration-600 line-clamp-1">
                  {product.name}
                </span>
                <span className="text-primary-1000 text-xs font-normal font-sans">
                  {product.price}
                </span>
              </div>
              <div className="w-[27px] h-[27px] border border-neutral-900 flex items-center justify-center hover:bg-neutral-200 transition duration-600 shrink-0">
                <ChevronRight size={16} strokeWidth={2} className="text-black" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <button
        onClick={scrollRight}
        aria-label="Scroll Right"
        className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 border border-neutral-300/60 flex items-center justify-center cursor-pointer shadow-md hover:bg-white active:scale-95 transition-all duration-300 hidden md:flex opacity-0 group-hover:opacity-100"
      >
        <ChevronRight size={18} className="text-black" />
      </button>
    </div>
  );
}
