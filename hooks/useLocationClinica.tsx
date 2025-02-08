const { useEffect, useState } = require("react");
import { AuthContext, LocationContext } from '@/context';
import { fetchLocations, updateLocationData } from '@/utils/supabase/data_services/data_services'
import { useContext } from 'react';
import { toast } from 'react-toastify';

const LOCAL_STORAGE_KEY = "@location";


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




    const set_location_handle = (value: any) => {
        setSelected_location(value);


        const data = locations.find((item: { id: number | string; }) => item.id == value)
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
        const res_data = await updateLocationData(change_data.id, change_data);
        if (res_data?.length) {
            toast.success('Updated successfully');
        }
        // console.log(res_data);
        setSelected_location_data(() => res_data[0]);
        set_update_loading(false);
        set_is_edited(false);
    };


    useEffect(() => {
        !(async function fetch_data() {
            const data = await fetchLocations()

            const locationRecord = localStorage.getItem(LOCAL_STORAGE_KEY);


            if (data.length) {
                let findLocation: any = data[0]

                const filterLocations = userRole === 'super admin' ? data : data.filter((loc) => allowedLocations.includes(loc.id))

                setLocations(filterLocations);

                if (locationRecord) {
                    findLocation = filterLocations.find((item: { id: number | string }) => item.id == +locationRecord);

                    if (!locationRecord) {
                        findLocation = filterLocations[0]
                        localStorage.setItem(LOCAL_STORAGE_KEY, findLocation?.id.toLocaleString())
                    }
                }
                else {
                    localStorage.setItem(LOCAL_STORAGE_KEY, findLocation?.id.toLocaleString())
                }
                setSelected_location(findLocation?.id);
                setSelected_location_data(findLocation)
                setSelectedLocation(findLocation)
                setChange_data(findLocation)
            }
        })()

    }, []);



    return { locations, set_location_handle, selected_location_data, change_data, selected_location, reset_state, on_change_handle, is_edited, update_loading, handle_update }



}