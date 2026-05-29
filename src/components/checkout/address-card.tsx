import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Address {
  street: string;
  city: string;
}

interface AddressCardProps {
  address?: Address;
}

export function AddressCard({ address }: AddressCardProps) {
  return (
    <div className="flex flex-col gap-4">
      {address ? (
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-b1 font-bold text-neutral-1000">Address</h3>
            <p className="text-b2 font-medium text-neutral-1000 mt-1">{address.street}</p>
            <p className="text-b3 text-neutral-500">{address.city}</p>
          </div>
          <button className="text-neutral-400 hover:text-neutral-1000 transition-colors">
            <Pencil className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <h3 className="text-b1 font-bold text-neutral-1000">Address</h3>
          <p className="text-b3 text-neutral-500">No address saved yet.</p>
        </div>
      )}

      <Button variant="default" className="w-full bg-neutral-100 text-neutral-1000 hover:bg-neutral-200 uppercase font-medium mt-2">
        Add Address
      </Button>
    </div>
  );
}
