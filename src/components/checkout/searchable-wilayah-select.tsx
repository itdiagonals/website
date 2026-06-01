"use client";

import { Check, ChevronDown, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api, type WilayahItem } from "@/lib/api";

type SearchableWilayahSelectProps = {
  label: string;
  level: WilayahItem["level"];
  parentCode?: string;
  value: string;
  selectedCode: string;
  onSelect: (item: WilayahItem) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  helperText?: string;
};

export function SearchableWilayahSelect({
  label,
  level,
  parentCode,
  value,
  selectedCode,
  onSelect,
  disabled = false,
  required = false,
  placeholder,
  emptyMessage,
  helperText,
}: SearchableWilayahSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState<WilayahItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const canFetch = !disabled && (!needsParent(level) || Boolean(parentCode));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

  useEffect(() => {
    if (!isOpen || !canFetch) {
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.wilayah.search({
          level,
          parentCode,
          query: searchQuery,
          limit: 20,
        });

        if (!active) {
          return;
        }

        setOptions(response);
      } catch (fetchError) {
        if (!active) {
          return;
        }

        console.error(`Failed to fetch ${level}:`, fetchError);
        setError("Gagal memuat data wilayah.");
        setOptions([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [canFetch, isOpen, level, parentCode, searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const selectedOption = useMemo(
    () => options.find((item) => item.code === selectedCode) ?? (value ? { code: selectedCode, name: value, level } : null),
    [level, options, selectedCode, value]
  );

  const title = selectedOption?.name || value || placeholder || `Pilih ${label.toLowerCase()}`;

  return (
    <div ref={containerRef} className="flex flex-col gap-2 text-b2 text-black">
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((open) => !open)}
          className="flex h-11 w-full items-center justify-between rounded-[8px] border border-primary-100 bg-white px-3 text-left outline-none disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
        >
          <span className={value ? "text-black" : "text-neutral-500"}>{title}</span>
          <ChevronDown className={["h-4 w-4 transition-transform", isOpen ? "rotate-180" : ""].join(" ")} />
        </button>

        {isOpen && !disabled && (
          <div className="absolute left-0 right-0 top-full z-[1002] mt-2 rounded-[10px] border border-primary-100 bg-white shadow-lg">
            <div className="border-b border-primary-100 p-3">
              <div className="flex items-center gap-2 rounded-[8px] border border-primary-100 px-3">
                <Search className="h-4 w-4 text-neutral-500" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={placeholder || `Cari ${label.toLowerCase()}`}
                  className="h-10 w-full outline-none"
                />
              </div>
            </div>

            <div className="max-h-[240px] overflow-y-auto py-2">
              {loading && (
                <div className="flex items-center gap-2 px-3 py-2 text-neutral-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memuat...</span>
                </div>
              )}

              {!loading && error && <div className="px-3 py-2 text-red-200">{error}</div>}

              {!loading && !error && options.length === 0 && (
                <div className="px-3 py-2 text-neutral-600">
                  {emptyMessage || `Belum ada data ${label.toLowerCase()}.`}
                </div>
              )}

              {!loading && !error && options.map((item) => {
                const isSelected = item.code === selectedCode;

                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-neutral-100"
                  >
                    <span>{item.name}</span>
                    <Check className={["h-4 w-4", isSelected ? "opacity-100" : "opacity-0"].join(" ")} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {helperText && <p className="text-[12px] leading-[18px] text-neutral-600">{helperText}</p>}
    </div>
  );
}

function needsParent(level: WilayahItem["level"]) {
  return level !== "province";
}
