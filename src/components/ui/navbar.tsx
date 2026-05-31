'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, ShoppingCart, ChevronDown, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { api, Category, Season } from '@/src/lib/api';
import NavbarAccountMenu from '@/src/components/auth/navbar-account-menu';

export type NavbarVariant = 'dark' | 'light' | 'transparent';

interface NavbarProps {
  variant?: NavbarVariant;
}

function SearchBar({ variant, isScrolled = false, isMobile = false, onClose }: { variant: NavbarVariant; isScrolled?: boolean; isMobile?: boolean; onClose?: () => void }) {
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

  const isDarkMode = isScrolled || variant === 'dark';

  return (
    <form
      onSubmit={handleSearchSubmit}
      className={cn(
        "relative flex items-center border rounded-none overflow-hidden transition-all duration-500 ease-in-out",
        isMobile
          ? "w-full h-10"
          : "hidden md:flex w-56 md:w-64 h-9",
        isDarkMode
          ? "bg-transparent border-white/30 focus-within:border-white/60"
          : "bg-transparent border-neutral-400/50 focus-within:border-primary-900"
      )}
    >
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={cn(
          "w-full h-full pl-3 pr-9 bg-transparent text-sm outline-none transition-colors duration-500 ease-in-out",
          isDarkMode
            ? "text-white placeholder:text-white/60"
            : "text-primary-500 placeholder:text-neutral-500"
        )}
      />
      <button
        type="submit"
        aria-label="Search products"
        className={cn(
          "absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors duration-300",
          isDarkMode
            ? "text-white/70 hover:text-white"
            : "text-neutral-600 hover:text-primary-500"
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const pathname = usePathname();

  const isCartOrProfile = pathname?.startsWith('/cart') || pathname?.startsWith('/profile');
  const activeVariant = isCartOrProfile ? 'light' : variant;
  const currentSeason = 'Cross Player';

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

  useEffect(() => {
    let cancelled = false;

    const loadNavbarData = async () => {
      try {
        const [categoryData, seasonData] = await Promise.all([
          api.categories.getAll(1, 50),
          api.seasons.getAll(1, 50),
        ]);

        if (!cancelled) {
          setCategories(categoryData);
          setSeasons(seasonData);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
          setSeasons([]);
        }
      }
    };

    void loadNavbarData();

    return () => {
      cancelled = true;
    };
  }, []);

  const scrolledClasses =
    'bg-primary-500 border-neutral-800/40 shadow-xl backdrop-blur-md';

  const defaultClasses: Record<NavbarVariant, string> = {
    dark: 'bg-primary-500 border-neutral-800/40',
    light: 'bg-neutral-100 border-neutral-200 text-primary-500',
    transparent: 'bg-neutral-100 border-neutral-200 text-primary-500',
  };

  const linkDefault: Record<NavbarVariant, string> = {
    dark: 'text-white hover:text-white',
    light: 'text-primary-500 hover:text-primary-900',
    transparent: 'text-neutral-900 hover:text-primrary-500',
  };

  const iconDefault: Record<NavbarVariant, string> = {
    dark: 'text-white hover:text-white',
    light: 'text-primary-500 hover:text-primary-900',
    transparent: 'text-neutral-900 hover:text-primary-500',
  };

  const scrolledLink = 'text-white hover:text-white';
  const scrolledIcon = 'text-white hover:text-white';

  const showBlackLogo = !isScrolled && activeVariant !== 'dark';

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
                <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
              </Link>

              <div className="absolute top-full left-1/2 z-50 w-[360px] -translate-x-1/2 pt-2 opacity-0 invisible transition-all duration-300 ease-in-out group-hover:visible group-hover:opacity-100 lg:w-[520px]">
                <div className={cn(
                  "grid grid-cols-2 gap-x-8 gap-y-4 border px-6 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] rounded-none lg:px-8",
                  activeVariant === 'light' ? 'bg-neutral-100 border-neutral-200' : 'bg-primary-500 border-neutral-800/50'
                )}>
                  <div className="flex flex-col gap-3.5">
                    <h4 className={cn(
                      "text-[12px] font-bold tracking-widest uppercase mb-1",
                      activeVariant === 'light' ? 'text-neutral-500' : 'text-neutral-400'
                    )}>
                      PRODUCT
                    </h4>
                    <Link
                      href="/products?category=Tops"
                      className={cn(
                        "text-[14px] font-semibold uppercase tracking-wider transition-colors duration-200",
                        activeVariant === 'light' ? 'text-primary-500 hover:text-black' : 'text-neutral-300 hover:text-white'
                      )}
                    >
                      Tops
                    </Link>
                    <Link
                      href="/products?category=Bottoms"
                      className={cn(
                        "text-[14px] font-semibold uppercase tracking-wider transition-colors duration-200",
                        activeVariant === 'light' ? 'text-primary-500 hover:text-black' : 'text-neutral-300 hover:text-white'
                      )}
                    >
                      Bottoms
                    </Link>
                    <Link
                      href="/products?category=Women"
                      className={cn(
                        "text-[14px] font-semibold uppercase tracking-wider transition-colors duration-200",
                        activeVariant === 'light' ? 'text-primary-500 hover:text-black' : 'text-neutral-300 hover:text-white'
                      )}
                    >
                      Women
                    </Link>
                    <Link
                      href="/products?category=Men"
                      className={cn(
                        "text-[14px] font-semibold uppercase tracking-wider transition-colors duration-200",
                        activeVariant === 'light' ? 'text-primary-500 hover:text-black' : 'text-neutral-300 hover:text-white'
                      )}
                    >
                      Men
                    </Link>

                    {/* Divider and All Products */}
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
                        <ChevronRight className="h-4 w-4" />
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
                      href="/product/season"
                      className="text-[14px] font-bold uppercase tracking-wider transition-colors duration-200 text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300"
                    >
                      {currentSeason}
                    </Link>
                    <Link
                      href="/products?season=A"
                      className={cn(
                        "text-[14px] font-semibold uppercase tracking-wider transition-colors duration-200",
                        activeVariant === 'light' ? 'text-primary-500 hover:text-black' : 'text-neutral-300 hover:text-white'
                      )}
                    >
                      Season A
                    </Link>
                    <Link
                      href="/products?season=B"
                      className={cn(
                        "text-[14px] font-semibold uppercase tracking-wider transition-colors duration-200",
                        activeVariant === 'light' ? 'text-primary-500 hover:text-black' : 'text-neutral-300 hover:text-white'
                      )}
                    >
                      Season B
                    </Link>
                    <Link
                      href="/products?season=C"
                      className={cn(
                        "text-[14px] font-semibold uppercase tracking-wider transition-colors duration-200",
                        activeVariant === 'light' ? 'text-primary-500 hover:text-black' : 'text-neutral-300 hover:text-white'
                      )}
                    >
                      Season C
                    </Link>

                    <div className={cn(
                      "border-t pt-3 mt-1",
                      activeVariant === 'light' ? 'border-neutral-200' : 'border-neutral-800/50'
                    )}>
                      <Link
                        href="/season"
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
                <SearchBar variant={activeVariant} isScrolled={isScrolled} />
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

            <NavbarAccountMenu variant={activeVariant} isScrolled={isScrolled} />
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
              isScrolled={isScrolled}
              isMobile
              onClose={() => setShowMobileSearch(false)}
            />
          </Suspense>
        </div>
      </header>
    </>
  );
}
