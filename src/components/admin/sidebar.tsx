'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { BookOpen, Calendar, LayoutDashboard, LogOut, Menu, Package, Receipt, Tag, X } from 'lucide-react'

import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/seasons', label: 'Seasons', icon: Calendar },
  { href: '/admin/care-guides', label: 'Care Guides', icon: BookOpen },
  { href: '/admin/transactions', label: 'Transactions', icon: Receipt },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)

    try {
      await api.auth.logout()
    } catch {
      // Backend already clears cookies on successful logout, but the user should still be returned to sign-in.
    } finally {
      router.replace('/auth/sign-in')
      setLoggingOut(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
          className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500 text-white shadow-md lg:hidden"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-neutral-300 bg-neutral-100 transition-transform duration-300 ease-in-out',
          '-translate-x-full lg:translate-x-0',
          isOpen && 'translate-x-0',
        )}
      >
        <div className="flex h-16 items-center border-b border-neutral-300 px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center bg-primary-500 text-sm font-bold text-white">DG</div>
            <span className="text-sm font-bold tracking-tight text-primary-1000">Diagonals Admin</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(`${item.href}/`))
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                      isActive ? 'bg-primary-500 text-white' : 'text-primary-800 hover:bg-neutral-200 hover:text-primary-1000',
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-neutral-300 p-4">
          <div className="rounded-lg bg-neutral-200 px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">AD</div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-primary-1000">Admin</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? 'Signing out...' : 'Logout'}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
