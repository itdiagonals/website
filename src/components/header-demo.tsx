"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-neutral-100">
      <div className="flex items-center justify-between h-[80px] md:h-[139px] py-[12px] md:py-[20px] px-4 md:px-[24px] max-w-[1440px] mx-auto">
        <button
          className="flex md:hidden items-center p-[6.591px] bg-white/20 border border-black shrink-0"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="w-[15.818px] h-[15.818px] text-black" />
          ) : (
            <Menu className="w-[15.818px] h-[15.818px] text-black" />
          )}
        </button>

        <button className="hidden md:flex items-center p-[6.591px] bg-white/20 border border-black shrink-0">
          <Menu className="w-[15.818px] h-[15.818px] text-black" />
        </button>

        <div className="flex flex-col gap-[10px] md:gap-[20px] items-center justify-center flex-1">
          <Link href="/" className="relative w-[120px] md:w-[163.721px] h-[32px] md:h-[40.93px]">
            <Image
              src="/logo/diagonals.webp"
              alt="Diagonals"
              fill
              className="object-contain"
              sizes="164px"
              priority
            />
          </Link>
          <nav className="hidden md:flex items-center justify-center gap-[30px] lg:gap-[50px]">
            <Link href="/new-arrivals" className="text-primary-500 whitespace-nowrap text-b1 font-normal">
              New Arrivals
            </Link>
            <Link
              href="/season-theme"
              className="bg-primary-500 text-neutral-100 px-[10px] whitespace-nowrap text-b1 font-medium"
            >
              Season Theme
            </Link>
            <Link href="/diagonals" className="text-primary-500 whitespace-nowrap text-b1 font-medium">
              Diagonals
            </Link>
            <Link href="/diagonals" className="text-primary-500 whitespace-nowrap text-b1 font-medium">
              Diagonals
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-[10px] md:gap-[15.86px] shrink-0">
          <div className="relative bg-white/50 border border-black h-[28.837px] w-[40px] md:w-[158.605px] shrink-0 overflow-clip">
            <Search className="absolute right-[8px] md:left-[130.49px] top-[5.05px] w-[17.302px] h-[17.302px] text-black" />
          </div>

          <Link
            href="/cart"
            className="flex items-center justify-center p-[7.209px] bg-white/50 border border-black w-[31px] shrink-0"
          >
            <ShoppingCart className="w-[16.581px] h-[16.581px] text-black" />
          </Link>

          <Link
            href="/profile"
            className="flex items-center justify-center p-[7.209px] bg-white/50 border border-black shrink-0"
          >
            <User className="w-[16.581px] h-[16.581px] text-black" />
          </Link>
        </div>
      </div>

      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-[300px] border-t border-black/10" : "max-h-0"
        )}
      >
        <nav className="flex flex-col items-center gap-4 py-4 bg-neutral-100">
          <Link
            href="/new-arrivals"
            className="text-primary-500 whitespace-nowrap text-b1 font-normal"
            onClick={() => setMobileMenuOpen(false)}
          >
            New Arrivals
          </Link>
          <Link
            href="/season-theme"
            className="bg-primary-500 text-neutral-100 px-[10px] whitespace-nowrap text-b1 font-medium"
            onClick={() => setMobileMenuOpen(false)}
          >
            Season Theme
          </Link>
          <Link
            href="/diagonals"
            className="text-primary-500 whitespace-nowrap text-b1 font-medium"
            onClick={() => setMobileMenuOpen(false)}
          >
            Diagonals
          </Link>
          <Link
            href="/diagonals"
            className="text-primary-500 whitespace-nowrap text-b1 font-medium"
            onClick={() => setMobileMenuOpen(false)}
          >
            Diagonals
          </Link>
        </nav>
      </div>
    </header>
  );
}
