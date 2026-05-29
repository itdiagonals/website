'use client'

import Link from 'next/link'
import { Ban, Lock } from 'lucide-react'

export default function TransactionsListModule() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-1000">Transactions</h1>
        <p className="mt-1 text-sm text-neutral-700">This page is wired to the backend capability that exists today.</p>
      </div>

      <div className="rounded-2xl border border-neutral-300 bg-neutral-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-primary-1000">
          <Lock className="h-6 w-6" />
          <h2 className="text-lg font-bold">Admin transaction API is not available yet</h2>
        </div>

        <p className="mt-4 text-sm leading-6 text-neutral-800">
          The Go backend currently exposes transaction history only for role <code>customer</code> through <code>/api/v1/transactions</code>.
          The admin app therefore does not render dummy transaction data here.
        </p>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-semibold">
            <Ban className="h-4 w-4" />
            Current backend limitation
          </div>
          <p className="mt-2">
            To make this page live, the backend still needs an admin-safe endpoint for listing and inspecting all customer transactions.
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <Link href="/admin" className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-400">
            Back to dashboard
          </Link>
          <Link href="/admin/products" className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-primary-900 transition-colors hover:bg-neutral-200">
            Manage products
          </Link>
        </div>
      </div>
    </div>
  )
}
