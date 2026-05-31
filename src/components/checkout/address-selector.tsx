"use client";

import { cn } from "@/lib/utils";
import { CustomerAddress } from "@/lib/api";

interface AddressSelectorProps {
  addresses: CustomerAddress[];
  selectedId?: number;
  onSelect: (id: number) => void;
}

export function AddressSelector({ addresses, selectedId, onSelect }: AddressSelectorProps) {
  if (addresses.length === 0) {
    return (
      <div className="p-6 bg-white border border-primary-100 rounded-[10px] text-center text-neutral-500 text-b2">
        Belum ada alamat pengiriman.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {addresses.map((addr) => {
        const isSelected = addr.id === selectedId;
        return (
          <button
            key={addr.id}
            onClick={() => onSelect(addr.id)}
            className={cn(
              "w-full text-left p-4 rounded-[10px] border transition-all duration-200",
              isSelected
                ? "border-primary-500 bg-primary-100/20 ring-1 ring-primary-400"
                : "border-primary-100 bg-white hover:border-primary-200"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-b1 font-semibold text-black truncate">
                    {addr.title}
                  </span>
                  {addr.is_primary && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-primary-500 text-white rounded-full">
                      Utama
                    </span>
                  )}
                </div>
                <p className="text-b2 text-neutral-700">{addr.recipient_name}</p>
                <p className="text-b2 text-neutral-600 mt-0.5">{addr.phone_number}</p>
                <p className="text-b2 text-neutral-500 mt-1.5 leading-relaxed">
                  {addr.full_address}, {addr.village}, {addr.district}, {addr.city},{" "}
                  {addr.province} {addr.postal_code}
                </p>
              </div>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center",
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
      })}
    </div>
  );
}
