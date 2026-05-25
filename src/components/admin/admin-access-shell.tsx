'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { api, ApiError } from '@/lib/api'

type AccessState = 'checking' | 'allowed' | 'forbidden' | 'error'

export default function AdminAccessShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [state, setState] = useState<AccessState>('checking')
  const [message, setMessage] = useState('Checking admin access...')

  useEffect(() => {
    let cancelled = false

    async function verifyAccess() {
      try {
        await api.users.getAll()
        if (!cancelled) {
          setState('allowed')
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        if (error instanceof ApiError && error.status === 401) {
          const redirect = encodeURIComponent(pathname || '/admin')
          router.replace(`/auth/sign-in?redirect=${redirect}`)
          return
        }

        if (error instanceof ApiError && error.status === 403) {
          setState('forbidden')
          setMessage('Akun ini berhasil login, tetapi tidak memiliki role admin.')
          return
        }

        setState('error')
        setMessage(error instanceof Error ? error.message : 'Failed to verify admin access.')
      }
    }

    verifyAccess()

    return () => {
      cancelled = true
    }
  }, [pathname, router])

  if (state === 'allowed') {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-300 bg-neutral-100 p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-primary-1000">
          {state === 'checking' ? 'Memeriksa akses admin' : 'Akses admin tidak tersedia'}
        </h1>
        <p className="mt-3 text-sm text-neutral-700">{message}</p>
        {state !== 'checking' && (
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/auth/sign-in"
              className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-400"
            >
              Kembali ke sign in
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-primary-900 transition-colors hover:bg-neutral-200"
            >
              Ke beranda
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
