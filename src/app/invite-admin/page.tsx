'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle, LoaderCircle, LogIn, Mail, ShieldCheck, UserPlus, XCircle } from 'lucide-react'

import { api } from '@/lib/api'

function InviteRedeemModule() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'promoted' | 'needs_auth'>(token ? 'loading' : 'invalid')
  const [tokenEmail, setTokenEmail] = useState('')

  useEffect(() => {
    if (!token) {
      return
    }

    async function checkToken() {
      const t = token ?? ''
      if (!t) {
        setStatus('invalid')
        return
      }
      try {
        const res = await fetch(`/api/v1/users/invite-check?token=${encodeURIComponent(t)}`)
        if (!res.ok) {
          setStatus('invalid')
          return
        }
        const data = await res.json()
        if (!data?.data?.email) {
          setStatus('invalid')
          return
        }
        setTokenEmail(data.data.email)

        if (data.data.user_exists) {
          try {
            await api.users.inviteRedeem({ token: t })
            setStatus('promoted')
          } catch {
            setStatus('needs_auth')
          }
        } else {
          setStatus('needs_auth')
        }
      } catch {
        setStatus('invalid')
      }
    }

    void checkToken()
  }, [token])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-neutral-100">
        <LoaderCircle className="h-8 w-8 animate-spin text-neutral-400" />
        <p className="text-sm text-neutral-500">Checking invitation...</p>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-100 px-6">
        <XCircle className="h-12 w-12 text-red-500" />
        <p className="text-lg font-semibold text-primary-1000">Invalid or expired invitation</p>
        <p className="max-w-sm text-center text-sm text-neutral-500">The invite link has expired or is invalid. Ask an admin to send a new invitation.</p>
        <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-800">
          Go to Homepage
        </Link>
      </div>
    )
  }

  if (status === 'promoted') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-100 px-6">
        <CheckCircle className="h-12 w-12 text-emerald-500" />
        <p className="text-lg font-semibold text-primary-1000">Welcome to the admin team!</p>
        <p className="max-w-sm text-center text-sm text-neutral-500">
          {tokenEmail} has been promoted to admin. You can now access the admin dashboard.
        </p>
        <Link href="/admin" className="inline-flex items-center gap-1.5 rounded-lg bg-primary-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-800">
          <ShieldCheck className="h-4 w-4" />
          Go to Dashboard
        </Link>
      </div>
    )
  }

  const returnUrl = encodeURIComponent(`/invite-admin?token=${encodeURIComponent(token ?? '')}`)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-100 px-6 py-10">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
        <Mail className="h-8 w-8 text-primary-900" />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-primary-1000">You have been invited</h1>
        <p className="mt-2 max-w-sm text-sm text-neutral-500">
          <strong className="text-neutral-800">{tokenEmail}</strong> has been invited to join the Diagonals admin team.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href={`/auth/sign-in?redirect=${returnUrl}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-800"
        >
          <LogIn className="h-4 w-4" />
          Sign In
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <Link
          href={`/auth/sign-up?redirect=${returnUrl}&email=${encodeURIComponent(tokenEmail)}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
        >
          <UserPlus className="h-4 w-4" />
          Create Account
        </Link>
      </div>

      <p className="max-w-xs text-center text-xs text-neutral-400">
        After signing in or creating an account, you will be automatically redirected back to accept the invitation.
      </p>
    </div>
  )
}

export default function InviteRedeemPage() {
  return (
    <Suspense fallback={null}>
      <InviteRedeemModule />
    </Suspense>
  )
}
