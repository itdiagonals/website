"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ProfileCard,
  UserProfile,
  UserProfileAddress,
} from "@/components/checkout/profile-card";
import {
  OrderTrackingCard,
  OrderItem,
} from "@/components/checkout/order-tracking-card";
import { AddAddressDialog } from "@/components/checkout/add-address-dialog";
import {
  api,
  type CustomerAddress,
  type Product,
  type TransactionHistoryListItem,
} from "@/lib/api";
import { getOrderCardPresentation } from "./order-status";

export type AddressFormState = {
  id: string;
  title: string;
  recipientName: string;
  phoneNumber: string;
  provinceCode: string;
  province: string;
  cityCode: string;
  city: string;
  districtCode: string;
  district: string;
  villageCode: string;
  village: string;
  postalCode: string;
  fullAddress: string;
  latitude: string;
  longitude: string;
  destinationAreaId: string;
  destinationAreaLabel: string;
  placeId: string;
  mapProvider: string;
  locationSource: string;
  isPrimary: boolean;
};

export const createEmptyAddressForm = (): AddressFormState => ({
  id: "",
  title: "",
  recipientName: "",
  phoneNumber: "",
  provinceCode: "",
  province: "",
  cityCode: "",
  city: "",
  districtCode: "",
  district: "",
  villageCode: "",
  village: "",
  postalCode: "",
  fullAddress: "",
  latitude: "",
  longitude: "",
  destinationAreaId: "",
  destinationAreaLabel: "",
  placeId: "",
  mapProvider: "",
  locationSource: "",
  isPrimary: false,
});

export const toAddressForm = (address: UserProfileAddress): AddressFormState => ({
  id: address.id,
  title: address.title,
  recipientName: address.recipientName,
  phoneNumber: address.phoneNumber,
  provinceCode: "",
  province: address.province,
  cityCode: "",
  city: address.city,
  districtCode: "",
  district: address.district,
  villageCode: "",
  village: address.village,
  postalCode: address.postalCode,
  fullAddress: address.fullAddress,
  latitude:
    address.latitude === null || address.latitude === undefined
      ? ""
      : String(address.latitude),
  longitude:
    address.longitude === null || address.longitude === undefined
      ? ""
      : String(address.longitude),
  destinationAreaLabel: address.destinationAreaLabel ?? "",
  destinationAreaId: address.destinationAreaId ?? "",
  placeId: address.placeId ?? "",
  mapProvider: address.mapProvider ?? "",
  locationSource: address.locationSource ?? "",
  isPrimary: address.isPrimary,
});

export const toAddressRecord = (form: AddressFormState): UserProfileAddress => ({
  id: form.id || crypto.randomUUID(),
  title: form.title,
  recipientName: form.recipientName,
  phoneNumber: form.phoneNumber,
  province: form.province,
  city: form.city,
  district: form.district,
  village: form.village,
  postalCode: form.postalCode,
  fullAddress: form.fullAddress,
  latitude: form.latitude === "" ? null : Number(form.latitude),
  longitude: form.longitude === "" ? null : Number(form.longitude),
  placeId: form.placeId,
  mapProvider: form.mapProvider,
  locationSource: form.locationSource,
  destinationAreaId: form.destinationAreaId,
  destinationAreaLabel: form.destinationAreaLabel,
  isPrimary: form.isPrimary,
});

export function mapBackendAddressToProfile(address: CustomerAddress): UserProfileAddress {
  return {
    id: String(address.id),
    title: address.title,
    recipientName: address.recipient_name,
    phoneNumber: address.phone_number,
    province: address.province,
    city: address.city,
    district: address.district,
    village: address.village,
    postalCode: address.postal_code,
    fullAddress: address.full_address,
    latitude: address.latitude ?? null,
    longitude: address.longitude ?? null,
    placeId: address.place_id,
    mapProvider: address.map_provider,
    locationSource: address.location_source,
    destinationAreaId: address.destination_area_id,
    destinationAreaLabel: address.destination_area_label,
    isPrimary: address.is_primary,
  };
}

export function mapProfileAddressToPayload(address: UserProfileAddress) {
  return {
    title: address.title,
    recipient_name: address.recipientName,
    phone_number: address.phoneNumber,
    province: address.province,
    city: address.city,
    district: address.district,
    village: address.village,
    postal_code: address.postalCode,
    full_address: address.fullAddress,
    latitude: address.latitude,
    longitude: address.longitude,
    place_id: address.placeId,
    map_provider: address.mapProvider,
    location_source: address.locationSource,
    destination_area_id: address.destinationAreaId,
    destination_area_label: address.destinationAreaLabel,
    is_primary: address.isPrimary,
  };
}

