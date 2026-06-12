import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatPrice } from "@/src/lib/dummy-data";
import type { Product } from "@/src/lib/dummy-data";

interface SimilarProductsProps {
  products: Product[];
}

export default function SimilarProducts({ products }: SimilarProductsProps) {
  return (
    <section className="w-full px-5 md:px-[26.6px] py-10">
      <h2 className="font-heading text-xl md:text-h7 text-black mb-8">
        Other Similar Works
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[17.8px] w-full">
        {products.slice(0, 4).map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="flex flex-col gap-[21.5px] items-center cursor-pointer group"
          >
            <div className="relative h-[300px] md:h-[404px] w-full overflow-hidden flex items-center justify-center">
              <Image
                src={product.coverImage?.url ?? "/products/similar-1.webp"}
                alt={product.name}
                fill
                className="object-contain p-4 group-hover:scale-105 transition duration-500"
              />
            </div>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col gap-[7.4px] p-[7.4px] w-[117.8px]">
                <p className="font-heading text-sm md:text-[16.3px] leading-[24.5px] font-bold text-black whitespace-nowrap">
                  {product.name}
                </p>
                <p className="font-body text-[10.4px] leading-[15.6px] text-black">
                  {formatPrice(product.basePrice)}
                </p>
              </div>
              <div className="border border-black flex items-center p-[7.4px]">
                <ChevronRight size={17} strokeWidth={2} className="text-black" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
