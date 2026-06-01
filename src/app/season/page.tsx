import ThemeHero from "@/src/modules/theme-hero"
import { api, Season } from "@/src/lib/api"

function sortByLatest(items: Season[]) {
  return [...items].sort(
    (a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime(),
  )
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
            image: season.cover_image?.url || "/image-1.png",
            href: `/season/${season.slug}`,
          }}
        />
      ))}
    </>
  )
}

export default SeasonPage
