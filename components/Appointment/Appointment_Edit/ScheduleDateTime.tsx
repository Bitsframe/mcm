import moment from "moment";
import React, { FC, useState, useEffect, useCallback } from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import enAppoinments from "@/locales/en/Appoinments.json";

// Custom styles for ReactDatePicker dark mode
const customDatePickerStyles = `
  .react-datepicker {
    background-color: white !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 8px !important;
    font-family: inherit !important;
  }
  
  .dark .react-datepicker {
    background-color: #122136 !important;
    border: 1px solid #374151 !important;
    color: white !important;
  }
  
  .react-datepicker__header {
    background-color: #f9fafb !important;
    border-bottom: 1px solid #e5e7eb !important;
  }
  
  .dark .react-datepicker__header {
    background-color: #1f2937 !important;
    border-bottom: 1px solid #374151 !important;
  }
  
  .react-datepicker__current-month,
  .react-datepicker__day-name,
  .react-datepicker__day {
    color: #111827 !important;
  }
  
  .dark .react-datepicker__current-month,
  .dark .react-datepicker__day-name,
  .dark .react-datepicker__day {
    color: white !important;
  }
  
  .react-datepicker__day:hover {
    background-color: #f3f4f6 !important;
  }
  
  .dark .react-datepicker__day:hover {
    background-color: #374151 !important;
  }
  
  .react-datepicker__day--selected {
    background-color: #3b82f6 !important;
    color: white !important;
  }
  
  .dark .react-datepicker__day--selected {
    background-color: #3b82f6 !important;
    color: white !important;
  }
  
  .react-datepicker__day--keyboard-selected {
    background-color: #dbeafe !important;
    color: #1e40af !important;
  }
  
  .dark .react-datepicker__day--keyboard-selected {
    background-color: #1e3a8a !important;
    color: white !important;
  }
  
  .react-datepicker__navigation {
    color: #6b7280 !important;
  }
  
  .dark .react-datepicker__navigation {
    color: #9ca3af !important;
  }
  
  .react-datepicker__navigation:hover {
    color: #374151 !important;
  }
  
  .dark .react-datepicker__navigation:hover {
    color: #d1d5db !important;
  }
`;

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
  selectDateTimeSlotHandle: (date: Date | "", time?: string | "") => void;
}

