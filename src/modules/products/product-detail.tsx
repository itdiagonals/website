"use client";

import ProductGallery from "@/src/components/products/product-gallery";
import ProductInfo from "@/src/components/products/product-info";
import ProductActionBar from "@/src/components/products/product-action-bar";
import SeasonPromoSection from "@/src/components/products/season-promo-section";
import SimilarProducts from "@/src/components/products/similar-products";
import { products, seasons } from "@/src/lib/dummy-data";
import type { Product } from "@/src/lib/dummy-data";

interface ProductDetailModuleProps {
  product: Product;
}

export default function ProductDetailModule({
  product,
}: ProductDetailModuleProps) {
  const isActiveSeason = product.season?.isActive ?? false;

  const activeSeason = seasons.find((s) => s.isActive);
  const similarProducts = products.filter(
    (p) => p.seasonId === product.seasonId && p.id !== product.id
  );

  const galleryImages = [
    "/products/jersey-main.png",
    "/products/jersey-thumb-1.png",
    "/products/jersey-thumb-2.png",
    "/products/jersey-thumb-3.png",
  ];

  return (
    <div className="bg-neutral-100 min-h-screen pb-[84px]">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[52px] pt-5 flex flex-col md:flex-row gap-10 md:gap-[55px] items-start">
        <ProductGallery images={galleryImages} />
        <ProductInfo product={product} />
      </div>

      {!isActiveSeason && activeSeason && (
        <div className="mt-16 md:mt-[120px]">
          <SeasonPromoSection season={activeSeason} />
        </div>
      )}

      <div className="max-w-[1440px] mx-auto mt-16 md:mt-[120px]">
        <SimilarProducts products={similarProducts} />
      </div>

      <ProductActionBar
        onAddToCart={() => console.log("Add to cart")}
        onBuyNow={() => console.log("Buy now")}
      />
    </div>
  );
}
