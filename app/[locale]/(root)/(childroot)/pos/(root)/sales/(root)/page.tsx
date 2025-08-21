"use client";
import React, {
  type FC,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";

import { Quantity_Field } from "@/components/Quantity_Field";
import { FaCreditCard } from "react-icons/fa";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import { IoCloseOutline } from "react-icons/io5";
import { Select } from "flowbite-react";

import { PiCaretCircleRightFill } from "react-icons/pi";
import { FaArrowsAltV } from "react-icons/fa";
import { BsCashCoin } from "react-icons/bs";

import { useCategoriesClinica } from "@/hooks/useCategoriesClinica";
import { useProductsClinica } from "@/hooks/useProductsClinica";
import { useRouter } from "next/navigation";
import { CircularProgress } from "@mui/material";
import { currencyFormatHandle } from "@/helper/common_functions";
import { toast } from "sonner";
import { Searchable_Dropdown } from "@/components/Searchable_Dropdown";
import PromoCodeComponent from "@/components/PromoCodeComponent";
import DiscountModal from "@/components/modals/DiscountModal";
// import SplitToLocationModal from "@/components/SplitToLocationModal";

import type { PromoCodeDataInterface } from "@/types/typesInterfaces";
import { formatPhoneNumber } from "@/utils/getCountryName";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { LocationContext } from "@/context";
import { TabContext } from "@/context";
import { calculateNewBalance, grandTotalHandle } from "@/utils/cart/cart";
import {
  fetch_content_service,
  update_content_service,
  create_content_service,
} from "@/utils/supabase/data_services/data_services";
import axios from "axios";
import { Custom_Modal } from "@/components/Modal_Components/Custom_Modal";
import { Input } from "@/components/ui/input";
import { useLocationClinica } from "@/hooks/useLocationClinica";
import { Modal } from "flowbite-react";

interface CartItemComponentInterface {
  data: CartArrayInterface;
  index: number;
  controllProductQtyHandle: (
    product_id: number,
    qty: number,
    price: number,
    index: number
  ) => void;
  updateDiscountPercent: (index: number, discount: number) => void;
}

interface CartArrayInterface {
  product_id: number;
  main_product_id: number;
  quantity: number;
  product_name: string;
  category_name: string;
  category_id: number;
  price: number;
  quantity_available: number;
  fulfillment_location_id: number;
  fulfillment_location_name: string;

  original_price: number; // original price before discount
  discount_percent: number; // discount applied
}

const render_details = [
  {
    key: "name",
    label: "Name:",
    render_value: (val: any) => `${val?.firstname} ${val?.lastname}`,
  },
  {
    key: "phone",
    label: "Phone Number:",
    render_value: (val: any) => formatPhoneNumber(val?.phone),
  },
  {
    key: "email",
    label: "Email:",
  },
  {
    key: "treatmenttype",
    label: "Treatment Category:",
  },
];

const calcTotalAmount = (perItemAmount: number, qty: number) => {
  return currencyFormatHandle(perItemAmount * qty);
};



const CartItemComponent: FC<CartItemComponentInterface> = ({
  data,
  controllProductQtyHandle,
  index,
  updateDiscountPercent,
}) => {
  const {
    product_name,
    category_name,
    quantity,
    quantity_available,
    product_id,
    price: initialPrice,
    original_price,
    discount_percent,  // Existing discount_percent from the backend or initial value
    fulfillment_location_id,
    fulfillment_location_name,
  } = data;

  const { selectedLocation } = useContext(LocationContext);
  const isOtherLocation = fulfillment_location_id !== selectedLocation?.id;

  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountPct, setDiscountPct] = useState(discount_percent);  // The modal value will update this
  const [price, setPrice] = useState(initialPrice); // Price after discount applied

  // Recalculate price whenever discountPct, original_price, or quantity changes
  useEffect(() => {
    let totalPrice = original_price * quantity; // Total price before discount
    if (discountPct > 0) {
      totalPrice = totalPrice * (1 - discountPct / 100); // Apply the discount for the specific product
    }
    setPrice(Number(totalPrice.toFixed(2))); // Set the price after discount
  }, [discountPct, original_price, quantity]); // Recalculate when discountPct, original_price, or quantity changes

  // Function to handle quantity change
  const qtyHandle = (type: string) => {
    let newQty = quantity;
    if (type === "inc") {
      newQty += 1;
    } else {
      newQty -= 1;
    }
    controllProductQtyHandle(product_id, newQty, price, index);
  };

  // Function to remove item
  const removeItemHandle = () => {
    controllProductQtyHandle(product_id, 0, price, index);
  };

  // Handle the removal of the discount
  const handleRemoveDiscount = () => {
    setDiscountPct(0); // Reset discount for the product
    setPrice(original_price * quantity); // Recalculate the price to the original price
  };

  // Handle when the discount modal is applied
  const handleApplyDiscount = (pct: number) => {
    setDiscountPct(pct); // Set the discountPct for the product
    const discountedPrice = (original_price * quantity) * (1 - pct / 100); // Calculate the new price after discount
    setPrice(Number(discountedPrice.toFixed(2))); // Set the new discounted price
    updateDiscountPercent(index, pct); // Update parent cartArray
    setIsDiscountModalOpen(false); // Close the modal after applying the discount
  };

  return (
    <div
      className={
        isOtherLocation
          ? "bg-blue-50 dark:bg-blue-900 border border-blue-400 dark:border-blue-600 py-2 px-3 rounded-md shadow-sm"
          : "bg-[#F1F4F9] dark:bg-gray-800 py-2 px-3 rounded-md"
      }
    >
      <div className="flex items-center">
        <div className="flex-1 flex items-center space-x-3">
          <div className="flex flex-col items-center text-[#121111] dark:text-gray-300">
            <button
              onClick={() => qtyHandle("inc")}
              className="disabled:opacity-60"
              disabled={quantity_available === quantity}
            >
              <IoIosArrowUp
                size={18}
                className="text-primary_color dark:text-blue-400"
              />
            </button>
            <span className="block text-base font-bold text-[#121111] dark:text-white">
              {quantity}
            </span>
            <button
              disabled={quantity === 0}
              className="disabled:opacity-60"
              onClick={() => qtyHandle("dec")}
            >
              <IoIosArrowDown
                size={18}
                className="text-primary_color dark:text-blue-400"
              />
            </button>
          </div>
          <dl>
            <dt className="text-base dark:text-white">{product_name}</dt>
            <dd className="text-sm text-gray-700 dark:text-gray-400">
              {category_name}
            </dd>
            {isOtherLocation && (
              <dd className="text-xs font-semibold text-blue-800 dark:text-blue-200 mt-1">
                Fulfilled at: {fulfillment_location_name}
              </dd>
            )}
          </dl>
        </div>

        {/* Price Section */}
        <div className="flex items-center space-x-3">
          {discountPct > 0 ? (
            <>
              <p className="text-sm text-gray-500 line-through dark:text-gray-400">
                ${original_price * quantity} {/* original price before discount */}
              </p>
              <p className="font-bold text-[#121111] dark:text-white">
                ${price} {/* discounted price for total quantity */}
              </p>
            </>
          ) : (
            <p className="font-bold text-[#121111] dark:text-white">
              ${original_price * quantity} {/* Total price without discount */}
            </p>
          )}

          <div>
            <button onClick={removeItemHandle}>
              <IoCloseOutline
                size={18}
                className="text-primary_color dark:text-blue-400"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Discount Section */}
      <div className="mt-2 flex items-center justify-between text-xs px-0.5">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-300">Discount</span>
          <span className="text-emerald-600 dark:text-emerald-400">
            {discountPct > 0 ? `${discountPct}% off` : "0% "}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsDiscountModalOpen(true)}
            className="text-[11px] px-2 py-1 rounded border border-[#0066ff] text-[#0066ff] hover:bg-[#cce0ff]/30"
          >
            {discountPct > 0 ? "Change discount" : "Add discount"}
          </button>
          {discountPct > 0 && (
            <button
              onClick={handleRemoveDiscount} // Removes the discount
              className="text-[11px] px-2 py-1 rounded border border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              Remove discount
            </button>
          )}
        </div>
      </div>

      {/* Discount Modal */}
      <DiscountModal
        isOpen={isDiscountModalOpen}
        initialValue={discountPct}
        onApply={handleApplyDiscount}  // Use the updated function to apply the discount
        onClose={() => setIsDiscountModalOpen(false)}
      />
    </div>
  );
};


