'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2, LogOut, User, ChevronDown } from 'lucide-react'

import { api, ApiError, type User as UserModel } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { NavbarVariant } from '@/src/components/ui/navbar'

interface NavbarAccountMenuProps {
  variant: NavbarVariant
  isScrolled: boolean
}

export default function NavbarAccountMenu({ variant, isScrolled }: NavbarAccountMenuProps) {
  const pathname = usePathname()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<UserModel | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadUser = async () => {
      setIsCheckingAuth(true)

      try {
        const currentUser = await api.users.me()
        if (!cancelled) {
          setUser(currentUser)
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status !== 401) {
            console.error('Failed to check auth state:', error)
          }
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsCheckingAuth(false)
        }
      }
    }

    void loadUser()

    const handleAuthChanged = () => {
      void loadUser()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('auth-changed', handleAuthChanged)
    }

    return () => {
      cancelled = true

      if (typeof window !== 'undefined') {
        window.removeEventListener('auth-changed', handleAuthChanged)
      }
    }
  }, [pathname])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const iconColor = isScrolled
    ? 'text-white hover:text-white'
    : variant === 'dark'
      ? 'text-white hover:text-white'
      : 'text-primary-500 hover:text-primary-900'

  const menuSurface = isScrolled || variant === 'dark'
    ? 'bg-primary-500 border-neutral-800/50 text-white'
    : 'bg-neutral-100 border-neutral-200 text-primary-500'

  const menuItemClass = cn(
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isScrolled || variant === 'dark'
      ? 'text-neutral-200 hover:bg-white/10 hover:text-white'
      : 'text-primary-500 hover:bg-neutral-200 hover:text-primary-900'
  )

  const handleProtectedNavigation = (href: string) => {
    if (user) {
      router.push(href)
      return
    }

    router.push(`/auth/sign-in?redirect=${encodeURIComponent(href)}`)
  }

  const handleLogout = async () => {
    setLoggingOut(true)

    try {
      await api.auth.logout()
    } catch {
      // If backend has already invalidated cookies, continue redirecting.
    } finally {
      setUser(null)
      setIsOpen(false)
      setLoggingOut(false)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-changed'))
      }
      router.replace('/auth/sign-in')
      router.refresh()
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={user ? 'Open account menu' : 'Open sign in menu'}
        onClick={() => setIsOpen((open) => !open)}
        className={cn('flex items-center gap-1 transition-all duration-500 ease-in-out hover:scale-110', iconColor)}
      >
        <User className="h-5 w-5 md:h-5.5 md:w-5.5" />
        <ChevronDown className={cn('h-4 w-4 transition-transform duration-300', isOpen && 'rotate-180')} />
      </button>

      <div
        className={cn(
          'absolute right-0 top-full mt-3 w-56 border p-2 shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition-all duration-200',
          menuSurface,
          isOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'
        )}
      >
        {isCheckingAuth ? (
          <div className="flex items-center gap-2 px-3 py-3 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking account...
          </div>
        ) : user ? (
          <>
            <div className="border-b border-current/10 px-3 py-3">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs opacity-70">{user.email}</p>
            </div>
            <div className="flex flex-col gap-1 py-2">
              <button type="button" onClick={() => handleProtectedNavigation('/profile')} className={menuItemClass}>
                <User className="h-4 w-4" />
                Profile
              </button>
            </div>
            <div className="border-t border-current/10 pt-2">
              <button type="button" onClick={handleLogout} disabled={loggingOut} className={cn(menuItemClass, 'w-full justify-start disabled:opacity-60')}>
                <LogOut className="h-4 w-4" />
                {loggingOut ? 'Signing out...' : 'Logout'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2 p-2">
            <p className="px-1 text-xs uppercase tracking-[0.18em] opacity-60">Guest</p>
            <Link href="/auth/sign-in" className={menuItemClass}>
              <User className="h-4 w-4" />
              Sign In
            </Link>
            <Link href="/auth/sign-up" className={menuItemClass}>
              <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
              Create Account
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
