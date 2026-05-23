import { Button } from "../components/ui/button";
import Link from "next/link";

interface ThemeHeroProps {
  theme: {
    title: string;
    image: string;
    href?: string;
  };
}

export default function ThemeHero({ theme }: ThemeHeroProps) {
  const { title, image, href } = theme;

  return (
    <section
      style={{
        backgroundImage: `url('${image}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="relative w-360.5 h-205.25 overflow-hidden bg-cover text-neutral-100 font-[DorivalUITrial]"
    >
      <div className="absolute top-0 -left-7.25 h-38.5 w-365.5 bg-[linear-gradient(180deg,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0)_100%)]" />

      <div className="absolute top-120.75 left-0 w-360.25 h-84.5 flex -rotate-180 bg-[linear-gradient(180deg,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0)_100%)]">
        {href && (
          <div className="flex mt-[87.1px] w-47.75 h-[42.85px] ml-17.5 relative items-center justify-center gap-[7.93px] p-[7.93px] bg-[#ffffff80] border-[0.79px] border-solid rotate-180">
            <Link href={`/products/${href}`}>
              <Button className="relative w-fit mt-[-0.79px] font-bold text-lg leading-[26.2px]">
                Explore Now
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-col w-250 items-start absolute top-159 left-[calc(50%-603px)]">
        <h4 className="relative w-111.5 -mt-px font-[Handi] font-normal text-lg leading-6.75">
          Theme of the season!
        </h4>
        <h1 className="relative w-fit text-7xl font-bold leading-25.5">
          {title}
        </h1>
      </div>
    </section>
  );
}
