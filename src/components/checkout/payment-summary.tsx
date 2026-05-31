"use client";

interface PaymentSummaryProps {
  itemSubtotal: number;
  shippingCost: number;
  total: number;
  itemCount: number;
  onPay: () => void;
  loading?: boolean;
}

export function PaymentSummary({
  itemSubtotal,
  shippingCost,
  total,
  itemCount,
  onPay,
  loading = false,
}: PaymentSummaryProps) {
  return (
    <div className="bg-white border border-primary-100 rounded-[10px] p-5 sticky top-4">
      <h3 className="text-h6 font-bold text-black mb-4">Ringkasan Pesanan</h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center text-b2 text-neutral-700">
          <span>Subtotal Produk ({itemCount} item)</span>
          <span>Rp {itemSubtotal.toLocaleString("id-ID")}</span>
        </div>

        <div className="flex justify-between items-center text-b2 text-neutral-700">
          <span>Ongkir</span>
          <span>Rp {shippingCost.toLocaleString("id-ID")}</span>
        </div>

        <div className="h-px bg-neutral-200 my-3" />

        <div className="flex justify-between items-center">
          <span className="text-b1 font-semibold text-black">Total Bayar</span>
          <span className="text-b1 font-bold text-black">
            Rp {total.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      <button
        onClick={onPay}
        disabled={loading}
        className="w-full mt-5 py-3.5 px-4 bg-primary-500 text-white font-semibold text-b1 rounded-[10px]
          hover:bg-primary-400 active:scale-[0.98] transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Memproses..." : "Bayar Sekarang"}
      </button>
    </div>
  );
}
