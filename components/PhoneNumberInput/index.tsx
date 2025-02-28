import React from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const PhoneNumberInput = ({
    className,
    label,
    placeholder,
    breakpoint,
    value,
    type = 'text',
    onChange,
}: {
    className?: string;
    label?: string;
    placeholder: string;
    breakpoint: boolean;
    value: string;
    type?: string;
    onChange: (value: string) => void;
}) => {
    return (
        <div className={`flex ${breakpoint ? 'sm:flex-row' : 'flex-col'} items-start w-full`}>
            {/* Label for the phone input */}
            <label className="text-[16px] text-customGray font-poppins font-bold mb-2">
                {label}
            </label>

            {/* Phone Input */}
            <PhoneInput
                 country={'us'}
                 onlyCountries={['us']}  // Default country
                value={value}   // Controlled value from props
                onChange={(phone: string) => onChange(phone)} // Update handler
                placeholder={placeholder} // Placeholder for the input
                
                inputStyle={{
                    width: '100%',
                    height: '46px',
                    fontSize: '16px',
                    color: '#000000',
                    borderRadius: '12px',
                    backgroundColor:'white'
                }}
                buttonStyle={{
                    borderRadius: '10px 0 0 10px',
                }}
                containerStyle={{
                    border: '2px solid #d1d5db', 
                    borderRadius: '12px',
                    width: '100%',
                }}
            />
        </div>
    );
};

export default PhoneNumberInput;
