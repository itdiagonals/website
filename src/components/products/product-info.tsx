"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Product } from "@/src/lib/dummy-data";

interface ProductInfoProps {
  product: Product;
  selectedColorId: number | null;
  selectedSizeId: number | null;
  onColorSelect: (id: number | null) => void;
  onSizeSelect: (id: number | null) => void;
}

export default function ProductInfo({
  product,
  selectedColorId,
  selectedSizeId,
  onColorSelect,
  onSizeSelect,
}: ProductInfoProps) {
  const selectedColor = product.availableColors.find(
    (c) => c.id === selectedColorId
  );
  const selectedSize = product.availableSizes.find(
    (s) => s.id === selectedSizeId
  );

  const colorGloballyDisabled = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const color of product.availableColors) {
      const hasAnyStock = product.variants.some(
        (v) => v.color === color.name && v.stock > 0
      );
      map.set(color.id, !hasAnyStock);
    }
    return map;
  }, [product.availableColors, product.variants]);

  const sizeGloballyDisabled = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const size of product.availableSizes) {
      const hasAnyStock = product.variants.some(
        (v) => v.size === size.name && v.stock > 0
      );
      map.set(size.id, !hasAnyStock);
    }
    return map;
  }, [product.availableSizes, product.variants]);

  const colorDisabledForSelectedSize = useMemo(() => {
    const map = new Map<number, boolean>();
    if (!selectedSize) return map;
    for (const color of product.availableColors) {
      const variant = product.variants.find(
        (v) => v.color === color.name && v.size === selectedSize.name
      );
      map.set(color.id, !variant || variant.stock <= 0);
    }
    return map;
  }, [selectedSize, product.availableColors, product.variants]);

  const sizeDisabledForSelectedColor = useMemo(() => {
    const map = new Map<number, boolean>();
    if (!selectedColor) return map;
    for (const size of product.availableSizes) {
      const variant = product.variants.find(
        (v) => v.color === selectedColor.name && v.size === size.name
      );
      map.set(size.id, !variant || variant.stock <= 0);
    }
    return map;
  }, [selectedColor, product.availableSizes, product.variants]);

  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (key: string) => {
    setOpenAccordion((prev) => (prev === key ? null : key));
  };

  const formatPrice = (amount: number) => {
    return "Rp " + amount.toLocaleString("id-ID");
  };

  return (
    <div className="flex flex-col gap-[20px] w-full">
      <div className="flex flex-col items-start text-black w-full">
        <p className="font-body text-b3 text-black w-full">
          {product.season.name}
        </p>
        <h1 className="font-heading text-2xl md:text-h5 font-bold text-black w-full">
          {product.name}
        </h1>
      </div>

      <p className="font-body text-b2 text-black whitespace-nowrap">
        {formatPrice(product.basePrice)}
      </p>

      <div className="flex flex-col gap-[32px] w-full">
        <p className="font-body text-b2 text-primary-300 w-full">
          {product.description}
        </p>

        <div className="flex flex-col gap-[25px] w-full">
          <div className="flex flex-col gap-[4px] w-full">
            <div className="flex flex-col gap-[7px] w-full">
              <p className="font-body text-b1 text-black whitespace-nowrap">
                Color
              </p>
              <div className="flex gap-[11.6px] items-center flex-wrap">
                {product.availableColors.map((color) => {
                  const isGloballyDisabled = colorGloballyDisabled.get(color.id) ?? false;
                  const isCrossDisabled = selectedSize
                    ? (colorDisabledForSelectedSize.get(color.id) ?? false)
                    : false;
                  const isDisabled = isGloballyDisabled || isCrossDisabled;

                  return (
                    <button
                      key={color.id}
                      onClick={() =>
                        !isDisabled &&
                        onColorSelect(selectedColorId === color.id ? null : color.id)
                      }
                      aria-label={`Select color ${color.name}`}
                      aria-pressed={selectedColorId === color.id}
                      disabled={isDisabled}
                      className={`flex items-center p-[8.93px] rounded-[5px] border-[0.893px] transition ${
                        isDisabled
                          ? "opacity-40 cursor-not-allowed border-black/10"
                          : selectedColorId === color.id
                            ? "border-primary-500 cursor-pointer"
                            : "border-black/20 cursor-pointer hover:border-black/40"
                      }`}
                    >
                      <div
                        className="w-[57px] h-[57px] shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
            {selectedColor && (
              <p className="font-body text-b3 text-[#71717A]">
                {selectedColor.name}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-[7px] w-full">
            <p className="font-body text-b1 text-black w-full">
              Size Available
            </p>
            <div className="flex gap-[15px] items-center opacity-88 flex-wrap">
              {product.availableSizes.map((size) => {
                const isGloballyDisabled = sizeGloballyDisabled.get(size.id) ?? false;
                const isCrossDisabled = selectedColor
                  ? (sizeDisabledForSelectedColor.get(size.id) ?? false)
                  : false;
                const isDisabled = isGloballyDisabled || isCrossDisabled;

                return (
                  <button
                    key={size.id}
                    onClick={() =>
                      !isDisabled &&
                      onSizeSelect(selectedSizeId === size.id ? null : size.id)
                    }
                    disabled={isDisabled}
                    className={`flex h-[34px] items-center justify-center p-[10px] rounded-[5px] w-[105px] border transition ${
                      isDisabled
                        ? "border-black/10 bg-neutral-100 text-black/30 cursor-not-allowed"
                        : selectedSizeId === size.id
                          ? "border-primary-500 bg-neutral-100 text-black cursor-pointer"
                          : "border-black/20 bg-[#fcfffc] text-black cursor-pointer hover:border-black/40"
                    }`}
                  >
                    <span className="font-sans text-[16px] leading-[24px] font-medium">
                      {size.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full">
          <button
            onClick={() => toggleAccordion("detail")}
            className="flex items-center justify-between h-[82px] py-[10px] pl-[10px] border-b border-black/20 w-full cursor-pointer"
          >
            <span className="font-body text-b2 text-black text-left w-[138px]">
              Detail
            </span>
            <ChevronRight
              size={24}
              strokeWidth={2}
              className={`shrink-0 text-black transition-transform duration-300 ${
                openAccordion === "detail" ? "rotate-90" : ""
              }`}
            />
          </button>
          {openAccordion === "detail" && (
            <div className="py-4 px-[10px]">
              <div className="font-body text-b3 text-primary-300 space-y-2">
                {product.detailInfo &&
                  Object.entries(product.detailInfo).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="capitalize font-medium">{key}:</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                {!product.detailInfo && (
                  <p>No detail information available.</p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => toggleAccordion("care")}
            className="flex items-center justify-between h-[82px] py-[10px] pl-[10px] border-b border-black/20 w-full cursor-pointer"
          >
            <span className="font-body text-b2 text-black text-left w-[138px]">
              Cara Perawatan
            </span>
            <ChevronRight
              size={24}
              strokeWidth={2}
              className={`shrink-0 text-black transition-transform duration-300 ${
                openAccordion === "care" ? "rotate-90" : ""
              }`}
            />
          </button>
          {openAccordion === "care" && (
            <div className="py-4 px-[10px]">
              <div className="font-body text-b3 text-primary-300 space-y-2">
                {product.careGuide?.instructions &&
                  Object.entries(product.careGuide.instructions).map(
                    ([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="capitalize font-medium">{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    )
                  )}
                {!product.careGuide?.instructions && (
                  <p>No care guide available.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
