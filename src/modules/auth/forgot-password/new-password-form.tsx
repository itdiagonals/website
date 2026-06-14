'use client'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { type FormEvent, useEffect, useState } from 'react'

import Label from '@/components/ui/label'
import Input from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

export default function NewPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const code = searchParams.get('code') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void api.auth.getCsrf().catch(() => undefined)
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!email || !code) {
      setError('Email atau OTP tidak ditemukan. Ulangi flow reset password.')
      return
    }

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password harus sama.')
      return
    }

    setSubmitting(true)

    try {
      await api.auth.resetPassword({ email, code, new_password: password })
      router.replace('/auth/sign-in?reset=1')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Gagal mengganti password.')
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

            <p className="text-b3 text-neutral-1000">Create New Password</p>

            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-[7px]">
              <div className="flex flex-col gap-[7px]">
                <Label text="Password" htmlFor="password" />
                <Input id="password" name="password" type="password" placeholder="Enter new password" required value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>

              <div className="flex flex-col gap-[7px]">
                <Label text="Confirm Password" htmlFor="confirm-password" />
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="mt-4">
                <Button type="submit" variant="auth" size="full" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Enter'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