const Orders = () => {
  const { categories } = useCategoriesClinica(true);
  const { selectedLocation } = useContext(LocationContext);
  const { locations } = useLocationClinica();
  const [showOtherLocationModal, setShowOtherLocationModal] = useState(false);
  const [otherLocationId, setOtherLocationId] = useState<number | null>(null);
  const [otherLocationCategoryId, setOtherLocationCategoryId] = useState<
    number | null
  >(null);
  const [otherLocationProductId, setOtherLocationProductId] = useState<
    number | null
  >(null);
  const [otherLocationProductQty, setOtherLocationProductQty] =
    useState<number>(1);
  const [otherLocationProducts, setOtherLocationProducts] = useState<any[]>([]);
  const [otherLocationCategories, setOtherLocationCategories] = useState<any[]>([]);

  // Split to location modal state
  const [showSplitModal, setShowSplitModal] = useState(false);

  const [cashInput, setCashInput] = useState("");
  const [cardInput, setCardInput] = useState("");

  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const [isPanelShrunk, setIsPanelShrunk] = useState(false);

  const {
    selectedCategory,
    products,
    getCategoriesByLocationId,
    loadingProducts,
    selectedProduct,
    selectProductHandle,
  } = useProductsClinica();

  const [fetchingDataLoading, setfetchingDataLoading] = useState(true);
  const [cartArray, setCartArray] = useState<CartArrayInterface[]>([]);
  const [productQty, setProductQty] = useState<number>(0);
  const [placeOrderLoading, setPlaceOrderLoading] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [promoCodeData, setPromoCode] = useState<PromoCodeDataInterface | null>(
    null
  );
  const [lastLocationId, setLastLocationId] = useState(0);
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [isAddBalanceModalOpen, setIsAddBalanceModalOpen] = useState(false);
  const [addBalanceLoading, setAddBalanceLoading] = useState(false);
  const [payWithCash, setPayWithCash] = useState(true);
  const [payWithCard, setPayWithCard] = useState(false);
  const [cardAmount, setCardAmount] = useState<number>(0);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountInput, setDiscountInput] = useState<string>("");
  const [addAmount, setAddAmount] = useState(0);
  const [addAmountInput, setAddAmountInput] = useState("");
  const [discountPct, setDiscountPct] = useState<number>(0);
