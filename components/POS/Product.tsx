import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { translationConstant } from '@/utils/translationConstants';

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
  // Modal mode: when true the component renders as a modal. Use isOpen to control visibility.
  modal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  modalTitle?: string;
  // Explicit unlimited flag (preferred to passing a sentinel number)
  unlimited?: boolean;
  // whether product is bonus eligible (show bonus icon)
  bonusEligible?: boolean;
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
  minQuantity = 0,
  formatPrice,
  rowMode = false,
  modal = false,
  isOpen = false,
  onClose,
  modalTitle,
  unlimited = false,
  bonusEligible = false,
}) => {
  const [internalQty, setInternalQty] = useState<number>(0);
  const qty = controlledQty !== undefined ? controlledQty : internalQty;
  const { t } = useTranslation(translationConstant.POSSALES);

  // No per-row console logging to avoid noisy output in UI
  const canIncrease = useMemo(() => {
    if (unlimited) return true;
    if (Number.isFinite(quantityLeft)) return qty < quantityLeft;
    return true; // fallback
  }, [qty, quantityLeft, unlimited]);

  const canDecrease = qty > 0;

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
  const buildDisplayName = (name: string) => {
    if (!name) return '';
    const tokens = [
      'UNIT', 'UNITS', 'MAMOGRAPHY', 'ORDER', 'EXAM', 'X-RAY', 'KIT', 'PACK', 'TABLET', 'CAPSULE', 'ML', 'MG', 'VIAL', 'SYRINGE', 'BOTTLE', 'SOLUTION', 'CREAM', 'OINTMENT', 'INJECTION', 'TEST', 'SAMPLE', 'BOX', 'SET'
    ];
    return name.replace(/\b([A-Za-z0-9-]+)\b/g, (m) => {
      const key = `POS-Sales_word_${m.toUpperCase().replace(/[^A-Z0-9-]/g, '-')}`;
      const translated = t(key, { defaultValue: m });
      return translated;
    });
  };
  const displayName = buildDisplayName(productName || '');

  const handleAddToCart = () => {
    if (disabled) return;
    if (onAddToCart) onAddToCart();
    else alert(`Added ${qty} ${displayName} to the cart. Total: ${fmt(totalCost)}`);
  };

  const row = (
    <tr className={onRowSelect ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" : ""}>
      <td
        className="border-b p-2"
        onClick={onRowSelect}
      >
        {bonusEligible ? (
          <div className="flex items-center gap-2">
            <Image src="/assets/bonusicon.png" alt="bonus" width={16} height={16} className="object-contain inline-block" />
            <span className="truncate">{displayName || '-'}</span>
          </div>
        ) : (
          displayName || '-'
        )}
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
        {unlimited ? (
          <span className="text-amber-600 dark:text-amber-400">{t('POS-Sales_k130')}</span>
        ) : Number.isFinite(quantityLeft) ? (
          <span>{Math.max(0, quantityLeft - qty)} {t('POS-Sales_k131')}</span>
        ) : (
          <span>{Math.max(0, quantityLeft - qty)} {t('POS-Sales_k131')}</span>
        )}
      </td>
      <td className="border-b p-2">{fmt(pricePerUnit)}</td>
      <td className="border-b p-2">{fmt(totalCost)}</td>
      {/* Actions removed; single Add to Cart button exists at the top of ProductListModal */}
    </tr>
  );

  if (rowMode) return row;

  const tableContent = (
    <div className="bg-white dark:bg-[#0E1725] rounded-lg p-2">
      <table className="w-full table-auto">
        <thead>
          <tr>
            <th className="border-b p-2 text-left">{t('POS-Sales_k126')}</th>
            <th className="border-b p-2 text-left">{t('POS-Sales_k7')}</th>
            <th className="border-b p-2 text-left">{t('POS-Sales_k127')}</th>
            <th className="border-b p-2 text-left">{t('POS-Sales_k128')}</th>
            <th className="border-b p-2 text-left">{t('POS-Sales_k129')}</th>
          </tr>
        </thead>
        <tbody>{row}</tbody>
      </table>
    </div>
  );

  if (!modal) {
    return <div className="bg-white dark:bg-[#0E1725] shadow-md rounded-lg p-5">{tableContent}</div>;
  }

  // Modal mode
  if (modal && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => {
          if (onClose) onClose();
        }}
      />
      <div className="relative w-full max-w-4xl mx-4 bg-white dark:bg-[#0E1725] rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{modalTitle ?? t('POS-Sales_k5')}</h3>
          <button
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            onClick={() => {
              if (onClose) onClose();
            }}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {tableContent}
        </div>
      </div>
    </div>
  );
};

export default Product;