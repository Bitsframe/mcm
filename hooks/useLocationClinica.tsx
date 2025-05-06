const { useEffect, useState } = require("react");
import { AuthContext, LocationContext } from '@/context';
import { fetchLocations, updateLocationData } from '@/utils/supabase/data_services/data_services'
import { useContext } from 'react';
import { toast } from 'react-toastify';

const LOCAL_STORAGE_KEY = "@location";

const FULL_ACCESS_ROLES = ['super admin', 'admin', 'supervisor'];

export function useLocationClinica(params: { defaultSetFirst?: boolean } = {}) {
    const { defaultSetFirst = false } = params
    const { selectedLocation, setSelectedLocation } = useContext(LocationContext);
    const { allowedLocations, userRole } = useContext(AuthContext);
    const [locations, setLocations] = useState([])
    const [selected_location, setSelected_location] = useState('')
    const [selected_location_data, setSelected_location_data] = useState(null)
    const [change_data, setChange_data] = useState(null)
    const [is_edited, set_is_edited] = useState(false);
    const [update_loading, set_update_loading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const allLocations = await fetchLocations();

                
                // Check if user has full access
                const hasFullAccess = FULL_ACCESS_ROLES.includes(userRole?.toLowerCase());
                
                // If user has full access, show all locations
                // Otherwise, filter based on allowedLocations
                const filteredLocations = hasFullAccess 
                    ? allLocations 
                    : allLocations.filter((location: any) => 
                        allowedLocations.includes(location.id)
                    );

                setLocations(filteredLocations);

                // If defaultSetFirst is true and we have locations, set the first one as selected
                if (defaultSetFirst && filteredLocations.length > 0) {
                    const firstLocation = filteredLocations[0];
                    setSelected_location(firstLocation.id.toString());
                    setSelected_location_data(firstLocation);
                    setSelectedLocation(firstLocation);
                    setChange_data(firstLocation);
                    localStorage.setItem(LOCAL_STORAGE_KEY, firstLocation.id.toString());
                }
            } catch (error) {
                console.error('Error fetching locations:', error);
                toast.error('Failed to fetch locations');
            }
        };

        fetchData();
    }, [allowedLocations, userRole, defaultSetFirst]);

    const set_location_handle = (value: any) => {
        setSelected_location(value);

        const data: any = locations.find((item: { id: number | string; }) => item.id == value)
        localStorage.setItem(LOCAL_STORAGE_KEY, value.toLocaleString())
        setSelected_location_data(data)
        setSelectedLocation(data)
        setChange_data(data)
    };

    const reset_state = () => {
        setChange_data(selected_location_data)
    }

    const on_change_handle = (field: string, val: string) => {
        set_is_edited(true);
        setChange_data((prev: any) => ({
            ...prev,
            [field]: val
        }));
    };

    const handle_update = async () => {
        set_update_loading(true);
        if (change_data) {
            const res_data = await updateLocationData(change_data.id, change_data);
            if (res_data?.length) {
                toast.success('Updated successfully');
            }
            setSelected_location_data(() => res_data[0]);
        }

        setSelected_location_data(() => res_data[0]);
        set_update_loading(false);
        set_is_edited(false);
    };

    return {
        locations,
        selected_location,
        selected_location_data,
        change_data,
        is_edited,
        update_loading,
        set_location_handle,
        reset_state,
        on_change_handle,
        set_update_loading,
        handle_update
    };
}