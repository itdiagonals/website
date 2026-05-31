import ThemeDesc from '../components/theme-desc';
import RowGallery from '../components/row-gallery';
import ThemeHero from '../modules/theme-hero';
import WelcomeAnimation from '../components/welcome-animation';
import Hero from '../modules/hero';
import LookbookCarousel from '../components/lookbook-carousel';
import NewArrival from '../modules/new-arrival';

const SEASON_ITEMS = [
  {
    image: "/image-2.png",
    title: "Water To\nThe Rescue",
    href: "/season/water-to-the-rescue",
  },
  {
    image: "/image-1.png",
    title: "Punk Rocker,\nYes I Am",
    href: "/season/punk-rocker-yes-i-am",
  },
  {
    image: "/image-3.png",
    title: "The Hills",
    href: "/season/the-hills",
  },
];

const PRODUCT_ITEMS = [
  {
    image: "/image-2.png",
    title: "Top",
    href: "/product/top",
  },
  {
    image: "/image-1.png",
    title: "Shorts",
    href: "/product/shorts",
  },
  {
    image: "/image-3.png",
    title: "Headwear",
    href: "/product/headwear",
  },
];

export default async function HomePage() {
  return (
    <>
      <WelcomeAnimation currentSeason='Cross Player Season' />
      <Hero />
      <ThemeDesc
        type="current-season"
        title="CROSS PLAYER MULTINANCE"
        desc="Lorem ipsum dolor sit amet consectetur. Amet id et massa sem feugiat nec. Elementum pellentesque id lacus massa quis. Metus proin dignissim tincidunt gravida. Magnis quis faucibus viverra tempor cursus et eget velit non. Id volutpat diam convallis suspendisse in adipiscing at. Posuere nam felis mauris amet."
        href="/product/season"
      />
      <RowGallery type='image-only' />
      <NewArrival />
      <ThemeDesc
        type="all-season"
        title="Explore all Season"
        desc="Discover our timeless collection that never fades. Crafted with premium materials designed for daily comfort and durability, making sure you always wear your passion with pride."
        href="/products"
      />
      <RowGallery type='interactive' items={SEASON_ITEMS} />
      <LookbookCarousel />
      <RowGallery type='interactive' items={PRODUCT_ITEMS}/>
    </>
  );
}
