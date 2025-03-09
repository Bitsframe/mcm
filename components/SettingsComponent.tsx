'use client'

import React, { useState, useEffect, forwardRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import moment from 'moment';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

const formattedTime = (time?: string) => {
  return time ? moment(time, 'HH:mm:ss').format('hh:mm A')
    : '';
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Location {
  id: number;
  title:string;
  address: string;
  report_time: string | null;
}

interface TimeOption {
  label: string;
  value: string;
}

// Time Selector Component
const TimeSelector = forwardRef<
  HTMLDivElement,
  { value: string; onChange: (time: string) => void }
>(({ value, onChange }, ref) => {
  const timeOptions: TimeOption[] = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2) % 12 || 12;
    const period = i < 24 ? 'AM' : 'PM';
    const minute = i % 2 === 0 ? '00' : '30';
    const formattedTime = `${hour}:${minute} ${period}`;
    const value = `${String(Math.floor(i / 2)).padStart(2, '0')}:${minute}:00`;
    return { label: formattedTime, value };
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

TimeSelector.displayName = 'TimeSelector';

const SettingsComponent: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('Locations').select('*');
      if (error) throw error;

      if (data?.length) {
        setLocations(data);
        selectLocation(data[0]);
      }
    } catch (error: any) {
      console.error('Error fetching locations:', error.message || error);
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (location: Location) => {
    setSelectedLocation(location);

    setSelectedTime(location.report_time || '');
  };

  const handleReportTimeUpdate = async () => {
    if (!selectedLocation || !selectedTime) return;

    setIsUpdating(true);
    try {
      console.log(`Updating report time for location ${selectedLocation.id}: ${selectedTime}`);

      const { error } = await supabase
        .from('Locations')
        .update({ report_time: selectedTime })
        .eq('id', selectedLocation.id);

      if (error) throw error;

      setLocations(prev =>
        prev.map(loc =>
          loc.id === selectedLocation.id ? { ...loc, report_time: selectedTime } : loc
        )
      );
      setSelectedLocation(prev => prev ? { ...prev, report_time: selectedTime } : prev);
    } catch (error: any) {
      console.error('Error updating report time:', error.message || error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="h-[80dvh] bg-background p-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Location Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Locations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 overflow-auto h-[55dvh]">
                      {locations.map(location => (
                        <div
                          key={location.id}
                          onClick={() => selectLocation(location)}
                          className={`p-2 rounded-md cursor-pointer ${selectedLocation?.id === location.id
                              ? 'bg-secondary'
                              : 'hover:bg-secondary/50'
                            }`}
                        >
                          {location.title}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-1 md:col-span-2">
                {selectedLocation && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Location Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-medium text-foreground mb-2">Address:</h3>
                          <p className="text-muted-foreground">{selectedLocation.address}</p>
                        </div>
                        <div>
                          <div className='flex justify-between items-center'>
                          <h3 className="font-medium text-foreground mb-2">Report Time:</h3>
                          <div>
                          <h3 className="font-light text-foreground mb-2">Current Selected Time: <span className='font-medium'>{selectedLocation.report_time ? formattedTime(selectedLocation.report_time!): '-- -- --'}</span> </h3>
                          </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="flex-1">
                              <TimeSelector key={selectedLocation?.title! || '-'} value={selectedTime} onChange={setSelectedTime} />
                            </div>
                            <Button
                              onClick={handleReportTimeUpdate}
                              disabled={isUpdating}
                              className="w-full sm:w-auto"
                            >
                              {isUpdating ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                "Update Time"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsComponent;
