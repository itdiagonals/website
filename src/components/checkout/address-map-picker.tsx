"use client";

import dynamic from "next/dynamic";

export interface AddressMapValue {
  fullAddress: string;
  postalCode: string;
  province: string;
  city: string;
  district: string;
  village: string;
  latitude: string;
  longitude: string;
  placeId: string;
  mapProvider: string;
  destinationAreaId: string;
  destinationAreaLabel: string;
}

interface AddressMapPickerProps {
  value: AddressMapValue;
  onChange: (next: Partial<AddressMapValue>) => void;
}

const AddressMapPickerInner = dynamic(
  () => import("./address-map-picker-inner"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] rounded-[10px] border border-primary-100 bg-neutral-100" />
    ),
  }
);

export function AddressMapPicker({ value, onChange }: AddressMapPickerProps) {
  return <AddressMapPickerInner value={value} onChange={onChange} />;
}
