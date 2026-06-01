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
      className="relative w-full h-[420px] sm:h-[480px] md:h-[500px] lg:h-205.25 mx-auto overflow-hidden bg-cover text-neutral-100 font-[DorivalUITrial]"
    >
      {/* <div className="absolute top-0 -left-7.25 h-38.5 w-365.5 bg-[linear-gradient(180deg,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0)_100%)]" /> */}

      <div className="absolute bottom-0 left-0 w-full h-[200px] sm:h-[240px] md:h-[280px] bg-[linear-gradient(0deg,rgba(0,0,0,0.75)_0%,rgba(0,0,0,0)_100%)] z-10 pointer-events-none" />

      <div className="relative z-20 flex flex-col md:flex-row justify-end md:justify-between w-full items-start md:items-end h-full p-4 sm:p-8 md:p-12 lg:p-15 mx-auto max-w-full md:max-w-[1440px] gap-4 md:gap-0">
        <div className="flex flex-col w-full md:w-[200px] lg:w-250 items-start">
          <h4 className="w-full md:w-[100px] lg:w-111.5 -mt-px font-[Handi] font-normal text-sm md:text-base lg:text-lg leading-5 md:leading-6.75">
            {subtitle || 'Theme of the season!'}
          </h4>
          <h1 className="w-full text-xl sm:text-3xl md:text-5xl lg:text-6xl font-bold leading-tight sm:leading-snug md:leading-normal lg:leading-25.5 break-words">
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