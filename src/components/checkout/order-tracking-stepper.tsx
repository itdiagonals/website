import { Check, Package, Truck, PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrackingStep {
  id: string;
  title: string;
  timestamp: string;
  status: "completed" | "active" | "pending";
  icon: string;
}

interface OrderTrackingStepperProps {
  steps: TrackingStep[];
  className?: string;
}

export function OrderTrackingStepper({ steps, className }: OrderTrackingStepperProps) {
  const getIcon = (iconName: string) => {
    const props = {
      className: "w-6 h-6 text-neutral-1000",
    };
    switch (iconName) {
      case "check":
        return <Check {...props} />;
      case "package":
        return <Package {...props} />;
      case "truck":
        return <Truck {...props} />;
      case "package-line":
      case "package-open":
        return <PackageOpen {...props} />;
      default:
        return <Check {...props} />;
    }
  };

  return (
    <div className={cn("bg-white border border-primary-100 rounded-[10px] p-4 sm:p-6", className)}>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col gap-[10px] items-center min-w-0">
            <div className="w-[41px] h-[37px] flex items-center justify-center rounded-[3px] bg-white border-[0.5px] border-primary-300">
              {getIcon(step.icon)}
            </div>
            <div className="flex flex-col items-center text-center gap-[9px] min-w-0">
              <span className="text-b3 font-bold text-secondary-500 break-words">
                {step.title}
              </span>
              <div className="text-b4 text-black whitespace-pre-wrap break-words">
                {step.timestamp.split("\n").map((line, i) => (
                  <p key={i} className="leading-[18px]">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
