import { translationConstant } from '@/utils/translationConstants';

import { renderFormattedDate } from '@/helper/common_functions';
import React, { FC, useState, useEffect } from 'react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from 'react-i18next';

type DayTimings = {
    mon_timing: string;
    tuesday_timing: string;
    wednesday_timing: string;
    thursday_timing: string;
    friday_timing: string;
    saturday_timing: string;
    sunday_timing: string;
};

interface Props {
    data: DayTimings;
    selectDateTimeSlotHandle: (date: Date | '', time?: string | '') => void
}

const ScheduleDateTime: FC<Props> = ({ data, selectDateTimeSlotHandle }) => {
    const [date, setDate] = useState<Date>(new Date());
    const [availableTimes, setAvailableTimes] = useState<string[]>([]);
    const [isClosed, setIsClosed] = useState<boolean>(false);
    const [selectedSlot, setSelectedSlot] = useState('')

    const getTimingKey = (date: Date): keyof DayTimings => {
        // const formatDate =  renderFormattedDate(date)
        const days = ['sunday_timing', 'mon_timing', 'tuesday_timing', 'wednesday_timing', 'thursday_timing', 'friday_timing', 'saturday_timing'] as const;
        return days[date.getDay()];
    };


    const generateTimeSlots = (timing: string) => {
        const [start, end] = timing.split('-').map(str => str.trim());
        let timeSlots = [];
        let startHour = parseInt(start.split(':')[0]);
        let endHour = parseInt(end.split(':')[0]);

        // Convert 12-hour time format to 24-hour format for comparison
        if (start.includes("pm") && startHour !== 12) startHour += 12;
        if (end.includes("pm") && endHour !== 12) endHour += 12;
        if (start.includes("am") && startHour === 12) startHour = 0;
        if (end.includes("am") && endHour === 12) endHour = 0;

        for (let hour = startHour; hour <= endHour; hour++) {
            let period = hour < 12 || hour === 24 ? 'AM' : 'PM';
            let formattedHour = hour % 12 === 0 ? 12 : hour % 12;
            let timeSlot = `${formattedHour}:00 ${period}`;
            timeSlots.push(timeSlot);
        }

        return timeSlots;
    };

    useEffect(() => {
        if (date) {
            const timingKey = getTimingKey(date);
            const timings = data[timingKey];
            console.log({
                timingKey,
                timings
            })

            if (timings && timings.toLowerCase() !== 'closed') {
                const timeSlots = generateTimeSlots(timings);
                console.log({ timeSlots })
                setAvailableTimes(timeSlots);
                setIsClosed(false);
            } else {
                setAvailableTimes([]);
                setIsClosed(true);
            }
        }
        setSelectedSlot('')
        selectDateTimeSlotHandle('')
    }, [date, data]);

    const dateTimeChangeHandle = (date: Date | null) => {
        if(date){
            setDate(date);
        }
    }

    const selectSlotHandle = (val: string) => {
        setSelectedSlot(val)
        selectDateTimeSlotHandle(date, val)
    }
    const {t} = useTranslation(translationConstant.APPOINMENTS)
    return (
        <div className="flex justify-between flex-row-reverse w-full gap-x-5 items-center ">
            

            <div className="flex gap-x-3 items-center md:w-1/2 justify-center">
                <label className="text-[16px] text-customGray font-poppins font-bold">
                {t("Appoinments_k1")}<span className='text-red-700'>&nbsp;*</span>
                </label>
                <select
                    value={selectedSlot}
                    onChange={(e) => selectSlotHandle(e.target.value)}
                    className='w-full h-[46px] border-[1px] border-[#CBD5E1] text-[16px] text-[#000000] placeholder:text-customGray placeholder:text-opacity-50 px-5 bg-transparent outline-none rounded-[10px]'
                    disabled={isClosed}
                >
                    {isClosed ? (
                        <option value="">Closed</option>
                    ) : (
                        availableTimes.length > 0 ? <> <option value=''>
                            Select Slot
                        </option> {

                                availableTimes.map((time, index) => (
                                    <option key={index} value={time}>
                                        {time}
                                    </option>
                                ))
                            }</> : (
                            <option value="">No available times</option>
                        )
                    )}
                </select>
            </div>

            <div className="flex gap-x-3 items-center md:w-1/2 justify-center">
                <label className="text-[16px] text-customGray font-poppins font-bold">
                {t("Appoinments_k2")}<span className='text-red-700'>&nbsp;*</span>
                </label>
                <div className='!border-[1px] !border-[#CBD5E1] !border-solid rounded-[10px]'>
                <ReactDatePicker
                    minDate={new Date()}
                    selected={date}
                    onChange={dateTimeChangeHandle}
                    placeholderText={"Select Schedule date"}
                    dateFormat="MM-dd-yyyy"
                    className="w-full h-[46px]  text-[16px] text-[#000000] placeholder:text-customGray placeholder:text-opacity-50 px-5 bg-transparent outline-none "
                />
                </div>
            </div>
        </div>
    )
}

export default ScheduleDateTime;
