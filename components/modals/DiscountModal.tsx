"use client";
import { useEffect, useRef, useState } from "react";

interface DiscountModalProps {
  isOpen: boolean;
  initialValue?: number;            // seed with current discount
  title?: string;
  onApply: (percent: number) => void;
  onClose: () => void;
}

export default function DiscountModal({
  isOpen,
  initialValue = 0,
  title = "Set product discount",
  onApply,
  onClose,
}: DiscountModalProps) {
  const [value, setValue] = useState<number>(initialValue);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // keep local input in sync when opening / when parent changes
  useEffect(() => {
    if (isOpen) setValue(initialValue);
  }, [isOpen, initialValue]);

  // close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // esc to close, enter to apply
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") handleApply();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, value]); // eslint-disable-line react-hooks/exhaustive-deps

  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const handleApply = () => onApply(clamp(Number.isFinite(value) ? value : 0));

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discount-modal-title"
    >
      <div
        ref={dialogRef}
        className="bg-white dark:bg-[#0e1725] rounded-lg shadow-xl w-full max-w-sm p-4"
      >
        <h3 id="discount-modal-title" className="text-lg font-semibold mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Enter percentage (0–100) for this product only.
        </p>

        <input
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={value}
          onChange={(e) => setValue(clamp(Number(e.target.value) || 0))}
          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-[#f1f4f9] dark:bg-[#1f2937]"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-3 py-2 rounded-md bg-[#0066FF] text-white hover:opacity-90"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
