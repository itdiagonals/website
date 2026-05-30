"use client";

import { useMemo, useState } from "react";
import ProductGallery from "@/src/components/products/product-gallery";
import ProductInfo from "@/src/components/products/product-info";
import ProductActionBar from "@/src/components/products/product-action-bar";
import SeasonPromoSection from "@/src/components/products/season-promo-section";
import SimilarProducts from "@/src/components/products/similar-products";
import { api } from "@/src/lib/api";
import type { Product, Season } from "@/src/lib/dummy-data";

interface ProductDetailModuleProps {
  product: Product;
  similarProducts?: Product[];
  activeSeason?: Season | null;
}

export default function ProductDetailModule({
  product,
  similarProducts = [],
  activeSeason,
}: ProductDetailModuleProps) {
  const isActiveSeason = product.season?.isActive ?? false;

  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);

  const selectedColor = product.availableColors.find(
    (c) => c.id === selectedColorId
  );
  const selectedSize = product.availableSizes.find(
    (s) => s.id === selectedSizeId
  );

  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return undefined;
    return product.variants.find(
      (v) => v.color === selectedColor.name && v.size === selectedSize.name
    );
  }, [selectedColor, selectedSize, product.variants]);

  const canAddToCart =
    selectedColor &&
    selectedSize &&
    selectedVariant &&
    selectedVariant.stock > 0;

  const galleryImages =
    product.gallery?.length
      ? product.gallery.map((g) => g.imageUrl)
      : product.coverImage?.url
        ? [product.coverImage.url]
        : [];

  const handleAddToCart = async () => {
    if (!canAddToCart) {
      alert("Silakan pilih warna dan ukuran yang tersedia.");
      return;
    }

    try {
      await api.cart.add({
        product_id: product.id,
        quantity: 1,
        selected_size: selectedSize!.name,
        selected_color_name: selectedColor!.name,
        selected_color_hex: selectedColor!.hex,
      });
      window.location.href = "/cart";
    } catch (error) {
      console.error("Failed to add to cart:", error);
      alert("Gagal menambahkan ke keranjang. Silakan coba lagi.");
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
  };

  return (
    <div className="bg-neutral-100 min-h-screen pb-[84px]">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[52px] pt-5 flex flex-col md:flex-row gap-10 md:gap-[55px] items-start">
        <ProductGallery images={galleryImages} />
        <ProductInfo
          product={product}
          selectedColorId={selectedColorId}
          selectedSizeId={selectedSizeId}
          onColorSelect={setSelectedColorId}
          onSizeSelect={setSelectedSizeId}
        />
      </div>

      {!isActiveSeason && activeSeason && (
        <div className="mt-16 md:mt-[120px]">
          <SeasonPromoSection season={activeSeason} />
        </div>
      )}

      {similarProducts.length > 0 && (
        <div className="max-w-[1440px] mx-auto mt-16 md:mt-[120px]">
          <SimilarProducts products={similarProducts} />
        </div>
      )}

      <ProductActionBar
        disabled={!canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />
    </div>
  );
}
