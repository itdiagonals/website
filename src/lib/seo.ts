export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }
  // Vercel production
  if (process.env.VERCEL_ENV === 'production') {
    return 'https://diagonals.id'
  }
  // Vercel preview deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  // Fallback for staging / local
  return 'https://preview.diagonals.id'
}

export const SITE_NAME = 'Diagonals'
export const SITE_TAGLINE = 'Curated Streetwear & Essentials'
export const SITE_DESCRIPTION =
  'Discover curated streetwear collections at Diagonals. Explore the latest drops, exclusive collaborations, and timeless essentials crafted for the modern urban lifestyle.'

export const OG_IMAGE = '/logo/diagonals.webp'
export const TWITTER_HANDLE = '@diagonals_id'
