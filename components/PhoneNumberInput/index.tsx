"use client";
import React, { useEffect } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const PhoneNumberInput = ({
  className,
  label,
  placeholder,
  breakpoint,
  value,
  type = "text",
  onChange,
}: {
  className?: string;
  label?: string;
  placeholder: string;
  breakpoint: boolean;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) => {
  // Dark mode ke liye custom CSS inject karte hain
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .dark .react-tel-input .country-list {
        background-color: #374151 !important;
        border-color: #4B5563 !important;
      }
      
      .dark .react-tel-input .country-list .country:hover {
        background-color: #4B5563 !important;
      }
      
      .dark .react-tel-input .country-list .country.highlight {
        background-color: #4B5563 !important;
      }
      
      .dark .react-tel-input .country-list .country {
        color: white !important;
      }
      
      .dark .react-tel-input .country-list .country .country-name {
        color: white !important;
      }
      
      .dark .react-tel-input .country-list .country .dial-code {
        color: #9CA3AF !important;
      }
      
      .dark .react-tel-input .selected-flag:hover {
        background-color: #4B5563 !important;
      }
      
      .dark .react-tel-input .selected-flag {
        background-color: #374151 !important;
      }
    `;
    
    document.head.appendChild(style);
    
    // Cleanup function
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div
      className={`flex ${
        breakpoint ? "sm:flex-row" : "flex-col"
      } items-start w-full`}
    >
      {label && (
        <label className="text-[16px] text-customGray font-poppins font-bold mb-2">
          {label}
        </label>
      )}

      <PhoneInput
        country={"us"}
        onlyCountries={["us"]}
        value={value}
        onChange={(phone: string) => onChange(phone)}
        placeholder={placeholder}
        inputClass="!w-full !h-[46px] !text-[16px] !rounded-xl dark:!bg-[#374151] dark:!text-white !bg-[#f1f4f9] !text-black !border !border-gray-300 dark:!border-gray-600"
        buttonClass="!rounded-l-xl dark:!bg-[#374151] !bg-[#f1f4f9] !border !border-gray-300 dark:!border-gray-600"
        containerClass="!w-full !rounded-xl dark:!bg-[#374151] !bg-[#f1f4f9] !border !border-gray-300 dark:!border-gray-600"
        dropdownClass="!bg-[#f1f4f9] !text-black dark:!bg-[#374151] dark:!text-white"
        dropdownStyle={
          typeof window !== "undefined" &&
          document.documentElement.classList.contains("dark")
            ? { 
                backgroundColor: "#374151", 
                color: "white",
                borderColor: "#4B5563"
              }
            : {}
        }
      />
    </div>
  );
};

export default PhoneNumberInput;