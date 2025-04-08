import { translationConstant } from '@/utils/translationConstants';
import { Label, Select } from 'flowbite-react'
import React, { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import { AiFillPlusCircle } from "react-icons/ai";
import { AiFillMinusCircle } from "react-icons/ai";


interface QuantityFieldInterface {
    quantity: number;
    quantityHandle: (e: number) => void;
    maxAvailability: number;
    disabled?: boolean;

}


export const Quantity_Field: FC<QuantityFieldInterface> = ({ quantity, quantityHandle, maxAvailability, disabled = false }) => {

    const [canAddMore, setCanAddMore] = useState(true)

    const handlePlusClick = () => {
        const quantityNow = quantity + 1
        quantityHandle(quantityNow)

    }
    const handleMinusClick = () => {
        if (quantity > 0) quantityHandle(quantity - 1)
    }


    useEffect(() => {

        if (quantity === maxAvailability) {
            setCanAddMore(false)
        } else {
            setCanAddMore(true)
        }

    }, [quantity, maxAvailability])


    const {t} = useTranslation(translationConstant.POSSALES)


    return (
        <div className={`w-full ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}>
            <Label htmlFor="quantity" value={t("POS-Sales_k7")} className='font-bold' />
            <div className='bg-white p-3 rounded-xl flex items-center w-full'>
                <p className='flex-1'>{quantity}</p>
                <div>
                    <button onClick={handlePlusClick} disabled={!canAddMore} className={`block disabled:opacity-60 disabled:cursor-default`}>
                        <AiFillPlusCircle className={`text-gray-600 `} />
                    </button>

                    <button onClick={handleMinusClick} disabled={quantity === 0} className={`block disabled:opacity-60 disabled:cursor-default`}>
                        <AiFillMinusCircle className={`text-gray-600`} />
                    </button>
                </div>
            </div>
        </div>
    )
}
