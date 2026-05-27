"use client";

import { FormEvent, useMemo, useState } from "react";
import { Header } from "@/components/checkout/header";
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

export function ProfileModule() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "Rafael Benitez",
    email: "RafaelJorge@my.id",
    phone: "+62 812-3456-7890",
    addresses: [
      {
        id: "addr-1",
        title: "Home",
        recipientName: "Rafael Benitez",
        phoneNumber: "+62 812-3456-7890",
        province: "DI Yogyakarta",
        city: "Sleman",
        district: "Depok",
        village: "Caturtunggal",
        postalCode: "55281",
        fullAddress: "JL. Jeruk 2 A9",
        latitude: -7.7746842,
        longitude: 110.4085123,
        destinationAreaLabel: "Caturtunggal, Depok, Sleman",
        isPrimary: true,
      },
      {
        id: "addr-2",
        title: "Office",
        recipientName: "Rafael Benitez",
        phoneNumber: "+62 812-3456-7890",
        province: "DI Yogyakarta",
        city: "Kota Yogyakarta",
        district: "Gondokusuman",
        village: "Baciro",
        postalCode: "55225",
        fullAddress: "Jl. Mawar 10, Lt 2",
        latitude: -7.782115,
        longitude: 110.391546,
        destinationAreaLabel: "Baciro, Gondokusuman, Kota Yogyakarta",
        isPrimary: false,
      },
    ],
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

  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfile((prev) => ({
      ...prev,
      name: profileNameInput.trim() || prev.name,
      phone: profilePhoneInput.trim(),
    }));
    setDialog(null);
  };

  const submitAddress = (event: FormEvent<HTMLFormElement>) => {
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

    setProfile((prev) => {
      const previousAddresses = prev.addresses ?? [];
      const filtered = previousAddresses.filter(
        (address) => address.id !== nextAddress.id
      );
      const normalized = nextAddress.isPrimary
        ? filtered.map((address) => ({ ...address, isPrimary: false }))
        : filtered;
      const nextAddresses = [...normalized, nextAddress];

      if (!nextAddresses.some((address) => address.isPrimary) && nextAddresses[0]) {
        nextAddresses[0] = { ...nextAddresses[0], isPrimary: true };
      }

      return {
        ...prev,
        addresses: nextAddresses,
      };
    });

    setDialog("address-list");
  };

  const setPrimaryAddress = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      addresses: (prev.addresses ?? []).map((address) => ({
        ...address,
        isPrimary: address.id === id,
      })),
    }));
  };

  const ongoingOrders: OrderItem[] = [
    {
      id: "o1",
      name: "Jersey Oversize Black System",
      gender: "Pria",
      color: "Biru Navy",
      size: "40 cm",
      price: 200000,
      image: "/blacktee.png",
      status: "Order Packaged",
      timestamp: "Pesanan diterima pukul 13.00\nDate",
    },
    {
      id: "o2",
      name: "Jersey Oversize Black System",
      gender: "Pria",
      color: "Biru Navy",
      size: "40 cm",
      price: 200000,
      image: "/bluetee.png",
      status: "Order Packaged",
      timestamp: "Pesanan diterima pukul 13.00\nDate",
    },
  ];

  const finishedOrders: OrderItem[] = [
    {
      id: "o3",
      name: "Jersey Oversize Black System",
      gender: "Pria",
      color: "Biru Navy",
      size: "40 cm",
      price: 200000,
      image: "/greentee.png",
      status: "Order Finished",
      timestamp: "Pesanan diterima pukul 13.00\nDate",
    },
    {
      id: "o4",
      name: "Jersey Oversize Black System",
      gender: "Pria",
      color: "Biru Navy",
      size: "40 cm",
      price: 200000,
      image: "/blacktee.png",
      status: "Order Finished",
      timestamp: "Pesanan diterima pukul 13.00\nDate",
    },
  ];

  return (
    <>
      <div className="min-h-screen flex flex-col bg-[#f3f3f3]">
        <Header />
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
            </div>

            <div className="flex flex-col gap-[22px] items-start w-full">
              <h2 className="text-h6 font-bold text-black">Order Tracking</h2>
              {ongoingOrders.map((order) => (
                <OrderTrackingCard key={order.id} item={order} variant="ongoing" />
              ))}
            </div>

            <div className="flex flex-col gap-[22px] items-start w-full">
              <h2 className="text-h6 font-bold text-black">Order Finished</h2>
              {finishedOrders.map((order) => (
                <OrderTrackingCard key={order.id} item={order} variant="finished" />
              ))}
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
