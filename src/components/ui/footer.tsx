'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Copyright } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { api, Category, Season } from '@/src/lib/api';

function sortByLatest<T extends { updated_at: string; created_at: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.updated_at || a.created_at).getTime();
    const bTime = new Date(b.updated_at || b.created_at).getTime();
    return bTime - aTime;
  });
}

export default function Footer() {
  const pathname = usePathname();
  const isCartOrProfile = pathname?.startsWith('/cart') || pathname?.startsWith('/profile');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadFooterData = async () => {
      try {
        const [seasonData, categoryData] = await Promise.all([
          api.seasons.getAll(1, 50),
          api.categories.getAll(1, 50),
        ]);

        if (!cancelled) {
          setSeasons(sortByLatest(seasonData).slice(0, 4));
          setCategories(categoryData.slice(0, 4));
        }
      } catch {
        if (!cancelled) {
          setSeasons([]);
          setCategories([]);
        }
      }
    };

    void loadFooterData();

    return () => {
      cancelled = true;
    };
  }, []);

  const seasonLinks = useMemo(
    () =>
      seasons.map((season) => ({
        id: season.id,
        label: season.name,
        href: `/products?season=${encodeURIComponent(season.slug)}`,
      })),
    [seasons]
  );

  const categoryLinks = useMemo(
    () =>
      categories.map((category) => ({
        id: category.id,
        label: category.name,
        href: `/products?category=${encodeURIComponent(category.slug)}`,
      })),
    [categories]
  );

  return (
    <footer className="w-full flex flex-col">
      {!isCartOrProfile && (
        <section className="relative w-full h-[360px] md:h-[420px] bg-[#383838] overflow-hidden flex items-center justify-center select-none">
          <div className="absolute top-0 left-0 h-full w-full bg-[url('/bg3.svg')] bg-left-bottom bg-no-repeat opacity-90"></div>
          <div className="relative w-56 h-56 md:w-64 md:h-64 z-10 flex items-center justify-center">
            <Image
              src="/logo/diagonals-diamond.svg"
              alt="Diagonals Diamond Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </section>
      )}

      <section className="w-full bg-[#f3f3f3] border-t border-neutral-200">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 py-16 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">

          <div className="lg:col-span-5 flex flex-col items-start">
            <Link href="/" className="relative w-[180px] h-[45px] block">
              <Image
                src="/logo/diagonals-black.svg"
                alt="DIAGONALS Logo"
                fill
                className="object-contain object-left"
              />
            </Link>

            <p className="mt-6 text-sm md:text-base text-neutral-800 leading-relaxed font-sans max-w-[440px] text-justify font-normal">
              Lorem ipsum dolor sit amet consectetur. Condimentum elit auctor vivamus elit.
              Nunc ac orci est elit massa. Diam quis nec tempor felis facilisis commodo.
              Nulla morbi nisl ac quis ultrices amet.
            </p>

            <div className="flex items-center gap-4 mt-8">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="p-2 -ml-2 rounded-full text-primary-500 hover:text-black transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter/X"
                className="p-2 rounded-full text-primary-500 hover:text-black transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-4 lg:col-start-7">
            <div className="flex flex-col">
              <h3 className="font-heading text-[20px] font-bold text-black mb-6 uppercase tracking-wider">
                Seasons
              </h3>
              <ul className="flex flex-col gap-4">
                {seasonLinks.length > 0 ? (
                  seasonLinks.map((season) => (
                    <li key={season.id}>
                      <Link href={season.href} className="text-sm md:text-[15px] font-semibold text-primary-500 hover:text-black transition-colors duration-300">
                        {season.label}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="text-sm md:text-[15px] font-semibold text-neutral-400">
                    Loading seasons...
                  </li>
                )}
              </ul>
            </div>

            <div className="flex flex-col">
              <h3 className="font-heading text-[20px] font-bold text-black mb-6 uppercase tracking-wider">
                Help
              </h3>
              <ul className="flex flex-col gap-4">
                <li>
                  <Link href="/faq" className="text-sm md:text-[15px] font-semibold text-primary-500 hover:text-black transition-colors duration-300">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/delivery" className="text-sm md:text-[15px] font-semibold text-primary-500 hover:text-black transition-colors duration-300">
                    Delivery
                  </Link>
                </li>
                <li>
                  <Link href="/return-policy" className="text-sm md:text-[15px] font-semibold text-primary-500 hover:text-black transition-colors duration-300">
                    Return Policy
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm md:text-[15px] font-semibold text-primary-500 hover:text-black transition-colors duration-300">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            <div className="flex flex-col col-span-2 sm:col-span-1">
              <h3 className="font-heading text-[20px] font-bold text-black mb-6 uppercase tracking-wider">
                Shop
              </h3>
              <ul className="flex flex-col gap-4">
                {categoryLinks.length > 0 ? (
                  categoryLinks.map((category) => (
                    <li key={category.id}>
                      <Link href={category.href} className="text-sm md:text-[15px] font-semibold text-primary-500 hover:text-black transition-colors duration-300">
                        {category.label}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="text-sm md:text-[15px] font-semibold text-neutral-400">
                    Loading categories...
                  </li>
                )}
              </ul>
            </div>
          </div>

        </div>

        <div className="w-full bg-[#e9e9e9] py-4 border-t border-neutral-200">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-600 font-sans">
            <span className='flex flex-row items-center gap-1'><Copyright size={12}/><p>{new Date().getFullYear()} DIAGONALS. All rights reserved.</p></span>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-black transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}
