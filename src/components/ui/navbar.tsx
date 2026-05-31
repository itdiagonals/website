'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, ShoppingCart, User, ChevronDown, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export type NavbarVariant = 'dark' | 'light' | 'transparent';

interface NavbarProps {
  variant?: NavbarVariant;
}

function SearchBar({ variant, isMobile = false, onClose }: { variant: NavbarVariant; isMobile?: boolean; onClose?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const currentSearch = searchParams.get('search');
    if (currentSearch) {
      setQuery(currentSearch);
    } else {
      setQuery('');
    }
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/products');
    }
    if (onClose) onClose();
  };

  const isLight = variant === 'light';

  return (
    <form
      onSubmit={handleSearchSubmit}
      className={cn(
        "relative flex items-center border rounded-none overflow-hidden transition-all duration-500 ease-in-out",
        isMobile
          ? "w-full h-10"
          : "hidden md:flex w-56 md:w-64 h-9",
        isLight
          ? "bg-transparent border-neutral-400/50 focus-within:border-primary-500"
          : "bg-transparent border-neutral-300/30 focus-within:border-white"
      )}
    >
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={cn(
          "w-full h-full pl-3 pr-9 bg-transparent text-sm outline-none transition-colors duration-500 ease-in-out",
          isLight
            ? "text-primary-500 placeholder:text-neutral-500"
            : "text-white placeholder:text-neutral-400"
        )}
      />
      <button
        type="submit"
        aria-label="Search products"
        className={cn(
          "absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors duration-300",
          isLight
            ? "text-neutral-600 hover:text-primary-500"
            : "text-neutral-300 hover:text-white"
        )}
      >
        <Search className="w-4 h-4" />
      </button>
    </form>
  );
}

const NAV_PRODUCT_ITEMS = [
  { title: 'Tops', href: '/products?category=Tops' },
  { title: 'Bottoms', href: '/products?category=Bottoms' },
  { title: 'Women', href: '/products?category=Women' },
  { title: 'Men', href: '/products?category=Men' }
];

const NAV_SEASON_ITEMS = [
  { title: 'Season A', href: '/season/water-to-the-rescue' },
  { title: 'Season B', href: '/season/punk-rocker-yes-i-am' },
  { title: 'Season C', href: '/season/the-hills' }
];

