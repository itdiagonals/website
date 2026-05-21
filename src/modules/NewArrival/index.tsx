import Image from "next/image";
import ProductCard from "@/src/components/ProductCard";
import Hero from "@/src/modules/Hero";
import { PRODUCT_CATEGORIES, productData } from "../dummydata";

export default function NewArrival() {
  return (
    <section className="w-full flex flex-col items-center">
      <div className="w-full mx-auto">
        <Hero />
      </div>
      <div className="w-full px-6 py-16 mx-auto bg-neutral-100 gap-16">
        <div className="flex items-center justify-center gap-10 mb-16">
          {PRODUCT_CATEGORIES.map((category, index) => (
            <div key={index} className="flex items-center gap-10">
              <button className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition duration-600">
                <span className="text-primary-400 text-lg font-medium whitespace-nowrap">
                  {category}
                </span>
                <Image
                  src="/chevron-down.svg"
                  alt="Arrow"
                  width={20}
                  height={20}
                  className="text-primary-400"
                />
              </button>
              {index < PRODUCT_CATEGORIES.length - 1 && (
                <div className="w-px h-6 bg-primary-400 shrink-0"></div>
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-6 w-full">
          {productData.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
