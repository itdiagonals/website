import Image from "next/image";
import Link from "next/link";
import type { Season } from "@/src/lib/dummy-data";

interface SeasonPromoSectionProps {
  season: Season;
}

export default function SeasonPromoSection({
  season,
}: SeasonPromoSectionProps) {
  const lookbookImages = season.lookbookImages ?? [];
  const lookbookUrls = lookbookImages.map((img) => img.url);
  const coverUrl = season.coverImage?.url;

  const images = lookbookUrls.length > 0 ? lookbookUrls : coverUrl ? [coverUrl] : [];

  const displayImages = [images[0], images[1], images[2]];

  return (
    <section className="w-full flex flex-col">
      <div className="relative bg-primary-500 min-h-[261px] overflow-hidden w-full">
        <div className="absolute top-1/2 left-4 md:left-[102px] -translate-y-1/2 pointer-events-none select-none">
          <div className="rotate-[-6.87deg] text-white/10 text-center font-[Handi] text-[28px] md:text-[44.6px] leading-[48px] md:leading-[74px] whitespace-nowrap">
            <p>"Across" signals a bridge, not a break: we cross</p>
            <p>contexts and make them belong. Visually, the rhombus holds</p>
            <p>the balance and the diagonal carries the motion—together</p>
            <p>they bring opposites into quiet coherence.</p>
          </div>
        </div>

        <div className="relative mt-1 mb-1 md:mb-12 md:mt-12 z-10 flex flex-col md:flex-row md:items-center justify-between px-6 md:px-[63px] py-10 md:py-0 h-full max-w-[1440px] mx-auto w-full gap-8 md:gap-0">
          <div className="flex flex-col gap-[20px] text-neutral-100 w-full md:w-[446px]">
            <p className="font-body text-b3 w-full">Theme of the season</p>
            <div className="font-heading text-2xl md:text-h5 w-full leading-[36px] md:leading-[48px]">
              <p className="uppercase font-bold">{season.name}</p>
            </div>
          </div>
          <p className="font-body text-b3 text-neutral-100 w-full md:w-[446px]">
            Breeze of the Game
          </p>
          <div className="flex flex-col gap-[36px] items-start w-full md:w-[485px]">
            <p className="font-body text-b3 text-neutral-100 w-full">
              {season.description}
            </p>
            <Link
              href={`/products?season=${season.slug}`}
              className="flex items-center justify-center p-[7.9px] w-[191px] border border-neutral-100 text-neutral-100 font-heading text-[17.4px] leading-[26px] hover:bg-neutral-100 hover:text-primary-500 transition duration-200"
            >
              Explore Now
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row w-full">
        {displayImages.map((img, idx) => (
          <div
            key={idx}
            className="relative w-full md:w-1/3 h-[300px] md:h-[493px] overflow-hidden bg-neutral-300"
          >
            {img ? (
              <Image
                src={img}
                alt={`Season look ${idx + 1}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-neutral-300 flex items-center justify-center">
                <span className="text-neutral-500 font-body text-sm">No image</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
