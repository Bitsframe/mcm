import { Input_Component_Appointment } from '@/components/Appointment/Add_Appointment_Modal/Input_Component';
import { useLocationClinica } from '@/hooks/useLocationClinica';
import { Label, Modal, Radio, Select } from 'flowbite-react'
import React, { useEffect, useState } from 'react'
import ScheduleDateTime from './ScheduleDateTime';
import { supabase } from '@/services/supabase';
import moment from 'moment';
import { toast } from 'sonner'
import { usStates } from '@/us-states';
import { validateFormData } from '@/utils/validationCheck';
import { useTranslation } from 'react-i18next';
import { translationConstant } from '@/utils/translationConstants';
import { CirclePlus } from 'lucide-react';

interface RadioButtonOptionsInterface {
    label: string;
    value: string;
}

const RadioButton = ({ value, name, label, checked, onChange }: any) => {
    const { t } = useTranslation(translationConstant.APPOINMENTS);
    return (
        <div className="flex items-center justify-start gap-3">
            <input
                id={`${name}-${value}`}
                type="radio"
                value={value}
                name={name}
                checked={checked}
                onChange={onChange}
                className="w-[25px] h-[25px] !border-solid !border-[2px] !border-gray-300"
            />{" "}
            <label htmlFor={`${name}-${value}`} className="text-[14px] text-customGray font-poppins">{t(label)}</label>
        </div>
    )

}

const RadioButtons = ({
    name,
    options,
    label,
    selectedValue,
    onChange,
    required = false,
    className

}: {
    name: string;
    options: RadioButtonOptionsInterface[];
    label?: string;
    selectedValue: string;
    onChange: (value: string) => void;
    required?: boolean;
    className?: string
}) => (
    <div className="flex flex-col md:flex-row items-start justify-start gap-2 pt-3">
        <label className="text-[16px] text-customGray font-poppins font-bold">
            {label}
        </label>
        <div className="flex flex-wrap gap-4">
            {options.map(({ label, value }, index) => (
                <RadioButton
                    key={index}
                    value={value}
                    name={name}
                    label={label}
                    checked={selectedValue === value}
                    onChange={() => onChange(value)}
                />
            ))}
        </div>
    </div>
);


const in_office_patient_options: RadioButtonOptionsInterface[] = [
    {
        label: 'Appoinments_k18',
        value: 'true'
    },
    {
        label: 'Appoinments_k19',
        value: 'false'
    }
]
const patient_type_options: RadioButtonOptionsInterface[] = [
    {
        label: "Appoinments_k21",
        value: 'true'
    },
    {
        label: 'Appoinments_k14',
        value: 'false'
    }
]
const gender_options: RadioButtonOptionsInterface[] = [
    {
        label: 'Appoinments_k35',
        value: 'Male'
    },
    {
        label: 'Appoinments_k36',
        value: 'Female'
    },
    {
        label: 'Appoinments_k37',
        value: 'Other'
    }
]

