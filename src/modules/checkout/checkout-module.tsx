"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, CartItem, CustomerAddress, TransactionHistoryDetail } from "@/lib/api";
import { AddressSelector } from "@/components/checkout/address-selector";
import { ShippingRateCard } from "@/components/checkout/shipping-rate-card";
import { CheckoutStepper } from "@/components/checkout/checkout-stepper";
import { CheckoutOrderSummary } from "@/components/checkout/checkout-order-summary";
import { AddAddressDialog } from "@/components/checkout/add-address-dialog";
import { mapBackendAddressToProfile } from "@/modules/checkout/profile-module";
import { cn } from "@/lib/utils";

type Step = "address" | "shipping" | "review" | "payment";

type SnapPayOptions = {
  onSuccess: (result: unknown) => void;
  onPending: (result: unknown) => void;
  onError: (result: unknown) => void;
  onClose: () => void;
};

type SnapRuntime = {
  pay: (token: string, options: SnapPayOptions) => void;
};

const PAYMENT_WINDOW_MINUTES = 60;

function getMidtransSnap(): SnapRuntime | null {
  if (typeof window === "undefined") {
    return null;
  }

  const candidate = (window as typeof window & { snap?: SnapRuntime }).snap;
  return candidate && typeof candidate.pay === "function" ? candidate : null;
}

function formatRemainingTime(milliseconds: number) {
  if (milliseconds <= 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getPaymentDeadline(createdAt?: string) {
  if (!createdAt) {
    return null;
  }

  const createdAtTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdAtTime)) {
    return null;
  }

  return createdAtTime + PAYMENT_WINDOW_MINUTES * 60 * 1000;
}

function formatPaymentDeadline(createdAt?: string) {
  const deadline = getPaymentDeadline(createdAt);
  if (!deadline) {
    return null;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(deadline));
}

