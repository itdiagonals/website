import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
}

export default function StatCard({ title, value, change, changeType = "neutral", icon }: StatCardProps) {
  return (
    <div className="rounded-sm border border-neutral-300 bg-neutral-100 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-neutral-700">{title}</span>
          <span className="text-2xl font-bold text-primary-1000">{value}</span>
          {change && (
            <span
              className={cn(
                "text-xs font-medium",
                changeType === "positive" && "text-green-200",
                changeType === "negative" && "text-red-200",
                changeType === "neutral" && "text-neutral-700"
              )}
            >
              {change}
            </span>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-200 text-primary-700">
          {icon}
        </div>
      </div>
    </div>
  );
}
