import { Label, Select } from 'flowbite-react'
import React, { FC, useEffect, useState } from 'react'
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



    return (
        <div className={`w-28 ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}>
            <Label htmlFor="quantity" value="Quantity" className='font-bold' />
            <div className='bg-white py-1 px-3 rounded-lg flex items-center'>
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
