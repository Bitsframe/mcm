import { useEffect, useState } from "react";
import { AuthContext, LocationContext } from '@/context';
import { fetchLocations, updateLocationData } from '@/utils/supabase/data_services/data_services'
import { useContext } from 'react';
import { toast } from 'react-toastify';
//@ts-ignore
import { Location } from '@/types/Location';

// Make the storage key user-specific
const getStorageKey = (userId: string) => `@location_${userId}`;

interface UseLocationClinicaParams {
  defaultSetFirst?: boolean;
}

interface UseLocationClinicaReturn {
  locations: Location[];
  set_location_handle: (value: number) => void;
  selected_location_data: Location | null;
  change_data: Location | null;
  selected_location: number;
  reset_state: () => void;
  on_change_handle: (field: string, val: string) => void;
  is_edited: boolean;
  update_loading: boolean;
  handle_update: () => Promise<void>;
}

export function useLocationClinica(params: UseLocationClinicaParams = {}): UseLocationClinicaReturn {
  const { defaultSetFirst = false } = params;

  const { selectedLocation, setSelectedLocation } = useContext(LocationContext);
  const { allowedLocations, userRole, userProfile } = useContext(AuthContext);

  const [locations, setLocations] = useState<Location[]>([]);
  const [selected_location, setSelected_location] = useState<number>(0);
  const [selected_location_data, setSelected_location_data] = useState<Location | null>(null);
  const [change_data, setChange_data] = useState<Location | null>(null);
  const [is_edited, set_is_edited] = useState<boolean>(false);
  const [update_loading, set_update_loading] = useState<boolean>(false);

  const set_location_handle = (value: number) => {
    setSelected_location(value);
    const data = locations.find((item: Location) => item.id === value);
    if (data && userProfile?.id) {
      // Use user-specific storage key
      localStorage.setItem(getStorageKey(userProfile.id), value.toString());
      setSelected_location_data(data);
      setSelectedLocation(data);
      setChange_data(data);
    }
  };

  const reset_state = () => {
    setChange_data(selected_location_data);
  };

  const on_change_handle = (field: string, val: string) => {
    set_is_edited(true);
    setChange_data((prev: Location | null) => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: val
      };
    });
  };

  const handle_update = async () => {
    if (!change_data) return;
    set_update_loading(true);
    const res_data = await updateLocationData(change_data.id, change_data);
    if (res_data?.length) {
      toast.success('Updated successfully');
    }
    setSelected_location_data(res_data[0]);
    set_update_loading(false);
    set_is_edited(false);
  };

  useEffect(() => {
    const fetch_data = async () => {
      if (!userProfile?.id) return; // Don't proceed if no user is logged in

      const data = await fetchLocations();
      // Use user-specific storage key
      const locationRecord = localStorage.getItem(getStorageKey(userProfile.id));

      if (data.length) {
        let findLocation = data[0];
        // Only filter locations if user is not a super admin
        const filterLocations = userRole === 'super admin' ? data : data.filter((loc: Location) => allowedLocations.includes(loc.id));
        setLocations(filterLocations);

        if (locationRecord) {
          // Try to find the location from the record
          const foundLocation = filterLocations.find((item: Location) => item.id === +locationRecord);
          findLocation = foundLocation || filterLocations[0];
          // If not found or not in allowed locations, use first allowed location
          if (!findLocation || (userRole !== 'super admin' && !allowedLocations.includes(findLocation.id))) {
            findLocation = filterLocations[0];
            localStorage.setItem(getStorageKey(userProfile.id), findLocation.id.toString());
          }
        } else {
          // If no record exists, use first allowed location
          findLocation = filterLocations[0];
          localStorage.setItem(getStorageKey(userProfile.id), findLocation.id.toString());
        }
        setSelected_location(findLocation.id);
        setSelected_location_data(findLocation);
        setSelectedLocation(findLocation);
        setChange_data(findLocation);
      }
    };

    fetch_data();
  }, [allowedLocations, userRole, userProfile?.id]);

  return {
    locations,
    set_location_handle,
    selected_location_data,
    change_data,
    selected_location,
    reset_state,
    on_change_handle,
    is_edited,
    update_loading,
    handle_update
  };
}