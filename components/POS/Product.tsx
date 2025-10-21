import { useMemo, useState } from 'react';

interface ProductProps {
  productName: string;
  pricePerUnit: number;
  quantityLeft: number; // use Number.MAX_SAFE_INTEGER to represent unlimited
  // Controlled quantity support
  quantity?: number;
  onQuantityChange?: (qty: number) => void;
  // Hook into Add to Cart
  onAddToCart?: () => void;
  // Optional row select callback (useful to sync external selectedProduct)
  onRowSelect?: () => void;
  // UI
  disabled?: boolean;
  minQuantity?: number; // default 1; pass 0 to allow zero quantity
  formatPrice?: (amount: number) => string; // optional currency formatter
  // Render mode: full table (default) or just a table row
  rowMode?: boolean;
}

const Product: React.FC<ProductProps> = ({
  productName,
  pricePerUnit,
  quantityLeft,
  quantity: controlledQty,
  onQuantityChange,
  onAddToCart,
  onRowSelect,
  disabled = false,
  minQuantity = 1,
  formatPrice,
  rowMode = false,
}) => {
  const [internalQty, setInternalQty] = useState<number>(minQuantity);
  const qty = controlledQty !== undefined ? controlledQty : internalQty;

  const canIncrease = useMemo(() => {
    if (Number.isFinite(quantityLeft)) return qty < quantityLeft;
    return true; // unlimited
  }, [qty, quantityLeft]);

  const canDecrease = qty > minQuantity;

  const handleIncrease = () => {
    if (!canIncrease || disabled) return;
    const next = qty + 1;
    if (onQuantityChange) onQuantityChange(next);
    else setInternalQty(next);
  };

  const handleDecrease = () => {
    if (!canDecrease || disabled) return;
    const next = qty - 1;
    if (onQuantityChange) onQuantityChange(next);
    else setInternalQty(next);
  };

  const totalCost = qty * pricePerUnit;
  const fmt = (n: number) => (formatPrice ? formatPrice(n) : `$${n}`);

  const handleAddToCart = () => {
    if (disabled) return;
    if (onAddToCart) onAddToCart();
    else alert(`Added ${qty} ${productName} to the cart. Total: ${fmt(totalCost)}`);
  };

  const row = (
    <tr className={onRowSelect ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" : ""}>
      <td
        className="border-b p-2"
        onClick={onRowSelect}
      >
        {productName || '-'}
      </td>
      <td className="border-b p-2">
        <div className="flex items-center space-x-2">
          <button
            className="bg-gray-300 dark:bg-gray-700 text-black dark:text-white px-2 py-1 rounded disabled:opacity-50"
            onClick={handleDecrease}
            disabled={!canDecrease || disabled}
          >
            -
          </button>
          <span className="min-w-[1.5rem] text-center">{qty}</span>
          <button
            className="bg-gray-300 dark:bg-gray-700 text-black dark:text-white px-2 py-1 rounded disabled:opacity-50"
            onClick={handleIncrease}
            disabled={!canIncrease || disabled}
          >
            +
          </button>
        </div>
      </td>
      <td className="border-b p-2">
        {Number.isFinite(quantityLeft) ? (
          <span>{Math.max(0, quantityLeft - qty)} left</span>
        ) : (
          <span className="text-amber-600 dark:text-amber-400">Unlimited</span>
        )}
      </td>
      <td className="border-b p-2">{fmt(pricePerUnit)} /unit</td>
      <td className="border-b p-2">{fmt(totalCost)}</td>
      <td className="border-b p-2">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
          onClick={handleAddToCart}
          disabled={disabled || qty <= minQuantity}
        >
          Add to Cart
        </button>
      </td>
    </tr>
  );

  if (rowMode) return row;

  return (
    <div className="bg-white dark:bg-[#0E1725] shadow-md rounded-lg p-5">
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
        <tbody>{row}</tbody>
      </table>
    </div>
  );
};

export default Product;
