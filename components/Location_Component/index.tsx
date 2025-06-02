'use client'
import { useLocationClinica } from '@/hooks/useLocationClinica'
import { Select } from 'flowbite-react'
import React from 'react'

const Location_Component = () => {
    const { locations, set_location_handle, selected_location } = useLocationClinica({ defaultSetFirst: true })

    const select_location_handle = (val: React.ChangeEvent<HTMLSelectElement>) => {
        const value = val.target.value
        //@ts-ignore
        set_location_handle(value)
    }

    console.log(selected_location)

    return (
        <div>
            <Select 
                onChange={select_location_handle} 
                defaultValue={selected_location} 
                className="bg-[#f1f4f9] dark:bg-[#122136] text-gray-800 dark:text-gray-300 border-none focus:ring-2 focus:ring-blue-500"
                id="locations" 
                required
            >
                {locations.map((location: any, index: any) => (
                    <option 
                        key={index} 
                        value={location.id}
                        className="bg-white dark:bg-[#122136] text-gray-800 dark:text-gray-300"
                    >
                        {location.title}
                    </option>
                ))}
            </Select>
        </div>
    )
}

export default Location_Component