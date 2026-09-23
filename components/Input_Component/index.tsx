import { Label } from "flowbite-react";
import React, { useEffect, useState } from "react";
import { LuEye, LuEyeOff, LuCalendar } from "react-icons/lu";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface InputComponentProps {
  label?: string;
  bg_color?: string;
  border?: string;
  disabled?: boolean;
  py?: string;
  onChange: (value: any) => void;
  value?: string | boolean;
  placeholder?: string;
  type?: string;
  min?: string;
  max?: string;
  passwordEye?: boolean;
  isDate?: boolean;
  darkMode?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export const Input_Component: React.FC<InputComponentProps> = ({
  label,
  bg_color = "bg-[#F5F5F7]",
  border = "",
  py = "py-2",
  onChange,
  value = "",
  placeholder = "",
  type = "text",
  min = "",
  max = "",
  passwordEye = false,
  disabled = false,
  isDate = false,
  darkMode,
  hasError = false,
  errorMessage = "",
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  const isDark = darkMode || (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const togglePassHandle = () => {
    setShowPassword((prev) => !prev);
  };

  // Remove this useEffect as it was causing issues
  // useEffect(() => {
  //   if (!passwordEye) {
  //     setShowPassword(true);
  //   }
  // }, []);

  return (
    <div className="w-full space-y-2">
      {label && (
        <Label 
          htmlFor="section" 
          value={label} 
          className="font-bold text-gray-900" 
        />
      )}
      <div className={type !== "boolean" ? `${border}` : ""}>
        {isDate ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={`w-full justify-start text-left font-normal bg-white hover:bg-gray-50 border-gray-300 text-gray-900 ${
                  !selectedDate && "text-gray-500"
                }`}
              >
                <LuCalendar className="mr-2 h-4 w-4 text-gray-600" />
                {selectedDate ? (
                  <span className="text-gray-900">
                    {format(selectedDate, "PPP")}
                  </span>
                ) : (
                  <span className="text-gray-500">
                    {placeholder}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border-gray-200">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  onChange(date);
                }}
                initialFocus
                className="bg-white"
                classNames={{
                  months: "text-gray-900",
                  month: "text-gray-900",
                  caption: "text-gray-900",
                  caption_label: "text-gray-900",
                  nav: "text-gray-900",
                  nav_button: "text-gray-900 hover:bg-gray-100 border-gray-300",
                  nav_button_previous: "text-gray-900 hover:bg-gray-100",
                  nav_button_next: "text-gray-900 hover:bg-gray-100",
                  table: "text-gray-900",
                  head_row: "text-gray-600",
                  head_cell: "text-gray-600",
                  row: "text-gray-900",
                  cell: "text-gray-900 hover:bg-gray-100 relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                  day: "text-gray-900 hover:bg-gray-100 aria-selected:bg-brand-600 aria-selected:text-white h-9 w-9 p-0 font-normal",
                  day_range_end: "text-gray-900",
                  day_selected: "bg-brand-600 text-white hover:bg-brand-700 focus:bg-brand-600",
                  day_today: "bg-gray-100 text-gray-900",
                  day_outside: "text-gray-400 opacity-50",
                  day_disabled: "text-gray-400 opacity-50",
                  day_range_middle: "text-gray-900",
                  day_hidden: "invisible",
                }}
              />
            </PopoverContent>
          </Popover>
        ) : ["boolean", "radio"].includes(type) ? (
          <div className={`flex space-x-4 ${py}`}>
            <label className="flex items-center space-x-2 text-gray-900">
              <input
                type="radio"
                name="booleanRadio"
                value="true"
                checked={value === true}
                onChange={() => onChange(true)}
                className={`rounded-full ${bg_color} w-[25px] h-[25px] !border-solid !border-[2px] !border-gray-300`}
              />
              <span>True</span>
            </label>
            <label className="flex items-center space-x-2 text-gray-900">
              <input
                type="radio"
                name="booleanRadio"
                value="false"
                checked={value === false}
                onChange={() => onChange(false)}
                className={`rounded-full ${bg_color} w-[25px] h-[25px] !border-solid !border-[2px] !border-gray-300`}
              />
              <span>False</span>
            </label>
          </div>
        ) : (
          <div className="relative w-full">
            <input
              disabled={disabled}
              min={min}
              max={100}
              //@ts-ignore
              value={value}
              onChange={(e) => onChange(e.target.value)}
              type={passwordEye && type === "password" ? (showPassword ? "text" : "password") : type}
              placeholder={placeholder}
              className={`w-full h-auto p-3 rounded-lg ${bg_color} ${py} px-3 ${passwordEye && type === "password" ? "pr-12" : ""} disabled:opacity-65 disabled:cursor-not-allowed text-gray-900 placeholder:text-gray-500 border ${hasError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"}`}
              id="section"
            />
            {passwordEye && type === "password" ? (
              <button 
                type="button" 
                onClick={togglePassHandle}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
              </button>
            ) : null}
          </div>
        )}
      </div>
      {hasError && errorMessage && (
        <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
      )}
    </div>
  );
};