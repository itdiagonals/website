import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/src/lib/seo'

const API_BASE_URL = process.env.INTERNAL_API_URL || 'http://localhost:8080/api/v1'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()

  const staticRoutes = ['', '/products', '/season'].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: path === '' ? 1 : 0.8,
  }))

  let productRoutes: MetadataRoute.Sitemap = []
  let seasonRoutes: MetadataRoute.Sitemap = []

  try {
    const productsRes = await fetch(`${API_BASE_URL}/products?limit=1000`, {
      next: { revalidate: 3600 },
    })
    if (productsRes.ok) {
      const productsPayload = await productsRes.json()
      const products = productsPayload?.data ?? []
      productRoutes = products.map(
        (product: { slug: string; updated_at?: string }) => ({
          url: `${siteUrl}/products/${encodeURIComponent(product.slug)}`,
          lastModified: product.updated_at
            ? new Date(product.updated_at)
            : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }),
      )
    }
  } catch {
    // ignore fetch errors during sitemap generation
  }

  try {
    const seasonsRes = await fetch(`${API_BASE_URL}/seasons?limit=1000`, {
      next: { revalidate: 3600 },
    })
    if (seasonsRes.ok) {
      const seasonsPayload = await seasonsRes.json()
      const seasons = seasonsPayload?.data ?? []
      seasonRoutes = seasons.map(
        (season: { slug: string; updated_at?: string }) => ({
          url: `${siteUrl}/season/${encodeURIComponent(season.slug)}`,
          lastModified: season.updated_at
            ? new Date(season.updated_at)
            : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }),
      )
    }
  } catch {
    // ignore fetch errors during sitemap generation
  }

  return [...staticRoutes, ...productRoutes, ...seasonRoutes]
}
