import React, { useEffect, useState, useRef } from "react";
import Modal from "@mui/material/Modal";
import { Input_Component } from "../Input_Component";
import { CreatePharmacyData, Pharmacy } from "@/types/pharmacy";
import { useTranslation } from "react-i18next";
import { Switch } from "antd";
import { translationConstant } from "@/utils/translationConstants";
import { extractStateAndZipcode } from "@/utils/addressParser";

interface PropsInterface {
    open: boolean;
    handleClose: () => void;
    submitHandle: (data: CreatePharmacyData) => Promise<void>;
    loading: boolean;
    editData: Pharmacy | null;
}

export default function AddEditPharmacyModal({
    open,
    handleClose,
    submitHandle,
    loading,
    editData,
}: PropsInterface) {
    const [formData, setFormData] = useState<CreatePharmacyData>({
        name: "",
        address: "",
        state: "",
        zip_code: "",
        phone_number: "",
        delivers: false,
        is_active: true,
        opening_hours: "{}",
    });

    const [smartyEnabled, setSmartyEnabled] = useState<boolean | null>(null);
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const lastSelectedAddressRef = useRef<string>('');
    const [apiCheckResult, setApiCheckResult] = useState<any>(null);
    const [isCheckingApi, setIsCheckingApi] = useState(false);
    const smartyCheckInitiatedRef = useRef(false);

    const { t } = useTranslation(translationConstant.PHARMACY);

    // Check Smarty API status only when needed
    const checkSmartyStatus = async () => {
        if (smartyCheckInitiatedRef.current) return;
        smartyCheckInitiatedRef.current = true;
        
        try {
            const res = await fetch('/api/address/status');
            const data = await res.json();
            setSmartyEnabled(data.enabled);
        } catch (err) {
            console.error('Failed to check Smarty status:', err);
            setSmartyEnabled(false);
        }
    };

    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name,
                address: editData.address,
                city: editData.city || "",
                state: (editData as any).state || "",
                zip_code: editData.zip_code,
                phone_number: editData.phone_number || "",
                delivers: editData.delivers,
                is_active: editData.is_active,
                opening_hours: JSON.stringify(editData.opening_hours || {}),
            });
        } else {
            setFormData({
                name: "",
                address: "",
                city: "",
                state: "",
                zip_code: "",
                phone_number: "",
                delivers: false,
                is_active: true,
                opening_hours: "{}",
            });
        }
    }, [editData]);

    const handleInputChange = (
        field: keyof CreatePharmacyData,
        value: string | boolean
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle address field focus - check Smarty status only when user focuses on address
    const handleAddressFocus = () => {
        if (smartyEnabled === null) {
            checkSmartyStatus();
        }
    };

    // Handle address change with autocomplete
    const handleAddressChange = async (value: string) => {
        handleInputChange("address", value);
        
        // Don't fetch if this is the address we just selected
        if (value === lastSelectedAddressRef.current) {
            return;
        }
        
        // Reset the ref if user starts typing again
        if (value !== lastSelectedAddressRef.current) {
            lastSelectedAddressRef.current = '';
        }
        
        // Only fetch suggestions if Smarty is enabled and input is long enough
        if (!smartyEnabled || value.length < 4) {
            setAddressSuggestions([]);
            return;
        }

        setIsLoadingSuggestions(true);
        
        try {
            const response = await fetch(`/api/address?search=${encodeURIComponent(value)}`);
            const data = await response.json();
            
            if (data.suggestions) {
                setAddressSuggestions(data.suggestions);
            } else {
                setAddressSuggestions([]);
            }
        } catch (error) {
            console.error('Error fetching address suggestions:', error);
            setAddressSuggestions([]);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    // Handle suggestion selection
    const handleSuggestionClick = (suggestion: any) => {
        const fullAddress = `${suggestion.street_line}${suggestion.secondary ? ' ' + suggestion.secondary : ''}, ${suggestion.city}, ${suggestion.state} ${suggestion.zipcode}`;
        
        // Store the selected address to prevent re-triggering API
        lastSelectedAddressRef.current = fullAddress;
        
        handleInputChange("address", fullAddress);
        setAddressSuggestions([]);
    };

    // Helper to format phone as 213-555-0123 for display
    const formatPhoneDisplay = (phone_number: string = ""): string => {
        let digits = phone_number.replace(/^\+?1/, "").replace(/[^0-9]/g, "").slice(0, 10);
        if (!digits) return "";
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    };


    const handleSubmit = async () => {
        if (!formData.name || !formData.address) {
            alert(t("Pharmacy_k26"));
            return;
        }

        // If editing, skip the duplicate check and just submit
        if (editData) {
            let parsedOpeningHours = formData.opening_hours;
            if (typeof formData.opening_hours === 'string') {
                try {
                    parsedOpeningHours = JSON.parse(formData.opening_hours);
                } catch (e) {
                    console.error("Invalid JSON for opening hours");
                    parsedOpeningHours = {};
                }
            }

            // Extract city, state and zipcode for update
            const { city, state, zipcode } = extractStateAndZipcode(formData.address);
            
            await submitHandle({ 
                ...formData,
                city: city || formData.city || undefined,
                state: state || formData.state,
                zip_code: zipcode || formData.zip_code,
                opening_hours: parsedOpeningHours,
            });
            return;
        }

        // For new pharmacy, extract city, state and zipcode from the address
        const { city, state, zipcode, cleanAddress } = extractStateAndZipcode(formData.address);
        
        console.log('📍 Extracted from address:', { 
            originalAddress: formData.address,
            cleanAddress: cleanAddress,
            extractedCity: city,
            extractedState: state, 
            extractedZipcode: zipcode 
        });

        // Check pharmacy via API first
        setIsCheckingApi(true);
        setApiCheckResult(null);

        try {
            console.log('🔍 Calling pharmacy check API with:', {
                name: formData.name,
                phoneNumber: formData.phone_number || '',
                address: {
                    streetAddress: cleanAddress,
                    zipcode: zipcode || '',
                    state: state || ''
                }
            });

            const response = await fetch('/api/pharmacy-check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    phoneNumber: formData.phone_number || '',
                    address: {
                        streetAddress: cleanAddress,
                        zipcode: zipcode || '',
                        state: state || ''
                    }
                })
            });

            const result = await response.json();
            console.log('✅ Pharmacy check result:', result);
            
            setIsCheckingApi(false);

            // If match found, show warning and prevent submission
            if (result.success && result.matchFound) {
                setApiCheckResult(result);
                return; // Stop here - don't submit to database
            }

            // No match found or error - proceed to add to database
            console.log('✅ No match found, proceeding to add pharmacy to database');
            
            let parsedOpeningHours = formData.opening_hours;
            if (typeof formData.opening_hours === 'string') {
                try {
                    parsedOpeningHours = JSON.parse(formData.opening_hours);
                } catch (e) {
                    console.error("Invalid JSON for opening hours");
                    parsedOpeningHours = {};
                }
            }

            // Submit to database with extracted city, state and zip_code
            await submitHandle({ 
                ...formData, 
                city: city || undefined,
                state: state || formData.state,
                zip_code: zipcode || formData.zip_code,
                opening_hours: parsedOpeningHours,
                is_active: true // Ensure is_active is true
            });

        } catch (error: any) {
            console.error('❌ Error checking pharmacy:', error);
            setIsCheckingApi(false);
            
            // On error, still try to add to database (fail-safe)
            console.log('⚠️ API check failed, proceeding to add pharmacy anyway');
            
            let parsedOpeningHours = formData.opening_hours;
            if (typeof formData.opening_hours === 'string') {
                try {
                    parsedOpeningHours = JSON.parse(formData.opening_hours);
                } catch (e) {
                    console.error("Invalid JSON for opening hours");
                    parsedOpeningHours = {};
                }
            }

            const { city, state, zipcode } = extractStateAndZipcode(formData.address);
            await submitHandle({ 
                ...formData, 
                city: city || undefined,
                state: state || formData.state,
                zip_code: zipcode || formData.zip_code,
                opening_hours: parsedOpeningHours,
                is_active: true
            });
        }
    };

    const closeModalHandle = () => {
        setFormData({
            name: "",
            address: "",
            city: "",
            state: "",
            zip_code: "",
            phone_number: "",
            delivers: false,
            is_active: true,
            opening_hours: "{}",
        });
        setApiCheckResult(null);
        setAddressSuggestions([]);
        lastSelectedAddressRef.current = '';
        handleClose();
    };

    const labelStyle = "text-sm font-medium mb-1.5 block text-gray-700 dark:text-gray-300";

    return (
        <div>
            <Modal
                open={open}
                onClose={closeModalHandle}
                aria-labelledby="add-edit-pharmacy-modal-title"
            >
                <div className="w-full h-full flex justify-center items-center px-4 bg-black bg-opacity-30">
                    <div className="bg-white rounded-2xl px-6 py-6 w-full dark:bg-[#0e1725] max-w-[500px] shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h2
                                id="add-edit-pharmacy-modal-title"
                                className="text-lg font-semibold dark:text-white text-gray-900"
                            >
                                {editData ? t("Pharmacy_k18") : t("Pharmacy_k4")}
                            </h2>
                            <button
                                onClick={closeModalHandle}
                                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {/* Pharmacy Name */}
                            <div>
                                <label className={labelStyle}>{t("Pharmacy_k34")}</label>
                                <Input_Component
                                    value={formData.name}
                                    placeholder={t("Pharmacy_k19")}
                                    border="border border-gray-200 rounded-lg dark:border-none"
                                    onChange={(value) => handleInputChange("name", value)}
                                    bg_color=" dark:bg-[#122136] bg-[#f1f4f9]"
                                />
                            </div>

                            {/* Street Address */}
                            {/* Street Address with Autocomplete */}
                            <div className="relative">
                                <label className={labelStyle}>{t("Pharmacy_k35")}</label>
                                <div className="relative" onFocus={handleAddressFocus}>
                                    <Input_Component
                                        value={formData.address}
                                        placeholder={t("Pharmacy_k6")}
                                        border="border border-gray-200 rounded-lg dark:border-none"
                                        onChange={handleAddressChange}
                                        bg_color=" dark:bg-[#122136] bg-[#f1f4f9]"
                                    />
                                    {isLoadingSuggestions && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Address Suggestions Dropdown */}
                                {addressSuggestions.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#122136] border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {addressSuggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="p-3 hover:bg-gray-100 dark:hover:bg-[#1a2942] cursor-pointer border-b dark:border-gray-700 last:border-b-0 transition-colors"
                                            >
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    {suggestion.street_line}
                                                    {suggestion.secondary && <span className="text-gray-600 dark:text-gray-400"> {suggestion.secondary}</span>}
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {suggestion.city}, {suggestion.state} {suggestion.zipcode}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className={labelStyle}>{t("Pharmacy_k36")}</label>
                                <div className="relative w-full">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 select-none">+1</span>
                                    <input
                                        type="text"
                                        className="w-full h-[45px] p-3 rounded-lg dark:bg-[#122136] bg-[#f1f4f9] pl-10 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-gray-200 dark:border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        maxLength={12}
                                        value={formatPhoneDisplay(formData.phone_number)}
                                        onChange={e => {
                                            let val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                                            handleInputChange("phone_number", val ? `+1${val}` : "");
                                        }}
                                        placeholder="213-555-0123"
                                    />
                                </div>
                            </div>

                            {/* Delivery Switch */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-[#f1f4f9] dark:bg-[#122136] mt-2 border border-gray-100 dark:border-none">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t("Pharmacy_k37")}
                                </span>
                                <Switch
                                    checked={!!formData.is_active}
                                    onChange={(checked) => handleInputChange("is_active", checked)}
                                />
                            </div>

                            {/* API Check Result Display - Only show if match found */}
                            {isCheckingApi && (
                                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                        <span className="text-sm text-blue-700 dark:text-blue-300">Searching for pharmacy...</span>
                                    </div>
                                </div>
                            )}

                            {/* Only show warning if match was found */}
                            {apiCheckResult && !isCheckingApi && apiCheckResult.success && apiCheckResult.matchFound && (
                                <div className="mt-4 p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700">
                                    <div className="space-y-3">
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">⚠️</span>
                                                <span className="font-semibold text-yellow-800 dark:text-yellow-300">
                                                    This pharmacy already exists
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setApiCheckResult(null)}
                                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {/* Matching Pharmacy Details */}
                                        {apiCheckResult.data && apiCheckResult.data.length > 0 && (
                                            <div className="space-y-2">
                                                {apiCheckResult.data.map((pharmacy: any, index: number) => (
                                                    <div key={index} className="bg-white dark:bg-gray-800/50 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800/50">
                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                            <div>
                                                                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                                                                <p className="font-medium text-gray-900 dark:text-white">{pharmacy.name}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                                                                <p className="font-medium text-gray-900 dark:text-white">{pharmacy.phone_number || 'N/A'}</p>
                                                            </div>
                                                            <div className="col-span-2">
                                                                <span className="text-gray-600 dark:text-gray-400">Address:</span>
                                                                <p className="font-medium text-gray-900 dark:text-white">{pharmacy.address}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600 dark:text-gray-400">City:</span>
                                                                <p className="font-medium text-gray-900 dark:text-white">{pharmacy.city || 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600 dark:text-gray-400">State:</span>
                                                                <p className="font-medium text-gray-900 dark:text-white">{pharmacy.state || 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600 dark:text-gray-400">Zipcode:</span>
                                                                <p className="font-medium text-gray-900 dark:text-white">{pharmacy.zip_code || 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                                                <p className="font-medium text-gray-900 dark:text-white">
                                                                    {pharmacy.is_active ? '✓ Active' : '✗ Inactive'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModalHandle}
                                    className="px-5 py-2 rounded-md bg-gray-100 dark:bg-[#122136] dark:text-white text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                    {t("Pharmacy_k21")}
                                </button>
                                {/* Hide Add button if a match was found */}
                                {!(apiCheckResult?.success && apiCheckResult?.matchFound) && (
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="px-5 py-2 rounded-md bg-[#0066ff] text-white hover:opacity-90 disabled:bg-gray-400 transition-opacity"
                                    >
                                        {editData
                                            ? loading ? t("Pharmacy_k23") : t("Pharmacy_k22")
                                            : loading ? t("Pharmacy_k25") : t("Pharmacy_k24")}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}