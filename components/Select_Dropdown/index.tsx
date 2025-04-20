import { Label, Select } from 'flowbite-react'
import React from 'react'

interface OptionArrayInterface {
    value: string | number;
    label: string | number;
    selected?: boolean;
    disabled?: boolean;

}
interface Props {
    options_arr: OptionArrayInterface[]
    on_change_handle?: (e: any) => void;
    required?: boolean;
    value?: string | number;
    label?: string
    start_empty?: boolean
    disabled?: boolean
    bg_color?: string
    initialValue?: any;
    hideLabel?: boolean

}
// @ts-ignore
export const Select_Dropdown = ({ disabled = false, options_arr, on_change_handle, required, value = '', label, start_empty = false, bg_color = '#F1F4F9', initialValue = '' || 0, hideLabel = false }: Props) => {
    return (
        <div className='w-full'>
            {label && !hideLabel && <Label htmlFor="section" value={label} className='font-bold' />}
            <Select disabled={disabled} value={value} className='w-full h-auto disabled:opacity-70' onChange={on_change_handle} style={{ backgroundColor: bg_color }} id="section" required={required}>
                {start_empty && <option selected value={initialValue}>{label}</option>}
                {options_arr.map(({ value, label, selected, disabled }: any, ind: number) => <option key={ind} disabled={disabled || false} selected={selected || false} value={value}>{label}</option>)}
            </Select>
        </div>
    )
}