export function CheckoutModule() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("address");
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | undefined>();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingRates, setShippingRates] = useState<import("@/lib/api").ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<import("@/lib/api").ShippingRate | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<TransactionHistoryDetail | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showEditAddress, setShowEditAddress] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [timeRemainingMs, setTimeRemainingMs] = useState<number | null>(null);
  const [autoOpenRequested, setAutoOpenRequested] = useState(false);
  const paymentAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [addrRes, cartRes] = await Promise.all([
          api.addresses.getAll().catch(() => [] as CustomerAddress[]),
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

        if (typeof window !== 'undefined') {
          const savedNotes = window.sessionStorage.getItem('checkout_notes');
          if (savedNotes) {
            setNotes(savedNotes);
          }
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
  const paymentDeadlineLabel = formatPaymentDeadline(transaction?.created_at);
  const isPaymentExpired = timeRemainingMs !== null && timeRemainingMs <= 0;

  useEffect(() => {
    if (!transaction || step !== "payment") {
      setTimeRemainingMs(null);
      return;
    }

    const deadline = getPaymentDeadline(transaction.created_at);
    if (!deadline) {
      setTimeRemainingMs(null);
      return;
    }

    const updateRemainingTime = () => {
      setTimeRemainingMs(Math.max(deadline - Date.now(), 0));
    };

    updateRemainingTime();
    const intervalId = window.setInterval(updateRemainingTime, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [step, transaction]);

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
    } catch {
      setError("Gagal mengambil ongkir. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [selectedAddressId, checkedCartItems]);

  const handleContinueToReview = useCallback(() => {
    if (!selectedRate) return;
    setStep("review");
  }, [selectedRate]);

  const handlePlaceOrder = useCallback(async () => {
    if (!selectedAddressId || !selectedRate || checkedCartItems.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const txn = await api.checkout.create({
        address_id: selectedAddressId,
        courier_name: selectedRate.courier_code,
        courier_service: selectedRate.service_code,
        selected_cart_item_ids: checkedCartItems.map((i) => i.id),
        notes: notes.trim() || undefined,
      });

      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('checkout_notes');
      }

      setTransaction(txn);
      setStep("payment");
      setPaymentMessage("Order berhasil dibuat. Membuka halaman pembayaran Midtrans...");
      setAutoOpenRequested(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Gagal membuat pesanan. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedAddressId, selectedRate, checkedCartItems, notes]);

  const openPayment = useCallback((txn: TransactionHistoryDetail, mode: "auto" | "manual") => {
    if (!txn.snap_token) {
      router.push(`/orders/${txn.order_id}`);
      return;
    }

    if (getPaymentDeadline(txn.created_at) !== null && getPaymentDeadline(txn.created_at)! <= Date.now()) {
      setPaymentMessage("Waktu pembayaran 1 jam telah habis. Silakan buat pesanan baru dari keranjang.");
      return;
    }

    const snap = getMidtransSnap();
    if (!snap) {
      setPaymentMessage(
        mode === "auto"
          ? "Popup pembayaran belum siap. Klik 'Buka Pembayaran' untuk melanjutkan secara manual."
          : "Midtrans belum siap dimuat. Coba lagi dalam beberapa detik."
      );
      return;
    }

    setLoading(true);
    setError(null);
    setPaymentMessage(
      mode === "auto"
        ? "Popup pembayaran sedang dibuka. Selesaikan pembayaran Anda dalam 1 jam."
        : "Popup pembayaran dibuka kembali. Selesaikan pembayaran Anda sebelum waktu habis."
    );

    snap.pay(txn.snap_token, {
      onSuccess: () => {
        router.push(`/orders/${txn.order_id}?status=success`);
      },
      onPending: () => {
        setPaymentMessage("Pembayaran belum selesai. Order tetap tersimpan dan stok ditahan sampai 1 jam.");
        setLoading(false);
      },
      onError: () => {
        setError("Pembayaran gagal. Silakan coba lagi.");
        setLoading(false);
      },
      onClose: () => {
        setPaymentMessage("Popup pembayaran ditutup. Anda bisa membuka lagi pembayaran selama waktu 1 jam masih tersedia.");
        setLoading(false);
      },
    });
  }, [router]);

  const handlePay = useCallback(() => {
    if (!transaction) {
      return;
    }

    openPayment(transaction, "manual");
  }, [openPayment, transaction]);

  useEffect(() => {
    if (!transaction || step !== "payment" || !autoOpenRequested) {
      return;
    }
    if (paymentAttemptedRef.current === transaction.order_id) {
      return;
    }

    paymentAttemptedRef.current = transaction.order_id;
    setAutoOpenRequested(false);
    openPayment(transaction, "auto");
  }, [autoOpenRequested, openPayment, step, transaction]);

  const handleAddAddressSuccess = (newAddress: CustomerAddress) => {
    setAddresses((prev) => [...prev, newAddress]);
    setSelectedAddressId(newAddress.id);
    setShowAddAddress(false);
  };

  const handleEditAddressSuccess = (updatedAddress: CustomerAddress) => {
    setAddresses((prev) =>
      prev.map((a) => (a.id === updatedAddress.id ? updatedAddress : a))
    );
    setShowEditAddress(false);
  };

  if (loading && step === "address" && addresses.length === 0 && !showAddAddress) {
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

          <CheckoutStepper step={step} />

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-[10px] text-b2 text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-8 items-start mt-6">
            <div className="w-full min-w-0 space-y-6">
              {step === "address" && (
                <div>
                  <h2 className="text-b1 font-semibold text-black mb-3">Pilih Alamat Pengiriman</h2>
                  <AddressSelector
                    addresses={addresses}
                    selectedId={selectedAddressId}
                    onSelect={setSelectedAddressId}
                  />
                  <div className="mt-4 flex items-center gap-3">
                    {selectedAddress && (
                      <button
                        onClick={() => setShowEditAddress(true)}
                        className="px-4 py-2 rounded-[8px] border border-primary-300 text-b2 text-primary-500 hover:bg-primary-100/20 transition-colors"
                      >
                        Edit Alamat
                      </button>
                    )}
                    <button
                      onClick={() => setShowAddAddress(true)}
                      className="px-4 py-2 rounded-[8px] border border-primary-300 text-b2 text-primary-500 hover:bg-primary-100/20 transition-colors"
                    >
                      + Tambah Alamat Baru
                    </button>
                  </div>
                </div>
              )}

              {step === "shipping" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-b1 font-semibold text-black">Pilih Metode Pengiriman</h2>
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
                          onSelect={() => setSelectedRate(rate)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === "review" && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-b1 font-semibold text-black">Review Pesanan</h2>
                      <button
                        onClick={() => setStep("shipping")}
                        className="text-b2 text-primary-400 hover:underline"
                      >
                        Ubah Pengiriman
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

              {step === "payment" && transaction && (
                <div className="space-y-6">
                  <div className="p-5 bg-white border border-primary-100 rounded-[10px] space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-b1 font-semibold text-black">Pembayaran</h2>
                        <p className="text-b2 text-neutral-600 mt-2">
                          Pesanan <span className="font-medium text-black">#{transaction.order_id}</span> sudah dibuat dan stok Anda sudah di-reserve.
                        </p>
                      </div>
                      <div className={cn(
                        "inline-flex w-fit rounded-full px-3 py-1 text-b3 font-semibold",
                        isPaymentExpired ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
                      )}>
                        {isPaymentExpired ? "Waktu pembayaran habis" : `Sisa waktu ${formatRemainingTime(timeRemainingMs ?? 0)}`}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[10px] border border-neutral-200 bg-[#f7f7f7] p-4">
                        <p className="text-b3 uppercase tracking-[0.08em] text-neutral-500">Batas pembayaran</p>
                        <p className="mt-1 text-b1 font-semibold text-black">
                          {paymentDeadlineLabel || "1 jam sejak order dibuat"}
                        </p>
                        <p className="mt-1 text-b3 text-neutral-500">
                          Setelah ini, reservation stok otomatis dilepas.
                        </p>
                      </div>
                      <div className="rounded-[10px] border border-neutral-200 bg-[#f7f7f7] p-4">
                        <p className="text-b3 uppercase tracking-[0.08em] text-neutral-500">Status saat ini</p>
                        <p className="mt-1 text-b1 font-semibold text-black">
                          {isPaymentExpired ? "Expired" : transaction.status === "paid" ? "Paid" : "Waiting for payment"}
                        </p>
                        <p className="mt-1 text-b3 text-neutral-500">
                          Jika popup tertutup atau diblokir browser, buka lagi dari tombol di kanan.
                        </p>
                      </div>
                    </div>

                    {paymentMessage && (
                      <div className="rounded-[10px] border border-primary-100 bg-primary-100/20 px-4 py-3 text-b2 text-neutral-700">
                        {paymentMessage}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handlePay}
                        disabled={loading || isPaymentExpired}
                        className="px-4 py-3 rounded-[10px] bg-primary-500 text-white text-b2 font-semibold hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPaymentExpired ? "Waktu Pembayaran Habis" : "Buka Pembayaran"}
                      </button>
                      <button
                        onClick={() => router.push(`/orders/${transaction.order_id}`)}
                        className="px-4 py-3 rounded-[10px] border border-primary-100 text-b2 font-semibold text-black hover:bg-neutral-100"
                      >
                        Lihat Detail Order
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full min-w-0 xl:max-w-[420px] xl:justify-self-end">
              <CheckoutOrderSummary
                cartItems={cartItems}
                selectedAddress={selectedAddress}
                selectedRate={selectedRate}
                step={step}
                onNext={step === "address" ? handleFetchRates : step === "shipping" ? handleContinueToReview : undefined}
                onPlaceOrder={handlePlaceOrder}
                onPay={handlePay}
                loading={loading}
                paymentButtonLabel={step === "payment" ? (isPaymentExpired ? "Waktu Habis" : "Buka Pembayaran") : undefined}
                paymentDisabled={step === "payment" && isPaymentExpired}
              />
            </div>
          </div>
        </div>
      </main>

      <AddAddressDialog
        open={showAddAddress}
        onClose={() => setShowAddAddress(false)}
        onSuccess={handleAddAddressSuccess}
      />

      <AddAddressDialog
        open={showEditAddress}
        onClose={() => setShowEditAddress(false)}
        onSuccess={handleEditAddressSuccess}
        mode="edit"
        initialAddress={selectedAddress ? mapBackendAddressToProfile(selectedAddress) : undefined}
      />
    </div>
  );
}
