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
    bg_color?: string;
    pattern?: string;
    title?: string;
}

export const Input_Component_Appointment: FC<Props> = ({
    value,
    label,
    onChange,
    placeholder,
    type = 'text',
    max = undefined,
    required = false,
    bg_color = "",
    pattern,
    title
}) => {
    return (
        <div className='w-full flex flex-1 flex-col space-y-1'>
            {label && (
                <Label
                    htmlFor="section"
                    value={label}
                    className={`font-bold break-words ${bg_color}`}
                />
            )}
            <div className={` rounded-lg ${bg_color}`}>
                <input
                    maxLength={type === 'date' ? undefined : max}
                    max={type === 'date' ? max : undefined}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    type={type}
                    required={required}
                    pattern={pattern}
                    title={title}
                    className={`w-full h-auto rounded-lg py-2 px-3 outline-none
                        ${bg_color}`}
                    id="section"
                    value={value}
                />
            </div>
        </div>
    )
}