export function ProfileModule() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "Customer",
    email: "",
    phone: "",
    addresses: [],
  });

  const [dialog, setDialog] = useState<
    "profile" | "address-list" | "address-form" | null
  >(null);
  const [addressMode, setAddressMode] = useState<"add" | "edit">("add");
  const [profileNameInput, setProfileNameInput] = useState(profile.name);
  const [profilePhoneInput, setProfilePhoneInput] = useState(profile.phone ?? "");
  const [addressForm, setAddressForm] =
    useState<AddressFormState>(createEmptyAddressForm());
  const [addressError, setAddressError] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ongoingOrders, setOngoingOrders] = useState<OrderItem[]>([]);
  const [finishedOrders, setFinishedOrders] = useState<OrderItem[]>([]);

  const fetchProfile = async () => {
    try {
      const user = await api.users.me();
      setProfile((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const addresses = await api.addresses.getAll();
      setProfile((prev) => ({
        ...prev,
        addresses: addresses.map(mapBackendAddressToProfile),
      }));
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  function isClosedOrder(paymentStatus: string, shippingStatus: string) {
    return getOrderCardPresentation(paymentStatus, shippingStatus).bucket === "closed";
  }

  const fetchOrders = useCallback(async () => {
    try {
      const list = await api.transactions.getAll(1, 50);
      const detailResults = await Promise.all(
        list.map(async (tx: TransactionHistoryListItem) => {
          try {
            const detail = await api.transactions.getByOrderId(tx.order_id);
            return { tx, detail };
          } catch {
            return null;
          }
        })
      );

      const productCache = new Map<number, Product>();
      const ongoing: OrderItem[] = [];
      const finished: OrderItem[] = [];

      for (const result of detailResults) {
        if (!result) continue;
        const { tx, detail } = result;

        for (const item of detail.items) {
          let product: Product | undefined = productCache.get(item.product_id);
          if (!product) {
            try {
              product = await api.products.getById(item.product_id);
              productCache.set(item.product_id, product);
            } catch {
              product = undefined;
            }
          }

          const paymentStatus = detail.status || tx.status;
          const shippingStatus = detail.shipping_status || tx.shipping_status;
          const presentation = getOrderCardPresentation(paymentStatus, shippingStatus);
          const orderItem: OrderItem = {
            id: `${tx.order_id}-${item.id}`,
            orderId: tx.order_id,
            name: product?.name || "Unknown Product",
            gender: "",
            color: item.selected_color_name,
            size: item.selected_size,
            price: Math.round(item.price),
            image: product?.cover_image?.url || "",
            status: presentation.label,
            tone: presentation.tone,
            timestamp: `${presentation.detail}\n${new Date(detail.updated_at || tx.created_at).toLocaleDateString("id-ID")}`,
          };

          if (isClosedOrder(paymentStatus, shippingStatus)) {
            finished.push(orderItem);
          } else {
            ongoing.push(orderItem);
          }
        }
      }

      setOngoingOrders(ongoing);
      setFinishedOrders(finished);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
    void fetchAddresses();
    void fetchOrders();
  }, [fetchOrders]);

  const primaryAddress = useMemo(
    () => profile.addresses?.find((address) => address.isPrimary),
    [profile.addresses]
  );

  const openProfileDialog = () => {
    setProfileNameInput(profile.name);
    setProfilePhoneInput(profile.phone ?? "");
    setDialog("profile");
  };

  const openAddressList = () => {
    setDialog("address-list");
  };

  const openAddressForm = (mode: "add" | "edit", address?: UserProfileAddress) => {
    setAddressMode(mode);
    setAddressError("");
    setAddressForm(
      address
        ? toAddressForm(address)
        : {
            ...createEmptyAddressForm(),
            isPrimary: !profile.addresses?.length,
          }
    );
    setDialog("address-form");
  };

  const submitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await api.users.updateMe({
        name: profileNameInput.trim(),
        phone: profilePhoneInput.trim(),
      });
      await fetchProfile();
      setDialog(null);
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Gagal memperbarui profil. Silakan coba lagi.");
    }
  };

  const submitAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (addressForm.latitude.trim() === "" || addressForm.longitude.trim() === "") {
      setAddressError("Please choose a point on the map or use current location before saving.");
      return;
    }

    if (
      addressForm.postalCode.trim() === "" ||
      addressForm.province.trim() === "" ||
      addressForm.city.trim() === "" ||
      addressForm.district.trim() === "" ||
      addressForm.village.trim() === ""
    ) {
      setAddressError("Please fill in all required address fields.");
      return;
    }

    const nextAddress = toAddressRecord(addressForm);

    try {
      const isExistingBackendAddress = addressMode === "edit" && nextAddress.id && !nextAddress.id.startsWith("addr-");
      if (isExistingBackendAddress) {
        const numericId = Number(nextAddress.id);
        if (!isNaN(numericId)) {
          await api.addresses.update(numericId, mapProfileAddressToPayload(nextAddress));
        }
      } else {
        await api.addresses.create(mapProfileAddressToPayload(nextAddress));
      }
      await fetchAddresses();
      setDialog("address-list");
    } catch (error) {
      console.error("Failed to save address:", error);
      setAddressError("Gagal menyimpan alamat. Silakan coba lagi.");
    }
  };

  const setPrimaryAddress = async (id: string) => {
    const address = profile.addresses?.find((a) => a.id === id);
    if (!address) return;

    const numericId = Number(id);
    if (isNaN(numericId)) return;

    try {
      await api.addresses.update(numericId, {
        ...mapProfileAddressToPayload({ ...address, isPrimary: true }),
        is_primary: true,
      });
      await fetchAddresses();
    } catch (error) {
      console.error("Failed to set primary address:", error);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-[#f3f3f3]">
        <main className="flex-grow pt-[72px] pb-[72px]">
          <div className="px-4 sm:px-6 md:px-[24px] max-w-[1440px] mx-auto w-full flex flex-col gap-[56px] sm:gap-[72px]">
            <div className="flex flex-col gap-[22px] items-start w-full">
              <h1 className="text-h6 font-bold text-black">Profile</h1>
              <ProfileCard
                profile={profile}
                onEditProfile={openProfileDialog}
                onEditAddress={() =>
                  primaryAddress
                    ? openAddressForm("edit", primaryAddress)
                    : openAddressList()
                }
                onAddAddress={openAddressList}
              />
              {(loadingProfile || loadingAddresses) && (
                <p className="text-b2 text-neutral-500">Loading...</p>
              )}
            </div>

            <div className="flex flex-col gap-[22px] items-start w-full">
              <h2 className="text-h6 font-bold text-black">Order Tracking</h2>
              {loadingOrders ? (
                <p className="text-b2 text-neutral-500">Loading orders...</p>
              ) : ongoingOrders.length === 0 ? (
                <p className="text-b2 text-neutral-500">No ongoing orders.</p>
              ) : (
                ongoingOrders.map((order) => (
                  <OrderTrackingCard key={order.id} item={order} variant="ongoing" />
                ))
              )}
            </div>

            <div className="flex flex-col gap-[22px] items-start w-full">
              <h2 className="text-h6 font-bold text-black">Order History</h2>
              {loadingOrders ? (
                <p className="text-b2 text-neutral-500">Loading orders...</p>
              ) : finishedOrders.length === 0 ? (
                <p className="text-b2 text-neutral-500">No finished orders.</p>
              ) : (
                finishedOrders.map((order) => (
                  <OrderTrackingCard key={order.id} item={order} variant="finished" />
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {dialog !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[720px] rounded-[10px] border border-primary-100 bg-white p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            {dialog === "profile" && (
              <>
                <h3 className="text-h7 font-bold text-black mb-4">Edit Profile</h3>
                <form onSubmit={submitProfile} className="flex flex-col gap-4">
                  <label className="flex flex-col gap-2 text-b2 text-black">
                    Name
                    <input
                      value={profileNameInput}
                      onChange={(event) => setProfileNameInput(event.target.value)}
                      className="h-11 rounded-[8px] border border-primary-100 px-3 outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-b2 text-black">
                    Phone
                    <input
                      value={profilePhoneInput}
                      onChange={(event) => setProfilePhoneInput(event.target.value)}
                      className="h-11 rounded-[8px] border border-primary-100 px-3 outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-b2 text-black">
                    Email
                    <input
                      value={profile.email}
                      disabled
                      className="h-11 rounded-[8px] border border-primary-100 px-3 outline-none bg-neutral-100 text-neutral-600"
                    />
                  </label>
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDialog(null)}
                      className="h-10 px-4 rounded-[8px] border border-primary-100 text-b2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="h-10 px-4 rounded-[8px] bg-primary-400 text-white text-b2"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </>
            )}

            {dialog === "address-list" && (
              <>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-h7 font-bold text-black">Saved Addresses</h3>
                  <button
                    type="button"
                    onClick={() => openAddressForm("add")}
                    className="h-10 px-4 rounded-[8px] bg-primary-400 text-white text-b2"
                  >
                    Add Address
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {(profile.addresses ?? []).map((address) => (
                    <div
                      key={address.id}
                      className="rounded-[10px] border border-primary-100 p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-b1 font-medium text-black">
                            {address.title}
                            {address.isPrimary ? " • Primary" : ""}
                          </p>
                          <p className="text-b2 text-black break-words">
                            {address.recipientName} • {address.phoneNumber}
                          </p>
                          <p className="text-b2 text-black break-words">
                            {address.fullAddress}
                          </p>
                          <p className="text-b3 text-neutral-700 break-words">
                            {address.village}, {address.district}, {address.city}, {address.province} {address.postalCode}
                          </p>
                          {address.destinationAreaLabel && (
                            <p className="text-b4 text-neutral-700 break-words">
                              {address.destinationAreaLabel}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          {!address.isPrimary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryAddress(address.id)}
                              className="h-10 px-4 rounded-[8px] border border-primary-100 text-b2"
                            >
                              Set primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openAddressForm("edit", address)}
                            className="h-10 px-4 rounded-[8px] border border-primary-100 text-b2"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setDialog(null)}
                    className="h-10 px-4 rounded-[8px] border border-primary-100 text-b2"
                  >
                    Close
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {dialog === "address-form" && (
        <AddAddressDialog
          open={true}
          onClose={openAddressList}
          onSuccess={async () => {
            await fetchAddresses();
            setDialog("address-list");
          }}
          mode={addressMode}
          initialAddress={addressMode === "edit" ? toAddressRecord(addressForm) : undefined}
        />
      )}
    </>
  );
}
