'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { type FormEvent, useEffect, useState } from 'react'

import Label from '@/components/ui/label'
import Input from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

export default function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTarget = searchParams.get('redirect') || '/auth/sign-in'
  const prefilledEmail = searchParams.get('email') || ''

  const [name, setName] = useState('')
  const [email, setEmail] = useState(prefilledEmail)
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

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password harus sama.')
      return
    }

    setSubmitting(true)

    try {
      await api.auth.register({ name, email, password })
      const signInUrl = redirectTarget.startsWith('/')
        ? `/auth/sign-in?redirect=${encodeURIComponent(redirectTarget)}`
        : '/auth/sign-in'
      router.replace(signInUrl)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Registrasi gagal.')
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

      <div className="relative z-10 flex w-full max-w-[540px] flex-col items-center gap-[23px] px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full rounded-[20px] bg-neutral-100 p-4 sm:p-[22px]">
          <div className="flex flex-col items-center gap-[7px]">
            <div className="flex h-[65px] w-[259px] items-center justify-center">
              <img
                src="/images/diagonals.webp"
                alt="Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-[7px]">
              <div className="flex flex-col gap-[7px]">
                <Label text="Name" htmlFor="name" />
                <Input id="name" name="name" type="text" placeholder="Enter your name" required value={name} onChange={(event) => setName(event.target.value)} />
              </div>

              <div className="flex flex-col gap-[7px]">
                <Label text="Email" htmlFor="email" />
                <Input id="email" name="email" type="email" placeholder="Enter your email" required value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>

              <div className="flex flex-col gap-[7px]">
                <Label text="Password" htmlFor="password" />
                <Input id="password" name="password" type="password" placeholder="Enter your password" required value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>

              <div className="flex flex-col gap-[7px]">
                <Label text="Re-Enter Password" htmlFor="confirm-password" />
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  placeholder="Re-enter your password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="mt-4">
                <Button type="submit" variant="primary" size="default" disabled={submitting}>
                  {submitting ? 'Creating account...' : 'Sign Up'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        <p className="text-b3 text-center text-white">
          Have an Account,{' '}
          <Link href="/auth/sign-in" className="underline hover:text-neutral-200">
            Press Here
          </Link>
        </p>
      </div>
    </section>
  )
}
