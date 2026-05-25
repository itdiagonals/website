'use client'

import Link from 'next/link'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { BookOpen, Calendar, ImageIcon, Package, ShieldCheck, TriangleAlert } from 'lucide-react'

import StatCard from '@/components/admin/stat-card'
import { api, type CareGuide, type Media, type Product, type Season, type User } from '@/lib/api'
import { formatDate, formatPrice } from '@/modules/admin/helpers'

interface DashboardState {
  products: Product[]
  seasons: Season[]
  careGuides: CareGuide[]
  media: Media[]
  users: User[]
}

export default function DashboardModule() {
  const [data, setData] = useState<DashboardState>({
    products: [],
    seasons: [],
    careGuides: [],
    media: [],
    users: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        const [products, seasons, careGuides, media, users] = await Promise.all([
          api.products.getAll(),
          api.seasons.getAll(),
          api.careGuides.getAll(),
          api.media.getAll(),
          api.users.getAll(),
        ])

        setData({ products, seasons, careGuides, media, users })
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  const activeSeasons = useMemo(() => data.seasons.filter((season) => season.is_active), [data.seasons])
  const lowStockProducts = useMemo(() => data.products.filter((product) => product.stock < 10), [data.products])
  const catalogValue = useMemo(() => data.products.reduce((sum, product) => sum + product.base_price * product.stock, 0), [data.products])
  const recentProducts = useMemo(
    () => [...data.products].sort((left, right) => right.updated_at.localeCompare(left.updated_at)).slice(0, 5),
    [data.products],
  )

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-primary-1000">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-700">Backend-backed overview for catalog and admin access.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Catalog Value" value={loading ? '...' : formatPrice(catalogValue)} change="Base price x stock" changeType="neutral" icon={<Package className="h-5 w-5" />} />
        <StatCard title="Products" value={loading ? '...' : data.products.length} change={`${lowStockProducts.length} low stock`} changeType={lowStockProducts.length ? 'negative' : 'positive'} icon={<Package className="h-5 w-5" />} />
        <StatCard title="Active Seasons" value={loading ? '...' : activeSeasons.length} change={`${data.seasons.length} total seasons`} changeType="neutral" icon={<Calendar className="h-5 w-5" />} />
        <StatCard title="Admin Users" value={loading ? '...' : data.users.length} change="Verified by protected admin route" changeType="positive" icon={<ShieldCheck className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-300 bg-neutral-100 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-300 px-5 py-4">
            <h2 className="text-base font-bold text-primary-1000">Recently Updated Products</h2>
            <Link href="/admin/products" className="text-sm font-medium text-primary-700 transition-colors hover:text-primary-1000">
              View All
            </Link>
          </div>
          <div className="divide-y divide-neutral-300">
            {loading && <div className="px-5 py-6 text-sm text-neutral-700">Loading products...</div>}
            {!loading &&
              recentProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-primary-1000">{product.name}</span>
                    <span className="text-xs text-neutral-700">{product.category?.name || 'No category'}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-medium text-primary-1000">{formatPrice(product.base_price)}</span>
                    <span className="text-xs text-neutral-700">Updated {formatDate(product.updated_at)}</span>
                  </div>
                </div>
              ))}
            {!loading && recentProducts.length === 0 && <div className="px-5 py-6 text-sm text-neutral-700">No products available.</div>}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-300 bg-neutral-100 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-300 px-5 py-4">
            <h2 className="text-base font-bold text-primary-1000">Catalog Resources</h2>
            <div className="text-sm font-bold text-primary-700">Live backend counts</div>
          </div>
          <div className="grid grid-cols-1 gap-3 px-5 py-5 sm:grid-cols-3">
            <ResourceCard label="Care Guides" value={loading ? '...' : String(data.careGuides.length)} icon={<BookOpen className="h-4 w-4" />} />
            <ResourceCard label="Media" value={loading ? '...' : String(data.media.length)} icon={<ImageIcon className="h-4 w-4" />} />
            <ResourceCard label="Low Stock" value={loading ? '...' : String(lowStockProducts.length)} icon={<TriangleAlert className="h-4 w-4" />} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-300 bg-neutral-100 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-300 px-5 py-4">
            <h2 className="text-base font-bold text-primary-1000">Active Seasons</h2>
            <Link href="/admin/seasons" className="text-sm font-medium text-primary-700 transition-colors hover:text-primary-1000">
              Manage
            </Link>
          </div>
          <div className="divide-y divide-neutral-300">
            {loading && <div className="px-5 py-6 text-sm text-neutral-700">Loading seasons...</div>}
            {!loading &&
              activeSeasons.map((season) => (
                <div key={season.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-medium text-primary-1000">{season.name}</p>
                    <p className="text-xs text-neutral-700">{season.subtitle || season.slug}</p>
                  </div>
                  <span className="text-xs text-neutral-700">Updated {formatDate(season.updated_at)}</span>
                </div>
              ))}
            {!loading && activeSeasons.length === 0 && <div className="px-5 py-6 text-sm text-neutral-700">No active seasons found.</div>}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-300 bg-neutral-100 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-300 px-5 py-4">
            <h2 className="text-base font-bold text-primary-1000">Admin Accounts</h2>
            <span className="text-sm font-medium text-primary-700">Protected `/users` route</span>
          </div>
          <div className="divide-y divide-neutral-300">
            {loading && <div className="px-5 py-6 text-sm text-neutral-700">Loading users...</div>}
            {!loading &&
              data.users.map((user) => (
                <div key={user.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-medium text-primary-1000">{user.name || user.email}</p>
                    <p className="text-xs text-neutral-700">{user.email}</p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-neutral-700">{user.role}</span>
                </div>
              ))}
            {!loading && data.users.length === 0 && <div className="px-5 py-6 text-sm text-neutral-700">No admin users found.</div>}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
        <p className="font-semibold">Transaction analytics are not exposed on an admin backend route yet.</p>
        <p className="mt-1">The current Go backend only exposes `/transactions` for role `customer`, so this dashboard intentionally avoids showing fake transaction data.</p>
      </div>
    </div>
  )
}

function ResourceCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-4">
      <div className="flex items-center gap-2 text-primary-800">{icon}<span className="text-sm font-medium">{label}</span></div>
      <p className="mt-3 text-2xl font-bold text-primary-1000">{value}</p>
    </div>
  )
}
