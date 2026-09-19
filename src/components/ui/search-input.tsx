"use client";
import { useEffect, useState, type Ref } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Input } from "./input";

type SearchInputProps = {
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onClear?: () => void;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
};

export function SearchInput({
  placeholder = "Search companies, industries, keywords...",
  value,
  defaultValue = "",
  onChange,
  onSubmit,
  onClear,
  className,
  inputRef,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  useEffect(() => {
    if (!isControlled) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue, isControlled]);

  const updateValue = (next: string) => {
    if (!isControlled) {
      setInternalValue(next);
    }
    onChange?.(next);
  };

  return (
    <label className={cn("relative block w-full", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
      <Input
        ref={inputRef}
        aria-label="Search"
        placeholder={placeholder}
        value={currentValue}
        onChange={(event) => updateValue(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onSubmit?.(currentValue);
          }
        }}
        className="pl-9 pr-14"
      />
      {currentValue ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            updateValue("");
            onClear?.();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border bg-white p-1 text-subtle transition hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      ) : (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-subtle">
          ⌘ K
        </span>
      )}
    </label>
  );
}
