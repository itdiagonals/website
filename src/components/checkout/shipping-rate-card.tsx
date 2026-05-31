"use client";

import { cn } from "@/lib/utils";
import { ShippingRate } from "@/lib/api";

interface ShippingRateCardProps {
  rate: ShippingRate;
  isSelected: boolean;
  onSelect: () => void;
}

export function ShippingRateCard({ rate, isSelected, onSelect }: ShippingRateCardProps) {
  const estimated = rate.estimated_range || rate.estimated_days || "N/A";

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-[10px] border transition-all duration-200",
        isSelected
          ? "border-primary-500 bg-primary-100/20 ring-1 ring-primary-400"
          : "border-primary-100 bg-white hover:border-primary-200"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-b1 font-semibold text-black uppercase">
              {rate.courier_name}
            </span>
            <span className="text-b2 text-neutral-600">
              {rate.service_name}
            </span>
          </div>
          <p className="text-b2 text-neutral-500">
            Estimasi tiba: {estimated}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-b1 font-bold text-black">
            Rp {rate.price.toLocaleString("id-ID")}
          </p>
        </div>
        <div
          className={cn(
            "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
            isSelected
              ? "border-primary-500 bg-primary-500"
              : "border-neutral-300"
          )}
        >
          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  );
}
