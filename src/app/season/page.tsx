import ThemeHero from "@/src/modules/theme-hero"

const SeasonPage = () => {
  return (
    <>
      <ThemeHero
        theme={{
          title: "Cross Player",
          subtitle: "Theme of the Season",
          image: "/CrossPlayer1.png",
          href: "/season/cross-player"
        }}
      />
      <ThemeHero
        theme={{
          title: "El Ligue Premiere",
          subtitle: "Theme of the Season",
          image: "/Frame1.webp",
          href: "/season/el-ligue-premiere"
        }}
      />
      <ThemeHero
        theme={{
          title: "Cross Player",
          subtitle: "Theme of the Season",
          image: "/welcome-background.webp",
          href: "/season/cross-player"
        }}
      />
      <ThemeHero
        theme={{
          title: "Cross Player",
          subtitle: "Theme of the Season",
          image: "/CrossPlayer1.png",
          href: "/season/cross-player"
        }}
      />
    </>
  )
}

export default SeasonPage
