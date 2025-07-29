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
  bg_color = "bg-[#f1f4f9] dark:bg-[#122136]",
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
          className="font-bold text-gray-900 dark:text-white" 
        />
      )}
      <div className={type !== "boolean" ? `${border}` : ""}>
        {isDate ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={`w-full justify-start text-left font-normal bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white ${
                  !selectedDate && "text-gray-500 dark:text-gray-400"
                }`}
              >
                <LuCalendar className="mr-2 h-4 w-4 text-gray-600 dark:text-gray-300" />
                {selectedDate ? (
                  <span className="text-gray-900 dark:text-white">
                    {format(selectedDate, "PPP")}
                  </span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">
                    {placeholder}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  onChange(date);
                }}
                initialFocus
                className="bg-white dark:bg-gray-800"
                classNames={{
                  months: "text-gray-900 dark:text-white",
                  month: "text-gray-900 dark:text-white",
                  caption: "text-gray-900 dark:text-white",
                  caption_label: "text-gray-900 dark:text-white",
                  nav: "text-gray-900 dark:text-white",
                  nav_button: "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600",
                  nav_button_previous: "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700",
                  nav_button_next: "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700",
                  table: "text-gray-900 dark:text-white",
                  head_row: "text-gray-600 dark:text-gray-300",
                  head_cell: "text-gray-600 dark:text-gray-300",
                  row: "text-gray-900 dark:text-white",
                  cell: "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                  day: "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 aria-selected:bg-blue-600 aria-selected:text-white h-9 w-9 p-0 font-normal",
                  day_range_end: "text-gray-900 dark:text-white",
                  day_selected: "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-600 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700",
                  day_today: "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white",
                  day_outside: "text-gray-400 dark:text-gray-500 opacity-50",
                  day_disabled: "text-gray-400 dark:text-gray-600 opacity-50",
                  day_range_middle: "text-gray-900 dark:text-white",
                  day_hidden: "invisible",
                }}
              />
            </PopoverContent>
          </Popover>
        ) : ["boolean", "radio"].includes(type) ? (
          <div className={`flex space-x-4 ${py}`}>
            <label className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <input
                type="radio"
                name="booleanRadio"
                value="true"
                checked={value === true}
                onChange={() => onChange(true)}
                className={`rounded-full ${bg_color} w-[25px] h-[25px] !border-solid !border-[2px] !border-gray-300 dark:!border-gray-500`}
              />
              <span>True</span>
            </label>
            <label className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <input
                type="radio"
                name="booleanRadio"
                value="false"
                checked={value === false}
                onChange={() => onChange(false)}
                className={`rounded-full ${bg_color} w-[25px] h-[25px] !border-solid !border-[2px] !border-gray-300 dark:!border-gray-500`}
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
              className={`w-full h-auto p-3 rounded-lg ${bg_color} ${py} px-3 ${passwordEye && type === "password" ? "pr-12" : ""} disabled:opacity-65 disabled:cursor-not-allowed text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border ${hasError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"}`}
              id="section"
            />
            {passwordEye && type === "password" ? (
              <button 
                type="button" 
                onClick={togglePassHandle}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors duration-200"
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