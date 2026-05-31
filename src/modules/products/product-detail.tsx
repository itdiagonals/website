"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProductGallery from "@/src/components/products/product-gallery";
import ProductInfo from "@/src/components/products/product-info";
import ProductActionBar from "@/src/components/products/product-action-bar";
import SeasonPromoSection from "@/src/components/products/season-promo-section";
import SimilarProducts from "@/src/components/products/similar-products";
import { ApiError, api, clearApiCache } from "@/src/lib/api";
import type { Product, Season } from "@/src/lib/dummy-data";
import { Toast } from "@/components/ui/toast";

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
  const router = useRouter();
  const isActiveSeason = product.season?.isActive ?? false;

  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

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

  const stockLabel = selectedVariant
    ? selectedVariant.stock > 0
      ? `Tersedia ${selectedVariant.stock} item untuk varian ini`
      : "Varian ini sedang habis"
    : "Pilih warna dan ukuran untuk melihat stok tersedia";

  const galleryImages =
    product.gallery?.length
      ? product.gallery.map((g) => g.imageUrl)
      : product.coverImage?.url
        ? [product.coverImage.url]
        : [];

  const addToCartCore = async (): Promise<boolean> => {
    if (!canAddToCart) {
      setNotice("Pilih warna dan ukuran yang masih tersedia sebelum melanjutkan.");
      return false;
    }

    try {
      setAddingToCart(true);
      setAddedToCart(false);
      setNotice(null);
      await api.cart.add({
        product_id: product.id,
        quantity: 1,
        selected_size: selectedSize!.name,
        selected_color_name: selectedColor!.name,
        selected_color_hex: selectedColor!.hex,
      });
      clearApiCache();
      setAddedToCart(true);
      return true;
    } catch (error) {
      console.error("Failed to add to cart:", error);
      if (error instanceof ApiError) {
        const stockMatch = error.message.match(/only\s+(\d+)\s+item/i);
        if (stockMatch) {
          setNotice(`Stok varian ${selectedColor!.name}, ${selectedSize!.name} tinggal ${stockMatch[1]} item.`);
          return false;
        }
        setNotice(error.message);
        return false;
      }
      setNotice("Gagal menambahkan ke keranjang. Silakan coba lagi.");
      return false;
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToCart = async () => {
    const ok = await addToCartCore();
    if (ok) {
      setToastVisible(true);
    }
  };

  const handleBuyNow = async () => {
    const ok = await addToCartCore();
    if (ok) {
      router.push("/cart");
    }
  };

  return (
    <>
      <Toast
        message="Berhasil ditambahkan ke keranjang."
        visible={toastVisible}
        onClose={() => {
          setToastVisible(false);
          setAddedToCart(false);
        }}
      />
      <div className="bg-neutral-100 min-h-screen pb-[84px]">
        <div className="max-w-[1440px] mx-auto px-5 md:px-[52px] pt-5 flex flex-col md:flex-row gap-10 md:gap-[55px] items-start">
        <ProductGallery images={galleryImages} />
        <ProductInfo
          product={product}
          selectedColorId={selectedColorId}
          selectedSizeId={selectedSizeId}
          onColorSelect={setSelectedColorId}
          onSizeSelect={setSelectedSizeId}
          stockLabel={stockLabel}
          notice={notice}
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
        addingToCart={addingToCart}
        addedToCart={addedToCart}
      />
    </div>
    </>
  );
}
