import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/src/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/auth',
          '/auth/*',
          '/cart',
          '/checkout',
          '/checkout/*',
          '/profile',
          '/orders',
          '/orders/*',
          '/invite-admin',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/auth',
          '/auth/*',
          '/cart',
          '/checkout',
          '/checkout/*',
          '/profile',
          '/orders',
          '/orders/*',
          '/invite-admin',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
