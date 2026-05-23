import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "order" | "payment" | "product" | "season";
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-primary-400 border-yellow-100",
  processing: "bg-primary-100 text-primary-500 border-primary-100",
  shipped: "bg-primary-300 text-white border-primary-300",
  delivered: "bg-green-100 text-primary-400 border-green-100",
  cancelled: "bg-red-100 text-primary-400 border-red-100",
  paid: "bg-green-100 text-primary-400 border-green-100",
  failed: "bg-red-100 text-primary-400 border-red-100",
  refunded: "bg-neutral-300 text-neutral-800 border-neutral-300",
  active: "bg-green-100 text-primary-400 border-green-100",
  inactive: "bg-neutral-300 text-neutral-800 border-neutral-300",
  true: "bg-green-100 text-green-200 border-green-100",
  false: "bg-neutral-300 text-neutral-800 border-neutral-300",
};

export default function StatusBadge({ status, variant = "order" }: StatusBadgeProps) {
  const key = variant === "season" ? String(status) : status.toLowerCase();
  const style = statusStyles[key] || "bg-neutral-200 text-neutral-800 border-neutral-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
        style
      )}
    >
      {status}
    </span>
  );
}
