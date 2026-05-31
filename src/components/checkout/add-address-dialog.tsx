"use client";

import { FormEvent, useState } from "react";
import { AddressMapPicker } from "@/components/checkout/address-map-picker";
import {
  api,
  type CustomerAddress,
} from "@/lib/api";
import {
  AddressFormState,
  createEmptyAddressForm,
  toAddressRecord,
  mapProfileAddressToPayload,
} from "@/modules/checkout/profile-module";

interface AddAddressDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newAddress: CustomerAddress) => void;
}

export function AddAddressDialog({ open, onClose, onSuccess }: AddAddressDialogProps) {
  const [addressForm, setAddressForm] = useState<AddressFormState>(createEmptyAddressForm);
  const [addressError, setAddressError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const created = await api.addresses.create(mapProfileAddressToPayload(nextAddress));
      onSuccess(created);
      setAddressForm(createEmptyAddressForm);
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
          <h3 className="text-h7 font-bold text-black">Tambah Alamat</h3>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-[8px] border border-primary-100 text-b2"
          >
            Tutup
          </button>
        </div>

        <form onSubmit={submitAddress} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-2 text-b2 text-black">
              Judul *
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
              Nama Penerima *
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
              Nomor Telepon *
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
                latitude: next.latitude ?? prev.latitude,
                longitude: next.longitude ?? prev.longitude,
                placeId: next.placeId ?? prev.placeId,
                mapProvider: next.mapProvider ?? prev.mapProvider,
                destinationAreaId: next.destinationAreaId ?? prev.destinationAreaId,
                destinationAreaLabel: next.destinationAreaLabel ?? prev.destinationAreaLabel,
                province: prev.province || next.province || "",
                city: prev.city || next.city || "",
                district: prev.district || next.district || "",
                village: prev.village || next.village || "",
                postalCode: prev.postalCode || next.postalCode || "",
                fullAddress: prev.fullAddress || next.fullAddress || "",
                locationSource: next.latitude && next.longitude ? "map_picker" : prev.locationSource,
              }));
            }}
          />

          <label className="flex flex-col gap-2 text-b2 text-black">
            Detail Alamat *
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
              Kode Pos *
              <input
                value={addressForm.postalCode}
                onChange={(event) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    postalCode: event.target.value,
                  }))
                }
                className="h-11 rounded-[8px] border border-primary-100 px-3 outline-none"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-b2 text-black">
              Provinsi *
              <input
                value={addressForm.province}
                onChange={(event) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    province: event.target.value,
                  }))
                }
                className="h-11 rounded-[8px] border border-primary-100 px-3 outline-none"
                required
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-2 text-b2 text-black">
              Kota *
              <input
                value={addressForm.city}
                onChange={(event) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    city: event.target.value,
                  }))
                }
                className="h-11 rounded-[8px] border border-primary-100 px-3 outline-none"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-b2 text-black">
              Kecamatan *
              <input
                value={addressForm.district}
                onChange={(event) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    district: event.target.value,
                  }))
                }
                className="h-11 rounded-[8px] border border-primary-100 px-3 outline-none"
                required
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-b2 text-black">
            Kelurahan *
            <input
              value={addressForm.village}
              onChange={(event) =>
                setAddressForm((prev) => ({
                  ...prev,
                  village: event.target.value,
                }))
              }
              className="h-11 rounded-[8px] border border-primary-100 px-3 outline-none"
              required
            />
          </label>

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
