'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ShoppingCart, User, ChevronDown, X } from 'lucide-react';
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

export default function Navbar({ variant = 'dark' }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
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
    'fixed top-0 left-0 w-full bg-primary-500 border-neutral-800/40 shadow-xl backdrop-blur-md';

  const defaultClasses: Record<NavbarVariant, string> = {
    dark: 'relative bg-primary-500 border-neutral-800/40',
    light: 'relative bg-neutral-100 border-neutral-200',
    transparent: 'relative bg-transparent border-transparent',
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

  const showBlackLogo = !isScrolled && variant === 'light';

  return (
    <>
      <header
        className={cn(
          'z-50 py-5 md:py-6 transition-all duration-700 ease-in-out will-change-[background-color,border-color,backdrop-filter,box-shadow]',
          isScrolled ? scrolledClasses : defaultClasses[variant]
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
              href="/new-arrivals"
              className={cn(
                'text-base font-semibold tracking-wide transition-colors duration-500 ease-in-out',
                isScrolled ? scrolledLink : linkDefault[variant]
              )}
            >
              New Arrivals
            </Link>
            <div className="relative group">
              <Link
                href="/products"
                className={cn(
                  'text-base font-semibold tracking-wide flex items-center gap-1 transition-colors duration-500 ease-in-out',
                  isScrolled ? scrolledLink : linkDefault[variant]
                )}
              >
                All Product
                <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
              </Link>
            </div>
          </nav>

          <div className="flex items-center gap-4 md:gap-6">
            <Suspense fallback={
              <div className="hidden md:flex relative items-center border border-neutral-300/30 rounded-none w-56 md:w-64 h-9">
                <span className="text-xs text-neutral-400 pl-3">Loading search...</span>
              </div>
            }>
              <div className="hidden md:block">
                <SearchBar variant={variant} />
              </div>
            </Suspense>

            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              aria-label="Toggle search"
              className={cn(
                'md:hidden transition-all duration-500 ease-in-out hover:scale-110',
                isScrolled ? scrolledIcon : iconDefault[variant]
              )}
            >
              {showMobileSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            <Link
              href="/cart"
              aria-label="View shopping cart"
              className={cn(
                'transition-all duration-500 ease-in-out hover:scale-110 relative',
                isScrolled ? scrolledIcon : iconDefault[variant]
              )}
            >
              <ShoppingCart className="w-5 h-5 md:w-5.5 md:h-5.5" />
            </Link>

            <Link
              href="/profile"
              aria-label="View profile"
              className={cn(
                'transition-all duration-500 ease-in-out hover:scale-110',
                isScrolled ? scrolledIcon : iconDefault[variant]
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
              variant={variant}
              isMobile
              onClose={() => setShowMobileSearch(false)}
            />
          </Suspense>
        </div>
      </header>

      {variant === 'light' && (
        <div
          className={cn(
            "transition-[height] duration-0",
            isScrolled ? "h-[72px] md:h-[88px]" : "h-0"
          )}
        />
      )}
    </>
  );
}
