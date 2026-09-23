"use client";
import { useEffect, useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const PhoneNumberInput = ({
  required = false,
  className,
  label,
  placeholder,
  breakpoint,
  value,
  type = "text",
  onChange,
  hasError = false,
  errorMessage = "",
}: {
  required?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
  breakpoint: boolean;
  value?: string | null;
  type?: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  errorMessage?: string;
}) => {
  const [isTouched, setIsTouched] = useState(false);
  const normalizedValue = value ?? "";
  const showError =
    hasError || (required && isTouched && normalizedValue.trim() === "");
  const helperMessage = errorMessage || "This field is required";

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .dark .react-tel-input .country-list {
        background-color: #1D1D1F !important;
        border-color: #6E6E73 !important;
      }

      .dark .react-tel-input .country-list .country:hover {
        background-color: #6E6E73 !important;
      }

      .dark .react-tel-input .country-list .country.highlight {
        background-color: #6E6E73 !important;
      }

      .dark .react-tel-input .country-list .country {
        color: white !important;
      }

      .dark .react-tel-input .country-list .country .country-name {
        color: white !important;
      }

      .dark .react-tel-input .country-list .country .dial-code {
        color: #86868B !important;
      }

      .dark .react-tel-input .selected-flag:hover {
        background-color: #6E6E73 !important;
      }

      .dark .react-tel-input .selected-flag {
        background-color: #1D1D1F !important;
      }

      .dark .react-tel-input .flag-dropdown {
        background-color: #1D1D1F !important;
        border-color: #6E6E73 !important;
      }

      .dark .react-tel-input .flag-dropdown:hover {
        background-color: #6E6E73 !important;
      }

      .dark .react-tel-input .flag-dropdown.open {
        background-color: #6E6E73 !important;
      }

      .dark .react-tel-input button {
        background-color: #1D1D1F !important;
        border-color: #6E6E73 !important;
      }

      .dark .react-tel-input button:hover {
        background-color: #6E6E73 !important;
      }

      .react-tel-input .selected-flag {
        background-color: #F5F5F7 !important;
        border-color: #D9D9DE !important;
      }

      .react-tel-input .selected-flag:hover {
        background-color: #E5E5EA !important;
      }

      .react-tel-input .flag-dropdown {
        background-color: #F5F5F7 !important;
        border-color: #D9D9DE !important;
      }

      .react-tel-input .flag-dropdown:hover {
        background-color: #E5E5EA !important;
      }

      .react-tel-input .flag-dropdown.open {
        background-color: #E5E5EA !important;
      }

      .react-tel-input button {
        background-color: #F5F5F7 !important;
        border-color: #D9D9DE !important;
      }

      .react-tel-input button:hover {
        background-color: #E5E5EA !important;
      }

      .react-tel-input .country-list {
        background-color: white !important;
        border: 1px solid #D9D9DE !important;
        color: #1D1D1F !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
      }

      .react-tel-input .country-list .country {
        color: #1D1D1F !important;
      }

      .react-tel-input .country-list .country:hover {
        background-color: #F5F5F7 !important;
      }

      .react-tel-input .country-list .country.highlight {
        background-color: #F5F5F7 !important;
      }

      .react-tel-input .country-list .country .country-name {
        color: #1D1D1F !important;
      }

      .react-tel-input .country-list .country .dial-code {
        color: #6E6E73 !important;
      }

      .dark .react-tel-input .country-list {
        background-color: #1D1D1F !important;
        border: 1px solid #6E6E73 !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handlePhoneChange = (phone: string) => {
    if (!isTouched) setIsTouched(true);

    const cleaned = phone.replace(/[^\d]/g, "");
    const final = cleaned.startsWith("1") ? "+" + cleaned : "+1" + cleaned;
    onChange(final);
  };

  const handleBlur = () => {
    setIsTouched(true);
  };

  return (
    <div
      className={`flex ${
        breakpoint ? "sm:flex-row" : "flex-col"
      } items-start w-full ${className}`}
    >
      {label && (
        <label
          className={`text-[14px] text-customGray font-poppins font-bold mb-1 ${
            showError ? "text-red-500" : ""
          }`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="w-full">
        <PhoneInput
          country={"us"}
          onlyCountries={["us"]}
          disableDropdown={true}
          countryCodeEditable={false}
          value={normalizedValue}
          onChange={handlePhoneChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          inputClass={`!w-full !h-[36px] !text-[13px] !rounded-md !bg-[#F5F5F7] !text-black !border ${
            showError
              ? "!border-red-500"
              : "!border-gray-300"
          }`}
          buttonClass={`!rounded-l-md !bg-[#F5F5F7] !border ${
            showError
              ? "!border-red-500"
              : "!border-gray-300"
          } !h-[36px]`}
          containerClass={`!w-full !rounded-md !bg-[#F5F5F7] !border ${
            showError
              ? "!border-red-500"
              : "!border-gray-300"
          }`}
          dropdownClass="!bg-white !text-black"
        />
        {showError && (
          <p className="mt-1 text-xs text-red-500">{helperMessage}</p>
        )}
      </div>
    </div>
  );
};

export default PhoneNumberInput;
