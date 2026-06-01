import { Button } from "../components/ui/button";
import Link from "next/link";

interface ThemeHeroProps {
  theme: {
    title: string;
    subtitle?: string;
    image: string;
    href?: string;
  };
}

export default function ThemeHero({ theme }: ThemeHeroProps) {
  const { title, subtitle, image, href } = theme;

  return (
    <section
      style={{
        backgroundImage: `url('${image}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="relative w-full h-205.25 mx-auto overflow-hidden bg-cover text-neutral-100 font-[DorivalUITrial]"
    >
      {/* <div className="absolute top-0 -left-7.25 h-38.5 w-365.5 bg-[linear-gradient(180deg,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0)_100%)]" /> */}

      <div className="flex flex-row justify-between w-full items-end h-full p-15 mx-auto max-w-[1440px]">
        <div className="flex flex-col w-250 items-start">
          <h4 className="w-111.5 -mt-px font-[Handi] font-normal text-lg leading-6.75">
            {subtitle || 'Theme of the season!'}
          </h4>
          <h1 className="w-fit text-7xl font-bold leading-25.5">
            {title}
          </h1>
        </div>
        {href && (
          <div className="">
            <Link href={`${href}`}>
              <Button variant={"default"}>
                Explore Now
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}