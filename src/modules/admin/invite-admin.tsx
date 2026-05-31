'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle, LoaderCircle, Mail, Send, ShieldCheck, UserPlus, XCircle } from 'lucide-react'

import { api } from '@/lib/api'

export default function InviteAdminModule() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [tokenStatus, setTokenStatus] = useState<'loading' | 'valid' | 'invalid' | 'promoted' | 'needs_register'>('loading')
  const [tokenEmail, setTokenEmail] = useState('')

  useEffect(() => {
    if (!token) {
      setTokenStatus('invalid')
      return
    }

    async function checkToken() {
      const t = token ?? ''
      if (!t) {
        setTokenStatus('invalid')
        return
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/users/invite-check?token=${encodeURIComponent(t)}`)
        if (!res.ok) {
          setTokenStatus('invalid')
          return
        }
        const data = await res.json()
        if (!data?.data?.email) {
          setTokenStatus('invalid')
          return
        }
        setTokenEmail(data.data.email)
        if (data.data.user_exists) {
          await api.users.inviteRedeem({ token: t })
          setTokenStatus('promoted')
        } else {
          setTokenStatus('needs_register')
        }
      } catch {
        setTokenStatus('invalid')
      }
    }

    void checkToken()
  }, [token])

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault()
    setSending(true)
    setResult(null)
    setError(null)

    try {
      await api.users.invite({ email: email.trim() })
      setResult(`Invitation sent to ${email.trim()}`)
      setEmail('')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to send invitation.')
    } finally {
      setSending(false)
    }
  }

  if (token) {
    if (tokenStatus === 'loading') {
      return (
        <div className="flex h-96 flex-col items-center justify-center gap-3">
          <LoaderCircle className="h-8 w-8 animate-spin text-neutral-400" />
          <p className="text-sm text-neutral-500">Checking invitation...</p>
        </div>
      )
    }

    if (tokenStatus === 'invalid') {
      return (
        <div className="flex h-96 flex-col items-center justify-center gap-4">
          <XCircle className="h-12 w-12 text-red-500" />
          <p className="text-lg font-semibold text-primary-1000">Invalid or expired invitation</p>
          <p className="text-sm text-neutral-500">The invite link has expired or is invalid. Ask an admin to send a new invitation.</p>
          <Link href="/admin" className="inline-flex items-center gap-1.5 rounded-lg bg-primary-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-800">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      )
    }

    if (tokenStatus === 'promoted') {
      return (
        <div className="flex h-96 flex-col items-center justify-center gap-4">
          <CheckCircle className="h-12 w-12 text-emerald-500" />
          <p className="text-lg font-semibold text-primary-1000">Welcome to the admin team</p>
          <p className="text-sm text-neutral-500">{tokenEmail} has been promoted to admin. You can now access the admin dashboard.</p>
          <Link href="/admin" className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-800">
            <ShieldCheck className="h-4 w-4" />
            Go to Dashboard
          </Link>
        </div>
      )
    }

    if (tokenStatus === 'needs_register') {
      return (
        <div className="flex h-96 flex-col items-center justify-center gap-4">
          <UserPlus className="h-12 w-12 text-primary-500" />
          <p className="text-lg font-semibold text-primary-1000">Create your account</p>
          <p className="max-w-sm text-center text-sm text-neutral-500">
            {tokenEmail} is invited to become an admin, but you don&apos;t have an account yet. Create one below and you&apos;ll be automatically promoted to admin.
          </p>
          <Link
            href={`/register?invite_token=${encodeURIComponent(token)}&email=${encodeURIComponent(tokenEmail)}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-800"
          >
            <UserPlus className="h-4 w-4" />
            Create Account
          </Link>
          <p className="text-xs text-neutral-400">After registration, return here to accept the invitation.</p>
        </div>
      )
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/admin" className="transition-colors hover:text-primary-1000">
          Dashboard
        </Link>
        <span>/</span>
        <span className="font-medium text-primary-1000">Invite Admin</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary-1000">Invite Admin</h1>
        <p className="mt-0.5 text-sm text-neutral-500">Send an invitation to promote a user to admin.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <form onSubmit={handleInvite} className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60 xl:col-span-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="invite-email" className="text-sm font-medium text-neutral-700">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                disabled={sending}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm text-neutral-800 outline-none transition-colors focus:border-primary-500 focus:bg-white"
              />
            </div>
            <p className="text-xs text-neutral-400">
              If the user already exists, they will be promoted immediately. Otherwise, an invitation email will be sent.
            </p>
          </div>

          {result && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle className="h-4 w-4" />
              {result}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <XCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={sending || !email.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? 'Sending invitation...' : 'Send Invite'}
          </button>
        </form>

        <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-400">How it works</h2>
          <ol className="flex flex-col gap-3 text-sm text-neutral-600">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-500">1</span>
              Enter the email of the person you want to invite.
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-500">2</span>
              If they already have an account, their role is promoted to admin instantly.
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-500">3</span>
              If not, they receive an email invitation with a link to create an account and join as admin.
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
