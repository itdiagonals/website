'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useState } from 'react'

import Label from '@/components/ui/label'
import Input from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

export default function ForgotPasswordForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
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
      await api.otp.request({ email, purpose: 'password_reset' })
      router.push(`/auth/forgot-password/otp?email=${encodeURIComponent(email)}`)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Gagal mengirim OTP.')
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
              <img
                src="/images/diagonals.webp"
                alt="Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <p className="text-b3 text-neutral-1000">Forgot Password</p>

            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-[7px]">
              <div className="flex flex-col gap-[7px]">
                <Label text="Email" htmlFor="email" />
                <Input id="email" name="email" type="email" placeholder="Enter your email" required value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="mt-4">
                <Button type="submit" variant="default" size="default" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Code'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        <p className="text-b3 text-center text-white">
          Remember your password, {' '}
          <Link href="/auth/sign-in" className="underline hover:text-neutral-200">
            Sign In
          </Link>
        </p>
      </div>
    </section>
  )
}
