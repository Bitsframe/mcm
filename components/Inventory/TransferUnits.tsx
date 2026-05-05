import React, { useEffect, useState, useRef } from "react";
import { Custom_Modal } from "@/components/Modal_Components/Custom_Modal";
import { Searchable_Dropdown } from "@/components/Searchable_Dropdown";
import { Input_Component } from "@/components/Input_Component";
import { toast } from "react-toastify";
import { useLocationClinica } from "@/hooks/useLocationClinica";
import { useCategoriesClinica } from "@/hooks/useCategoriesClinica";
import { useProductsClinica } from "@/hooks/useProductsClinica";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import axios from "axios";

interface TransferUnitsProps {
    open: boolean;
    onClose: () => void;
    onTransferSuccess?: () => void;
}

export const TransferUnits: React.FC<TransferUnitsProps> = ({
    open,
    onClose,
    onTransferSuccess,
}) => {
    const { t } = useTranslation(translationConstant.INVENTORY);
    const { locations } = useLocationClinica();


    const [selectedCategory, setSelectedCategory] = useState<number>(0);
    const [selectedProduct, setSelectedProduct] = useState<number>(0);
    const [units, setUnits] = useState('');
    const [fromLocation, setFromLocation] = useState<number>(0);
    const [toLocation, setToLocation] = useState<number>(0);
    const [transferLoading, setTransferLoading] = useState(false);
    const [transferError, setTransferError] = useState('');
    const [availableUnits, setAvailableUnits] = useState(0);


    const { categories } = useCategoriesClinica(true, fromLocation);

    const {
        products,
        getCategoriesByLocationId,
        loadingProducts,
    } = useProductsClinica(fromLocation);

    // Keep a stable ref to the categories fetcher so effects don't re-run
    // when the function identity changes between renders.
    const getCategoriesRef = useRef(getCategoriesByLocationId);
    useEffect(() => {
        getCategoriesRef.current = getCategoriesByLocationId;
    }, [getCategoriesByLocationId]);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (open) {
            // call via ref to avoid effect re-running when the function identity changes
            try { getCategoriesRef.current?.(0); } catch (e) {}
            setFromLocation(0)
            setSelectedCategory(0);
            setSelectedProduct(0);
            setUnits('');
            setToLocation(0);
            setTransferError('');
        }
    }, [open]);

    // When location changes, reset category, product, and toLocation
    useEffect(() => {
        setSelectedCategory(0);
        setSelectedProduct(0);
        setUnits('');
        setToLocation(0);
        setTransferError('');
    }, [fromLocation]);

    // When category changes, reset product and units
    useEffect(() => {
        setSelectedProduct(0);
        setUnits('');
        setTransferError('');
        if (selectedCategory) {
            try { getCategoriesRef.current?.(selectedCategory); } catch (e) {}
        }
    }, [selectedCategory]);

    // When product changes, update available units
    useEffect(() => {
        if (selectedProduct) {
            const prod = products.find((p: any) => p.main_product_id === selectedProduct);
            setAvailableUnits(prod ? prod.quantity_available : 0);
        } else {
            setAvailableUnits(0);
        }
    }, [selectedProduct, products]);

    const handleTransferSubmit = async () => {
        if (!fromLocation || !toLocation || !selectedCategory || !selectedProduct) {
            setTransferError(t('Inventory_k55'));
            return;
        }
        if (fromLocation === toLocation) {
            setTransferError(t('Inventory_k56'));
            return;
        }
        const unitsVal = parseInt(units, 10);
        if (!unitsVal || unitsVal <= 0) {
            setTransferError(t('Inventory_k57'));
            return;
        }
        if (unitsVal > availableUnits) {
            setTransferError(`${t('Inventory_k58')} (${availableUnits})`);
            return;
        }
        setTransferLoading(true);
        setTransferError('');
        try {
            const response = await axios.post('/api/inventory/transfer', {
                from_location_id: fromLocation,
                to_location_id: toLocation,
                product_id: selectedProduct,
                units: unitsVal,
            });
            if (response.data && response.data.success) {
                toast.success(t('Inventory_k59'));
                onClose();
                if (onTransferSuccess) onTransferSuccess();
            } else {
                setTransferError(response.data?.message || t('Inventory_k60'));
            }
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                setTransferError(error.response?.data?.message || t('Inventory_k60'));
            } else {
                setTransferError(t('Inventory_k60'));
            }
        } finally {
            setTransferLoading(false);
        }
    };

    const selectedCategoryHandle = (cat_id: number) => {
        setSelectedCategory(cat_id);
        getCategoriesByLocationId(cat_id);
    }


    return (
        <Custom_Modal
            open_handle={() => { }}
            Title={t("Inventory_k49")}
            loading={transferLoading}
            is_open={open}
            close_handle={onClose}
            create_new_handle={handleTransferSubmit}
            buttonLabel={t("Inventory_k44")}
            Trigger_Button={null}
            disabled={
                transferLoading ||
                !fromLocation ||
                !toLocation ||
                !selectedCategory ||
                !selectedProduct ||
                !units ||
                parseInt(units, 10) > availableUnits ||
                fromLocation === toLocation
            }
        >
            <div className="w-full grid grid-cols-2 gap-4 dark:bg-[#0e1725]">
                <div className="">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("Inventory_k50")}</label>
                    <Searchable_Dropdown
                        label={t("Inventory_k50")}
                        value={fromLocation}
                        options_arr={locations.map((loc: any) => ({ value: loc.id, label: loc.title }))}
                        on_change_handle={(e: any) => setFromLocation(Number(e.target.value))}
                        required={true}
                    />
                </div>
                <div className="">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("Inventory_k51")}</label>
                    <Searchable_Dropdown
                        label={t("Inventory_k51")}
                        value={toLocation}
                        options_arr={locations.filter((loc: any) => loc.id !== fromLocation).map((loc: any) => ({ value: loc.id, label: loc.title }))}
                        on_change_handle={(e: any) => setToLocation(Number(e.target.value))}
                        required={true}
                    />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("Inventory_k32")}</label>
                    <Searchable_Dropdown
                        label={t("Inventory_k32")}
                        value={selectedCategory}
                        options_arr={categories.map((cat: any) => ({ value: cat.category_id, label: cat.category_name }))}
                        on_change_handle={(e: any) => selectedCategoryHandle(Number(e.target.value))}
                        required={true}
                    />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("Inventory_k52")}</label>
                    <Searchable_Dropdown
                        label={t("Inventory_k52")}
                        value={selectedProduct}
                        options_arr={products.filter((prod: any) => !prod.unlimited).map((prod: any) => ({ value: prod.main_product_id, label: prod.product_name }))}
                        on_change_handle={(e: any) => setSelectedProduct(Number(e.target.value))}
                        required={true}
                        disabled={!selectedCategory}
                    />
                </div>
                <div className="col-span-2">
                    <Input_Component
                        type="number"
                        value={units}
                        onChange={setUnits}
                        border="border-[1px] border-gray-300 rounded-md dark:border-none"
                        label={`${t("Inventory_k53")} (${t("Inventory_k54")}: ${availableUnits})`}
                        bg_color="bg-[#f1f4f9] dark:bg-[#122136]"
                        disabled={!selectedProduct}
                    />
                </div>
                {transferError && (
                    <div className="col-span-2 text-red-500 text-sm">{transferError}</div>
                )}
            </div>
        </Custom_Modal>
    );
}; 