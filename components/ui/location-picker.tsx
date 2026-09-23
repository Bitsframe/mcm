"use client";

import * as React from "react";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Searchable location pop-up: a pop-up button that opens a panel with a search
 * field and the matching locations. Used wherever a page lets the user choose a
 * location, so long lists are one keystroke away instead of a scroll.
 *
 * `value` is the selected id as a string ("" = the `allLabel` option, when given).
 */
export interface LocationPickerProps {
  locations: { id: number | string; title?: string; address?: string | null }[];
  value: string;
  onChange: (id: string) => void;
  /** When set, an "all" row with value "" is offered first. */
  allLabel?: React.ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export function LocationPicker({
  locations,
  value,
  onChange,
  allLabel,
  placeholder = "Location",
  searchPlaceholder = "Search locations…",
  className,
  id,
  disabled,
}: LocationPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const q = query.trim().toLowerCase();
  const matches = q
    ? locations.filter((l) =>
        `${l.title ?? ""} ${l.address ?? ""}`.toLowerCase().includes(q)
      )
    : locations;
  const selected = locations.find((l) => String(l.id) === value);
  const label = value === "" && allLabel ? allLabel : selected?.title ?? placeholder;

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-8 w-auto min-w-[10rem] max-w-full items-center justify-between gap-2 rounded-md border border-input bg-white px-2.5 text-body text-label shadow-mac-sm transition-colors hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 data-[state=open]:bg-surface disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin size={13} className="shrink-0 text-label-3" />
            <span className={cn("truncate", !selected && !allLabel && "text-label-3")}>{label}</span>
          </span>
          <ChevronDown size={14} className="shrink-0 text-label-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="bg-vibrant-white w-[min(22rem,calc(100vw-2rem))] rounded-lg border-border p-0 shadow-mac-lg"
      >
        <div className="flex items-center gap-2 border-b border-border px-2.5 py-2">
          <Search size={14} className="shrink-0 text-label-3" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-6 w-full bg-transparent text-body text-label placeholder:text-label-3 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && matches.length) pick(String(matches[0].id));
              if (e.key === "Escape") setOpen(false);
            }}
          />
        </div>
        <ul role="listbox" className="max-h-72 overflow-y-auto p-1">
          {allLabel && !q && (
            <Row active={value === ""} onClick={() => pick("")}>
              {allLabel}
            </Row>
          )}
          {matches.map((l) => (
            <Row key={l.id} active={String(l.id) === value} onClick={() => pick(String(l.id))} sub={l.address ?? undefined}>
              {l.title}
            </Row>
          ))}
          {matches.length === 0 && (
            <li className="px-2 py-3 text-center text-footnote text-label-3">No locations match</li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function Row({
  active,
  onClick,
  children,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <li
      role="option"
      aria-selected={active}
      onClick={onClick}
      className="group flex cursor-default items-start gap-2 rounded-md px-2 py-1.5 text-body text-label hover:bg-brand-600 hover:text-white"
    >
      <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
        {active && <Check size={13} strokeWidth={2.5} />}
      </span>
      <span className="min-w-0">
        <span className="block truncate">{children}</span>
        {sub && <span className="block truncate text-caption text-label-3 group-hover:text-white/80">{sub}</span>}
      </span>
    </li>
  );
}