const ScheduleDateTime: FC<ScheduleDateTimeProps> = ({
  data,
  selectDateTimeSlotHandle,
  default_data_time,
}) => {
  const [date, setDate] = useState<any>("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  const getTimingKey = (date: Date): keyof DayTimings => {
    const days = [
      "sunday_timing",
      "mon_timing",
      "tuesday_timing",
      "wednesday_timing",
      "thursday_timing",
      "friday_timing",
      "saturday_timing",
    ] as const;
    return days[date.getDay()];
  };

  const parseTime = (timeStr: string) => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return { hours, minutes };
  };

  const generateTimeSlots = (timing: string) => {
    const [start, end] = timing.split("-").map((str) => str.trim());
    let timeSlots = [];
    let startHour = parseInt(start.split(":")[0]);
    let endHour = parseInt(end.split(":")[0]);

    // Convert 12-hour time format to 24-hour format for comparison
    if (start.includes("pm") && startHour !== 12) startHour += 12;
    if (end.includes("pm") && endHour !== 12) endHour += 12;
    if (start.includes("am") && startHour === 12) startHour = 0;
    if (end.includes("am") && endHour === 12) endHour = 0;

    for (let hour = startHour; hour <= endHour; hour++) {
      let period = hour < 12 || hour === 24 ? "AM" : "PM";
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
        timings,
      });

      if (timings && timings.toLowerCase() !== "closed") {
        const timeSlots = generateTimeSlots(timings);
        console.log({ timeSlots });
        setAvailableTimes(timeSlots);
        setIsClosed(false);
      } else {
        setAvailableTimes([]);
        setIsClosed(true);
      }
    }
    setSelectedSlot("");
    selectDateTimeSlotHandle("");
  }, [date, data, selectDateTimeSlotHandle]);

  const dateTimeChangeHandle = (date: Date | null) => {
    if (date) {
      setDate(date);
    }
  };

  const selectSlotHandle = (val: string) => {
    setSelectedSlot(val);
    selectDateTimeSlotHandle(date, val);
  };

  const splitDateAndTime = useCallback((returnType: string) => {
    if (default_data_time && default_data_time.includes("|")) {
      const parts = default_data_time.split("|");
      if (parts.length > 1) {
        const str = parts[1].split(" - ");
        if (str.length > 1) {
          const date = str[0];
          const time = str[1];
          if (returnType === "date") {
            return new Date(moment(date, "DD-MM-YYYY").format("YYYY-MM-DD"));
          }
          if (returnType === "time") {
            return time;
          }
        }
      }
    }
    return "";
  }, [default_data_time]);

  useEffect(() => {
    const date_default = splitDateAndTime("date");
    const time_default = splitDateAndTime("time");
    setDate(date_default);
    if (time_default && typeof time_default === "string") {
      console.log(time_default);
      setTimeout(() => {
        setSelectedSlot(() => time_default);
      }, 1000);
    }
  }, [splitDateAndTime]);

  const { t } = useTranslation(translationConstant.APPOINMENTS)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customDatePickerStyles }} />
      <div className="flex flex-col md:flex-row justify-center w-full gap-5 items-center">
      <div className="flex flex-col items-start md:w-1/2 w-full justify-center">
        <label className="text-[16px] text-customGray dark:text-gray-300 font-poppins font-bold">
          {t("Appoinments_k56")}
        </label>
        <span className="border-[1px] border-[#000000] dark:border-gray-500 rounded-[10px] w-full">
          <ReactDatePicker
            selected={date}
            onChange={dateTimeChangeHandle}
            placeholderText="Select Schedule date"
            dateFormat="MM-dd-yyyy"
            className="w-full h-[46px] text-[16px] text-black dark:text-white placeholder:text-customGray placeholder:text-opacity-50 dark:placeholder:text-gray-400 px-5 bg-[#f1f4f9] dark:bg-[#122136] outline-none rounded-[10px]"
            calendarClassName="bg-white dark:bg-[#122136] border border-gray-200 dark:border-gray-700 shadow-lg"
            dayClassName={(date) => "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"}
            //@ts-ignore
            monthClassName="text-black dark:text-white"
            //@ts-ignore
            yearClassName="text-black dark:text-white"
            headerClassName="text-black dark:text-white"
          />
        </span>
      </div>
      <div className="flex flex-col items-start md:w-1/2 w-full justify-center">
        <label className="text-[16px] text-customGray dark:text-gray-300 font-poppins font-bold">
          {t("Appoinments_k55")}
        </label>
        <select
          value={selectedSlot}
          onChange={(e) => selectSlotHandle(e.target.value)}
          className="w-full h-[46px] text-[16px] text-black dark:text-white bg-[#f1f4f9] dark:bg-[#122136] border-none outline-none rounded-lg px-3 py-2"
          disabled={isClosed}
        >
          {isClosed ? (
            <option value="" className="bg-white dark:bg-[#122136] text-black dark:text-white">
              Closed
            </option>
          ) : availableTimes.length > 0 ? (
            <>
              <option value="" className="bg-white dark:bg-[#122136] text-black dark:text-white">
                {t("Appoinments_k95", { defaultValue: (enAppoinments as any)["Appoinments_k95"] ?? "Select Slot" })}
              </option>
              {availableTimes.map((time, index) => (
                <option
                  key={index}
                  value={time}
                  className="bg-white dark:bg-[#122136] text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {time}
                </option>
              ))}
            </>
          ) : (
            <option value="" className="bg-white dark:bg-[#122136] text-black dark:text-white">
              {t("Appoinments_k97", { defaultValue: (enAppoinments as any)["Appoinments_k97"] ?? "No available times" })}
            </option>
          )}
        </select>
      </div>
    </div>
    </>
  );
};

export default ScheduleDateTime;
