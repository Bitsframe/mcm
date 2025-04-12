import { Label } from "flowbite-react";
import React, { useEffect, useState } from "react";
import { LuEye, LuEyeOff } from "react-icons/lu";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
}

export const Input_Component: React.FC<InputComponentProps> = ({
  label,
  bg_color = "bg-[#F1F4F9]",
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
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
          <DatePicker
            selected={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              onChange(date);
            }}
            className="w-full p-3 rounded-lg border"
            placeholderText={placeholder}
          />
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
          <div className="flex w-full items-center bg-[#f1f4f9] pr-3">
            <input
              disabled={disabled}
              min={min}
              max={100}
              //@ts-ignore
              value={value}
              onChange={(e) => onChange(e.target.value)}
              type={showPassword ? "text" : "password"}
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
