"use client";

import { FormEvent, useEffect, useState } from "react";
import { AddressMapPicker } from "@/components/checkout/address-map-picker";
import { SearchableWilayahSelect } from "@/components/checkout/searchable-wilayah-select";
import {
  api,
  type CustomerAddress,
  type WilayahItem,
} from "@/lib/api";
import {
  AddressFormState,
  createEmptyAddressForm,
  toAddressRecord,
  toAddressForm,
  mapProfileAddressToPayload,
} from "@/modules/checkout/profile-module";
import { type UserProfileAddress } from "@/components/checkout/profile-card";

interface AddAddressDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newAddress: CustomerAddress) => void;
  mode?: "add" | "edit";
  initialAddress?: UserProfileAddress;
}

export function AddAddressDialog({ open, onClose, onSuccess, mode = "add", initialAddress }: AddAddressDialogProps) {
  const [addressForm, setAddressForm] = useState<AddressFormState>(() => {
    if (mode === "edit" && initialAddress) {
      return toAddressForm(initialAddress);
    }
    return createEmptyAddressForm();
  });
  const [addressError, setAddressError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialAddress) {
        setAddressForm(toAddressForm(initialAddress));
      } else {
        setAddressForm(createEmptyAddressForm());
      }
      setAddressError("");
    }
  }, [open, mode, initialAddress]);

  const updateAddressForm = (next: Partial<AddressFormState>) => {
    setAddressForm((prev) => ({ ...prev, ...next }));
  };

  const handleProvinceSelect = (item: WilayahItem) => {
    setAddressError("");
    updateAddressForm({
      provinceCode: item.code,
      province: item.name,
      cityCode: "",
      city: "",
      districtCode: "",
      district: "",
      villageCode: "",
      village: "",
    });
  };

  const handleCitySelect = (item: WilayahItem) => {
    setAddressError("");
    updateAddressForm({
      cityCode: item.code,
      city: item.name,
      districtCode: "",
      district: "",
      villageCode: "",
      village: "",
    });
  };

  const handleDistrictSelect = (item: WilayahItem) => {
    setAddressError("");
    updateAddressForm({
      districtCode: item.code,
      district: item.name,
      villageCode: "",
      village: "",
    });
  };

  const handleVillageSelect = (item: WilayahItem) => {
    setAddressError("");
    updateAddressForm({
      villageCode: item.code,
      village: item.name,
    });
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

    setLoading(true);
    try {
      const nextAddress = toAddressRecord(addressForm);
      if (mode === "edit" && initialAddress) {
        const numericId = Number(initialAddress.id);
        const updated = await api.addresses.update(numericId, mapProfileAddressToPayload(nextAddress));
        onSuccess(updated);
      } else {
        const created = await api.addresses.create(mapProfileAddressToPayload(nextAddress));
        onSuccess(created);
        setAddressForm(createEmptyAddressForm());
      }
      setAddressError("");
    } catch (error) {
      console.error("Failed to save address:", error);
      setAddressError("Gagal menyimpan alamat. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[720px] rounded-[10px] border border-primary-100 bg-white p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-h7 font-bold text-black">{mode === "edit" ? "Edit Alamat" : "Tambah Alamat"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-[8px] border border-primary-100 text-b2"
          >
            Tutup
          </button>
        </div>

        <form onSubmit={submitAddress} className="flex flex-col gap-4">
          <section className="rounded-[10px] border border-primary-100 p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-1">
              <h4 className="text-b1 font-semibold text-black">1. Isi data diri</h4>
              <p className="text-[12px] leading-[18px] text-neutral-600">Lengkapi identitas penerima terlebih dahulu.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-b2 text-black">
                Judul *
                <input
                  value={addressForm.title}
                  onChange={(event) => updateAddressForm({ title: event.target.value })}
                  className="h-11 rounded-[8px] border border-primary-100 px-3 outline-none"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-b2 text-black">
                Nama Penerima *
                <input
                  value={addressForm.recipientName}
                  onChange={(event) => updateAddressForm({ recipientName: event.target.value })}
                  className="h-11 rounded-[8px] border border-primary-100 px-3 outline-none"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-b2 text-black sm:col-span-2">
                Nomor Telepon *
                <input
                  value={addressForm.phoneNumber}
                  onChange={(event) => updateAddressForm({ phoneNumber: event.target.value })}
                  className="h-11 rounded-[8px] border border-primary-100 px-3 outline-none"
                  required
                />
              </label>
            </div>
          </section>

          <section className="rounded-[10px] border border-primary-100 p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-1">
              <h4 className="text-b1 font-semibold text-black">2. Detail alamat lengkap</h4>
              <p className="text-[12px] leading-[18px] text-neutral-600">Pilih wilayah bertahap dari data master yang sudah tersedia.</p>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-b2 text-black">
                Detail Alamat *
                <textarea
                  value={addressForm.fullAddress}
                  onChange={(event) => updateAddressForm({ fullAddress: event.target.value })}
                  className="min-h-[100px] rounded-[8px] border border-primary-100 px-3 py-3 outline-none"
                  required
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SearchableWilayahSelect
                  label="Provinsi"
                  level="province"
                  value={addressForm.province}
                  selectedCode={addressForm.provinceCode}
                  onSelect={handleProvinceSelect}
                  required
                  placeholder="Cari provinsi"
                />
                <SearchableWilayahSelect
                  label="Kota"
                  level="city"
                  parentCode={addressForm.provinceCode}
                  value={addressForm.city}
                  selectedCode={addressForm.cityCode}
                  onSelect={handleCitySelect}
                  required
                  disabled={!addressForm.provinceCode}
                  placeholder="Cari kota"
                  emptyMessage="Kota belum tersedia untuk provinsi ini."
                  helperText={!addressForm.provinceCode ? "Pilih provinsi terlebih dahulu." : undefined}
                />
                <SearchableWilayahSelect
                  label="Kecamatan"
                  level="district"
                  parentCode={addressForm.cityCode}
                  value={addressForm.district}
                  selectedCode={addressForm.districtCode}
                  onSelect={handleDistrictSelect}
                  required
                  disabled={!addressForm.cityCode}
                  placeholder="Cari kecamatan"
                  emptyMessage="Kecamatan belum tersedia untuk kota ini."
                  helperText={!addressForm.cityCode ? "Pilih kota terlebih dahulu." : undefined}
                />
                <SearchableWilayahSelect
                  label="Kelurahan"
                  level="village"
                  parentCode={addressForm.districtCode}
                  value={addressForm.village}
                  selectedCode={addressForm.villageCode}
                  onSelect={handleVillageSelect}
                  required
                  disabled={!addressForm.districtCode}
                  placeholder="Cari kelurahan"
                  emptyMessage="Kelurahan belum tersedia untuk kecamatan ini."
                  helperText={!addressForm.districtCode ? "Pilih kecamatan terlebih dahulu." : undefined}
                />
                <label className="flex flex-col gap-2 text-b2 text-black sm:col-span-2">
                  Kode Pos *
                  <input
                    value={addressForm.postalCode}
                    onChange={(event) => updateAddressForm({ postalCode: event.target.value })}
                    className="h-11 rounded-[8px] border border-primary-100 px-3 outline-none"
                    placeholder="Kode pos akan terisi dari pin point bila tersedia"
                    required
                  />
                  <span className="text-[12px] leading-[18px] text-neutral-600">
                    Saat ini kode pos otomatis akan terisi dari hasil pin point jika tersedia.
                  </span>
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-[10px] border border-primary-100 p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-1">
              <h4 className="text-b1 font-semibold text-black">3. Tambahkan pin point</h4>
              <p className="text-[12px] leading-[18px] text-neutral-600">Pin point membantu akurasi lokasi pengiriman.</p>
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
                  latitude: next.latitude ?? prev.latitude,
                  longitude: next.longitude ?? prev.longitude,
                  placeId: next.placeId ?? prev.placeId,
                  mapProvider: next.mapProvider ?? prev.mapProvider,
                  destinationAreaId: next.destinationAreaId ?? prev.destinationAreaId,
                  destinationAreaLabel: next.destinationAreaLabel ?? prev.destinationAreaLabel,
                  postalCode: prev.postalCode || next.postalCode || "",
                  fullAddress: prev.fullAddress || next.fullAddress || "",
                  locationSource: next.latitude && next.longitude ? "map_picker" : prev.locationSource,
                }));
              }}
            />
          </section>

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
              onClick={onClose}
              className="h-10 px-4 rounded-[8px] border border-primary-100 text-b2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-4 rounded-[8px] bg-primary-400 text-white text-b2 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
