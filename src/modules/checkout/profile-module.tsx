"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ProfileCard,
  UserProfile,
  UserProfileAddress,
} from "@/components/checkout/profile-card";
import {
  OrderTrackingCard,
  OrderItem,
} from "@/components/checkout/order-tracking-card";
import { AddressMapPicker } from "@/components/checkout/address-map-picker";
import {
  api,
  type CustomerAddress,
  type Product,
  type TransactionHistoryDetailItem,
  type TransactionHistoryListItem,
} from "@/lib/api";

type AddressFormState = {
  id: string;
  title: string;
  recipientName: string;
  phoneNumber: string;
  province: string;
  city: string;
  district: string;
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

const createEmptyAddressForm = (): AddressFormState => ({
  id: "",
  title: "",
  recipientName: "",
  phoneNumber: "",
  province: "",
  city: "",
  district: "",
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

const toAddressForm = (address: UserProfileAddress): AddressFormState => ({
  id: address.id,
  title: address.title,
  recipientName: address.recipientName,
  phoneNumber: address.phoneNumber,
  province: address.province,
  city: address.city,
  district: address.district,
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

const toAddressRecord = (form: AddressFormState): UserProfileAddress => ({
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

function mapBackendAddressToProfile(address: CustomerAddress): UserProfileAddress {
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

function mapProfileAddressToPayload(address: UserProfileAddress) {
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

  function toDisplayStatus(shippingStatus: string): OrderItem["status"] {
    const s = shippingStatus.toLowerCase();
    if (s === "delivered" || s === "finished" || s === "completed" || s === "diterima") {
      return "Order Finished";
    }
    if (s === "shipped" || s === "in_transit" || s === "sent" || s === "dikirim") {
      return "Order Sent";
    }
    if (s === "packaged" || s === "packed" || s === "diproses") {
      return "Order Packaged";
    }
    return "Order Accepted";
  }

  function isFinishedStatus(shippingStatus: string) {
    const s = shippingStatus.toLowerCase();
    return s === "delivered" || s === "finished" || s === "completed" || s === "diterima";
  }

  async function fetchOrders() {
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

          const displayStatus = toDisplayStatus(tx.shipping_status);
          const orderItem: OrderItem = {
            id: `${tx.order_id}-${item.id}`,
            orderId: tx.order_id,
            name: product?.name || "Unknown Product",
            gender: "",
            color: item.selected_color_name,
            size: item.selected_size,
            price: Math.round(item.price),
            image: product?.cover_image?.url || "",
            status: displayStatus,
            timestamp: `Order ${tx.order_id}\n${new Date(tx.created_at).toLocaleDateString("id-ID")}`,
          };

          if (isFinishedStatus(tx.shipping_status)) {
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
  }

  useEffect(() => {
    void fetchProfile();
    void fetchAddresses();
    void fetchOrders();
  }, []);

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
      setAddressError("Selected location is incomplete. Please choose a more specific point or search result.");
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
              <h2 className="text-h6 font-bold text-black">Order Finished</h2>
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

            {dialog === "address-form" && (
              <>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-h7 font-bold text-black">
                    {addressMode === "add" ? "Add Address" : "Edit Address"}
                  </h3>
                  <button
                    type="button"
                    onClick={openAddressList}
                    className="h-10 px-4 rounded-[8px] border border-primary-100 text-b2"
                  >
                    Saved addresses
                  </button>
                </div>

                <form onSubmit={submitAddress} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-2 text-b2 text-black">
                      Title
                      <input
                        value={addressForm.title}
                        onChange={(event) =>
                          setAddressForm((prev) => ({
                            ...prev,
                            title: event.target.value,
                          }))
                        }
                        className="h-11 rounded-[8px] border border-primary-100 px-3 outline-none"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-b2 text-black">
                      Recipient Name
                      <input
                        value={addressForm.recipientName}
                        onChange={(event) =>
                          setAddressForm((prev) => ({
                            ...prev,
                            recipientName: event.target.value,
                          }))
                        }
                        className="h-11 rounded-[8px] border border-primary-100 px-3 outline-none"
                        required
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-2 text-b2 text-black">
                      Phone Number
                      <input
                        value={addressForm.phoneNumber}
                        onChange={(event) =>
                          setAddressForm((prev) => ({
                            ...prev,
                            phoneNumber: event.target.value,
                          }))
                        }
                        className="h-11 rounded-[8px] border border-primary-100 px-3 outline-none"
                        required
                      />
                    </label>
                  </div>

                  <AddressMapPicker
                    value={{
                      fullAddress: addressForm.fullAddress,
                      postalCode: addressForm.postalCode,
                      province: addressForm.province,
                      city: addressForm.city,
                      district: addressForm.district,
                      village: addressForm.village,
                      latitude: addressForm.latitude,
                      longitude: addressForm.longitude,
                      placeId: addressForm.placeId,
                      mapProvider: addressForm.mapProvider,
                      destinationAreaId: addressForm.destinationAreaId,
                      destinationAreaLabel: addressForm.destinationAreaLabel,
                    }}
                    onChange={(next) => {
                      setAddressError("");
                      setAddressForm((prev) => ({
                        ...prev,
                        ...next,
                        locationSource: next.latitude && next.longitude ? "map_picker" : prev.locationSource,
                      }));
                    }}
                  />

                  <label className="flex flex-col gap-2 text-b2 text-black">
                    Full Address Detail
                    <textarea
                      value={addressForm.fullAddress}
                      onChange={(event) =>
                        setAddressForm((prev) => ({
                          ...prev,
                          fullAddress: event.target.value,
                        }))
                      }
                      className="min-h-[100px] rounded-[8px] border border-primary-100 px-3 py-3 outline-none"
                      required
                    />
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-2 text-b2 text-black">
                      Postal Code
                      <input
                        value={addressForm.postalCode}
                        readOnly
                        className="h-11 rounded-[8px] border border-primary-100 bg-neutral-100 px-3 outline-none text-neutral-700"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-b2 text-black">
                      Province
                      <input
                        value={addressForm.province}
                        readOnly
                        className="h-11 rounded-[8px] border border-primary-100 bg-neutral-100 px-3 outline-none text-neutral-700"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-2 text-b2 text-black">
                      City
                      <input
                        value={addressForm.city}
                        readOnly
                        className="h-11 rounded-[8px] border border-primary-100 bg-neutral-100 px-3 outline-none text-neutral-700"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-b2 text-black">
                      District
                      <input
                        value={addressForm.district}
                        readOnly
                        className="h-11 rounded-[8px] border border-primary-100 bg-neutral-100 px-3 outline-none text-neutral-700"
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-2 text-b2 text-black">
                    Village
                    <input
                      value={addressForm.village}
                      readOnly
                      className="h-11 rounded-[8px] border border-primary-100 bg-neutral-100 px-3 outline-none text-neutral-700"
                    />
                  </label>

                  <input type="hidden" value={addressForm.placeId} readOnly />
                  <input type="hidden" value={addressForm.mapProvider} readOnly />
                  <input type="hidden" value={addressForm.destinationAreaId} readOnly />
                  <input type="hidden" value={addressForm.destinationAreaLabel} readOnly />

                  {addressError && (
                    <p className="text-b2 text-red-200">{addressError}</p>
                  )}

                  <label className="flex items-center gap-3 text-b2 text-black">
                    <input
                      type="checkbox"
                      checked={addressForm.isPrimary}
                      onChange={(event) =>
                        setAddressForm((prev) => ({
                          ...prev,
                          isPrimary: event.target.checked,
                        }))
                      }
                    />
                    Set as primary address
                  </label>

                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={openAddressList}
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
          </div>
        </div>
      )}
    </>
  );
}
