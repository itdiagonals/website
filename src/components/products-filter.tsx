'use client';

import { Check, ChevronDown } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

type FilterOption = {
  label: string;
  value: string;
};

interface ProductsFilterProps {
  seasons: FilterOption[];
  categories: FilterOption[];
  genders: FilterOption[];
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const activeOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value]
  );

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div ref={wrapperRef} className="relative flex min-w-[180px] flex-col gap-2 text-primary-400">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary-400/70">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={[
          'flex w-full items-center justify-between border-b border-primary-400/30 bg-transparent pb-3 text-left text-base font-medium text-primary-400 outline-none transition',
          'hover:border-primary-400 hover:text-primary-500',
          isOpen ? 'border-primary-400 text-primary-500' : '',
        ].join(' ')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>{activeOption?.label ?? 'Select option'}</span>
        <ChevronDown className={['h-4 w-4 transition-transform duration-200', isOpen ? 'rotate-180' : ''].join(' ')} />
      </button>

      <div
        className={[
          'absolute left-0 right-0 top-full z-30 mt-2 origin-top border border-primary-400/15 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.12)] transition-all duration-150',
          isOpen ? 'visible scale-100 opacity-100' : 'invisible scale-95 opacity-0',
        ].join(' ')}
      >
        <div className="max-h-72 overflow-y-auto py-2" role="listbox" aria-label={label}>
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={[
                  'flex w-full items-center justify-between px-4 py-3 text-left text-[15px] transition-colors',
                  isSelected ? 'bg-primary-500 text-white' : 'text-primary-500 hover:bg-neutral-100',
                ].join(' ')}
                role="option"
                aria-selected={isSelected}
              >
                <span>{option.label}</span>
                <Check className={['h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0'].join(' ')} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ProductsFilter({
  seasons,
  categories,
  genders,
}: ProductsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false,
    });
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('season');
    params.delete('category');
    params.delete('gender');

    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false,
    });
  };

  return (
    <div className="container flex flex-col gap-6 px-6 md:px-12 lg:px-20">
      <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-5">
        <FilterSelect
          label="Season"
          value={searchParams.get('season') ?? ''}
          options={seasons}
          onChange={(value) => updateFilter('season', value)}
        />
        <FilterSelect
          label="Category"
          value={searchParams.get('category') ?? ''}
          options={categories}
          onChange={(value) => updateFilter('category', value)}
        />
        <FilterSelect
          label="Gender"
          value={searchParams.get('gender') ?? ''}
          options={genders}
          onChange={(value) => updateFilter('gender', value)}
        />
      </div>

      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={clearFilters}
          className="text-sm font-medium uppercase tracking-[0.14em] text-primary-400/70 transition hover:text-primary-400"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
