"use client";

import React, { useState, useEffect, forwardRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import moment from "moment";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
}

const formattedTime = (time?: string) => {
  return time ? moment(time, "HH:mm:ss").format("hh:mm A") : "";
};

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Location {
  id: number;
  title: string;
  address: string;
  report_time: string | null;
}

interface TimeOption {
  label: string;
  value: string;
}

const TimeSelector = forwardRef<
  HTMLDivElement,
  { value: string; onChange: (time: string) => void }
>(({ value, onChange }, ref) => {
  const timeOptions: TimeOption[] = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2) % 12 || 12;
    const period = i < 24 ? "AM" : "PM";
    const minute = i % 2 === 0 ? "00" : "30";
    const formattedTime = `${hour}:${minute} ${period}`;
    const value = `${String(Math.floor(i / 2)).padStart(2, "0")}:${minute}:00`;
    return { label: formattedTime, value };
  });

  // Add 12:00 AM with value as 11:59 PM
  timeOptions.push({
    label: "12:00 AM",
    value: "23:59:00", // 11:59 PM
  });

  return (
    <Select value={value || undefined} onValueChange={onChange}>
      {/* @ts-ignore */}
      <SelectTrigger ref={ref} className="w-full">
        <SelectValue placeholder="Select time" />
      </SelectTrigger>
      <SelectContent>
        {timeOptions.map(({ label, value }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

TimeSelector.displayName = "TimeSelector";

const SettingsComponent: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("Locations").select("*");
      if (error) throw error;
      if (data?.length) {
        setLocations(data);
        selectLocation(data[0]);
      }
    } catch (error: any) {
      console.error("Error fetching locations:", error.message || error);
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (location: Location) => {
    setSelectedLocation(location);
    setSelectedTime(location.report_time || "");
  };

  const handleReportTimeUpdate = async () => {
    if (!selectedLocation || !selectedTime) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("Locations")
        .update({ report_time: selectedTime })
        .eq("id", selectedLocation.id);

      if (error) throw error;

      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === selectedLocation.id
            ? { ...loc, report_time: selectedTime }
            : loc
        )
      );
      setSelectedLocation((prev) =>
        prev ? { ...prev, report_time: selectedTime } : prev
      );
    } catch (error: any) {
      console.error("Error updating report time:", error.message || error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="h-[80dvh] bg-background p-6 dark:bg-gray-900">
      <div className="bg-white dark:bg-[#0E1725] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-4 border-b dark:border-gray-700">
          <h1 className="text-lg font-medium text-gray-900 dark:text-white">
            Reporting Time
          </h1>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Left - Locations */}
          <div className="w-[30%] border-r bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="text-sm font-medium mb-3 text-gray-800 dark:text-gray-300">
                Locations
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search locations"
                  className="w-full pl-8 pr-2 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <svg
                  className="absolute left-2 top-2.5 h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </div>
            </div>

            <div className="overflow-auto h-[calc(80dvh-120px)]">
              {locations.map((location) => (
                <div
                  key={location.id}
                  onClick={() => selectLocation(location)}
                  className={`px-4 py-3 cursor-pointer border-b text-sm dark:border-gray-700 ${
                    selectedLocation?.id === location.id
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {location.title}
                </div>
              ))}
            </div>
          </div>

          {/* Right - Details */}
          <div className="flex-1 p-6 w-[70%] text-gray-800 dark:text-gray-100">
            {selectedLocation ? (
              <>
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-1">Address</h3>
                  <p className="text-sm">{selectedLocation.address}</p>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1">
                    Current Selected Time
                  </h3>
                  <p className="text-sm">
                    {selectedLocation.report_time
                      ? formattedTime(selectedLocation.report_time!)
                      : "12:00 AM"}
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-1">Report Time</h3>
                  <div className="relative">
                    <TimeSelector
                      key={selectedLocation?.title! || "-"}
                      value={selectedTime}
                      onChange={setSelectedTime}
                    />
                    <svg
                      className="absolute right-3 top-3 h-4 w-4 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleReportTimeUpdate}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Time"
                    )}
                  </button>

                  <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    Reset
                  </button>
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">
                Select a location to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsComponent;
