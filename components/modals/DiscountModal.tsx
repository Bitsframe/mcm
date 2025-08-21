"use client";
import { useEffect, useRef, useState } from "react";

interface DiscountModalProps {
  isOpen: boolean;
  initialValue?: number; // Seed with the current discount
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

  // Keep local input in sync when opening / when parent changes
  useEffect(() => {
    if (isOpen) setValue(initialValue);
  }, [isOpen, initialValue]);

  // Close on outside click
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

  // Escape to close, Enter to apply
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
  
  // Apply the discount logic
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

        {/* Discount Input */}
        <input
          type="text"
          value={value === 0 ? "" : value} // Show an empty string when value is 0
          onChange={(e) => {
            let rawValue = e.target.value;

            // Remove any non-numeric characters except for a decimal point
            rawValue = rawValue.replace(/[^0-9.]/g, "");

            // Ensure only one decimal point is allowed
            if ((rawValue.match(/\./g) || []).length > 1) {
              rawValue = rawValue.replace(/\.+$/, "");
            }

            // Parse the raw value as a float
            let newValue = parseFloat(rawValue) || 0;

            // Clamp the value between 0 and 100
            newValue = Math.max(0, Math.min(100, newValue));

            // Round the value to two decimal places if necessary
            if (!isNaN(newValue)) {
              newValue = Math.round(newValue * 100) / 100; // Ensure two decimal places
            }

            // Set the value in the state
            setValue(newValue);
          }}
          placeholder="Enter % of discount"
          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-[#f1f4f9] dark:bg-[#1f2937]"
          min={0}
          max={100}
          step="0.01"
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
