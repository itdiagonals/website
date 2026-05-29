"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  className,
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className={cn("flex flex-col gap-[9px]", className)}>
      <span className="text-b1 font-medium text-black">Jumlah</span>
      <div className="flex items-center">
        <button
          onClick={handleDecrement}
          disabled={value <= min}
          className="flex items-center justify-center w-[35px] h-[35px] bg-white border border-primary-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="w-6 h-6 text-neutral-1000" />
        </button>
        <div className="flex items-center justify-center w-[69px] h-[35px] bg-white border-t border-b border-primary-300 text-[18px] font-medium text-primary-300">
          {value}
        </div>
        <button
          onClick={handleIncrement}
          disabled={value >= max}
          className="flex items-center justify-center w-[35px] h-[35px] bg-white border border-primary-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-6 h-6 text-neutral-1000" />
        </button>
      </div>
    </div>
  );
}
