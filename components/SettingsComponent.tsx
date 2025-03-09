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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Location {
  id: number;
  address: string;
  report_time: string;
}

interface TimeOption {
  label: string;
  value: string;
}

// Updated TimeSelector component with shadcn/ui
const TimeSelector = forwardRef<
  HTMLDivElement, 
  { value: string; onChange: (time: string) => void }
>(({ value, onChange }, ref) => {
  const timeOptions: TimeOption[] = [];
  
  for (let i = 0; i < 24; i++) {
    const hour = i % 12 || 12;
    const period = i < 12 ? 'AM' : 'PM';
    const time = `${hour}:00 ${period}`;
    const value = `${i.toString().padStart(2, '0')}:00:00`;
    timeOptions.push({ label: time, value });
    
    const halfHourTime = `${hour}:30 ${period}`;
    const halfHourValue = `${i.toString().padStart(2, '0')}:30:00`;
    timeOptions.push({ label: halfHourTime, value: halfHourValue });
  }

  return (
    <Select 
      value={value} 
      onValueChange={onChange}
    >
      <SelectTrigger ref={ref} className="w-full">
        <SelectValue placeholder="Select time" />
      </SelectTrigger>
      <SelectContent>
        {timeOptions.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

TimeSelector.displayName = 'TimeSelector';

const SettingsComponent: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('09:00:00');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Locations')
        .select('*');
      
      if (error) throw error;
      
      setLocations(data || []);
      if (data && data.length > 0) {
        setSelectedLocation(data[0]);
        setSelectedTime(data[0].report_time);
      }
    } catch (error: any) {
      console.error('Error fetching locations:', error.message || error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportTimeUpdate = async () => {
    if (!selectedLocation) return;

    try {
      setIsUpdating(true);
      
      // Debug logging to help identify issues
      console.log('Updating report time for location:', selectedLocation.id);
      console.log('New time value:', selectedTime);
      
      const { data, error } = await supabase
        .from('Locations')
        .update({ report_time: selectedTime })
        .eq('id', selectedLocation.id);
      
      // Detailed error logging
      if (error) {
        console.error('Supabase error object:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        throw error;
      }
      
      console.log('Update successful:', data);
      
      // Update local state
      setLocations(locations.map(location => 
        location.id === selectedLocation.id 
          ? { ...location, report_time: selectedTime } 
          : location
      ));
      setSelectedLocation({ ...selectedLocation, report_time: selectedTime });
    } catch (error: any) {
      // More comprehensive error handling
      const errorMessage = error.message || 
                          (error.error?.message) || 
                          (typeof error === 'object' ? JSON.stringify(error) : 'Unknown error');
      
      console.error('Error updating report time:', error);
      console.error('Error details:', errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-full bg-background p-6">
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
                    <div className="space-y-1">
                      {locations.map((location) => (
                        <div
                          key={location.id}
                          onClick={() => {
                            setSelectedLocation(location);
                            setSelectedTime(location.report_time);
                          }}
                          className={`p-2 rounded-md cursor-pointer ${
                            selectedLocation?.id === location.id 
                              ? 'bg-secondary' 
                              : 'hover:bg-secondary/50'
                          }`}
                        >
                          {location.address}
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
                          <h3 className="font-medium text-foreground mb-2">Report Time:</h3>
                          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="flex-1">
                              <TimeSelector
                                value={selectedTime}
                                onChange={setSelectedTime}
                              />
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