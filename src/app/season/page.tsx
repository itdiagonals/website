import ThemeHero from "@/src/modules/theme-hero"
import { api, Season } from "@/src/lib/api"

function sortByLatest(items: Season[]) {
  return [...items].sort(
    (a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime(),
  )
}

import type { Metadata } from 'next'
import { SITE_NAME } from '@/src/lib/seo'

export const metadata: Metadata = {
  title: `Seasons & Collections | ${SITE_NAME}`,
  description: 'Explore all Diagonals seasons and collections. From exclusive drops to timeless essentials.',
  openGraph: {
    title: `Seasons & Collections | ${SITE_NAME}`,
    description: 'Explore all Diagonals seasons and collections. From exclusive drops to timeless essentials.',
    type: 'website',
  },
  alternates: {
    canonical: '/season',
  },
}

const SeasonPage = async () => {
  const seasons = sortByLatest(await api.seasons.getAll(1, 1000))

  return (
    <>
      {seasons.map((season) => (
        <ThemeHero
          key={season.id}
          theme={{
            title: season.name,
            subtitle: season.subtitle || "Theme of the season!",
            image: season.cover_image?.url || "/image-1.webp",
            href: `/season/${season.slug}`,
          }}
        />
      ))}
    </>
  )
}

export default SeasonPage
