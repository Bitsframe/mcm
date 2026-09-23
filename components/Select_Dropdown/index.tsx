import { Label } from "flowbite-react";
import React from "react";

import { MacSelect } from "@/components/ui/mac-select";

interface OptionArrayInterface {
  value: string | number;
  label: string | number;
  selected?: boolean;
  disabled?: boolean;
}

interface Props {
  options_arr: OptionArrayInterface[];
  on_change_handle?: (e: any) => void;
  required?: boolean;
  value?: string | number;
  label?: string;
  start_empty?: boolean;
  disabled?: boolean;
  bg_color?: string;
  initialValue?: any;
  hideLabel?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

// @ts-ignore
export const Select_Dropdown = ({
  disabled = false,
  options_arr,
  on_change_handle,
  required,
  value = "",
  label,
  start_empty = false,
  bg_color = "",
  //@ts-ignore
  initialValue = "" || 0,
  hideLabel = false,
  hasError = false,
  errorMessage = "",
}: Props) => {
  return (
    <div className="w-full space-y-2">
      {label && !hideLabel && (
        <Label
          htmlFor="section"
          value={label}
          className={`font-bold ${hasError ? "text-red-600" : ""}`}
        />
      )}
      <MacSelect
        disabled={disabled}
        value={value}
        // `selected` on <option> is not how React sets a select; when the
        // caller passes no value, the option flagged selected becomes the default.
        defaultValue={value === undefined ? options_arr.find((o) => o.selected)?.value : undefined}
        onChange={on_change_handle}
        id="section"
        required={required}
        className={`w-full h-auto disabled:opacity-70 text-black outline-none border ${hasError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-brand-500 focus:ring-brand-500"}`}
        style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}
      >
        {start_empty && (
          <option
            value={initialValue}
            className=""
          >
            {label}
          </option>
        )}
        {options_arr.map(
          ({ value, label, disabled }: any, ind: number) => (
            <option
              key={ind}
              disabled={disabled || false}
              value={value}
              className="text-black"
            >
              {label}
            </option>
          )
        )}
      </MacSelect>
      {hasError && errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
};
