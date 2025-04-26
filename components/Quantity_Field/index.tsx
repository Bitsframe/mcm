import { translationConstant } from '@/utils/translationConstants';
import { Label } from 'flowbite-react';
import React, { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AiFillPlusCircle, AiFillMinusCircle } from "react-icons/ai";

interface QuantityFieldInterface {
    quantity: number;
    quantityHandle: (e: number) => void;
    maxAvailability: number;
    disabled?: boolean;
}

export const Quantity_Field: FC<QuantityFieldInterface> = ({ 
    quantity, 
    quantityHandle, 
    maxAvailability, 
    disabled = false 
}) => {
    const [canAddMore, setCanAddMore] = useState(true);
    const { t } = useTranslation(translationConstant.POSSALES);

    const handlePlusClick = () => quantityHandle(quantity + 1);
    const handleMinusClick = () => quantity > 0 && quantityHandle(quantity - 1);

    useEffect(() => {
        setCanAddMore(quantity !== maxAvailability);
    }, [quantity, maxAvailability]);

    return (
        <div className={`w-full ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}>
            <Label
                htmlFor="quantity"
                value={t("POS-Sales_k7")}
                className="font-bold text-gray-900 dark:text-gray-200 mb-0.5 block text-sm"
            />
            
            <div className="bg-white dark:bg-[#0e1725] p-2 rounded-lg flex items-center w-full border dark:border-gray-700">
                <p className="flex-1 text-gray-900 dark:text-gray-100 text-sm">{quantity}</p>
                <div className="flex gap-1 items-center">
                    <button
                        onClick={handlePlusClick}
                        disabled={!canAddMore || disabled}
                        className="disabled:opacity-60 disabled:cursor-default"
                    >
                        <AiFillPlusCircle className="text-gray-600 dark:text-gray-300 text-lg" />
                    </button>
                    
                    <button
                        onClick={handleMinusClick}
                        disabled={quantity === 0 || disabled}
                        className="disabled:opacity-60 disabled:cursor-default"
                    >
                        <AiFillMinusCircle className="text-gray-600 dark:text-gray-300 text-lg" />
                    </button>
                </div>
            </div>
        </div>
    );
};