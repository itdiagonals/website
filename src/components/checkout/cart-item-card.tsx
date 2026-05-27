"use client";

import Image from "next/image";
import { X, Check } from "lucide-react";
import { QuantitySelector } from "./quantity-selector";
import { cn } from "@/lib/utils";

export interface CartItem {
  id: string;
  productId: number;
  name: string;
  gender: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
  checked?: boolean;
}

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onToggleCheck: (id: string) => void;
  className?: string;
}

export function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
  onToggleCheck,
  className,
}: CartItemCardProps) {
  const subtotal = item.price * item.quantity;

  return (
    <div className={cn("relative border-b border-black/20 p-4 sm:p-6", className)}>
      <button
        onClick={() => onRemove(item.id)}
        className="absolute right-3 top-3 sm:right-[21px] sm:top-[21px] z-10 text-black hover:opacity-70 transition-opacity"
      >
        <X className="w-6 h-6 sm:w-[30px] sm:h-[30px]" />
      </button>

      <button
        onClick={() => onToggleCheck(item.id)}
        className={cn(
          "absolute left-3 top-3 sm:left-[29px] sm:top-[33px] z-10 w-6 h-6 sm:w-[30px] sm:h-[30px] flex items-center justify-center border border-[#fcfffc] transition-colors",
          item.checked ? "bg-[#2f2f2f]" : "bg-neutral-300"
        )}
      >
        {item.checked && <Check className="w-4 h-4 text-white" />}
      </button>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <div className="relative w-full sm:w-[214px] h-[200px] sm:h-[268px] shrink-0 mt-8 sm:mt-0">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-contain object-bottom"
            sizes="214px"
          />
        </div>

        <div className="flex flex-col flex-1 justify-between gap-4 sm:gap-6">
          <div className="flex flex-col gap-2 sm:gap-[10px] min-w-0 pr-8 sm:pr-10">
            <h3 className="font-medium text-[18px] sm:text-[20px] leading-[28px] sm:leading-[32px] text-black break-words">
              {item.name}
            </h3>
            <p className="text-b1 text-black">{item.gender}</p>
            <p className="text-b1 text-black break-words">{item.color}</p>
            <p className="text-b1 text-black">{item.size}</p>
            <p className="text-b1 font-medium text-secondary-500">
              Rp. {item.price.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <QuantitySelector
              value={item.quantity}
              onChange={(q) => onUpdateQuantity(item.id, q)}
            />
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-[12px]">
              <span className="text-b1 font-medium text-black">Subtotal :</span>
              <span className="font-bold text-[20px] sm:text-[22px] leading-[30px] sm:leading-[33px] text-primary-400">
                Rp. {subtotal.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
