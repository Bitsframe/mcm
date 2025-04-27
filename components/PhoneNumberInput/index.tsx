"use client";
import React from "react";
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
        inputClass="!w-full !h-[46px] !text-[16px] !rounded-xl dark:!bg-[#374151] dark:!text-white !bg-white !text-black !border-0"
        buttonClass="!rounded-l-xl dark:!bg-[#374151] !bg-white !border-0"
        containerClass="!w-full !rounded-xl dark:!bg-[#374151] !bg-white"
        dropdownClass="!bg-white !text-black"
        dropdownStyle={
          typeof window !== "undefined" &&
          document.documentElement.classList.contains("dark")
            ? { backgroundColor: "#374151", color: "white" }
            : {}
        }
      />
    </div>
  );
};

export default PhoneNumberInput;
