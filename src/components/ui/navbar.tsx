'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, ShoppingCart, User, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

function SearchBar() {
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
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className="relative flex items-center bg-transparent border border-neutral-300/30 rounded-none w-56 md:w-64 h-9 overflow-hidden transition-all duration-300 focus-within:border-white focus-within:w-72"
    >
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-full pl-3 pr-9 bg-transparent text-white text-sm outline-none placeholder:text-neutral-400"
      />
      <button
        type="submit"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-white cursor-pointer transition-colors duration-200"
      >
        <Search className="w-4 h-4" />
      </button>
    </form>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  const isAdminPage = pathname?.startsWith('/admin');
  const isAuthPage = pathname?.startsWith('/auth');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
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

  if (isAdminPage || isAuthPage) {
    return null;
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-out py-5 md:py-6',
        isScrolled
          ? 'bg-primary-500 border-b border-neutral-800/40 shadow-xl backdrop-blur-md py-3.5 md:py-4'
          : 'bg-transparent border-b border-transparent'
      )}
    >
      <div className="max-w-360 mx-auto px-6 md:px-12 lg:px-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <Image
            src="/logo/diagonals-white.svg"
            alt="Diagonals Logo"
            width={120}
            height={40}
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Center Menu Links (Omitted About Us) */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-12">
          <Link
            href="/new-arrivals"
            className="text-neutral-200 hover:text-white text-base font-semibold tracking-wide transition-colors duration-200"
          >
            New Arrivals
          </Link>
          <div className="relative group">
            <Link
              href="/products"
              className="text-neutral-200 hover:text-white text-base font-semibold tracking-wide flex items-center gap-1 transition-colors duration-200"
            >
              All Product
              <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
            </Link>
          </div>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Search bar inside Suspense boundary */}
          <Suspense fallback={
            <div className="relative flex items-center border border-neutral-300/30 rounded-none w-56 md:w-64 h-9">
              <span className="text-xs text-neutral-400 pl-3">Loading search...</span>
            </div>
          }>
            <SearchBar />
          </Suspense>

          {/* Cart Icon Link */}
          <Link
            href="/cart"
            className="text-neutral-200 hover:text-white transition-all duration-200 hover:scale-110 relative"
          >
            <ShoppingCart className="w-5 h-5 md:w-5.5 md:h-5.5" />
          </Link>

          {/* User Profile Link */}
          <Link
            href="/profile"
            className="text-neutral-200 hover:text-white transition-all duration-200 hover:scale-110"
          >
            <User className="w-5 h-5 md:w-5.5 md:h-5.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
