import { translationConstant } from '@/utils/translationConstants';
import { renderFormattedDate } from '@/helper/common_functions';
import React, { FC, useState, useEffect, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from "@/components/ui/calendar"; // shadcn calendar component
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { fetch_content_service } from '@/utils/supabase/data_services/data_services';
import { supabase } from '@/services/supabase';
import { LocationContext } from '@/context';

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
    const [bookedTimes, setBookedTimes] = useState<string[]>([]);

    const { selectedLocation } = useContext(LocationContext);

    const getTimingKey = (date: Date): keyof DayTimings => {
        const days = ['sunday_timing', 'mon_timing', 'tuesday_timing', 'wednesday_timing', 'thursday_timing', 'friday_timing', 'saturday_timing'] as const;
        return days[date.getDay()];
    };

    const generateTimeSlots = (timing: string) => {
        const [start, end] = timing.split('-').map(str => str.trim());
        let timeSlots = [];
        let startHour = parseInt(start.split(':')[0]);
        let endHour = parseInt(end.split(':')[0]);

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

    // Fetch already-booked slots for the selected date and location
    useEffect(() => {
        const fetchBooked = async () => {
            try {
                if (!selectedLocation?.id || !date) {
                    setBookedTimes([]);
                    return;
                }

                // Query Supabase directly for appointments matching the selected location.
                // Some tables/rows use `location_id` while others use `locationid`.
                // Use an OR to cover both possibilities and avoid helper-level user-location filtering.
                const locId = Number(selectedLocation.id);
                // Query only the existing column `location_id` to avoid SQL errors
                const { data: rows, error } = await supabase
                    .from('Appoinments')
                    .select('*')
                    .eq('location_id', locId);

                if (error) {
                    console.error('Error fetching appointments directly from Supabase', error);
                    setBookedTimes([]);
                    return;
                }

                // Debug: log retrieved rows so we can see why a newly-inserted appointment
                // may not appear in the fetched set (helps diagnose RLS / filtering issues).
                try {
                    console.debug('[ScheduleDateTime] fetched appointments count=', (rows || []).length);
                    console.debug('[ScheduleDateTime] sample date_and_time values=', (rows || []).slice(0,10).map(r => r?.date_and_time));
                } catch (e) {}

                const selDayStrDMY = format(date, 'dd-MM-yyyy');
                const selDayStrYMD = format(date, 'yyyy-MM-dd');

                // More tolerant parsing: handle prefixes like '3|29-10-2025 - 11:00 AM'
                const times = (rows || [])
                    .map(r => r?.date_and_time as string)
                    .filter(Boolean)
                    .map((s: string) => s.trim())
                    .map((s: string) => {
                        // Remove any prefix up to last pipe '|' if present
                        const core = s.includes('|') ? s.substring(s.lastIndexOf('|') + 1).trim() : s;
                        // Try to match patterns like '29-10-2025 - 11:00 AM' or '2025-10-29 - 11:00 AM'
                        const m = core.match(/(\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4})\s*-\s*(\d{1,2}:\d{2}\s*[AaPp][Mm])/);
                        if (!m) return '';
                        const datePart = m[1];
                        const timePartRaw = m[2];

                        // Normalize date to compare with selected date
                        let normalizedDate = '';
                        try {
                            // support dd-MM-yyyy and yyyy-MM-dd
                            const d1 = parse(datePart, 'dd-MM-yyyy', new Date());
                            if (!isNaN(d1.getTime())) normalizedDate = format(d1, 'dd-MM-yyyy');
                            else {
                                const d2 = parse(datePart, 'yyyy-MM-dd', new Date());
                                if (!isNaN(d2.getTime())) normalizedDate = format(d2, 'dd-MM-yyyy');
                            }
                        } catch (e) {
                            normalizedDate = '';
                        }

                        const matches = normalizedDate === selDayStrDMY || datePart === selDayStrDMY || datePart === selDayStrYMD;
                        const timePart = (timePartRaw || '').toUpperCase().replace(/\s+/g, ' ').trim();
                        return matches ? timePart : '';
                    })
                    .filter((t: string) => !!t);

                setBookedTimes(times);
            } catch (e) {
                console.error('Failed to fetch booked slots', e);
                setBookedTimes([]);
            }
        };
        fetchBooked();
    }, [selectedLocation, date]);

    const bookedSet = useMemo(() => new Set(bookedTimes.map(t => t.trim().toUpperCase())), [bookedTimes]);

    const dateTimeChangeHandle = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            setDate(selectedDate);
        }
    }

    const selectSlotHandle = (val: string) => {
        setSelectedSlot(val)
        selectDateTimeSlotHandle(date, val)
    }
    
    const { t } = useTranslation(translationConstant.APPOINMENTS)
    
    return (
        <div className="flex flex-col md:flex-row-reverse justify-between w-full gap-5 md:gap-x-5 items-center">
            <div className="flex gap-x-3 items-center w-full md:w-1/2 justify-center">
                <label className="text-[16px] text-customGray font-poppins font-bold">
                    {t("Appoinments_k1")}<span className='text-red-700'>&nbsp;*</span>
                </label>
                <select
                    value={selectedSlot}
                    onChange={(e) => selectSlotHandle(e.target.value)}
                    className='w-full h-[46px] text-[16px] text-black dark:text-white bg-[#f1f4f9] dark:bg-[#122136] border-none outline-none rounded-lg px-3 py-2'
                    style={{
                        backgroundColor: document.documentElement.classList.contains('dark') ? '#122136' : '#f1f4f9',
                        border: 'none',
                        outline: 'none'
                    }}
                    disabled={isClosed}
                >
                    {isClosed ? (
                        <option value="" className="bg-white dark:bg-[#122136] text-black dark:text-white">Closed</option>
                    ) : (
                        availableTimes.length > 0 ? <> <option value='' className="bg-white dark:bg-[#122136] text-black dark:text-white">
                            Select Slot
                        </option> {
                                availableTimes.map((time, index) => {
                                    const timeKey = String(time).trim().toUpperCase();
                                    const isBooked = bookedSet.has(timeKey);
                                    return (
                                        <option
                                            key={index}
                                            value={time}
                                            disabled={isBooked}
                                            className={`bg-white dark:bg-[#122136] text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${isBooked ? 'opacity-60' : ''}`}
                                        >
                                            {time}{isBooked ? ' (Booked)' : ''}
                                        </option>
                                    );
                                })
                            }</> : (
                            <option value="" className="bg-white dark:bg-[#122136] text-black dark:text-white">No available times</option>
                        )
                    )}
                </select>
            </div>

            <div className="flex gap-x-3 items-center w-full md:w-1/2 justify-center">
                <label className="text-[16px] text-customGray font-poppins font-bold">
                    {t("Appoinments_k2")}<span className='text-red-700'>&nbsp;*</span>
                </label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className="w-full h-[46px] text-[16px] text-[#000000] dark:text-white rounded-lg justify-start text-left font-normal hover:bg-gray-50 dark:hover:bg-gray-700"
                            style={{
                                backgroundColor: document.documentElement.classList.contains('dark') ? '#122136' : '#f1f4f9',
                                border: 'none',
                                outline: 'none'
                            }}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "MM-dd-yyyy") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={dateTimeChangeHandle}
                            fromDate={new Date()}
                            initialFocus
                            className="rounded-md bg-white dark:bg-gray-800"
                            classNames={{
                                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                month: "space-y-4",
                                caption: "flex justify-center pt-1 relative items-center text-gray-900 dark:text-gray-100",
                                caption_label: "text-sm font-medium text-gray-900 dark:text-gray-100",
                                nav: "space-x-1 flex items-center",
                                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md",
                                nav_button_previous: "absolute left-1",
                                nav_button_next: "absolute right-1",
                                table: "w-full border-collapse space-y-1",
                                head_row: "flex",
                                head_cell: "text-gray-500 dark:text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
                                row: "flex w-full mt-2",
                                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-blue-100 dark:[&:has([aria-selected])]:bg-blue-900 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                day: "h-9 w-9 p-0 font-normal text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md aria-selected:opacity-100",
                                day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 dark:focus:bg-blue-700",
                                day_today: "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100",
                                day_outside: "text-gray-400 dark:text-gray-600 opacity-50",
                                day_disabled: "text-gray-400 dark:text-gray-600 opacity-50",
                                day_range_middle: "aria-selected:bg-blue-100 dark:aria-selected:bg-blue-900 aria-selected:text-gray-900 dark:aria-selected:text-gray-100",
                                day_hidden: "invisible"
                            }}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}

export default ScheduleDateTime;