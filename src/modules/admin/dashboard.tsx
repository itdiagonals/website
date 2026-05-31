'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowUpRight, BookOpen, Box, Calendar, ImageIcon, Layers, LoaderCircle, Package, Palette, Ruler, ShieldCheck, ShoppingBag, Users } from 'lucide-react'

import { api, type Product, type Season, type User } from '@/lib/api'
import { formatDate, formatPrice } from '@/modules/admin/helpers'
import { cn } from '@/lib/utils'

interface DashboardStats {
  products: number
  seasons: number
  active_seasons: number
  care_guides: number
  media: number
  users: number
  admin_users: number
  low_stock: number
  out_of_stock: number
  total_stock: number
  catalog_value: number
}

export default function DashboardModule() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stats`)
        if (!statsRes.ok) throw new Error('Failed to load stats')
        const statsData = await statsRes.json()
        setStats(statsData.data)

        const [productItems, seasonItems, userItems] = await Promise.all([
          api.products.getAll(),
          api.seasons.getAll(),
          api.users.getAll(),
        ])
        setProducts(productItems)
        setSeasons(seasonItems)
        setUsers(userItems)
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  const activeSeasons = useMemo(() => seasons.filter((s) => s.is_active), [seasons])
  const lowStockProducts = useMemo(() => products.filter((p) => p.stock < 10 && p.stock > 0), [products])
  const outOfStockProducts = useMemo(() => products.filter((p) => p.stock === 0), [products])

  const recentActivity = useMemo(() => {
    const items = [
      ...products.map((p) => ({ type: 'product' as const, id: p.id, name: p.name, slug: p.slug, updated_at: p.updated_at, cover_image: p.cover_image })),
      ...seasons.map((s) => ({ type: 'season' as const, id: s.id, name: s.name, slug: s.slug, updated_at: s.updated_at, cover_image: s.cover_image })),
    ]
    return items.sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 6)
  }, [products, seasons])

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <LoaderCircle className="h-8 w-8 animate-spin text-neutral-400" />
        <p className="text-sm text-neutral-500">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold text-primary-1000">{error}</p>
      </div>
    )
  }

  const s = stats ?? {
    products: 0, seasons: 0, active_seasons: 0, care_guides: 0,
    media: 0, users: 0, admin_users: 0, low_stock: 0,
    out_of_stock: 0, total_stock: 0, catalog_value: 0,
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-neutral-400">{today}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-primary-1000">Dashboard</h1>
        <p className="mt-0.5 text-sm text-neutral-500">Overview of your catalog and store health.</p>
      </div>

      {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <div className="flex flex-col gap-2 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Stock Alerts
          </div>
          <div className="flex flex-wrap gap-2">
            {outOfStockProducts.map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                <Box className="h-3 w-3" />
                {p.name} — Out of stock
              </span>
            ))}
            {lowStockProducts.map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                <Box className="h-3 w-3" />
                {p.name} — {p.stock} left
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Products" value={s.products} icon={<Package className="h-4 w-4" />} href="/admin/products" />
        <MetricCard label="Active Seasons" value={s.active_seasons} icon={<Calendar className="h-4 w-4" />} href="/admin/seasons" />
        <MetricCard label="Categories" value={products.filter((p, i, arr) => arr.findIndex((x) => x.category_id === p.category_id) === i).length} icon={<Layers className="h-4 w-4" />} href="/admin/categories" />
        <MetricCard label="Total Stock" value={s.total_stock} icon={<Box className="h-4 w-4" />} href="/admin/products" />
        <MetricCard label="Media" value={s.media} icon={<ImageIcon className="h-4 w-4" />} href="/admin/products" />
        <MetricCard label="Care Guides" value={s.care_guides} icon={<BookOpen className="h-4 w-4" />} href="/admin/care-guides" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <section className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Recent Activity</h2>
              <div className="flex items-center gap-3 text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-500" />
                  Product
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500" />
                  Season
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-0">
              {recentActivity.length === 0 && (
                <p className="py-4 text-sm text-neutral-400">No recent activity.</p>
              )}
              {recentActivity.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.type === 'product' ? `/admin/products/${item.id}` : '/admin/seasons'}
                  className="group flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-neutral-50"
                >
                  {item.cover_image?.url ? (
                    <img
                      src={item.cover_image.url}
                      alt={item.cover_image.alt || item.name}
                      className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-neutral-100"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400">
                      {item.type === 'product' ? <Package className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium text-neutral-800 group-hover:text-primary-800">{item.name}</span>
                    <span className="text-xs text-neutral-400">{item.type === 'product' ? 'Product' : 'Season'} · Updated {formatDate(item.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-block h-2 w-2 rounded-full',
                        item.type === 'product' ? 'bg-primary-500' : 'bg-violet-500',
                      )}
                    />
                    <ArrowUpRight className="h-3.5 w-3.5 text-neutral-300 transition-colors group-hover:text-neutral-500" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">Catalog Value</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-primary-1000">{formatPrice(s.catalog_value)}</span>
              <span className="text-sm text-neutral-400">total inventory value</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-neutral-400">Base price avg</p>
                <p className="mt-0.5 text-sm font-semibold text-neutral-700">
                  {s.products > 0 ? formatPrice(Math.round(s.catalog_value / Math.max(s.total_stock, 1))) : formatPrice(0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Total units</p>
                <p className="mt-0.5 text-sm font-semibold text-neutral-700">{s.total_stock}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Out of stock</p>
                <p className={cn('mt-0.5 text-sm font-semibold', s.out_of_stock > 0 ? 'text-red-600' : 'text-neutral-700')}>
                  {s.out_of_stock}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">Quick Actions</h2>
            <div className="flex flex-col gap-1">
              <QuickAction href="/admin/products" icon={<ShoppingBag className="h-4 w-4" />} label="Add Product" desc="Create a new product listing" />
              <QuickAction href="/admin/seasons" icon={<Calendar className="h-4 w-4" />} label="Manage Seasons" desc="Activate or edit seasons" />
              <QuickAction href="/admin/categories" icon={<Layers className="h-4 w-4" />} label="Categories" desc="Organize product categories" />
              <QuickAction href="/admin/care-guides" icon={<BookOpen className="h-4 w-4" />} label="Care Guides" desc="Add washing instructions" />
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Admin Team</h2>
              <Link href="/admin/invite-admin" className="text-xs font-medium text-primary-700 transition-colors hover:text-primary-1000">
                Invite
              </Link>
            </div>
            <div className="flex flex-col gap-0">
              {users.filter((u) => u.role === 'admin').length === 0 && (
                <p className="py-2 text-sm text-neutral-400">No admin users.</p>
              )}
              {users
                .filter((u) => u.role === 'admin')
                .map((user) => (
                  <div key={user.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600">
                      {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-1 flex-col gap-0">
                      <span className="text-sm font-medium text-neutral-800">{user.name || user.email}</span>
                      <span className="text-xs text-neutral-400">{user.email}</span>
                    </div>
                    <span className="rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-700">
                      {user.role}
                    </span>
                  </div>
                ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">Active Seasons</h2>
            {activeSeasons.length === 0 && (
              <p className="text-sm text-neutral-400">No active seasons.</p>
            )}
            <div className="flex flex-col gap-2">
              {activeSeasons.map((season) => (
                <div key={season.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                  {season.cover_image?.url ? (
                    <img src={season.cover_image.url} alt={season.name} className="h-8 w-8 shrink-0 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-400">
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-0">
                    <span className="text-sm font-medium text-neutral-800">{season.name}</span>
                    <span className="text-xs text-neutral-400">{season.subtitle || season.slug}</span>
                  </div>
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  href,
}: {
  label: string
  value: number
  icon: React.ReactNode
  href: string
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-neutral-200/60 transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-400">{label}</span>
        <span className="text-neutral-300 transition-colors group-hover:text-neutral-500">{icon}</span>
      </div>
      <span className="text-xl font-semibold tracking-tight text-neutral-800">{value}</span>
    </Link>
  )
}

function QuickAction({
  href,
  icon,
  label,
  desc,
}: {
  href: string
  icon: React.ReactNode
  label: string
  desc: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-neutral-50"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 transition-colors group-hover:bg-primary-50 group-hover:text-primary-600">
        {icon}
      </span>
      <div className="flex flex-1 flex-col gap-0">
        <span className="text-sm font-medium text-neutral-800">{label}</span>
        <span className="text-xs text-neutral-400">{desc}</span>
      </div>
      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-300 transition-colors group-hover:text-neutral-500" />
    </Link>
  )
}
