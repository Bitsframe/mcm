import React, { useEffect, useState } from "react";
import { Custom_Modal } from "@/components/Modal_Components/Custom_Modal";
import { Searchable_Dropdown } from "@/components/Searchable_Dropdown";
import { Input_Component } from "@/components/Input_Component";
import { toast } from "react-toastify";
import { useLocationClinica } from "@/hooks/useLocationClinica";
import { useCategoriesClinica } from "@/hooks/useCategoriesClinica";
import { useProductsClinica } from "@/hooks/useProductsClinica";
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

    // Reset state when modal opens/closes
    useEffect(() => {
        if (open) {
            getCategoriesByLocationId(0)
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
        if (selectedCategory) getCategoriesByLocationId(selectedCategory);
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
            setTransferError('All fields are required.');
            return;
        }
        if (fromLocation === toLocation) {
            setTransferError('From and To locations must be different.');
            return;
        }
        const unitsVal = parseInt(units, 10);
        if (!unitsVal || unitsVal <= 0) {
            setTransferError('Units must be greater than 0.');
            return;
        }
        if (unitsVal > availableUnits) {
            setTransferError(`Cannot transfer more than available units (${availableUnits})`);
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
                toast.success('Units transferred successfully!');
                onClose();
                if (onTransferSuccess) onTransferSuccess();
            } else {
                setTransferError(response.data?.message || 'Transfer failed.');
            }
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                setTransferError(error.response?.data?.message || 'Transfer failed.');
            } else {
                setTransferError('Transfer failed.');
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
            Title="Transfer Units"
            loading={transferLoading}
            is_open={open}
            close_handle={onClose}
            create_new_handle={handleTransferSubmit}
            buttonLabel="Transfer"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Location</label>
                    <Searchable_Dropdown
                        label="From Location"
                        value={fromLocation}
                        options_arr={locations.map((loc: any) => ({ value: loc.id, label: loc.title }))}
                        on_change_handle={(e: any) => setFromLocation(Number(e.target.value))}
                        required={true}
                    />
                </div>
                <div className="">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Location</label>
                    <Searchable_Dropdown
                        label="To Location"
                        value={toLocation}
                        options_arr={locations.filter((loc: any) => loc.id !== fromLocation).map((loc: any) => ({ value: loc.id, label: loc.title }))}
                        on_change_handle={(e: any) => setToLocation(Number(e.target.value))}
                        required={true}
                    />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <Searchable_Dropdown
                        label="Category"
                        value={selectedCategory}
                        options_arr={categories.map((cat: any) => ({ value: cat.category_id, label: cat.category_name }))}
                        on_change_handle={(e: any) => selectedCategoryHandle(Number(e.target.value))}
                        required={true}
                    />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product</label>
                    <Searchable_Dropdown
                        label="Product"
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
                        label={`Units (Available: ${availableUnits})`}
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