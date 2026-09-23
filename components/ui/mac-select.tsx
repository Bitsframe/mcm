"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Drop-in replacement for a native `<select>`.
 *
 * Takes the same `<option>` children and the same `onChange(e)` shape
 * (`e.target.value`, `e.target.name`), so call sites change only the tag name,
 * but renders the design-system pop-up button instead of the OS control.
 * Radix forbids an empty-string item value, so "" is carried by a sentinel.
 */

const EMPTY = "__mac_select_empty__";

type Option = { value: string; label: React.ReactNode; disabled?: boolean };

export type MacSelectChangeEvent = {
  target: { value: string; name?: string; id?: string };
  currentTarget: { value: string; name?: string; id?: string };
};

export interface MacSelectProps {
  value?: string | number | null;
  defaultValue?: string | number | null;
  /** Receives `{ target: { value, name, id } }` — typed loosely so handlers written for a native select's ChangeEvent fit. */
  onChange?: (e: any) => void;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  options?: Option[];
  placeholder?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  className?: string;
  contentClassName?: string;
  "aria-label"?: string;
  /** Accepted for call-site compatibility; the trigger keeps the system look. */
  style?: React.CSSProperties;
  title?: string;
  tabIndex?: number;
  autoFocus?: boolean;
  onBlur?: (e: any) => void;
  onFocus?: (e: any) => void;
}

function optionsFromChildren(children: React.ReactNode): Option[] {
  const out: Option[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const el = child as React.ReactElement<any>;
    if (el.type === React.Fragment) {
      out.push(...optionsFromChildren(el.props.children));
      return;
    }
    if (el.type === "option") {
      const raw = el.props.value ?? el.props.children;
      out.push({
        value: raw == null ? "" : String(raw),
        label: el.props.children ?? String(raw ?? ""),
        disabled: Boolean(el.props.disabled),
      });
      return;
    }
    if (el.type === "optgroup") {
      out.push(...optionsFromChildren(el.props.children));
    }
  });
  return out;
}

/**
 * Call sites converted from native selects still pass their old visual classes
 * (borders, padding, text size). Only sizing and spacing survive, so every
 * pop-up button looks the same; the width is the one thing pages should decide.
 */
const LAYOUT = /^(?:(?:sm|md|lg|xl|2xl):)?(?:w-|min-w-|max-w-|flex-|grow|shrink|basis-|m[trblxy]?-|-m[trblxy]?-|col-span-|self-|justify-self-|order-|block|inline|hidden)/;
const keepLayoutClasses = (className?: string) => {
  const kept = (className ?? "").split(/\s+/).filter((c) => c && LAYOUT.test(c));
  // A pop-up button is as wide as its content unless the page asks for a width.
  if (!kept.some((c) => /(^|:)(w-|min-w-|max-w-|flex-1|grow)/.test(c))) kept.push("w-auto", "min-w-[9rem]", "max-w-full");
  return kept.join(" ");
};

const toKey = (v: string | number | null | undefined) =>
  v == null || v === "" ? EMPTY : String(v);
const fromKey = (k: string) => (k === EMPTY ? "" : k);

export const MacSelect = React.forwardRef<HTMLButtonElement, MacSelectProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onValueChange,
      children,
      options,
      placeholder,
      disabled,
      required,
      name,
      id,
      className,
      contentClassName,
      style: _style,
      title,
      tabIndex,
      autoFocus,
      onBlur,
      onFocus,
      ...rest
    },
    ref
  ) => {
    const opts = React.useMemo(
      () => options ?? optionsFromChildren(children),
      [options, children]
    );
    const controlled = value !== undefined;
    const [inner, setInner] = React.useState(toKey(defaultValue));
    const current = controlled ? toKey(value) : inner;

    // A disabled placeholder option (the "Select…" row of a native select) is
    // shown as the placeholder rather than as a pickable item.
    const placeholderOpt = opts.find((o) => o.value === "" && o.disabled);
    const items = opts.filter((o) => o !== placeholderOpt);
    const hasEmptyItem = items.some((o) => o.value === "");

    const handle = (k: string) => {
      const v = fromKey(k);
      if (!controlled) setInner(k);
      onValueChange?.(v);
      onChange?.({ target: { value: v, name, id }, currentTarget: { value: v, name, id } });
    };

    return (
      <Select
        value={current === EMPTY && !hasEmptyItem ? undefined : current}
        onValueChange={handle}
        disabled={disabled}
        required={required}
        name={name}
      >
        <SelectTrigger
          ref={ref}
          id={id}
          className={cn(keepLayoutClasses(className))}
          aria-label={rest["aria-label"]}
          title={title}
          tabIndex={tabIndex}
          autoFocus={autoFocus}
          onBlur={onBlur}
          onFocus={onFocus}
        >
          <SelectValue placeholder={placeholder ?? placeholderOpt?.label ?? ""} />
        </SelectTrigger>
        <SelectContent className={contentClassName}>
          {items.map((o, i) => (
            <SelectItem key={`${o.value}-${i}`} value={toKey(o.value)} disabled={o.disabled}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);
MacSelect.displayName = "MacSelect";
