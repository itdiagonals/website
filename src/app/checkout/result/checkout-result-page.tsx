"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Navbar from "@/components/ui/navbar";

export default function CheckoutResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("order_id");
  const status = searchParams.get("status") || "pending";

  const [order, setOrder] = useState<import("@/lib/api").TransactionHistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || orderId === "undefined") {
      setError("Order ID tidak ditemukan.");
      setLoading(false);
      return;
    }

    const loadOrder = async () => {
      try {
        const tx = await api.transactions.getByOrderId(orderId);
        setOrder(tx);
      } catch {
        setError("Gagal memuat detail pesanan.");
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [orderId]);

  const isSuccess = status === "success" || order?.status === "paid";
  const isPending = status === "pending" || order?.status === "pending";

  return (
    <>
      <div className="min-h-screen flex flex-col bg-[#f3f3f3]">
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white border border-primary-100 rounded-[10px] p-8 text-center">
            {loading ? (
              <p className="text-b2 text-neutral-500">Memuat...</p>
            ) : error ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-h6 font-bold text-black mb-2">Terjadi Kesalahan</h2>
                <p className="text-b2 text-neutral-600 mb-6">{error}</p>
              </>
            ) : isSuccess ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-h6 font-bold text-black mb-2">Pembayaran Berhasil!</h2>
                <p className="text-b2 text-neutral-600 mb-2">
                  Pesanan <span className="font-semibold text-black">{order?.order_id}</span> telah dikonfirmasi.
                </p>
                <p className="text-b2 text-neutral-500 mb-6">
                  Total: Rp {order?.total_amount.toLocaleString("id-ID")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push(`/orders/${orderId}`)}
                    className="flex-1 py-3 px-4 bg-primary-500 text-white font-semibold text-b1 rounded-[10px]
                      hover:bg-primary-400 active:scale-[0.98] transition-all duration-200"
                  >
                    Lihat Pesanan
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="flex-1 py-3 px-4 border border-primary-100 text-black font-semibold text-b1 rounded-[10px]
                      hover:bg-neutral-100 active:scale-[0.98] transition-all duration-200"
                  >
                    Beranda
                  </button>
                </div>
              </>
            ) : isPending ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-h6 font-bold text-black mb-2">Menunggu Pembayaran</h2>
                <p className="text-b2 text-neutral-600 mb-2">
                  Pesanan <span className="font-semibold text-black">{order?.order_id}</span> sedang menunggu konfirmasi pembayaran.
                </p>
                <p className="text-b2 text-neutral-500 mb-6">
                  Total: Rp {order?.total_amount.toLocaleString("id-ID")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push(`/orders/${orderId}`)}
                    className="flex-1 py-3 px-4 bg-primary-500 text-white font-semibold text-b1 rounded-[10px]
                      hover:bg-primary-400 active:scale-[0.98] transition-all duration-200"
                  >
                    Lihat Pesanan
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="flex-1 py-3 px-4 border border-primary-100 text-black font-semibold text-b1 rounded-[10px]
                      hover:bg-neutral-100 active:scale-[0.98] transition-all duration-200"
                  >
                    Beranda
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-h6 font-bold text-black mb-2">Pembayaran Gagal</h2>
                <p className="text-b2 text-neutral-600 mb-6">
                  Silakan coba lagi atau hubungi customer service.
                </p>
                <button
                  onClick={() => router.push("/cart")}
                  className="w-full py-3 px-4 bg-primary-500 text-white font-semibold text-b1 rounded-[10px]
                    hover:bg-primary-400 active:scale-[0.98] transition-all duration-200"
                >
                  Kembali ke Keranjang
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
