import { useEffect, useState, useContext } from "react";
import { AuthContext, LocationContext } from '@/context';
import { fetchLocations, updateLocationData } from '@/utils/supabase/data_services/data_services';
import { toast } from 'react-toastify';

interface Location {
    id: number | string;
    title: string;
    address: string;
    phone: string;
    email: string;
    fax: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export function useLocationClinica({ defaultSetFirst = false }: { defaultSetFirst?: boolean } = {}) {
    const { setSelectedLocation } = useContext(LocationContext);
    const { allowedLocations, userRole } = useContext(AuthContext);

    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState<string | number>('');
    const [selectedLocationData, setSelectedLocationData] = useState<Location | null>(null);
    const [editedData, setEditedData] = useState<Location | null>(null);
    const [isEdited, setIsEdited] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);

    const setLocation = (id: string | number) => {
        setSelectedLocationId(id);
        const location = locations.find(loc => loc?.id === id) || null;
        setSelectedLocationData(location);
        setSelectedLocation(location);
        setEditedData(location);
    };

    const resetState = () => {
        setEditedData(selectedLocationData);
        setIsEdited(false);
    };

    const handleChange = (field: keyof Location, value: string) => {
        setIsEdited(true);
        setEditedData(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleUpdate = async () => {
        if (!editedData) return;
        setUpdateLoading(true);
        const updatedData = await updateLocationData(Number(editedData.id), editedData);
        if (updatedData?.length) {
            toast.success('Updated successfully');
            setSelectedLocationData(updatedData[0] as any);
            setIsEdited(false);
        }
        setUpdateLoading(false);
    };

    useEffect(() => {
        (async function loadLocations() {
            const data = await fetchLocations();
            console.log("USE EFFECT LOCATIONS ->", data);
    
            if (!data || data.length === 0) {
                console.warn("No locations fetched.");
                return;
            }
    
            const availableLocations =
                userRole === "super admin"
                    ? data
                    : data.filter((loc) => allowedLocations.includes(loc.id));
    
            setLocations(availableLocations as any);
    
            if (!selectedLocationId && availableLocations.length > 0) {
                setLocation(availableLocations[0]?.id);
            }
        })();
    }, [allowedLocations]);
    

    return {
        locations,
        selectedLocationId,
        selectedLocationData,
        editedData,
        isEdited,
        updateLoading,
        setLocation,
        resetState,
        handleChange,
        handleUpdate,
    };
}