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
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const togglePassHandle = () => {
    setShowPassword((prev) => !prev);
  };

  useEffect(() => {
    if (!passwordEye) {
      setShowPassword(true);
    }
  }, []);

  return (
    <div className="w-full space-y-2">
      {label && <Label htmlFor="section" value={label} className="font-bold" />}
      <div className={type !== "boolean" ? `${border}` : ""}>
        {isDate ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={`w-full justify-start text-left font-normal ${bg_color} ${
                  !selectedDate && "text-muted-foreground"
                } ${darkMode ? 'dark:bg-[#122136] dark:text-white dark:border-gray-600' : ''}`}
              >
                <LuCalendar className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP")
                ) : (
                  <span>{placeholder}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  onChange(date);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        ) : ["boolean", "radio"].includes(type) ? (
          <div className={`flex space-x-4 ${py}`}>
            <label className="flex items-center space-x-2">
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
            <label className="flex items-center space-x-2">
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
          <div className="flex w-full items-center">
            <input
              disabled={disabled}
              min={min}
              max={100}
              //@ts-ignore
              value={value}
              onChange={(e) => onChange(e.target.value)}
              type={showPassword ? type : "password"}
              placeholder={placeholder}
              className={`w-full h-auto p-3 rounded-lg ${bg_color} ${py} px-3 flex-1 disabled:opacity-65 disabled:cursor-not-allowed`}
              id="section"
            />
            {passwordEye ? (
              <button type="button" onClick={togglePassHandle}>
                {showPassword ? <LuEyeOff /> : <LuEye />}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};