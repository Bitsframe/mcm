import moment from 'moment';
import React, { FC, useState, useEffect } from 'react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export type DayTimings = {
    mon_timing: string;
    tuesday_timing: string;
    wednesday_timing: string;
    thursday_timing: string;
    friday_timing: string;
    saturday_timing: string;
    sunday_timing: string;
};

export interface ScheduleDateTimeProps {
    data: DayTimings;
    default_data_time: string;
    selectDateTimeSlotHandle: (date: Date | '', time?: string | '') => void
}

const ScheduleDateTime: FC<ScheduleDateTimeProps> = ({ data, selectDateTimeSlotHandle, default_data_time }) => {
    const [date, setDate] = useState<any>('');
    const [availableTimes, setAvailableTimes] = useState<string[]>([]);
    const [isClosed, setIsClosed] = useState<boolean>(false);
    const [selectedSlot, setSelectedSlot] = useState<string>('')

    const getTimingKey = (date: Date): keyof DayTimings => {
        const days = ['sunday_timing', 'mon_timing', 'tuesday_timing', 'wednesday_timing', 'thursday_timing', 'friday_timing', 'saturday_timing'] as const;
        return days[date.getDay()];
    };

    const parseTime = (timeStr: string) => {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return { hours, minutes };
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
        if (date) {
            setDate(date);
        }
    }

    const selectSlotHandle = (val: string) => {
        setSelectedSlot(val)
        selectDateTimeSlotHandle(date, val)
    }


    const splitDateAndTime = (returnType: string) => {

        if (default_data_time
        ) {
            const str = default_data_time.split('|')[1].split(' - ')
            const date = str[0]
            const time = str[1]
            if (returnType === 'date') {
                return new Date(moment(date, 'DD-MM-YYYY').format('YYYY-MM-DD'))
            }
            if (returnType === 'time') {
                return time
            }
        } else {
            return ''
        }
    }


    useEffect(() => {
        const date_default = splitDateAndTime('date')
        const time_default = splitDateAndTime('time')
        setDate(date_default)
        if(time_default && typeof(time_default) === 'string'){
            console.log(time_default)
            setTimeout(() => {
                setSelectedSlot(()=>time_default)
            }, 1000);
        }

    }, [])


    return (
        <div className="flex flex-col md:flex-row justify-center w-full gap-5 items-center">
            <div className="flex flex-col items-start md:w-1/2 justify-center">
                <label className="text-[16px] text-customGray font-poppins font-bold">
                    Select Schedule Date:
                </label>
                <span className='border-[1px] border-[#000000] rounded-[10px] w-full'>
                <ReactDatePicker
                    // minDate={}
                    selected={date }
                    onChange={dateTimeChangeHandle}
                    placeholderText={"Select Schedule date"}
                    dateFormat="dd-MM-yyyy"
                    className="w-full h-[46px] text-[16px] text-[#000000] placeholder:text-customGray placeholder:text-opacity-50 px-5 bg-transparent outline-none "
                />
                </span>
            </div>

            <div className="flex flex-col items-start md:w-1/2 justify-center">
                <label className="text-[16px] text-customGray font-poppins font-bold">
                    Select Schedule Time:
                </label>
                <select
                    value={selectedSlot}
                    onChange={(e) => selectSlotHandle(e.target.value)}
                    className='w-full h-[46px] border-[1px] border-[#000000] text-[16px] text-[#000000] placeholder:text-customGray placeholder:text-opacity-50 px-5 bg-transparent outline-none rounded-[10px]'
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
        </div>
    )
}

export default ScheduleDateTime;
