import { Label, Select } from "flowbite-react";
import React from "react";

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
  bg_color = " dark:bg-[#122136]",
  //@ts-ignore
  initialValue = "" || 0,
  hideLabel = false,
}: Props) => {
  return (
    <div className="w-full">
      {label && !hideLabel && (
        <Label
          htmlFor="section"
          value={label}
          className="font-bold dark:text-gray-300"
        />
      )}
      <Select
        disabled={disabled}
        value={value}
        onChange={on_change_handle}
        id="section"
        required={required}
        className="w-full h-auto disabled:opacity-70 text-black dark:text-gray-300 border-none outline-none"
        style={{
          backgroundColor: document.documentElement.classList.contains("dark")
            ? "#122136"
            : "#f1f4f9",
          color: document.documentElement.classList.contains("dark")
            ? "#d1d5db"
            : "#000000",
        }}
      >
        {start_empty && (
          <option
            value={initialValue}
            className="dark:bg-[#122136] dark:text-gray-300"
          >
            {label}
          </option>
        )}
        {options_arr.map(
          ({ value, label, selected, disabled }: any, ind: number) => (
            <option
              key={ind}
              disabled={disabled || false}
              selected={selected || false}
              value={value}
              className="text-black dark:text-gray-300 dark:bg-[#122136]"
            >
              {label}
            </option>
          )
        )}
      </Select>
    </div>
  );
};
