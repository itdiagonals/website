"use client";

import { useEffect } from "react";
import { Check, X } from "lucide-react";

interface ToastProps {
  message: string;
  visible: boolean;
  onClose?: () => void;
}

export function Toast({ message, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-lg bg-primary-500 px-4 py-3 text-white shadow-lg transition-all duration-300 ease-out ${
        visible
          ? "translate-x-0 opacity-100 pointer-events-auto"
          : "translate-x-full opacity-0 pointer-events-none"
      }`}
      role="alert"
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Check className="h-4 w-4 text-white" />
      </div>
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => onClose?.()}
        className="ml-2 shrink-0 rounded p-1 hover:bg-white/20 transition"
        aria-label="Tutup notifikasi"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
