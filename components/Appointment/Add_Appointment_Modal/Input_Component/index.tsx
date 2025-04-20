import { Label } from 'flowbite-react'
import React, { FC } from 'react'

interface Props {
    label?: string;
    placeholder: string;
    type?: string;
    onChange: (e: string) => void;
    max?: number;
    required?: boolean;
    value: string;
    darkMode?: boolean;
}

export const Input_Component_Appointment: FC<Props> = ({
    value,
    label,
    onChange,
    placeholder,
    type = 'text',
    max = undefined,
    required = false,
    darkMode = false,
}) => {
    return (
        <div className='w-full flex flex-1 flex-col space-y-1'>
            {label && (
                <Label
                    htmlFor="section"
                    value={label}
                    className={`font-bold break-words ${darkMode ? 'text-white' : 'text-gray-900'}`}
                />
            )}
            <div className={`border rounded-lg ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                <input
                    maxLength={max}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    type={type}
                    required={required}
                    className={`w-full h-auto rounded-lg py-3 px-3 outline-none
                        ${darkMode ? 'bg-[#1a1e24] text-white placeholder-gray-400' : 'bg-white text-black placeholder-gray-500'}`}
                    id="section"
                    value={value}
                />
            </div>
        </div>
    )
}
