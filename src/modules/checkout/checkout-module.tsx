"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, CartItem } from "@/lib/api";
import { AddressSelector } from "@/components/checkout/address-selector";
import { ShippingRateCard } from "@/components/checkout/shipping-rate-card";
import { PaymentSummary } from "@/components/checkout/payment-summary";
import { cn } from "@/lib/utils";

type Step = "address" | "shipping" | "payment";

export function CheckoutModule() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("address");
  const [addresses, setAddresses] = useState<import("@/lib/api").CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | undefined>();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingRates, setShippingRates] = useState<import("@/lib/api").ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<import("@/lib/api").ShippingRate | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [addrRes, cartRes] = await Promise.all([
          api.addresses.getAll().catch(() => [] as import("@/lib/api").CustomerAddress[]),
          api.cart.get().catch(() => ({ items: [] as CartItem[] })),
        ]);
        setAddresses(addrRes);
        setCartItems(cartRes.items);

        const primary = addrRes.find((a) => a.is_primary);
        if (primary) {
          setSelectedAddressId(primary.id);
        } else if (addrRes.length > 0) {
          setSelectedAddressId(addrRes[0].id);
        }
      } catch {
        setError("Gagal memuat data. Silakan refresh halaman.");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const checkedCartItems = cartItems.filter((i) => i.quantity > 0);
  const itemSubtotal = checkedCartItems.reduce(
    (acc, item) => acc + item.base_price * item.quantity,
    0
  );

  const handleFetchRates = useCallback(async () => {
    if (!selectedAddressId || checkedCartItems.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.checkout.rates({
        address_id: selectedAddressId,
        selected_cart_item_ids: checkedCartItems.map((i) => i.id),
      });
      setShippingRates(res.rates);
      setSelectedRate(null);
      setStep("shipping");
    } catch (err) {
      setError("Gagal mengambil ongkir. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [selectedAddressId, checkedCartItems]);

  const handleCheckout = useCallback(async () => {
    if (!selectedAddressId || !selectedRate || checkedCartItems.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const transaction = await api.checkout.create({
        address_id: selectedAddressId,
        courier_name: selectedRate.courier_code,
        courier_service: selectedRate.service_code,
        selected_cart_item_ids: checkedCartItems.map((i) => i.id),
        notes: notes.trim() || undefined,
      });

      if (transaction.snap_token) {
        if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).snap) {
          const snap = (window as unknown as Record<string, unknown>).snap as {
            pay: (
              token: string,
              options: {
                onSuccess: (result: unknown) => void;
                onPending: (result: unknown) => void;
                onError: (result: unknown) => void;
                onClose: () => void;
              }
            ) => void;
          };

          snap.pay(transaction.snap_token, {
            onSuccess: () => {
              router.push(`/orders/${transaction.order_id}?status=success`);
            },
            onPending: () => {
              router.push(`/orders/${transaction.order_id}?status=pending`);
            },
            onError: () => {
              setError("Pembayaran gagal. Silakan coba lagi.");
              setLoading(false);
            },
            onClose: () => {
              setLoading(false);
            },
          });
        } else {
          router.push(`/checkout/result?order_id=${transaction.order_id}&status=pending`);
        }
      } else {
        router.push(`/orders/${transaction.order_id}`);
      }
    } catch (err) {
      setError("Checkout gagal. Silakan coba lagi.");
      setLoading(false);
    }
  }, [selectedAddressId, selectedRate, checkedCartItems, notes, router]);

  if (loading && step === "address" && addresses.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f3f3f3]">
        <main className="flex-grow flex items-center justify-center">
          <p className="text-b2 text-neutral-500">Loading checkout...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f3f3]">
      <main className="flex-grow pb-20">
        <div className="px-4 sm:px-6 md:px-[24px] max-w-[1440px] mx-auto w-full">
          <h1 className="text-h6 font-bold text-black mt-[14px] mb-[14px]">Checkout</h1>

          <div className="flex items-center gap-2 mb-6">
            {(["address", "shipping", "payment"] as Step[]).map((s, idx) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                    step === s
                      ? "bg-primary-500 text-white"
                      : idx < ["address", "shipping", "payment"].indexOf(step)
                        ? "bg-primary-400 text-white"
                        : "bg-neutral-200 text-neutral-500"
                  )}
                >
                  {idx + 1}
                </div>
                <span
                  className={cn(
                    "text-b2 font-medium hidden sm:block",
                    step === s ? "text-black" : "text-neutral-500"
                  )}
                >
                  {s === "address" && "Alamat"}
                  {s === "shipping" && "Pengiriman"}
                  {s === "payment" && "Pembayaran"}
                </span>
                {idx < 2 && <div className="w-8 h-px bg-neutral-300 hidden sm:block" />}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-[10px] text-b2 text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-8 items-start">
            <div className="w-full min-w-0 space-y-6">
              {step === "address" && (
                <div>
                  <h2 className="text-b1 font-semibold text-black mb-3">Pilih Alamat Pengiriman</h2>
                  <AddressSelector
                    addresses={addresses}
                    selectedId={selectedAddressId}
                    onSelect={setSelectedAddressId}
                  />
                  <button
                    onClick={handleFetchRates}
                    disabled={!selectedAddressId || loading}
                    className="w-full mt-4 py-3.5 px-4 bg-primary-500 text-white font-semibold text-b1 rounded-[10px]
                      hover:bg-primary-400 active:scale-[0.98] transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Memuat..." : "Lanjut ke Pengiriman"}
                  </button>
                </div>
              )}

              {step === "shipping" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-b1 font-semibold text-black">Pilih Kurir</h2>
                    <button
                      onClick={() => setStep("address")}
                      className="text-b2 text-primary-400 hover:underline"
                    >
                      Ubah Alamat
                    </button>
                  </div>

                  {selectedAddress && (
                    <div className="p-3 bg-white border border-primary-100 rounded-[10px] mb-4 text-b2 text-neutral-600">
                      <p className="font-medium text-black">{selectedAddress.recipient_name}</p>
                      <p>{selectedAddress.full_address}, {selectedAddress.city}</p>
                    </div>
                  )}

                  {shippingRates.length === 0 && !loading ? (
                    <p className="text-b2 text-neutral-500">Tidak ada layanan pengiriman tersedia.</p>
                  ) : (
                    <div className="space-y-3">
                      {shippingRates.map((rate) => (
                        <ShippingRateCard
                          key={`${rate.courier_code}-${rate.service_code}`}
                          rate={rate}
                          isSelected={
                            selectedRate?.courier_code === rate.courier_code &&
                            selectedRate?.service_code === rate.service_code
                          }
                          onSelect={() => {
                            setSelectedRate(rate);
                            setStep("payment");
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === "payment" && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-b1 font-semibold text-black">Detail Pengiriman</h2>
                      <button
                        onClick={() => setStep("shipping")}
                        className="text-b2 text-primary-400 hover:underline"
                      >
                        Ubah Kurir
                      </button>
                    </div>

                    {selectedAddress && (
                      <div className="p-4 bg-white border border-primary-100 rounded-[10px] text-b2 text-neutral-600">
                        <p className="font-medium text-black">{selectedAddress.recipient_name}</p>
                        <p>{selectedAddress.phone_number}</p>
                        <p className="mt-1">
                          {selectedAddress.full_address}, {selectedAddress.village},{" "}
                          {selectedAddress.district}, {selectedAddress.city},{" "}
                          {selectedAddress.province} {selectedAddress.postal_code}
                        </p>
                      </div>
                    )}

                    {selectedRate && (
                      <div className="mt-3 p-4 bg-white border border-primary-100 rounded-[10px] flex items-center justify-between">
                        <div>
                          <p className="text-b1 font-semibold text-black uppercase">
                            {selectedRate.courier_name} {selectedRate.service_name}
                          </p>
                          <p className="text-b2 text-neutral-500">
                            Estimasi: {selectedRate.estimated_range || selectedRate.estimated_days || "N/A"}
                          </p>
                        </div>
                        <p className="text-b1 font-bold text-black">
                          Rp {selectedRate.price.toLocaleString("id-ID")}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="text-b1 font-semibold text-black mb-3">Catatan Pesanan</h2>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tulis catatan untuk penjual (opsional)"
                      rows={3}
                      className="w-full p-4 bg-white border border-primary-100 rounded-[10px] text-b2 text-black
                        placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-400
                        resize-none"
                    />
                  </div>

                  <div>
                    <h2 className="text-b1 font-semibold text-black mb-3">Produk Dipesan</h2>
                    <div className="bg-white border border-primary-100 rounded-[10px] overflow-hidden">
                      {checkedCartItems.map((item, idx) => (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center gap-4 p-4",
                            idx < checkedCartItems.length - 1 && "border-b border-neutral-100"
                          )}
                        >
                          <div className="w-16 h-16 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-b2 font-medium text-black truncate">
                              {item.product_name}
                            </p>
                            <p className="text-b2 text-neutral-500">
                              {item.selected_color_name}, {item.selected_size}
                            </p>
                            <p className="text-b2 text-neutral-500">x{item.quantity}</p>
                          </div>
                          <p className="text-b2 font-semibold text-black flex-shrink-0">
                            Rp {(item.base_price * item.quantity).toLocaleString("id-ID")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full min-w-0 xl:max-w-[420px] xl:justify-self-end">
              {step === "payment" && selectedRate && (
                <PaymentSummary
                  itemSubtotal={itemSubtotal}
                  shippingCost={selectedRate.price}
                  total={itemSubtotal + selectedRate.price}
                  itemCount={checkedCartItems.length}
                  onPay={handleCheckout}
                  loading={loading}
                />
              )}

              {step === "shipping" && (
                <div className="bg-white border border-primary-100 rounded-[10px] p-5 sticky top-4">
                  <h3 className="text-h6 font-bold text-black mb-4">Ringkasan Sementara</h3>
                  <div className="flex justify-between items-center text-b2 text-neutral-700">
                    <span>Subtotal Produk</span>
                    <span>Rp {itemSubtotal.toLocaleString("id-ID")}</span>
                  </div>
                  <p className="mt-4 text-b2 text-neutral-500">
                    Pilih kurir di sebelah kiri untuk melihat total.
                  </p>
                </div>
              )}

              {step === "address" && (
                <div className="bg-white border border-primary-100 rounded-[10px] p-5 sticky top-4">
                  <h3 className="text-h6 font-bold text-black mb-4">Ringkasan Keranjang</h3>
                  <div className="flex justify-between items-center text-b2 text-neutral-700">
                    <span>Subtotal Produk</span>
                    <span>Rp {itemSubtotal.toLocaleString("id-ID")}</span>
                  </div>
                  <p className="mt-4 text-b2 text-neutral-500">
                    Pilih alamat pengiriman untuk melanjutkan.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
