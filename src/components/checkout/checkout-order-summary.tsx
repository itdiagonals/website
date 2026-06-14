"use client";

import Image from "next/image";
import { CartItem } from "@/lib/api";
import { ShippingRate } from "@/lib/api";
import { CustomerAddress } from "@/lib/api";

interface CheckoutOrderSummaryProps {
  cartItems: CartItem[];
  selectedAddress?: CustomerAddress;
  selectedRate?: ShippingRate | null;
  step: string;
  onNext?: () => void;
  onPlaceOrder?: () => void;
  onPay?: () => void;
  loading?: boolean;
  paymentButtonLabel?: string;
  paymentDisabled?: boolean;
}

export function CheckoutOrderSummary({
  cartItems,
  selectedAddress,
  selectedRate,
  step,
  onNext,
  onPlaceOrder,
  onPay,
  loading = false,
  paymentButtonLabel,
  paymentDisabled = false,
}: CheckoutOrderSummaryProps) {
  const checkedItems = cartItems.filter((i) => i.quantity > 0);
  const itemSubtotal = checkedItems.reduce(
    (acc, item) => acc + item.base_price * item.quantity,
    0
  );
  const shippingCost = selectedRate?.price ?? 0;
  const total = itemSubtotal + shippingCost;

  const getButtonConfig = () => {
    switch (step) {
      case "address":
        return {
          label: "Lanjut ke Pengiriman",
          onClick: onNext,
          disabled: !selectedAddress || loading,
        };
      case "shipping":
        return {
          label: "Lanjut ke Review",
          onClick: onNext,
          disabled: !selectedRate || loading,
        };
      case "review":
        return {
          label: "Place Order",
          onClick: onPlaceOrder,
          disabled: loading,
        };
      case "payment":
        return {
          label: paymentButtonLabel || "Bayar Sekarang",
          onClick: onPay,
          disabled: loading || paymentDisabled,
        };
      default:
        return { label: "Lanjutkan", onClick: onNext, disabled: true };
    }
  };

  const btn = getButtonConfig();

  return (
    <div className="bg-white border border-primary-100 rounded-[10px] p-5 sticky top-4 space-y-5">
      <h3 className="text-h6 font-bold text-black">Ringkasan Pesanan</h3>

      {checkedItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-b1 font-semibold text-black">
              Keranjang ({checkedItems.length} item)
            </h4>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {checkedItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative w-16 h-16 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image_url && (
                    <Image
                      src={item.image_url}
                      alt={item.product_name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-b2 font-medium text-black truncate">
                    {item.product_name}
                  </p>
                  <p className="text-b3 text-neutral-500">
                    {item.selected_color_name}, {item.selected_size}
                  </p>
                  <p className="text-b3 text-neutral-500">x{item.quantity}</p>
                </div>
                <p className="text-b2 font-semibold text-black flex-shrink-0">
                  Rp {(item.base_price * item.quantity).toLocaleString("id-ID")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 pt-3 border-t border-neutral-200">
        <div className="flex justify-between items-center text-b2 text-neutral-700">
          <span>Subtotal Produk</span>
          <span>Rp {itemSubtotal.toLocaleString("id-ID")}</span>
        </div>

        {selectedRate ? (
          <div className="flex justify-between items-center text-b2 text-neutral-700">
            <span>Ongkir ({selectedRate.courier_name} {selectedRate.service_name})</span>
            <span>Rp {shippingCost.toLocaleString("id-ID")}</span>
          </div>
        ) : (
          <div className="flex justify-between items-center text-b2 text-neutral-700">
            <span>Ongkir</span>
            <span className="text-neutral-400">-</span>
          </div>
        )}

        <div className="h-px bg-neutral-200" />

        <div className="flex justify-between items-center">
          <span className="text-b1 font-semibold text-black">Total Bayar</span>
          <span className="text-h6 font-bold text-black">
            Rp {total.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {btn.onClick && (
        <button
          onClick={btn.onClick}
          disabled={btn.disabled}
          className="w-full py-3.5 px-4 bg-primary-500 text-white font-semibold text-b1 rounded-[10px]
            hover:bg-primary-400 active:scale-[0.98] transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Memproses..." : btn.label}
        </button>
      )}
    </div>
  );
}
