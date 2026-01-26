"use client";

import React, { useEffect, useState } from "react";
import Modal from "@mui/material/Modal";
import { Input_Component } from "../Input_Component";
import { CreatePharmacyData, Pharmacy } from "@/types/pharmacy";
import { useTranslation } from "react-i18next";
import { Switch } from "antd";
import { translationConstant } from "@/utils/translationConstants";

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
        zipcode: "",
        phone: "",
        delivers: false,
        opening_hours: "{}",
    });

    const { t } = useTranslation(translationConstant.PHARMACY);

    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name,
                address: editData.address,
                zipcode: editData.zipcode,
                phone: editData.phone || "",
                delivers: editData.delivers,
                opening_hours: JSON.stringify(editData.opening_hours || {}),
            });
        } else {
            setFormData({
                name: "",
                address: "",
                zipcode: "",
                phone: "",
                delivers: false,
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

    // Helper to format phone as 213-555-0123 for display
    const formatPhoneDisplay = (phone: string = ""): string => {
        let digits = phone.replace(/^\+?1/, "").replace(/[^0-9]/g, "").slice(0, 10);
        if (!digits) return "";
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.address || !formData.zipcode) {
            alert(t("Pharmacy_k26"));
            return;
        }

        let parsedOpeningHours = formData.opening_hours;
        if (typeof formData.opening_hours === 'string') {
            try {
                parsedOpeningHours = JSON.parse(formData.opening_hours);
            } catch (e) {
                console.error("Invalid JSON for opening hours");
                parsedOpeningHours = {};
            }
        }

        await submitHandle({ ...formData, opening_hours: parsedOpeningHours });
    };

    const closeModalHandle = () => {
        setFormData({
            name: "",
            address: "",
            zipcode: "",
            phone: "",
            delivers: false,
            opening_hours: "{}",
        });
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
                                <label className={labelStyle}>Pharmacy Name</label>
                                <Input_Component
                                    value={formData.name}
                                    placeholder={t("Pharmacy_k19")}
                                    border="border border-gray-200 rounded-lg dark:border-none"
                                    onChange={(value) => handleInputChange("name", value)}
                                    bg_color=" dark:bg-[#122136] bg-[#f1f4f9]"
                                />
                            </div>

                            {/* Street Address */}
                            <div>
                                <label className={labelStyle}>Street Address</label>
                                <Input_Component
                                    value={formData.address}
                                    placeholder={t("Pharmacy_k6")}
                                    border="border border-gray-200 rounded-lg dark:border-none"
                                    onChange={(value) => handleInputChange("address", value)}
                                    bg_color=" dark:bg-[#122136] bg-[#f1f4f9]"
                                />
                            </div>

                            {/* Zipcode and Phone */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelStyle}>Zipcode</label>
                                    <Input_Component
                                        value={formData.zipcode}
                                        placeholder={t("Pharmacy_k20")}
                                        border="border border-gray-200 rounded-lg dark:border-none"
                                        onChange={(value) => handleInputChange("zipcode", value)}
                                        bg_color=" dark:bg-[#122136] bg-[#f1f4f9]"
                                    />
                                </div>
                                <div>
                                    <label className={labelStyle}>Phone Number</label>
                                    <div className="relative w-full">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 select-none">+1</span>
                                        <input
                                            type="text"
                                            className="w-full h-[45px] p-3 rounded-lg dark:bg-[#122136] bg-[#f1f4f9] pl-10 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border border-gray-200 dark:border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            maxLength={12}
                                            value={formatPhoneDisplay(formData.phone)}
                                            onChange={e => {
                                                let val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                                                handleInputChange("phone", val ? `+1${val}` : "");
                                            }}
                                            placeholder="213-555-0123"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Switch */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-[#f1f4f9] dark:bg-[#122136] mt-2 border border-gray-100 dark:border-none">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Open
                                </span>
                                <Switch
                                    checked={formData.delivers}
                                    onChange={(checked) => handleInputChange("delivers", checked)}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModalHandle}
                                    className="px-5 py-2 rounded-md bg-gray-100 dark:bg-[#122136] dark:text-white text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                    {t("Pharmacy_k21")}
                                </button>
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
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}