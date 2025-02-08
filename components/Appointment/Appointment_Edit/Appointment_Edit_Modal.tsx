'use client'
import React, { FC, useState } from 'react'
import { Custom_Modal } from '../../Modal_Components/Custom_Modal'
import ScheduleDateTime, { DayTimings } from './ScheduleDateTime'
import moment from 'moment'
import { update_appointment_service } from '@/utils/supabase/data_services/data_services'
import { toast } from 'react-toastify'
import { Appointment, LocationInterface } from '@/app/(root)/(childroot)/appoinments/page'
import { sendEmail } from '@/utils/emailService'
import { EmailBodyTempEnum } from '@/utils/emailService/templateDetails'

interface Appointment_Edit_Modal_Props {
    location_data: LocationInterface;
    appointment_details: Appointment;
    update_available_data: (data_and_time: string) => void;
    default_data_time: string;
}

export const Appointment_Edit_Modal: FC<Appointment_Edit_Modal_Props> = ({ location_data, appointment_details, update_available_data, default_data_time }) => {

    const [openModal, setOpenModal] = useState<boolean>(false)
    const [LoadingUpdate, setLoadingUpdate] = useState(false)
    const [isDateSelected, setIsDateSelected] = useState(false)
    const [isTimeSelected, setIsTimeSelected] = useState(false)
    const [selectedVal, setselectedVal] = useState('')


    const create_content_handle = async () => {
        setLoadingUpdate(true)

        if (selectedVal) {
            const { error, data } = await update_appointment_service(appointment_details.id, selectedVal)
            if (!error) {
                const lang = 'en'
                const emailType = EmailBodyTempEnum.UPDATE_TO_YOUR_APPOINTMENT_DETAILS

                const { email_address, location, first_name, last_name, service, date_and_time } = appointment_details
                const data: any = {
                    email: email_address,
                    name: `${first_name} ${last_name}`,
                    location: location,
                    service: service,
                    date: selectedVal ? selectedVal?.split?.('|')?.[1]?.split?.(' - ')?.[0] : '-',

                    time: selectedVal ? selectedVal?.split?.(' - ')?.[1] : '-',
                    oldDate: date_and_time ? date_and_time?.split?.('|')?.[1]?.split?.(' - ')?.[0] : '-',
                    oldTime: date_and_time ? date_and_time?.split?.(' - ')?.[1] : '-'

                }
                await sendEmail({ lang, emailType, data })
                toast.success('Updated successfully');
                // Update appointment time slot in the database
                update_available_data(selectedVal)
                setOpenModal(false)
            }

        }

        console.log(appointment_details)
        setLoadingUpdate(false)

    }

    const openModalHandle = () => {
        setOpenModal(true)
    }
    const closeModalHandle = () => {
        setOpenModal(false)
    }


    const selectDateTimeSlotHandle = (date: Date | '', time?: string | '') => {
        if (date && time) {
            const formated_date = moment(date).format('DD-MM-YYYY')

            const createSlotForDB = `${appointment_details.location_id}|${formated_date} - ${time}`
            console.log({ createSlotForDB })
            setselectedVal(createSlotForDB)
        } else {
            setselectedVal('')

        }

        if (date) {
            setIsDateSelected(true)

        }

        if (time) {
            setIsTimeSelected(true)
        }
    }



    return (
        <Custom_Modal disabled={!isDateSelected || !isTimeSelected} Trigger_Button={<button onClick={openModalHandle} className="border-text_primary_color flex-1 text-text_primary_color border-2 active:opacity-60 rounded-md px-4 py-1 ml-2 hover:bg-text_primary_color_hover">Edit</button>} create_new_handle={create_content_handle} open_handle={openModalHandle} close_handle={closeModalHandle} is_open={openModal} Title='Update Appointment Time Slot' buttonLabel='Update' loading={LoadingUpdate} >
            <div className='grid grid-cols-1 gap-4'>

                <ScheduleDateTime default_data_time={default_data_time} selectDateTimeSlotHandle={selectDateTimeSlotHandle} data={location_data} />



            </div>

        </Custom_Modal>
    )
}
