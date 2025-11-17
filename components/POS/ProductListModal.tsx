 import React, { useMemo, useState } from 'react';
import Product from './Product';

interface ProductListModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading?: boolean;
  products: any[];
  qtyMap: Record<number, number>;
  onQtyChange: (id: number, qty: number) => void;
  onAddToCart: (p: any) => void;
  disabled?: boolean;
  title?: string;
  formatPrice?: (n: number) => string;
}

const ProductListModal: React.FC<ProductListModalProps> = ({
  isOpen,
  onClose,
  loading,
  products,
  qtyMap,
  onQtyChange,
  onAddToCart,
  disabled,
  title = 'Products',
  formatPrice,
}) => {
  // Hooks must be called unconditionally at the top of the component
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const s = searchTerm.toLowerCase();
    return products.filter((p: any) => (p.product_name || '').toLowerCase().includes(s));
  }, [products, searchTerm]);

  const hasAnyQty = useMemo(() => {
    return filteredProducts.some((p: any) => (qtyMap[p.product_id] ?? 0) > 0);
  }, [filteredProducts, qtyMap]);

  const handleAddAllToCart = () => {
    filteredProducts.forEach((p: any) => {
      const q = qtyMap[p.product_id] ?? 0;
      if (q > 0) onAddToCart(p);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="relative w-full max-w-5xl mx-4 bg-white dark:bg-[#0E1725] rounded-lg shadow-lg overflow-hidden flex flex-col"
        style={{ height: '72vh' }}
      >
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

  <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-3 flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search product..."
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 text-sm"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded text-sm"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="ml-4">
              <button
                type="button"
                onClick={handleAddAllToCart}
                disabled={!hasAnyQty || disabled}
                className="px-3 py-2 bg-blue-500 text-white rounded text-sm disabled:opacity-50"
              >
                Add to Cart
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-sm">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-sm">No products found for this search/location</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr>
                    <th className="border-b p-2 text-left">Product Name</th>
                    <th className="border-b p-2 text-left">Quantity</th>
                    <th className="border-b p-2 text-left">Availability</th>
                    <th className="border-b p-2 text-left">Price/Unit</th>
                    <th className="border-b p-2 text-left">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <Product
                      key={p.product_id}
                      rowMode
                      productName={p.product_name}
                      pricePerUnit={p.price}
                      quantityLeft={p.quantity_available}
                      unlimited={!!p.unlimited}
                      quantity={qtyMap[p.product_id] ?? 0}
                      onQuantityChange={(q) => onQtyChange(p.product_id, q)}
                      // per-row add removed; single Add All button will use qtyMap
                      disabled={disabled}
                      minQuantity={0}
                      formatPrice={formatPrice}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListModal;
