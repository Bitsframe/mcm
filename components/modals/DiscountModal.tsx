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
  initialValue,
  title = "Establecer descuento del producto",
  onApply,
  onClose,
}: DiscountModalProps) {
  // Use string state for input to allow floats and empty
  const [inputValue, setInputValue] = useState<string>(
    initialValue !== undefined && initialValue !== null ? initialValue.toString() : ""
  );
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Keep local input in sync when opening / when parent changes
  useEffect(() => {
    if (isOpen) {
      setInputValue(
        initialValue !== undefined && initialValue !== null ? initialValue.toString() : ""
      );
    }
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
  }, [isOpen, inputValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const clamp = (n: number) => Math.max(0, Math.min(100, n));

  // Apply the discount logic
  const handleApply = () => {
    let num = parseFloat(inputValue);
    if (isNaN(num)) num = 0;
    num = Math.round(clamp(num) * 100) / 100;
    // Enforce max 100 and min 0 on apply
    if (num > 100) num = 100;
    if (num < 0) num = 0;
    onApply(num);
  };

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
          Ingrese el porcentaje (0–100) solo para este producto.
        </p>

        {/* Discount Input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            let rawValue = e.target.value;
            // Allow only digits and a decimal point
            rawValue = rawValue.replace(/[^0-9.]/g, "");
            // Ensure only one decimal point is allowed
            if ((rawValue.match(/\./g) || []).length > 1) {
              rawValue = rawValue.replace(/\.+$/, ""); // Remove extra dots
            }
            // Remove leading zero unless immediately followed by a decimal point
            if (rawValue.length > 1 && rawValue[0] === '0' && rawValue[1] !== '.') {
              rawValue = rawValue.replace(/^0+/, '');
            }
            // Restrict to two decimal places if decimal exists
            if (rawValue.includes('.')) {
              const [intPart, decPart] = rawValue.split('.');
              rawValue = intPart + '.' + (decPart ? decPart.slice(0, 2) : '');
            }
            // Enforce max 100 and min 0
            if (rawValue !== "" && !isNaN(Number(rawValue))) {
              let num = Number(rawValue);
              if (num > 100) rawValue = "100";
              if (num < 0) rawValue = "0";
            }
            setInputValue(rawValue);
          }}
          placeholder="Ingrese el % de descuento"
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
            Cancelar
          </button>
          <button
            onClick={handleApply}
            className="px-3 py-2 rounded-md bg-[#0066FF] text-white hover:opacity-90"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