const [discountModalOpen, setDiscountModalOpen] = useState(false);


  const router = useRouter();

  const category_change_handle = (e: any) => {
    const value = e.target.value;
    getCategoriesByLocationId(value);
    setProductQty(0);
  };

  const select_product_change_handle = (e: any) => {
    const value = e.target.value;
    selectProductHandle(value);
    setProductQty(0);
  };

  useEffect(() => {
    setfetchingDataLoading(true);
    const storedData = localStorage.getItem("@pos-patient") || null;
    if (storedData) {
      const data = JSON.parse(storedData);
      setSelectedPatient(data);
    }
    setTimeout(() => {
      setfetchingDataLoading(false);
    }, 2000);
  }, [router]);

  useEffect(() => {
    if (selectedLocation) {
      const currentSelectedLocationId = selectedLocation.id;
      if (lastLocationId && currentSelectedLocationId !== lastLocationId) {
        setCartArray([]);
        localStorage.removeItem("@pos-patient");
        setSelectedPatient(null);
        setLastLocationId(currentSelectedLocationId);
      }
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (selectedLocation) {
      setLastLocationId(selectedLocation.id);
    }
  }, []);

  useEffect(() => {
    const fetchCreditBalance = async () => {
      if (selectedPatient?.id) {
        try {
          const data: any = await fetch_content_service({
            table: "credit_audit",
            matchCase: [{ key: "patient_id", value: selectedPatient.id }],
            selectParam: "balance",
          });
          const totalCredit = data && data.length > 0 ? data[0]?.balance : 0;
          setCreditAmount(totalCredit);
        } catch (error) {
          console.error("Error fetching credit balance:", error);
          setCreditAmount(0);
        }
      } else {
        setCreditAmount(0);
      }
    };

    fetchCreditBalance();
  }, [selectedPatient]);

  const quantityHandle = (qty: number) => {
    setProductQty(qty);
  };

  
const addToCartHandle = () => {
  const findCategory: any = categories.find(
    ({ category_id }: any) => +selectedProduct.category_id === +category_id
  );

  if (findCategory && selectedLocation) {
    const basePrice = selectedProduct.price;
    let finalUnitPrice = basePrice;
    const discount_percent = discountPct || 0;  // You already have discountPct in the component

    if (discount_percent > 0) {
      finalUnitPrice = Number((basePrice * (1 - discount_percent / 100)).toFixed(2)); // Apply discount if needed
    }

    // Creating the product object with discount_percent included
    const addProduct: CartArrayInterface = {
      product_id: selectedProduct.product_id,
      main_product_id: selectedProduct.main_product_id,
      product_name: selectedProduct.product_name,
      quantity: productQty,
      category_name: findCategory.category_name,
      category_id: findCategory.category_id,
      quantity_available: selectedProduct.quantity_available,
      price: finalUnitPrice,
      original_price: basePrice,
      discount_percent,  // Add the discount here
      fulfillment_location_id: selectedLocation.id,
      fulfillment_location_name:
        selectedLocation.title || selectedLocation.name || "Unknown",
    };

    cartArray.push(addProduct);  // Add the product to the cart array
    setCartArray([...cartArray]); // Re-render the cart

    selectProductHandle(0);  // Reset selected product after adding
    setProductQty(0);        // Reset quantity
    setDiscountPct(0);       // Reset discount
    getCategoriesByLocationId(0);  // Fetch categories (if necessary)
  }
};



  const openOtherLocationModal = () => {
    setShowOtherLocationModal(true);
    setOtherLocationId(null);
    setOtherLocationCategoryId(null);
    setOtherLocationProductId(null);
    setOtherLocationProductQty(1);
    setOtherLocationProducts([]);
    setOtherLocationCategories([]);
  };

  const handleOtherLocationChange = (locId: number) => {
    setOtherLocationId(locId);
    fetch_content_service({ table: "categories" }).then((cats: any[]) => {
      setOtherLocationCategories(cats);
      setOtherLocationCategoryId(null);
      setOtherLocationProductId(null);
      setOtherLocationProducts([]);
    });
  };

  const handleOtherLocationCategoryChange = (catId: number) => {
    setOtherLocationCategoryId(catId);
    // Fetch products for this location/category
    fetch_content_service({
      table: "inventory",
      matchCase: [
        { key: "products.category_id", value: catId },
        { key: "location_id", value: otherLocationId! },
        { key: "archived", value: false },
        { key: "products.archived", value: false },
      ],
      selectParam:
        ",products(price,category_id, product_name,archived, unlimited)",
      filterOptions: [
        { operator: "not", column: "products", value: null },
        { operator: "neq", column: "products.price", value: 0 },
      ],
    }).then((data: any[]) => {
      const formattedData = data
        .filter(
          (elem) =>
            elem.quantity > 0 ||
            (elem.products.unlimited && elem.products.price > 0)
        )
        .map(
          ({
            quantity,
            inventory_id,
            product_id,
            products: { price, product_name, category_id, unlimited },
          }: any) => {
            return {
              product_id: inventory_id,
              category_id,
              product_name: product_name,
              price,
              quantity_available: quantity,
              unlimited,
              main_product_id: product_id,
            };
          }
        );
      setOtherLocationProducts(formattedData);
      setOtherLocationProductId(null);
    });
  };

  const handleAddOtherLocationProduct = () => {
    const findCategory: any = otherLocationCategories.find(
      ({ category_id }: any) => +otherLocationCategoryId! === +category_id
    );
    const selectedProduct = otherLocationProducts.find(
      (p: any) => p.product_id === otherLocationProductId
    );
    const fulfillmentLocation = locations.find(
      (loc: any) => loc.id === otherLocationId
    );

    let addProduct: CartArrayInterface | null = null;

    if (findCategory && fulfillmentLocation && selectedProduct) {
      addProduct = {
        product_id: selectedProduct.product_id,
        product_name: selectedProduct.product_name,
        quantity: otherLocationProductQty,
        category_name: findCategory.category_name,
        category_id: findCategory.category_id,
        quantity_available: selectedProduct.quantity_available,
        price: selectedProduct.price,
        fulfillment_location_id: fulfillmentLocation.id,
        fulfillment_location_name:
          fulfillmentLocation.title || fulfillmentLocation.name || "Unknown",
      };

      if (addProduct) {
        cartArray.push(addProduct);
        setCartArray([...cartArray]);
        setShowOtherLocationModal(false);
      }
    }
  };

  const handleAddFromSplitModal = (product: any, location: any, quantity: number) => {
    const findCategory: any = categories.find(({ category_id }: any) => +product.category_id === +category_id);
    let addProduct: CartArrayInterface | null = null;
    if (findCategory) {
      addProduct = {
        product_id: product.product_id,
        product_name: product.product_name,
        quantity: quantity,
        category_name: findCategory.category_name,
        category_id: findCategory.category_id,
        quantity_available: product.quantity_available,
        price: product.price,
        fulfillment_location_id: location.location_id,
        fulfillment_location_name: location.location_name,
      };
      if (addProduct) {
        // Add to cart as a separate item (even if same product from different location)
        cartArray.push(addProduct);
        setCartArray([...cartArray]);
        setShowSplitModal(false);
        toast.success(`Added ${quantity} ${product.product_name} from ${location.location_name}`);
      }
    }
  };

  const controllProductQtyHandle = (
    product_id: number,
    qty: number,
    price: number,
    index: number
  ) => {
    if (qty === 0) {
      cartArray.splice(index, 1);
    } else {
      cartArray[index].quantity = qty;
    }
    setCartArray([...cartArray]);
  };

  const placeOrderHandle = async () => {
    try {
      setPlaceOrderLoading(true);
      setIsBalanceLoading(true);

      if (!selectedPatient || !cartArray.length) return;
      

      const { data } = await axios.post("/api/orders", {
        patient_id: selectedPatient.id,
        cartArray,
        appliedDiscount,
        creditAmount,
        cashAmount: payWithCash ? receivedAmount : 0,
        cardAmount: payWithCard ? cardAmount : 0,
        creditUsed,
        promoCodeData,
        selectedPatient,
        selectedLocation,
      });
  
      toast.success(data.message, {
        style: {
          background: "white",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const { totalAfterDiscount, totalPaid, newBalance, overpaid } =
        calculateNewBalance({
          cartArray,
          appliedDiscount,
          payWithCash,
          receivedAmount,
          payWithCard,
          cardAmount,
          creditUsed,
          selectedLocation,
        });

      // console.log("🧮 Total After Discount:", totalAfterDiscount);
      // console.log("💰 Total Paid:", totalPaid);
      // console.log(
      //   overpaid
      //     ? `📉 Overpaid — Reducing balance by: ${totalPaid - totalAfterDiscount}`
      //     : `📈 Underpaid — Increasing balance by credit used: ${totalAfterDiscount - totalPaid}`
      // );
      // console.log("🧾 New Location Balance (before DB update):", newBalance);

      await update_content_service({
        table: "Locations",
        post_data: {
          id: selectedLocation.id,
          balance: newBalance,
        },
      });

      selectedLocation.balance = newBalance;

      const response = await fetch_content_service({
        table: "Locations",
        matchCase: [{ key: "id", value: selectedLocation.id }],
        selectParam: "balance,credit_limit",
      });

      const updatedLocation = response as Array<{
        balance: number;
        credit_limit: number;
      }>;

      if (updatedLocation && updatedLocation.length > 0) {
        selectedLocation.balance = updatedLocation[0].balance;
        selectedLocation.credit_limit = updatedLocation[0].credit_limit;
        // console.log("📥 Refreshed Location Balance & Limit from DB:", updatedLocation[0]);
      }

      setCartArray([]);
      localStorage.removeItem("@pos-patient");
      setSelectedPatient(null);
      setCreditAmount(0);
      setReceivedAmount(0);
      setCardAmount(0);
      setCardInput("");
      setCashInput("");
    } catch (err: any) {
      console.error("❌ Order placement failed:", err);
      toast.error(err.response?.data?.message || err.message, {
        style: {
          background: "#FFFFFF",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
        },
      });
    } finally {
      setPlaceOrderLoading(false);
      setIsBalanceLoading(false);
    }
  };

  const applyDiscountHandle = (
    codeData: PromoCodeDataInterface | null,
    discount: number
  ) => {
    setAppliedDiscount(discount);
    setPromoCode(codeData);
  };

  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k19");
  }, []);

  const subtotal =
    grandTotalHandle(cartArray, appliedDiscount).amount + creditAmount;
  // console.log("🔢 Subtotal:", subtotal);

  const creditAvailable = React.useMemo(() => {
    if (!selectedLocation || selectedLocation.balance === undefined) {
      return 0;
    }
    return selectedLocation.balance;
  }, [selectedLocation]);

  const creditUsed = useMemo(() => {
    const userStartedPaying = cashInput !== "" || cardInput !== "";
    if (!userStartedPaying) return 0;

    const paid = receivedAmount + cardAmount;
    const productTotalAfterDiscount = grandTotalHandle(
      cartArray,
      appliedDiscount
    ).amount;
    const creditNeeded = productTotalAfterDiscount - paid;
    const allowedCredit = Math.min(creditNeeded, creditAvailable);

    return Math.max(0, allowedCredit);
  }, [
    cashInput,
    cardInput,
    receivedAmount,
    cardAmount,
    creditAvailable,
    cartArray,
    appliedDiscount,
  ]);

  const displayedBalanceLimit = React.useMemo(() => {
    if (!selectedLocation || selectedLocation.balance === undefined) {
      return 0;
    }
    return Math.max(0, selectedLocation.balance - creditUsed);
  }, [selectedLocation, creditUsed]);

  const finalCredit = useMemo(() => {
    const totalDue = grandTotalHandle(cartArray, appliedDiscount).amount;
    const totalPaid = receivedAmount + cardAmount;
    return totalDue - totalPaid;
  }, [receivedAmount, cardAmount, cartArray, appliedDiscount]);

  const handleAddBalance = async () => {
    if (!selectedPatient?.id || isNaN(addAmount) || addAmount === 0) return;

    setAddBalanceLoading(true);
    try {
      const data: any = await fetch_content_service({
        table: "credit_audit",
        matchCase: [{ key: "patient_id", value: selectedPatient.id }],
        selectParam: "balance,id",
      });

      let newBalance = addAmount;
      let creditAuditId = null;

      if (data && data.length > 0) {
        newBalance = Number(data[0].balance) - Number(addAmount);
        creditAuditId = data[0].id;
        await update_content_service({
          table: "credit_audit",
          post_data: { id: creditAuditId, balance: newBalance },
        });
      } else {
        await create_content_service({
          table: "credit_audit",
          post_data: { patient_id: selectedPatient.id, balance: newBalance },
        });
      }

      await create_content_service({
        table: "transaction_history",
        post_data: {
          patient_id: selectedPatient.id,
          amount: addAmount,
          balance: creditUsed,
          type: "topup",
        },
      });

      setCreditAmount(newBalance);
      setAddAmount(0);
      setIsAddBalanceModalOpen(false);
      toast.success("Balance updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update balance");
    } finally {
      setAddBalanceLoading(false);
    }
  };

  const { t } = useTranslation(translationConstant.POSSALES);

  useEffect(() => {
    if (payWithCash && !payWithCard) setCardAmount(0);
    if (payWithCard && !payWithCash) setReceivedAmount(0);
    if (!payWithCash && !payWithCard) setPayWithCash(true);
  }, [payWithCash, payWithCard]);

  const totalPaid =
    (payWithCash ? receivedAmount : 0) + (payWithCard ? cardAmount : 0);



  return (
    <main className="w-full h-full font-medium text-sm dark:bg-gray-900 dark:text-white">
      <div className="w-full p-1 grid grid-cols-1 md:grid-cols-3 gap-1">
        <div className="bg-[#F1F4F9] dark:bg-[#080E16] h-[65dvh] md:h-[60dvh] overflow-auto md:col-span-2 rounded w-full">
            {/* Header with fulfillment button */}
            {fetchingDataLoading ? (
              <div className="w-full flex flex-col justify-center h-full space-y-1">
                <CircularProgress size={16} className="dark:text-white" />
                <h1 className="text-xs text-gray-400 dark:text-gray-300">
                  Fetching patient details
                </h1>
              </div>
            ) : (
              <div className="bg-[#F1F4F9] dark:bg-[#080E16] p-2 rounded shadow-sm ">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold mb-2 dark:text-white">
                    {t("POS-Sales_k3")}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 bg-blue-600 text-white rounded  hover:bg-blue-700"
                      onClick={openOtherLocationModal}
                      type="button"
                    >
                      Add from Other Location
                    </button>
                    <button
                      className="px-3 py-1 bg-blue-600 text-white rounded  hover:bg-blue-700"
                      onClick={() => setIsAddBalanceModalOpen(true)}
                      disabled={!selectedPatient}
                      type="button"
                    >
                      Add Balance
                    </button>
                  </div>
                  <Custom_Modal
                    is_open={isAddBalanceModalOpen}
                    close_handle={() => setIsAddBalanceModalOpen(false)}
                    create_new_handle={handleAddBalance}
                    loading={addBalanceLoading}
                    Title="Add Balance"
                    buttonLabel="Add"
                    submit_button_color="blue"
                    disabled={addBalanceLoading || !addAmount || addAmount > creditAmount}
                  >
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Current Balance</label>
                        <div className="p-2 rounded font-bold">{creditAmount}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Add Amount</label>
                        <Input
                          type="number"
                          min={1}
                          value={addAmount}
                          onChange={e => setAddAmount(Number(e.target.value))}
                          className="w-full border border-black"
                        />
                      </div>
                      <div className="mb-2">
                        <label className="block text-sm font-medium mb-1">New Balance</label>
                        <div
                          className={`
                          p-3 rounded font-bold text-lg 
                          ${creditAmount + (addAmount || 0) >= 0
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"}
                        `}
                        >

                          {Math.max(0, creditAmount - (addAmount || 0)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </Custom_Modal>

                </div>
                {selectedPatient ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {render_details.map(({ label, key, render_value }, ind) => {
                      const extracted_val = render_value
                        ? render_value(selectedPatient)
                        : selectedPatient[key];
                      return (
                        <div
                          key={ind}
                          className="space-y-0.5 bg-white dark:bg-[#0E1725] p-2 rounded"
                        >
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {label}
                          </p>
                          <p className="text-sm font-medium dark:text-white">
                            {extracted_val}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <h1 className="text-red-600 dark:text-red-400 text-xs">
                      {t("POS-Sales_k4")}
                    </h1>
                  </div>
                )}
              </div>
            )}

          <div className="bg-[#F1F4F9] dark:bg-[#080E16] p-2 rounded shadow-sm">
            <h2 className="text-sm font-semibold mb-2 dark:text-white">
              {t("POS-Sales_k5")}
            </h2>
            <div className="space-y-2">
              <div>
                <Searchable_Dropdown
                  disabled={!selectedPatient}
                  initialValue={0}
                  value={selectedCategory}
                  //@ts-ignore
                  dark_bg_color="gray.700"
                  start_empty={true}
                  options_arr={categories.map(
                    ({ category_id, category_name }: any) => ({
                      value: category_id,
                      label: category_name,
                    })
                  )}
                  required={true}
                  on_change_handle={category_change_handle}
                  label="POS-Sales_k6"
                />
              </div>
              <div>
                {loadingProducts ? (
                  <div className="text-xs text-black dark:text-white">
                    {selectedCategory ? "Loading..." : "Select Category.."}
                  </div>
                ) : (
                  <Searchable_Dropdown
                    disabled={!selectedPatient}
                    initialValue={0}
                    //@ts-ignore
                    dark_bg_color="gray.700"
                    start_empty={true}
                    options_arr={products.map(
                      ({ product_id, product_name }: any) => ({
                        value: product_id,
                        label: product_name,
                      })
                    )}
                    required={true}
                    value={selectedProduct ? selectedProduct.product_id : 0}
                    on_change_handle={select_product_change_handle}
                    label="Select Product"
                  />
                )}
              </div>
              <div>
                <div className="space-y-0.5">
                  <Quantity_Field
                    disabled={!selectedPatient}
                    maxAvailability={
                      selectedProduct ? selectedProduct.quantity_available : 0
                    }
                    quantity={productQty}
                    quantityHandle={quantityHandle}
                    unlimited={selectedProduct?.unlimited}
                  />
                  {selectedProduct ? (
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-300 pl-0.5">
                      <div className="text-xs flex items-center space-x-3">
                        <p>
                          {currencyFormatHandle(selectedProduct?.price || 0)}
                          /unit
                        </p>
                        <p>
                          Total Cost{" "}
                          {currencyFormatHandle(
                            (selectedProduct?.price || 0) * productQty
                          )}
                        </p>
                      </div>
                      {selectedProduct.unlimited ? (
                        <div className="text-xs text-amber-600 dark:text-amber-400">
                          Unlimited
                        </div>
                      ) : (
                        <div className="text-xs text-amber-600 dark:text-amber-400">
                          {selectedProduct.quantity_available - productQty} left
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>



              <div className="flex gap-2">
                <button
                  disabled={!productQty}
                  onClick={addToCartHandle}
                  className="bg-[#0066FF] my-2 text-white font-medium py-1 px-4 rounded hover:opacity-90 active:opacity-70 disabled:opacity-50 text-base"
                  type="submit"
                >
                  {t("POS-Sales_k8")}
                </button>
              </div>
              <div className="mb-2">
                <button
                  disabled={!selectedProduct || (selectedProduct.quantity_available - productQty) > 0 || selectedProduct?.unlimited}
                  onClick={() => setShowSplitModal(true)}
                  className="bg-orange-500 my-2 text-white font-medium py-1 px-4 rounded hover:opacity-90 active:opacity-70 disabled:opacity-50 text-base"
                  type="button"
                >
                  {t("POS-Sales_k82")}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#F1F4F9] dark:bg-[#080E16] h-[60dvh] overflow-auto rounded flex flex-col shadow-sm p-1 w-full mt-2 md:mt-0">
          <div className="p-2 bg-white dark:bg-[#0E1725] rounded border-b border-gray-100 flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t("POS-Sales_k9")}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("POS-Sales_k10")} # --
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h1 className="text-[11px] text-gray-700 dark:text-gray-300 ">
                  {t("POS-Sales_k30")}:{" "}
                  <span className={`font-bold`}>
                    {/* Calculate and display adjusted Balance Limit if Final Credit is negative */}
                    {/* Display calculated adjusted Balance Limit */}
                    {`${selectedLocation?.credit_limit?.toFixed(2)}`}
                  </span>
                </h1>
              </div>
              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  {t("POS-Sales_k29")}:{" "}
                  <span
                    className={`font-bold ${
                      displayedBalanceLimit < 0
                        ? "text-red-500 dark:text-red-400"
                        : ""
                    }`}
                  >
                    {isBalanceLoading ? (
                      <div className="inline-flex items-center">
                        {/* <CircularProgress size={14} className="mr-1" /> */}
                        <span className="text-xs opacity-35 font-light">
                          Updating...
                        </span>
                      </div>
                    ) : (
                      `${displayedBalanceLimit.toFixed(2)}`
                    )}
                  </span>
                </h1>
              </div>
            </div>
          </div>

          <div className="overflow-auto flex-1 p-1 my-0.5 bg-white dark:bg-[#0e1725] rounded">
            <div className="space-y-0.5">
              {cartArray.map((data: CartArrayInterface, ind) => (
                <CartItemComponent
                  index={ind}
                  data={data}
                  key={ind}
                  controllProductQtyHandle={controllProductQtyHandle}
                  updateDiscountPercent={(idx, discount) => {
                    const updatedCart = [...cartArray];
                    updatedCart[idx].discount_percent = discount;
                    setCartArray(updatedCart);
                  }}
                />
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-700 mt-auto rounded-b relative">
            <div
              className={`p-2 space-y-2 rounded dark:bg-[#0E1725] transition-all duration-300 ${
                isPanelShrunk ? "max-h-12 overflow-hidden" : "max-h-none"
              }`}
            >
              <button
                onClick={() => setIsPanelShrunk(!isPanelShrunk)}
                className="absolute -top-3 right-2 z-10 p-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-200 border-2 border-white dark:border-gray-700"
                type="button"
              >
                {isPanelShrunk ? <FaArrowsAltV /> : <FaArrowsAltV /> }
              </button>

              <PromoCodeComponent
                patientId={selectedPatient?.id}
                applyDiscountHandle={applyDiscountHandle}
              />

              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  {t("POS-Sales_k76")}
                </h1>
                <p className="text-xs">
                  ${grandTotalHandle(cartArray, 0).amount.toFixed(2)}
                </p>
              </div>
<div className="flex items-center justify-between">
  <h1 className="text-xs text-gray-700 dark:text-gray-300">
    {t("POS-Sales_k13")} %
  </h1>
  <div className="flex items-center gap-2">
    <p className="text-xs">
      {appliedDiscount
        ? `${Math.abs(
            grandTotalHandle(cartArray, appliedDiscount).discountAmount
          ).toFixed(2)} (${appliedDiscount}%)`
        : "NILL"}
    </p>
    {appliedDiscount > 0 && (
      <button
        onClick={() => {
          setAppliedDiscount(0);  // Reset the discount
          setDiscountInput("");    // Clear discount input field
          toast.success("Discount removed");  // Show success message
        }}
        className="text-xs text-red-500"
      >
        X {/* Cross symbol to remove discount */}
      </button>
    )}
    <button
      className={`text-xs px-2 py-0.5 rounded ${
        cartArray.length === 0
          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
          : "bg-blue-500 text-white"
      }`}
      disabled={cartArray.length === 0}
      onClick={() => {
        setDiscountInput(appliedDiscount !== 0 ? String(appliedDiscount) : "");
        setIsDiscountModalOpen(true);
      }}
    >
      Add
    </button>
  </div>
</div>

{/* Discount Modal */}
{isDiscountModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-md w-96 h-40 flex flex-col justify-between">
      <div>
        <h2 className="text-sm font-semibold mb-3 text-gray-800 dark:text-white">
          Enter Discount % (0 - 100)
        </h2>
        <input
          type="text"
          value={discountInput}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "") {
              setDiscountInput("");
              return;
            }
            if (/^\d{0,3}(\.\d{0,2})?$/.test(value)) {
              const num = Number.parseFloat(value);
              if (num <= 100) {
                setDiscountInput(value);
              }
            }
          }}
          placeholder="Enter % of discount"
          className="w-full p-2 border border-gray-400 focus:border-blue-600 rounded outline outline-1 outline-gray-300 focus:outline-blue-500 text-sm text-black dark:text-white dark:bg-[#122136]"
        />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button
          className="px-3 py-1 text-sm rounded bg-gray-400 text-white"
          onClick={() => setIsDiscountModalOpen(false)}
        >
          Cancel
        </button>
        <button
          className="px-3 py-1 text-sm rounded bg-blue-600 text-white"
          onClick={() => {
            const numValue =
              typeof discountInput === "string"
                ? Number.parseFloat(discountInput)
                : discountInput;
            if (numValue >= 0 && numValue <= 100) {
              setAppliedDiscount(numValue);  // Apply the discount
              setIsDiscountModalOpen(false);
            } else {
              toast.error("Discount must be between 0 and 100%");
            }
          }}
        >
          Apply
        </button>
      </div>
    </div>
  </div>
)}


              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  {t("POS-Sales_k78")}
                </h1>
                <p className="text-xs">
                  $
                  {grandTotalHandle(cartArray, appliedDiscount).amount.toFixed(
                    2
                  )}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  {t("POS-Sales_k32")}
                </h1>
                <p className="text-xs">
                  {creditAmount < 0
                    ? `-${Math.abs(creditAmount).toFixed(2)}`
                    : `${creditAmount.toFixed(2)}`}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  {t("POS-Sales_k42")}
                </h1>
                <p className="text-xs">
                  {/* ${(grandTotalHandle(cartArray, appliedDiscount).amount - creditAmount).toFixed(2)} */}
                  $
                  {(
                    grandTotalHandle(cartArray, appliedDiscount).amount +
                    creditAmount
                  ).toFixed(2)}
                </p>
              </div>

              <div className="flex items-center mb-2 space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <span
                    className={`w-4 h-4 flex items-center justify-center rounded-sm 
${payWithCash ? "bg-blue-600" : "bg-[#F1F4F9] dark:bg-[#374151]"} 
transition-colors`}
                  >
                    <input
                      type="checkbox"
                      checked={payWithCash}
                      onChange={() => {
                        setPayWithCash((prev) => !prev);
                        if (payWithCash && !payWithCard) setCardAmount(0);
                      }}
                      className="appearance-none w-full bg-slate-300 dark:bg-[#374151] rounded-md h-full"
                    />
                  </span>
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {t("POS-Sales_k90")}
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <span
                    className={`w-4 h-4 flex items-center justify-center rounded-sm 
${payWithCard ? "bg-blue-600" : "bg-[#F1F4F9] dark:bg-[#374151]"} 
transition-colors`}
                  >
                    <input
                      type="checkbox"
                      checked={payWithCard}
                      onChange={() => {
                        setPayWithCard((prev) => !prev);
                        if (payWithCard && !payWithCash) setReceivedAmount(0);
                      }}
                      className="appearance-none w-full bg-slate-300 dark:bg-[#374151] rounded-md h-full"
                    />
                  </span>
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {t("POS-Sales_k91")}
                  </span>
                </label>
              </div>

              {/* Modified payment input section - Receivables on left, inputs on right */}
              {(payWithCash || payWithCard) && (
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {t("POS-Sales_k99")}:
                  </span>

                  <div className="flex items-center gap-2">
                    {payWithCash && (
                      <div className="relative flex items-center">
                        <BsCashCoin
                          className="absolute left-2 text-gray-500 dark:text-gray-400"
                          size={14}
                        />
                        <span className="absolute left-6 ml-1 text-gray-500 dark:text-gray-400 text-xs">
                          $
                        </span>
                        <input
                          type="text"
                          value={cashInput}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (/^\d*\.?\d*$/.test(raw)) {
                              const normalized = raw.replace(
                                /^0+(?!\.)/,
                                raw === "0" ? "0" : ""
                              );
                              setCashInput(normalized);
                              setReceivedAmount(
                                Number.parseFloat(normalized) || 0
                              );
                            }
                          }}
                          placeholder="0.00"
                          className="w-20 pl-10 border border-gray-400 dark:border-blue-400 rounded-md text-sm focus:outline-none bg-[#f1f4f9] dark:bg-[#374151] text-black dark:text-white p-1"
                        />
                      </div>
                    )}

                    {payWithCash && payWithCard && (
                      <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                        +
                      </span>
                    )}

                    {payWithCard && (
                      <div className="relative flex items-center">
                        <FaCreditCard
                          className="absolute left-2 text-gray-500 dark:text-gray-400"
                          size={14}
                        />
                        <span className="absolute left-6 ml-1 text-gray-500 dark:text-gray-400 text-xs">
                          $
                        </span>
                        <input
                          type="text"
                          value={cardInput}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (/^\d*\.?\d*$/.test(raw)) {
                              const normalized = raw.replace(
                                /^0+(?!\.)/,
                                raw === "0" ? "0" : ""
                              );
                              setCardInput(normalized);
                              setCardAmount(Number.parseFloat(normalized) || 0);
                            }
                          }}
                          placeholder="0.00"
                          className="w-20 pl-10 border border-gray-400 dark:border-blue-400 rounded-md text-sm focus:outline-none bg-[#f1f4f9] dark:bg-[#374151] text-black dark:text-white p-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-1">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  {t("POS-Sales_k80")}
                </h1>
                <p className="text-xs text-gray-900 dark:text-white">
                  {creditUsed < 0
                    ? `-${Math.abs(creditUsed).toFixed(2)}`
                    : `${creditUsed.toFixed(2)}`}
                </p>
              </div>

              <div className="flex items-center justify-between mt-1">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  {t("POS-Sales_k100")}
                </h1>
                <p className="text-xs text-gray-900 dark:text-white">{`${totalPaid.toFixed(
                  2
                )}`}</p>
              </div>

              <div className="flex justify-end pt-0.5">
                <button
                  onClick={placeOrderHandle}
                  disabled={
                    !cartArray.length ||
                    totalPaid > subtotal ||
                    creditUsed > (selectedLocation?.balance ?? 0) ||
                    ((payWithCash || payWithCard) &&
                      totalPaid === 0 &&
                      creditUsed === 0)
                  }
                  className={`      rounded py-1 px-3 text-white w-1/2       flex justify-between items-center text-sm      ${
                    !cartArray.length ||
                    totalPaid > subtotal ||
                    creditUsed > (selectedLocation?.balance ?? 0) ||
                    ((payWithCash || payWithCard) &&
                      totalPaid === 0 &&
                      creditUsed === 0)
                      ? "bg-blue-600"
                      : "bg-blue-600"
                  }      ${
                    !cartArray.length ||
                    totalPaid > subtotal ||
                    creditUsed > (selectedLocation?.balance ?? 0) ||
                    ((payWithCash || payWithCard) &&
                      totalPaid === 0 &&
                      creditUsed === 0)
                      ? "opacity-50"
                      : ""
                  }    `}
                >
                  {placeOrderLoading ? (
                    <CircularProgress size={14} color="secondary" />
                  ) : (
                    <>
                      <span className="font-medium">{`${totalPaid.toFixed(
                        2
                      )}`}</span>
                      <PiCaretCircleRightFill size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        show={showOtherLocationModal}
        onClose={() => setShowOtherLocationModal(false)}
      >
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
          <div className="mb-2">
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-200">
              Select Location
            </label>
            <select
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1"
              value={String(otherLocationId ?? "")}
              onChange={(e) =>
                handleOtherLocationChange(Number(e.target.value))
              }
            >
              <option value="">Select Location</option>
              {locations.map((loc: any) => (
                <option
                  key={String(loc.id)}
                  value={String(loc.id)}
                  disabled={loc.id === selectedLocation?.id}
                >
                  {loc.title || loc.name}
                  {loc.id === selectedLocation?.id ? " (Current Location)" : ""}
                </option>
              ))}
            </select>
          </div>

          {otherLocationId && (
            <div className="mb-2">
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-200">
                Select Category
              </label>
              <select
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1"
                value={String(otherLocationCategoryId ?? "")}
                onChange={(e) =>
                  handleOtherLocationCategoryChange(Number(e.target.value))
                }
              >
                <option value="">Select Category</option>
                {otherLocationCategories.map((cat: any) => (
                  <option
                    key={String(cat.category_id)}
                    value={String(cat.category_id)}
                  >
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {otherLocationCategoryId && (
            <div className="mb-2">
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-200">
                Select Product
              </label>
              <select
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1"
                value={String(otherLocationProductId ?? "")}
                onChange={(e) =>
                  setOtherLocationProductId(Number(e.target.value))
                }
              >
                <option value="">Select Product</option>
                {otherLocationProducts.map((prod: any) => (
                  <option
                    key={String(prod.product_id)}
                    value={String(prod.product_id)}
                  >
                    {prod.product_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {otherLocationProductId !== null && (
            <div className="mb-2">
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-200">
                Quantity
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-lg font-bold text-gray-700 dark:text-gray-200 disabled:opacity-50"
                  onClick={() =>
                    setOtherLocationProductQty((qty) =>
                      Math.min(
                        otherLocationProducts.find(
                          (p: any) => p.product_id === otherLocationProductId
                        )?.quantity_available || 1,
                        qty + 1
                      )
                    )
                  }
                  disabled={
                    otherLocationProductQty >=
                    (otherLocationProducts.find(
                      (p: any) => p.product_id === otherLocationProductId
                    )?.quantity_available || 1)
                  }
                >
                  +
                </button>
              </div>
              <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                Available:{" "}
                {otherLocationProducts.find(
                  (p: any) => p.product_id === otherLocationProductId
                )?.quantity_available ?? 0}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
              onClick={handleAddOtherLocationProduct}
              disabled={
                !otherLocationId ||
                !otherLocationCategoryId ||
                !otherLocationProductId
              }
              type="button"
            >
              {t("POS-Sales_k8")}
            </button>
            <button
              className="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded text-xs hover:bg-gray-400 dark:hover:bg-gray-600"
              onClick={() => setShowOtherLocationModal(false)}
              type="button"
            >
              {t("POS-Sales_k18")}
            </button>
          </div>
        </div>
      </Modal>

      {/* <SplitToLocationModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        selectedProduct={selectedProduct}
        selectedCategory={categories.find((cat: any) => cat.category_id === selectedCategory)}
        onAddToCart={handleAddFromSplitModal}
        currentLocationId={selectedLocation?.id || 0}
      /> */}
    </main>
  );
};

export default Orders;
