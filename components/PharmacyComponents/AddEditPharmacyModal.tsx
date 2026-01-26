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
        opening_hours: "{}", // Default JSON string
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

    const handleSubmit = async () => {
        if (!formData.name || !formData.address || !formData.zipcode) {
            alert(t("Pharmacy_k26"));
            return;
        }

        // Ensure opening_hours is valid JSON if provided as string
        let parsedOpeningHours = formData.opening_hours;
        if (typeof formData.opening_hours === 'string') {
            try {
                parsedOpeningHours = JSON.parse(formData.opening_hours);
            } catch (e) {
                console.error("Invalid JSON for opening hours");
                parsedOpeningHours = {}; // Fallback
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


    return (
        <div>
            <Modal
                open={open}
                onClose={closeModalHandle}
                aria-labelledby="add-edit-pharmacy-modal-title"
                aria-describedby="add-edit-pharmacy-modal-description"
            >
                <div className="w-full h-full flex justify-center items-center px-4 bg-black bg-opacity-30">
                    <div className="bg-white rounded-2xl px-6 py-6 w-full dark:bg-[#0e1725] max-w-[500px] shadow-lg ">
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
                            <Input_Component
                                value={formData.name}
                                placeholder={t("Pharmacy_k19")}
                                border="border border-gray-200 rounded-lg dark:border-none"
                                onChange={(value) => handleInputChange("name", value)}
                                bg_color=" dark:bg-[#122136] bg-[#f1f4f9]"
                            />

                            <Input_Component
                                value={formData.address}
                                placeholder={t("Pharmacy_k6")}
                                border="border border-gray-200 rounded-lg dark:border-none"
                                onChange={(value) => handleInputChange("address", value)}
                                bg_color=" dark:bg-[#122136] bg-[#f1f4f9]"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input_Component
                                    value={formData.zipcode}
                                    placeholder={t("Pharmacy_k20")}
                                    border="border border-gray-200 rounded-lg dark:border-none"
                                    onChange={(value) => handleInputChange("zipcode", value)}
                                    bg_color=" dark:bg-[#122136] bg-[#f1f4f9]"
                                />
                                <Input_Component
                                    value={formData.phone || ""}
                                    placeholder={t("Pharmacy_k7")}
                                    border="border border-gray-200 rounded-lg dark:border-none"
                                    onChange={(value) => handleInputChange("phone", value)}
                                    bg_color=" dark:bg-[#122136] bg-[#f1f4f9]"
                                />
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg bg-[#f1f4f9] dark:bg-[#122136]">
                                <span className="text-sm text-gray-700 dark:text-gray-300">{t("Pharmacy_k8")}</span>
                                <Switch
                                    checked={formData.delivers}
                                    onChange={(checked) => handleInputChange("delivers", checked)}
                                />
                            </div>


                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={handleClose}
                                    className="px-5 py-2 rounded-md bg-gray-100 dark:bg-[#122136] dark:text-white text-gray-700 hover:bg-gray-200"
                                >
                                    {t("Pharmacy_k21")}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-5 py-2 rounded-md bg-[#0066ff] text-white hover:opacity-90 disabled:bg-gray-400"
                                >
                                    {editData
                                        ? loading
                                            ? t("Pharmacy_k23")
                                            : t("Pharmacy_k22")
                                        : loading
                                            ? t("Pharmacy_k25")
                                            : t("Pharmacy_k24")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
