"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Product } from "@/src/lib/dummy-data";

interface ProductInfoProps {
  product: Product;
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const [selectedColorId, setSelectedColorId] = useState<number | null>(
    product.availableColors[0]?.id ?? null
  );
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(
    product.availableSizes[0]?.id ?? null
  );
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const selectedColor = product.availableColors.find(
    (c) => c.id === selectedColorId
  );

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
                {product.availableColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColorId(color.id)}
                    className={`flex items-center p-[8.93px] rounded-[5px] border-[0.893px] transition cursor-pointer ${
                      selectedColorId === color.id
                        ? "border-primary-500"
                        : "border-black/20"
                    }`}
                  >
                    <div
                      className="w-[57px] h-[57px] shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                  </button>
                ))}
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
              {product.availableSizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => setSelectedSizeId(size.id)}
                  className={`flex h-[34px] items-center justify-center p-[10px] rounded-[5px] w-[105px] border transition cursor-pointer ${
                    selectedSizeId === size.id
                      ? "border-primary-500 bg-neutral-100 text-black"
                      : "border-black/20 bg-[#fcfffc] text-black"
                  }`}
                >
                  <span className="font-sans text-[16px] leading-[24px] font-medium">
                    {size.name}
                  </span>
                </button>
              ))}
              <div className="flex h-[34px] items-center justify-center p-[10px] rounded-[5px] w-[105px] border border-black/40">
                <span className="font-sans text-[16px] leading-[24px] font-medium text-black/40">
                  XS
                </span>
              </div>
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
