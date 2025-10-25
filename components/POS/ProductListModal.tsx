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
  if (!isOpen) return null;

  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const s = searchTerm.toLowerCase();
    return products.filter((p: any) => (p.product_name || '').toLowerCase().includes(s));
  }, [products, searchTerm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-5xl mx-4 bg-white dark:bg-[#0E1725] rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          <div className="mb-3 flex items-center gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product..."
              className="w-full md:w-1/2 px-3 py-2 border rounded bg-white dark:bg-gray-800 text-sm"
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
                    <th className="border-b p-2 text-left">Actions</th>
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
                      onAddToCart={() => onAddToCart(p)}
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
