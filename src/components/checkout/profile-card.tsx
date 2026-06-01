import { Pencil } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  addresses?: UserProfileAddress[];
}

export interface UserProfileAddress {
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
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string;
  mapProvider?: string;
  locationSource?: string;
  destinationAreaId?: string;
  destinationAreaLabel?: string;
  isPrimary: boolean;
}

interface ProfileCardProps {
  profile: UserProfile;
  className?: string;
  onEditProfile?: () => void;
  onEditAddress?: () => void;
  onAddAddress?: () => void;
}

export function ProfileCard({
  profile,
  className,
  onEditProfile,
  onEditAddress,
  onAddAddress,
}: ProfileCardProps) {
  const primaryAddress =
    profile.addresses?.find((address) => address.isPrimary) ??
    profile.addresses?.[0];

  return (
    <div
      className={cn(
        "bg-white border border-primary-100 rounded-[10px] min-h-[436px] w-full overflow-hidden flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-[36px]",
        className
      )}
    >
      <div className="w-full max-w-[1080px] flex flex-col gap-6 sm:gap-[36px]">
        <div className="flex flex-col gap-6 sm:gap-[35px] w-full">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-[50px]">
              <div className="relative w-[60px] h-[60px] sm:w-[83px] sm:h-[83px] rounded-full bg-neutral-200 overflow-hidden shrink-0">
                {profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={profile.name}
                    fill
                    className="object-cover"
                    sizes="83px"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-300" />
                )}
              </div>
              <div className="flex flex-col text-black min-w-0">
                <p className="font-bold text-[20px] sm:text-[26px] leading-[30px] sm:leading-[39px] truncate">
                  {profile.name}
                </p>
                <div className="flex flex-col justify-center min-h-[30px]">
                  <p className="text-[12px] sm:text-[14px] leading-[18px] sm:leading-[21px] truncate">
                    <span>{profile.email.split("@")[0]}</span>
                    <span style={{ fontFamily: "Segoe UI, sans-serif" }}>@</span>
                    <span>{profile.email.split("@")[1]}</span>
                  </p>
                  {profile.phone && (
                    <p className="text-[12px] sm:text-[14px] leading-[18px] sm:leading-[21px] text-neutral-700 truncate">
                      {profile.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onEditProfile}
              className="text-neutral-400 hover:text-neutral-1000 transition-colors shrink-0"
            >
              <Pencil className="w-5 h-5 sm:w-6 sm:h-6 mx-3 md:mx-0" />
            </button>
          </div>

          <div className="h-px w-full bg-neutral-200" />

          <div className="flex flex-col gap-[15px] items-start">
            <p className="text-b1 font-medium text-black">Address</p>
            <div className="flex items-start justify-between w-full gap-4">
              <div className="flex flex-col gap-[5px] items-start text-black min-w-0">
                <p className="font-medium text-[18px] sm:text-[24px] leading-[28px] sm:leading-[34px] break-words">
                  {primaryAddress?.title || "No address"}
                </p>
                <p className="text-b2 break-words">
                  {primaryAddress?.recipientName || ""}
                  {primaryAddress?.phoneNumber
                    ? ` • ${primaryAddress.phoneNumber}`
                    : ""}
                </p>
                <p className="text-b2 break-words">
                  {primaryAddress?.fullAddress || ""}
                </p>
                <p className="text-b3 text-neutral-700 break-words">
                  {primaryAddress
                    ? `${primaryAddress.village}, ${primaryAddress.district}, ${primaryAddress.city}, ${primaryAddress.province} ${primaryAddress.postalCode}`
                    : ""}
                </p>
                {primaryAddress?.destinationAreaLabel && (
                  <p className="text-b4 text-neutral-700 break-words">
                    {primaryAddress.destinationAreaLabel}
                  </p>
                )}
                {!!profile.addresses?.length && (
                  <p className="text-b4 text-neutral-700">
                    {profile.addresses.length} saved address
                    {profile.addresses.length > 1 ? "es" : ""}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onEditAddress}
                className="text-neutral-400 hover:text-neutral-1000 transition-colors shrink-0"
              >
                <Pencil className="w-5 h-5 sm:w-6 sm:h-6 mx-3 md:mx-0" />
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddAddress}
          className="bg-[#aaa7a7] h-[51px] rounded-[5px] w-full flex items-center justify-center cursor-pointer hover:bg-[#999696] transition-colors"
        >
          <p className="text-b1 font-medium text-black">Add Address</p>
        </button>
      </div>
    </div>
  );
}
