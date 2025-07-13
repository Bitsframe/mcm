"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "flowbite-react";
import { fetch_content_service } from "@/utils/supabase/data_services/data_services";
import { useLocationClinica } from "@/hooks/useLocationClinica";
import { toast } from "sonner";

interface SplitToLocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedProduct: any;
    selectedCategory: any;
    onAddToCart: (product: any, location: any, quantity: number) => void;
    currentLocationId: number;
}

interface LocationProduct {
    location_id: number;
    location_name: string;
    quantity_available: number;
    product_id: number;
    product_name: string;
    price: number;
    category_id: number;
    category_name: string;
    unlimited: boolean;
}

const SplitToLocationModal: React.FC<SplitToLocationModalProps> = ({
    isOpen,
    onClose,
    selectedProduct,
    selectedCategory,
    onAddToCart,
    currentLocationId,
}) => {
    const { locations } = useLocationClinica();
    const [availableLocations, setAvailableLocations] = useState<LocationProduct[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
    const [loading, setLoading] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen && selectedProduct) {
            fetchAvailableLocations();
            setSelectedLocationId(null);
            setSelectedQuantity(1);
        }
    }, [isOpen, selectedProduct]);

    const fetchAvailableLocations = async () => {
        if (!selectedProduct) return;

        setLoading(true);
        try {
            // Fetch inventory for the same product across all locations
            const data: any = await fetch_content_service({
                table: 'inventory',
                matchCase: [
                    { key: 'product_id', value: selectedProduct.main_product_id },
                    { key: 'archived', value: false },
                    { key: 'products.archived', value: false }
                ],
                selectParam: ',products(price,category_id, product_name,archived, unlimited)',
                filterOptions: [
                    { operator: 'not', column: 'products', value: null },
                    { operator: 'neq', column: 'products.price', value: 0 },
                    { operator: 'neq', column: 'quantity', value: 0 },
                    { operator: 'neq', column: 'location_id', value:currentLocationId },
                ]
            });

            // Filter and format the data
            const formattedData = data
                .filter((elem: any) => {
                    // Only include locations that have stock or unlimited products
                    return elem.quantity > 0 || (elem.products.unlimited && elem.products.price > 0);
                })
                .filter((elem: any) => elem.location_id !== currentLocationId) // Exclude current location
                .map(({ quantity, inventory_id, product_id, location_id, products: { price, product_name, category_id, unlimited } }: any) => {
                    const location = locations.find((loc: any) => loc.id === location_id);
                    return {
                        location_id,
                        location_name: location?.title || location?.name || "Unknown Location",
                        quantity_available: quantity,
                        product_id: inventory_id,
                        product_name: product_name,
                        price,
                        category_id,
                        category_name: selectedCategory?.category_name || "Unknown Category",
                        unlimited,
                        main_product_id: product_id,
                    };
                });

            setAvailableLocations(formattedData);
        } catch (error) {
            console.error("Error fetching available locations:", error);
            toast.error("Failed to fetch available locations");
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (!selectedLocationId) return;

        const selectedLocationProduct = availableLocations.find(
            (loc) => loc.location_id === selectedLocationId
        );

        if (selectedLocationProduct) {
            onAddToCart(selectedLocationProduct, selectedLocationProduct, selectedQuantity);
            onClose();
            toast.success("Product added to cart from another location");
        }
    };

    const handleQuantityChange = (newQuantity: number) => {
        const selectedLocationProduct = availableLocations.find(
            (loc) => loc.location_id === selectedLocationId
        );

        if (selectedLocationProduct) {
            const maxQuantity = selectedLocationProduct.unlimited
                ? 999999
                : selectedLocationProduct.quantity_available;

            setSelectedQuantity(Math.min(Math.max(1, newQuantity), maxQuantity));
        }
    };

    const selectedLocationProduct = availableLocations.find(
        (loc) => loc.location_id === selectedLocationId
    );

    return (
        <Modal show={isOpen} onClose={onClose} size="md">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
                <div className="mb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Add from Another Location
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Select a location where "{selectedProduct?.product_name}" is available to add to cart
                            </p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : availableLocations.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                            No other locations have this product in stock.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                                Select Location
                            </label>
                            <select
                                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-3 py-2"
                                value={selectedLocationId || ""}
                                onChange={(e) => setSelectedLocationId(Number(e.target.value))}
                            >
                                <option value="">Select a location</option>
                                {availableLocations.map((location) => (
                                    <option key={location.location_id} value={location.location_id}>
                                        {location.location_name} - {location.unlimited ? "Unlimited" : `${location.quantity_available} available`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedLocationId && selectedLocationProduct && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                                    Quantity
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-lg font-bold text-gray-700 dark:text-gray-200 disabled:opacity-50"
                                        onClick={() => handleQuantityChange(selectedQuantity - 1)}
                                        disabled={selectedQuantity <= 1}
                                    >
                                        -
                                    </button>
                                    <span className="px-4 py-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded text-gray-900 dark:text-gray-100 min-w-[60px] text-center">
                                        {selectedQuantity}
                                    </span>
                                    <button
                                        type="button"
                                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-lg font-bold text-gray-700 dark:text-gray-200 disabled:opacity-50"
                                        onClick={() => handleQuantityChange(selectedQuantity + 1)}
                                        disabled={
                                            !selectedLocationProduct.unlimited &&
                                            selectedQuantity >= selectedLocationProduct.quantity_available
                                        }
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                                    Available: {selectedLocationProduct.unlimited ? "Unlimited" : selectedLocationProduct.quantity_available}
                                </div>
                                <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                                    Price: ${selectedLocationProduct.price.toFixed(2)} per unit
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-600"
                                onClick={onClose}
                                type="button"
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                                onClick={handleAddToCart}
                                disabled={!selectedLocationId}
                                type="button"
                            >
                                Add to Cart
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default SplitToLocationModal; 