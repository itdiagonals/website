'use client';

import { usePathname } from 'next/navigation';
import Navbar from './ui/navbar';
import Footer from './ui/footer';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const isAuth = pathname?.startsWith('/auth');
  const shouldHideShell = isAdmin || isAuth;

  return (
    <>
      {!shouldHideShell && <Navbar variant="transparent" />}
      <main className={!shouldHideShell ? 'pt-20' : ''}>{children}</main>
      {!shouldHideShell && <Footer />}
    </>
  );
}
