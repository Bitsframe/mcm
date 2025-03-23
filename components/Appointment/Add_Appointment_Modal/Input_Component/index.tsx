import { Label, Select } from 'flowbite-react'
import React, { FC } from 'react'

interface Props {
    label?: string;
    placeholder: string;
    type?: string;
    onChange: (e: string) => void;
    max?: number | undefined;
    required?: boolean;
    value: string
}

export const Input_Component_Appointment: FC<Props> = ({ value, label, onChange, placeholder, type = 'text', max=undefined , required = false} : Props) => {
    return (
        <div className='w-full flex flex-1 items-center space-x-2'>
            {label && <><Label htmlFor="section" value={label} className='font-bold break-words' /></> }
            <div className='border-[1px] border-[#CBD5E1] flex-1 rounded-lg'>
                <input
                    maxLength={max || undefined}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    type={type}
                    className={`w-full h-auto  rounded-lg py-3 px-3`}
                    id="section"
                    value={value}
                />
            </div>
        </div>
    )
}