export default function Navbar({ variant = 'dark' }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const pathname = usePathname();

  const isCartOrProfile = pathname?.startsWith('/cart') || pathname?.startsWith('/profile');
  const activeVariant = isCartOrProfile ? 'light' : variant;
  const currentSeason = 'Cross Player';
  const currentSeasonSlug = 'cross-player';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 1) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrolledClasses =
    'bg-primary-500 border-neutral-800/40 shadow-xl backdrop-blur-md';

  const defaultClasses: Record<NavbarVariant, string> = {
    dark: 'bg-primary-500 border-neutral-800/40',
    light: 'bg-neutral-100 border-neutral-200',
    transparent: 'bg-transparent border-transparent',
  };

  const linkDefault: Record<NavbarVariant, string> = {
    dark: 'text-white hover:text-white',
    light: 'text-primary-500 hover:text-primary-900',
    transparent: 'text-neutral-200 hover:text-white',
  };

  const iconDefault: Record<NavbarVariant, string> = {
    dark: 'text-white hover:text-white',
    light: 'text-primary-500 hover:text-primary-900',
    transparent: 'text-neutral-200 hover:text-white',
  };

  const scrolledLink = 'text-white hover:text-white';
  const scrolledIcon = 'text-white hover:text-white';

  const showBlackLogo = !isScrolled && activeVariant === 'light';

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 w-full z-50 h-20 py-5 md:py-6 transition-all duration-700 ease-in-out will-change-[background-color,border-color,backdrop-filter,box-shadow]',
          isScrolled ? scrolledClasses : defaultClasses[activeVariant]
        )}
      >
        <div className="max-w-360 mx-auto px-6 md:px-12 lg:px-20 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2 relative w-[120px] h-[40px]">
            <Image
              src="/logo/diagonals-white.svg"
              alt="Diagonals Logo"
              fill
              className={cn(
                "object-contain transition-opacity duration-700 ease-in-out",
                showBlackLogo ? "opacity-0" : "opacity-100"
              )}
            />
            <Image
              src="/logo/diagonals-black.svg"
              alt="Diagonals Logo"
              fill
              className={cn(
                "object-contain transition-opacity duration-700 ease-in-out",
                showBlackLogo ? "opacity-100" : "opacity-0"
              )}
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8 lg:gap-12">
            <Link
              href="/products"
              className={cn(
                'text-base font-semibold tracking-wide transition-colors duration-500 ease-in-out',
                isScrolled ? scrolledLink : linkDefault[activeVariant]
              )}
            >
              New Arrivals
            </Link>
            <div className="relative group">
              <Link
                href="/products"
                className={cn(
                  'text-base font-semibold tracking-wide flex items-center gap-1 transition-colors duration-500 ease-in-out',
                  isScrolled ? scrolledLink : linkDefault[activeVariant]
                )}
              >
                All Product
                <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
              </Link>

              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[360px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out z-50">
                <div className={cn(
                  "border shadow-[0_20px_50px_rgba(0,0,0,0.25)] rounded-none py-6 px-6 grid grid-cols-2 gap-x-8 gap-y-4",
                  activeVariant === 'light' ? 'bg-neutral-100 border-neutral-200' : 'bg-primary-500 border-neutral-800/50'
                )}>
                  <div className="flex flex-col gap-3.5">
                    <h4 className={cn(
                      "text-[12px] font-bold tracking-widest uppercase mb-1",
                      activeVariant === 'light' ? 'text-neutral-500' : 'text-neutral-400'
                    )}>
                      PRODUK
                    </h4>
                    {NAV_PRODUCT_ITEMS.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className={cn(
                          "text-[14px] font-semibold uppercase tracking-wider transition-colors duration-200",
                          activeVariant === 'light' ? 'text-primary-500 hover:text-black' : 'text-neutral-300 hover:text-white'
                        )}
                      >
                        {item.title}
                      </Link>
                    ))}

                    <div className={cn(
                      "border-t pt-3 mt-1",
                      activeVariant === 'light' ? 'border-neutral-200' : 'border-neutral-800/50'
                    )}>
                      <Link
                        href="/products"
                        className={cn(
                          "text-[14px] font-bold uppercase tracking-wider transition-colors duration-200 flex items-center gap-1",
                          activeVariant === 'light' ? 'text-black hover:text-primary-500' : 'text-white hover:text-neutral-300'
                        )}
                      >
                        All Products
                        <span className="text-[12px] font-light">→</span>
                      </Link>
                    </div>
                  </div>

                  <div className={cn(
                    "flex flex-col gap-3.5 border-l pl-8",
                    activeVariant === 'light' ? 'border-neutral-200' : 'border-neutral-800/50'
                  )}>
                    <h4 className={cn(
                      "text-[12px] font-bold tracking-widest uppercase mb-1",
                      activeVariant === 'light' ? 'text-neutral-500' : 'text-neutral-400'
                    )}>
                      SEASON
                    </h4>
                    <Link
                      href={`/season/${currentSeasonSlug}`}
                      className="text-[14px] font-bold uppercase tracking-wider transition-colors duration-200 text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300"
                    >
                      {currentSeason}
                    </Link>
                    {NAV_SEASON_ITEMS.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className={cn(
                          "text-[14px] font-semibold uppercase tracking-wider transition-colors duration-200",
                          activeVariant === 'light' ? 'text-primary-500 hover:text-black' : 'text-neutral-300 hover:text-white'
                        )}
                      >
                        {item.title}
                      </Link>
                    ))}

                    <div className={cn(
                      "border-t pt-3 mt-1",
                      activeVariant === 'light' ? 'border-neutral-200' : 'border-neutral-800/50'
                    )}>
                      <Link
                        href="/products"
                        className={cn(
                          "text-[14px] font-bold uppercase tracking-wider transition-colors duration-200 flex items-center gap-1",
                          activeVariant === 'light' ? 'text-black hover:text-primary-500' : 'text-white hover:text-neutral-300'
                        )}
                      >
                        All Seasons
                        <ChevronRight />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-4 md:gap-6">
            <Suspense fallback={
              <div className="hidden md:flex relative items-center border border-neutral-300/30 rounded-none w-56 md:w-64 h-9">
                <span className="text-xs text-neutral-400 pl-3">Loading search...</span>
              </div>
            }>
              <div className="hidden md:block">
                <SearchBar variant={activeVariant} />
              </div>
            </Suspense>

            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              aria-label="Toggle search"
              className={cn(
                'md:hidden transition-all duration-500 ease-in-out hover:scale-110',
                isScrolled ? scrolledIcon : iconDefault[activeVariant]
              )}
            >
              {showMobileSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            <Link
              href="/cart"
              aria-label="View shopping cart"
              className={cn(
                'transition-all duration-500 ease-in-out hover:scale-110 relative',
                isScrolled ? scrolledIcon : iconDefault[activeVariant]
              )}
            >
              <ShoppingCart className="w-5 h-5 md:w-5.5 md:h-5.5" />
            </Link>

            <Link
              href="/profile"
              aria-label="View profile"
              className={cn(
                'transition-all duration-500 ease-in-out hover:scale-110',
                isScrolled ? scrolledIcon : iconDefault[activeVariant]
              )}
            >
              <User className="w-5 h-5 md:w-5.5 md:h-5.5" />
            </Link>
          </div>
        </div>

        <div
          className={cn(
            'md:hidden overflow-hidden transition-all duration-500 ease-in-out',
            showMobileSearch ? 'max-h-20 opacity-100 mt-4 px-6' : 'max-h-0 opacity-0'
          )}
        >
          <Suspense fallback={
            <div className="relative flex items-center border border-neutral-300/30 rounded-none w-full h-10">
              <span className="text-xs text-neutral-400 pl-3">Loading search...</span>
            </div>
          }>
            <SearchBar
              variant={activeVariant}
              isMobile
              onClose={() => setShowMobileSearch(false)}
            />
          </Suspense>
        </div>
      </header>
    </>
  );
}
