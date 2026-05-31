"use client";

import { cn } from "@/lib/utils";

export type CheckoutStep = "address" | "shipping" | "review" | "payment";

interface CheckoutStepperProps {
  step: CheckoutStep;
}

const STEPS: { key: CheckoutStep; label: string }[] = [
  { key: "address", label: "Alamat Pengiriman" },
  { key: "shipping", label: "Metode Pengiriman" },
  { key: "review", label: "Review & Pesan" },
  { key: "payment", label: "Pembayaran" },
];

export function CheckoutStepper({ step }: CheckoutStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2">
      {STEPS.map((s, idx) => {
        const isActive = idx === currentIndex;
        const isCompleted = idx < currentIndex;
        const isLast = idx === STEPS.length - 1;

        return (
          <div key={s.key} className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-colors duration-200",
                  isActive
                    ? "bg-primary-500 text-white"
                    : isCompleted
                      ? "bg-primary-400 text-white"
                      : "bg-neutral-200 text-neutral-500"
                )}
              >
                {isCompleted ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={cn(
                  "text-b2 font-medium hidden sm:block whitespace-nowrap",
                  isActive ? "text-black" : isCompleted ? "text-primary-400" : "text-neutral-500"
                )}
              >
                {s.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "w-8 sm:w-12 h-px flex-shrink-0",
                  isCompleted ? "bg-primary-400" : "bg-neutral-300"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
