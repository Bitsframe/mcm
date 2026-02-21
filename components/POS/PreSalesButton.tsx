"use client";

import React from "react";

interface PreSalesButtonProps {
  disabled?: boolean;
  onClick?: () => void;
}

const PreSalesButton: React.FC<PreSalesButtonProps> = ({ 
  disabled = false, 
  onClick 
}) => {
  return (
    <button
      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      Pre Sales
    </button>
  );
};

export default PreSalesButton;
