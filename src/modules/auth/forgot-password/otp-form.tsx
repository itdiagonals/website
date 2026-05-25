'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { type FormEvent, type KeyboardEvent, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

export default function OtpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const code = otp.join('')
    if (code.length !== 6 || !email) {
      setError('Email atau kode OTP belum lengkap.')
      return
    }

    setSubmitting(true)
    router.push(`/auth/forgot-password/new-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`)
  }

  async function handleResend() {
    if (!email) {
      setError('Email tidak ditemukan. Ulangi dari halaman forgot password.')
      return
    }

    setResending(true)
    setError(null)

    try {
      await api.otp.request({ email, purpose: 'password_reset' })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Gagal mengirim ulang OTP.')
    } finally {
      setResending(false)
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

            <p className="text-b3 text-center text-neutral-1000">
              Enter the 6-digit code sent to {email || 'your email'}
            </p>

            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-[7px]">
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                     value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="h-12 w-10 rounded-[6px] border border-zinc-200 bg-white text-center text-b2 text-neutral-1000 outline-none transition-colors focus:border-primary-300 sm:h-14 sm:w-12"
                    />
                ))}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="mt-4">
                <Button type="submit" variant="primary" size="default" disabled={submitting}>
                  {submitting ? 'Continuing...' : 'Verify'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        <p className="text-b3 text-center text-white">
          Didnt receive code?{' '}
          <button type="button" onClick={handleResend} className="underline hover:text-neutral-200" disabled={resending}>
            {resending ? 'Sending...' : 'Resend'}
          </button>
        </p>
        <Link href="/auth/forgot-password" className="text-b3 text-white underline hover:text-neutral-200">
          Change email
        </Link>
      </div>
    </section>
  )
}
