import { Check, Package, Truck, PackageOpen, CircleX } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrackingStep {
  id: string;
  title: string;
  timestamp: string;
  status: "completed" | "active" | "pending" | "failed";
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
      case "x-circle":
        return <CircleX {...props} />;
      default:
        return <Check {...props} />;
    }
  };

  const getStepStyles = (status: TrackingStep["status"]) => {
    switch (status) {
      case "completed":
        return {
          frame: "border-green-200 bg-green-50",
          title: "text-green-700",
          text: "text-green-700",
        };
      case "active":
        return {
          frame: "border-primary-400 bg-primary-100/30",
          title: "text-black",
          text: "text-black",
        };
      case "failed":
        return {
          frame: "border-red-200 bg-red-50",
          title: "text-red-700",
          text: "text-red-700",
        };
      default:
        return {
          frame: "border-primary-100 bg-white opacity-60",
          title: "text-neutral-500",
          text: "text-neutral-400",
        };
    }
  };

  return (
    <div className={cn("bg-white border border-primary-100 rounded-[10px] p-4 sm:p-6", className)}>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col gap-[10px] items-center min-w-0">
            <div className={cn("w-[41px] h-[37px] flex items-center justify-center rounded-[3px] border-[0.5px]", getStepStyles(step.status).frame)}>
              {getIcon(step.icon)}
            </div>
            <div className="flex flex-col items-center text-center gap-[9px] min-w-0">
              <span className={cn("text-b3 font-bold break-words", getStepStyles(step.status).title)}>
                {step.title}
              </span>
              <div className={cn("text-b4 whitespace-pre-wrap break-words", getStepStyles(step.status).text)}>
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
