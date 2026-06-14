'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { type FormEvent, useEffect, useState } from 'react'

import Label from '@/components/ui/label'
import Input from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api, ApiError } from '@/lib/api'

function safeRedirectPath(target: string | null): string | null {
  if (!target) return null
  if (!target.startsWith('/')) return null
  if (target.startsWith('//') || target.startsWith('/\\')) return null
  return target
}

export default function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void api.auth.getCsrf().catch(() => undefined)
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await api.auth.login({ email, password })

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-changed'))
      }

      try {
        await api.users.getAll(1, 1)
        const redirectTarget = safeRedirectPath(searchParams.get('redirect'))
        if (redirectTarget && redirectTarget.startsWith('/admin')) {
          router.replace(redirectTarget)
        } else {
          router.replace('/admin')
        }
        router.refresh()
      } catch (adminCheckError) {
        if (adminCheckError instanceof ApiError && adminCheckError.status === 403) {
          const redirectTarget = safeRedirectPath(searchParams.get('redirect'))
          if (redirectTarget && !redirectTarget.startsWith('/admin')) {
            router.replace(redirectTarget)
          } else {
            router.replace('/')
          }
          router.refresh()
        } else {
          router.replace('/')
          router.refresh()
        }
      }
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 403) {
        setError('Email belum diverifikasi. Silakan periksa kotak masuk Anda atau daftar ulang.')
      } else {
        setError(caughtError instanceof Error ? caughtError.message : 'Login gagal.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/auth-bg.webp)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

      <div className="relative z-10 flex w-full max-w-[540px] flex-col items-center gap-[26px] px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full rounded-[20px] bg-neutral-100 p-4 sm:p-[22px]">
          <div className="flex flex-col items-center gap-[7px]">
            <div className="flex h-[65px] w-[259px] items-center justify-center">
              <Image
                src="/logo/diagonals.webp"
                alt="Logo"
                width={259}
                height={65}
                priority
                className="h-full w-full object-contain"
              />
            </div>

            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-[7px]">
              <div className="flex flex-col gap-[7px]">
                <Label text="Email" htmlFor="email" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  className="disabled:opacity-70"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-[7px]">
                <Label text="Password" htmlFor="password" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  className="disabled:opacity-70"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600">
                  <p>{error}</p>
                  {error.includes('Email belum diverifikasi') && (
                    <p className="mt-1">
                      <Link
                        href={`/auth/verify-email?email=${encodeURIComponent(email)}`}
                        className="underline text-primary-600 hover:text-primary-500"
                      >
                        Verifikasi email sekarang
                      </Link>
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4">
                <Button type="submit" variant="auth" size="full" disabled={submitting}>
                  {submitting ? 'Signing in...' : 'Enter'}
                </Button>
              </div>
            </form>

            <Link
              href="/auth/forgot-password"
              className="self-start text-b3 text-primary-500 transition-colors hover:text-primary-400"
            >
              Forgot Password
            </Link>
          </div>
        </div>

        <p className="text-b3 text-center text-white">
          Dont Have an Account,{' '}
          <Link href="/auth/sign-up" className="underline hover:text-neutral-200">
            Sign Up
          </Link>
        </p>
      </div>
    </section>
  )
}
