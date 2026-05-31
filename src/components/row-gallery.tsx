import Image from "next/image";
import Link from "next/link";

interface GalleryItem {
  image: string;
  title?: string;
  href?: string;
}

interface RowGalleryProps {
  type: "image-only" | "interactive";
  items?: GalleryItem[];
}

const DEFAULT_ITEMS: GalleryItem[] = [
  {
    image: "/image-2.png",
    title: "Water To\nThe Rescue",
    href: "/products/water-rescue",
  },
  {
    image: "/image-1.png",
    title: "Punk Rocker,\nYes I Am",
    href: "/products/punk-rocker",
  },
  {
    image: "/image-3.png",
    title: "The Hills",
    href: "/products/the-hills",
  },
];

export default function RowGallery({ type, items = DEFAULT_ITEMS }: RowGalleryProps) {
  const isInteractive = type === "interactive";

  return (
    <section className="w-full">
      <div className="grid grid-cols-3 w-full h-[400px]">
        {items.map((item, index) => {
          if (isInteractive && item.href) {
            return (
              <Link
                key={index}
                href={item.href}
                className="relative group overflow-hidden block w-full h-full cursor-pointer"
              >
                {/* Background Image */}
                <Image
                  src={item.image}
                  alt={item.title || `Gallery image ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Dark Gradient Bottom Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Text and Button Overlay */}
                <div className="absolute inset-x-6 bottom-6 flex justify-between items-end z-10">
                  <h3 className="text-white text-2xl font-bold leading-tight whitespace-pre-line tracking-wide drop-shadow-md">
                    {item.title}
                  </h3>

                  {/* Square Arrow Button */}
                  <div className="w-[42px] h-[42px] bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-md transition-all duration-300 group-hover:bg-white group-hover:border-white shrink-0">
                    <svg
                      className="w-5 h-5 text-white group-hover:text-primary-500 transition-colors duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          }

          // Image-only mode
          return (
            <div key={index} className="relative w-full h-full overflow-hidden">
              <Image
                src={item.image}
                alt={`Gallery image ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
