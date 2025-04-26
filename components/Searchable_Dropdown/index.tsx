import { translationConstant } from '@/utils/translationConstants';
import { Label } from 'flowbite-react';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface OptionArrayInterface {
    value: string | number;
    label: string | number;
    selected?: boolean;
    disabled?: boolean;
}

interface Props {
    options_arr: OptionArrayInterface[];
    on_change_handle?: (e: any) => void;
    required?: boolean;
    value?: string | number;
    label?: string;
    start_empty?: boolean;
    disabled?: boolean;
    initialValue?: any;
}

export const Searchable_Dropdown = ({
    disabled = false,
    options_arr,
    on_change_handle,
    required,
    value = '',
    label,
    start_empty = false,
    //@ts-ignore
    initialValue = '' || 0,
}: Props) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation(translationConstant.POSSALES);
    const filteredOptions = options_arr.filter((option) =>
        option.label.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setShowDropdown(true);
    };

    const handleSelectOption = (selectedValue: string | number) => {
        if (on_change_handle) {
            on_change_handle({ target: { value: selectedValue } });
        }
        setSelectedValue(selectedValue);
        setShowDropdown(false);
        setSearchTerm('');
    };

    useEffect(() => {
        setSelectedValue(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="w-full relative" ref={dropdownRef}>
            {/* {label && (
                <Label
                    htmlFor="searchable-select"
                    value={t(label)}
                    className="font-bold text-gray-900 dark:text-gray-200 mb-0.5 block text-sm"
                />
            )} */}

            <div
                onClick={() => {
                    setShowDropdown(true);
                    setSearchTerm('');
                }}
                className={`w-full p-2 rounded-lg cursor-pointer bg-white dark:bg-[#0e1725] border dark:border-gray-700 text-sm`}
            >
                <p className="text-gray-900 dark:text-gray-200">
                    {options_arr.find((opt) => opt.value === selectedValue)?.label || t(label as any)}
                </p>
            </div>

            {showDropdown && (
                <ul className="absolute z-10 w-full bg-white dark:bg-[#0e1725] border border-gray-300 dark:border-gray-700 rounded max-h-40 overflow-auto text-sm mt-1">
                    <input
                        type="text"
                        value={showDropdown ? searchTerm : options_arr.find((opt) => opt.value === selectedValue)?.label || ''}
                        onChange={handleInputChange}
                        onFocus={() => setShowDropdown(true)}
                        placeholder={'Search...'}
                        className="w-full p-1 border-b border-gray-300 dark:border-gray-600 rounded-t text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 text-sm"
                        disabled={disabled}
                        required={required}
                        readOnly={false}
                    />

                    {filteredOptions.map(({ value, label, disabled }, ind) => (
                        <li
                            key={ind}
                            onClick={() => !disabled && handleSelectOption(value)}
                            className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-200 text-sm ${
                                disabled ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};