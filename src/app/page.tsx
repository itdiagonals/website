import ThemeDesc from '../components/theme-desc';
import RowGallery from '../components/row-gallery';
import ThemeHero from '../modules/theme-hero';
import WelcomeAnimation from '../components/welcome-animation';
import NewArrivalHero from '../modules/hero';
// import ElLiguePremiere from '../modules/ElLiguePremiere';

export default async function HomePage() {
  return (
    <>
      <WelcomeAnimation currentSeason='Cross Player Season' />
      <NewArrivalHero />
      {/* <ElLiguePremiere/> */}
      <ThemeDesc
        type="current-season"
        title="CROSS PLAYER MULTINANCE"
        desc="Lorem ipsum dolor sit amet consectetur. Amet id et massa sem feugiat nec. Elementum pellentesque id lacus massa quis. Metus proin dignissim tincidunt gravida. Magnis quis faucibus viverra tempor cursus et eget velit non. Id volutpat diam convallis suspendisse in adipiscing at. Posuere nam felis mauris amet."
        href="/products/season"
      />
      <RowGallery type="image-only" />
      <ThemeDesc
        type="all-season"
        title="ALL SEASON CLASSICS"
        desc="Discover our timeless collection that never fades. Crafted with premium materials designed for daily comfort and durability, making sure you always wear your passion with pride."
        href="/products"
      />
      <RowGallery type="interactive" />

      <ThemeHero theme={{ title: "Cross Player", image: "/CrossPlayer1.png", href: "/cross-player" }} />
      <ThemeHero theme={{ title: "Cross Player", image: "/CrossPlayer.png" }} />
    </>
  );
}
