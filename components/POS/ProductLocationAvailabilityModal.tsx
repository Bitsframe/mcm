"use client";
import React, { useEffect, useState } from 'react';
import { Modal } from 'flowbite-react';
import { fetch_content_service } from '@/utils/supabase/data_services/data_services';
import { CircularProgress } from '@mui/material';

interface LocationAvailability {
  inventory_id: number;
  location_id: number;
  location_name: string;
  quantity: number;
  price: number;
}

interface ProductLocationAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number; // main_product_id from products table
  productName: string;
  categoryName: string;
  currentLocationId: number;
  onAddToCart: (locationId: number, inventoryId: number, locationName: string, quantity: number, price: number) => void;
}

const ProductLocationAvailabilityModal: React.FC<ProductLocationAvailabilityModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  categoryName,
  currentLocationId,
  onAddToCart,
}) => {
  const [locations, setLocations] = useState<LocationAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<number, number>>({});

  useEffect(() => {
    if (isOpen && productId) {
      fetchLocationAvailability();
    }
  }, [isOpen, productId]);

  const fetchLocationAvailability = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching availability for product_id:', productId);
      
      // Fetch all inventory records for this product across all locations
      const inventoryData: any = await fetch_content_service({
        table: 'inventory',
        matchCase: [
          { key: 'product_id', value: productId },
          { key: 'archived', value: false },
        ],
        selectParam: ',Locations(title),products(price)',
      });

      console.log('📦 Inventory data:', inventoryData);

      if (inventoryData && inventoryData.length > 0) {
        // Filter out current location and locations with 0 quantity
        const availableLocations = inventoryData
          .filter((item: any) => 
            item.location_id !== currentLocationId && 
            item.quantity > 0 &&
            item.Locations
          )
          .map((item: any) => ({
            inventory_id: item.inventory_id,
            location_id: item.location_id,
            location_name: item.Locations?.title || 'Unknown Location',
            quantity: item.quantity,
            price: item.products?.price || 0, // Use price from products table
          }));

        console.log('✅ Available locations:', availableLocations);
        setLocations(availableLocations);
      } else {
        setLocations([]);
      }
    } catch (error) {
      console.error('❌ Error fetching location availability:', error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (locationId: number, quantity: number) => {
    setSelectedQuantities(prev => ({
      ...prev,
      [locationId]: quantity,
    }));
  };

  const handleAddFromLocation = (location: LocationAvailability) => {
    const quantity = selectedQuantities[location.location_id] || 1;
    onAddToCart(
      location.location_id,
      location.inventory_id,
      location.location_name,
      quantity,
      location.price
    );
    onClose();
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="2xl">
      <Modal.Header>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Product Availability at Other Locations
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {productName} - {categoryName}
          </p>
        </div>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <CircularProgress />
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              This product is not available at any other location.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {locations.map((location) => (
              <div
                key={location.location_id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {location.location_name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Available: <span className="font-semibold text-green-600 dark:text-green-400">{location.quantity} units</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Qty:</label>
                      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700">
                        <button
                          type="button"
                          onClick={() => {
                            const currentQty = selectedQuantities[location.location_id] || 1;
                            if (currentQty > 1) {
                              handleQuantityChange(location.location_id, currentQty - 1);
                            }
                          }}
                          className="px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={location.quantity}
                          value={selectedQuantities[location.location_id] || 1}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            const clampedVal = Math.min(Math.max(val, 1), location.quantity);
                            handleQuantityChange(location.location_id, clampedVal);
                          }}
                          className="w-16 px-2 py-1 text-center bg-transparent text-gray-900 dark:text-white border-x border-gray-300 dark:border-gray-600 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const currentQty = selectedQuantities[location.location_id] || 1;
                            if (currentQty < location.quantity) {
                              handleQuantityChange(location.location_id, currentQty + 1);
                            }
                          }}
                          className="px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddFromLocation(location)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-semibold"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded"
        >
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductLocationAvailabilityModal;
