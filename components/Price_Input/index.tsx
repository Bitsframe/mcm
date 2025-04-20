import { Label } from 'flowbite-react'
import React from 'react'

// Define props interface for the Input_Component
interface InputComponentProps {
    label?: string;
    bg_color?: string;
    border?: string;
    py?: string;
    onChange: (value: any) => void; // Accepting both string and boolean for value
    value?: string | boolean; // value can be string or boolean
    placeholder?: string;
    type?: string;
    min?: string; // Keep as string to match HTML input attributes
    max?: string;
}


export const Price_Input: React.FC<InputComponentProps> = ({
    label,
    bg_color = 'bg-white',
    border = '',
    py = 'py-2',
    onChange,
    value = '',
    placeholder = '',
    type = 'text',
    min = '',
    max = ''
}) => {
    console.log({ min, max })

    return (
        <div className='w-full space-y-2'>
            {label && <Label htmlFor="section" value={label} className='font-bold' />}
            <div className={`${border} flex items-center`}>
                <span className={`pl-3 h-12 items-center justify-center flex rounded-l-lg ${bg_color} block `}>
                    $
                </span>
                <input
                    min={min}
                    max={100}
                    // @ts-ignore
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    type={type}
                    placeholder={placeholder}
                    className={`w-full h-auto p-3 rounded-lg ${bg_color} ${py} px-3`}
                    id="section"
                />
            </div>
        </div>
    );
};