export const Add_Appointment_Modal = ({ newAddedRow }: { newAddedRow: (e: any) => void }) => {

    const { locations } = useLocationClinica()
    const [formData, setFormData] = useState<any>({})
    const [open, setOpen] = useState(false)
    const [services, setServices] = useState<string[] | null | undefined>([]);
    const [loading, setLoading] = useState(false)

    const close_handle = () => {
        setOpen(false)
        setFormData({})
    }
    const open_handle = () => {
        setOpen(true)
    }
    const select_change_handle = (key: string, val: string | number) => {
        setFormData((pre: any) => {
            return { ...pre, [key]: val }
        })

    }
    const selectDateTimeSlotHandle = (date: Date | '', time?: string | '') => {
        if (formData.location_id) {
            let dbSlot = ''
            if (date && time) {
                const formated_date = moment(date).format('DD-MM-YYYY')

                const createSlotForDB = `${formData.location_id}|${formated_date} - ${time}`
                console.log({ createSlotForDB })
                dbSlot = createSlotForDB
            }


            setFormData((pre: any) => {
                return { ...pre, date_and_time: dbSlot }
            })
            console.log(dbSlot)
        }
        else {
            // toast.warning(`Select location first`);
        }
    }
    const submitHandle = async () => {
        setLoading(true)
        const {
            location_id,
            first_name,
            last_name,
            email_address,
            street_address,
            in_office_patient,
            new_patient,
            dob,
            sex,
            phone,
            date_and_time,
            service, state,
            zipcode } = formData
        let appointmentDetails: any = {
            location_id,
            first_name,
            last_name,
            email_address,

            in_office_patient: in_office_patient === 'true' || false,
            new_patient: new_patient === 'true' || false,
            dob: dob,
            sex: sex,
            phone: phone,
            service: service,
            date_and_time
        };

        const requiredFields = [
            "location_id",
            "in_office_patient",
            "new_patient",
            "first_name",
            "last_name",
            "email_address",
            "phone",
            'sex',
            "state",
            "zipcode",
            "street_address",
            "service",
            "date_and_time",
        ];

        for (const field of requiredFields) {
            if (!formData[field]) {
                toast.warning(`Please fill in the ${field}`);
                setLoading(false)
                return;
            }
        }

        const postData = {
            ...appointmentDetails,
            address: `${formData.street_address}, ${formData.state}, ${formData.zipcode}`,
            date_and_time,
        }
        const { data, error } = await supabase
            .from("Appoinments")
            .insert([postData])
            .select();

        newAddedRow(data?.[0])

        if (error) {
            if (error?.message === 'duplicate key value violates unique constraint "Appoinments_date_and_time_key"') {
                toast.error(`Sorry, Appointment time slot is not available, Please select any other time slot`);
            }
            else { toast.error(`Error submitting appointment: ${error?.message}`); }
        } else {
            toast.success(<div className="flex justify-between">
                        <p>Appointment scheduled successfully.</p>
                        <button
                          onClick={() => toast.dismiss()} 
                          className="absolute top-0 right-0 p-1 rounded hover:bg-gray-100"
                        >
                          <span className="text-sm">&#x2715;</span>
                        </button>
                      </div>);
            console.log(data, "Appointment Submitted");
            close_handle()
        }
        setLoading(false)

    };


    useEffect(() => {
        const fetchServices = async () => {
            let { data, error } = await supabase.from('services').select("title");

            if (data) {
                const serviceData = data.map((item) => item.title);
                setServices(serviceData);
            }
        };

        fetchServices();
    }, []);
    console.log(formData)

    const { t } = useTranslation(translationConstant.APPOINMENTS);


    return (
        <div>
            <button onClick={open_handle} className='text-lg flex items-center gap-3 bg-[#0066ff] px-5 py-2 rounded-md text-white'>
                <CirclePlus color='white' />
                {t("Appoinments_k15")}
            </button>
            <Modal show={open} onClose={close_handle}>
    <Modal.Header>
        <div className='flex items-center justify-between'>
            <h1 className='font-bold text-xl'>Add an Appointment</h1>
        </div>
    </Modal.Header>
    <Modal.Body>
        <div className="space-y-4">
            <div className='space-y-2'>
                <Label className='font-medium'>Locations</Label>
                <Select
                    value={formData.location_id}
                    onChange={(e) => select_change_handle('location_id', e.target.value)}
                >
                    <option value=''>All locations</option>
                    {locations.map((location: any, index: any) => (
                        <option key={index} value={location.id}>{location.address}</option>
                    ))}
                </Select>
            </div>

            <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                    <Label className='font-medium'>Type of visit</Label>
                    <RadioButtons
                        name='in_office_patient'
                        options={in_office_patient_options}
                        selectedValue={formData.in_office_patient}
                        onChange={(e) => select_change_handle('in_office_patient', e)}
                        className="flex gap-2"
                    />
                </div>
                
                <div className='space-y-2'>
                    <Label className='font-medium'>Are you a New/Returning Patient? </Label>
                    <RadioButtons
                        name='new_patient'
                        options={patient_type_options}
                        selectedValue={formData.new_patient}
                        onChange={(e) => select_change_handle('new_patient', e)}
                        className="flex gap-2"
                    />
                </div>
            </div>

            <div className='h-[1px] bg-gray-300 w-full my-4'></div>

            <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                    <Label className='font-medium'>First Name</Label>
                    <Input_Component_Appointment 
                        required 
                        onChange={(e: string) => select_change_handle('first_name', e)} 
                        value={formData.first_name}
                        placeholder="FirstName"
                    />
                </div>
                <div className='space-y-2'>
                    <Label className='font-medium'>Last Name</Label>
                    <Input_Component_Appointment 
                        required 
                        onChange={(e: string) => select_change_handle('last_name', e)} 
                        value={formData.last_name}
                        placeholder="LastName"
                    />
                </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                    <Label className='font-medium'>Email</Label>
                    <Input_Component_Appointment 
                        required 
                        onChange={(e: string) => select_change_handle('email_address', e)} 
                        type="email"
                        value={formData.email_address}
                        placeholder="Email"
                    />
                </div>
                <div className='space-y-2'>
                    <Label className='font-medium'>Phone</Label>
                    <Input_Component_Appointment 
                        required 
                        onChange={(e: string) => select_change_handle('phone', e)} 
                        value={formData.phone}
                        placeholder="Phone Number"
                    />
                </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                    <Label className='font-medium'>Date of Birth</Label>
                    <Input_Component_Appointment 
                        type='date' 
                        onChange={(e: string) => select_change_handle('dob', e)} 
                        value={formData.dob}
                        placeholder="mm/dd/yyyy"
                    />
                </div>
                <div className='space-y-2'>
                    <Label className='font-medium'>Gender</Label>
                    <RadioButtons
                        name='sex'
                        options={gender_options}
                        selectedValue={formData.sex}
                        required
                        onChange={(e) => select_change_handle('sex', e)}
                        className="flex gap-2"
                    />
                </div>
            </div>

            <div className='h-[1px] bg-gray-300 w-full my-4'></div>

            <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                    <Label className='font-medium'>State</Label>
                    <Select
                        value={formData.state}
                        onChange={(e) => select_change_handle('state', e.target.value)}
                    >
                        <option disabled value=''>Alaska - AK</option>
                        {usStates?.map(({ value, name }, index: any) => (
                            <option key={index} value={name}>{`${name} - ${value}`}</option>
                        ))}
                    </Select>
                </div>
                <div className='space-y-2'>
                    <Label className='font-medium'>Zipcode</Label>
                    <Input_Component_Appointment 
                        required 
                        max={5} 
                        onChange={(e: string) => select_change_handle('zipcode', e)} 
                        value={formData.zipcode}
                        placeholder="Enter Zipcode"
                    />
                </div>
            </div>

            <div className='space-y-2'>
                <Label className='font-medium'>Street Address</Label>
                <Input_Component_Appointment 
                    required 
                    onChange={(e: string) => select_change_handle('street_address', e)} 
                    value={formData.street_address}
                    placeholder="Enter your address with zipcode"
                />
            </div>

            <div className='h-[1px] bg-gray-300 w-full my-4'></div>

            <div className='space-y-2'>
                <Label className='font-medium'>Treatment</Label>
                <Select
                    value={formData.service}
                    onChange={(e) => select_change_handle('service', e.target.value)}
                >
                    <option value=''>Select treatment type</option>
                    {services?.map((service: string, index: any) => (
                        <option key={index} value={service}>{service}</option>
                    ))}
                </Select>
            </div>

            <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                    <Label className='font-medium'>Time</Label>
                    {locations.length > 0 && <ScheduleDateTime data={locations[0]} selectDateTimeSlotHandle={selectDateTimeSlotHandle} />}
                </div>
            </div>
        </div>
    </Modal.Body>
    <Modal.Footer>
        <div className='flex w-full justify-between'>
            <button 
                onClick={close_handle} 
                className='bg-gray-200 px-4 py-2 rounded-md text-gray-700 hover:bg-gray-300 transition-colors'
            >
                Cancel
            </button>
            <button 
                disabled={loading} 
                onClick={submitHandle} 
                className={`bg-[#0066ff] ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#0052cc]'} px-4 py-2 rounded-md text-white transition-colors`}
            >
                {loading ? 'Submitting...' : 'Save Changes'}
            </button>
        </div>
    </Modal.Footer>
</Modal>
        </div >
    )
}


