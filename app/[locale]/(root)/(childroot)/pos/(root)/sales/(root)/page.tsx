"use client";
import React, { FC, useContext, useEffect, useState, useMemo } from "react";
import { Quantity_Field } from "@/components/Quantity_Field";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import { IoCloseOutline } from "react-icons/io5";
import { Select } from "flowbite-react";
import { PiCaretCircleRightFill } from "react-icons/pi";
import { FaHandshake, FaSearch, FaCheckCircle, FaClock } from "react-icons/fa";
import { useCategoriesClinica } from "@/hooks/useCategoriesClinica";
import { useProductsClinica } from "@/hooks/useProductsClinica";
import { useRouter } from "next/navigation";
import { CircularProgress } from "@mui/material";
import { currencyFormatHandle } from "@/helper/common_functions";
import { toast } from "sonner";
import { Searchable_Dropdown } from "@/components/Searchable_Dropdown";
import PromoCodeComponent from "@/components/PromoCodeComponent";
import { PromoCodeDataInterface } from "@/types/typesInterfaces";
import { formatPhoneNumber } from "@/utils/getCountryName";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { LocationContext } from "@/context";
import { TabContext } from "@/context";
import {
  fetch_content_service,
  update_content_service,
  create_content_service
} from "@/utils/supabase/data_services/data_services";
import axios from 'axios';
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
}
interface CartArrayInterface {
  product_id: number;
  quantity: number;
  product_name: string;
  category_name: string;
  category_id: number;
  price: number;
  quantity_available: number;
  fulfillment_location_id: number;
  fulfillment_location_name: string;
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

const grandTotalHandle = (cart: any[], discount = 0): { amount: number; discountAmount: number } => {
  const amount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (amount * discount) / 100;
  const total = amount - discountAmount;
  return {
    amount: total,
    discountAmount,
  };
};








const calcTotalAmount = (perItemAmount: number, qty: number) => {
  return currencyFormatHandle(perItemAmount * qty);
};

const CartItemComponent: FC<CartItemComponentInterface> = ({
  data,
  controllProductQtyHandle,
  index,
}) => {
  const {
    product_name,
    category_name,
    quantity,
    quantity_available,
    product_id,
    price,
    fulfillment_location_id,
    fulfillment_location_name,
  } = data;
  const { selectedLocation } = useContext(LocationContext);
  const isOtherLocation = fulfillment_location_id !== selectedLocation?.id;

  const qtyHandle = (type: string) => {
    let newQty = quantity;
    if (type === "inc") {
      newQty += 1;
    } else {
      newQty -= 1;
    }
    controllProductQtyHandle(product_id, newQty, price, index);
  };

  const removeItemHandle = () => {
    controllProductQtyHandle(product_id, 0, price, index);
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
        <div className="flex items-center space-x-3">
          <p className="font-bold text-[#121111] dark:text-white">
            {calcTotalAmount(price, quantity)}
          </p>
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
    </div>
  );
};

const Orders = () => {
  const { categories } = useCategoriesClinica(true);
  const { selectedLocation } = useContext(LocationContext);
  const { locations } = useLocationClinica();
  const [showOtherLocationModal, setShowOtherLocationModal] = useState(false);
  const [otherLocationId, setOtherLocationId] = useState<number | null>(null);
  const [otherLocationCategoryId, setOtherLocationCategoryId] = useState<number | null>(null);
  const [otherLocationProductId, setOtherLocationProductId] = useState<number | null>(null);
  const [otherLocationProductQty, setOtherLocationProductQty] = useState<number>(1);
  const [otherLocationProducts, setOtherLocationProducts] = useState<any[]>([]);
  const [otherLocationCategories, setOtherLocationCategories] = useState<any[]>([]);
  const [showFulfillmentModal, setShowFulfillmentModal] = useState(false);
  const [fulfillmentOrderRef, setFulfillmentOrderRef] = useState('');
  const [fulfillmentToken, setFulfillmentToken] = useState('');
  const [fulfillmentResults, setFulfillmentResults] = useState<any[]>([]);
  const [fulfillmentLoading, setFulfillmentLoading] = useState(false);
  const [fulfilledId, setFulfilledId] = useState<number | null>(null);

  // Add these at the top (state hooks):
  const [cashInput, setCashInput] = useState("0");
  const [cardInput, setCardInput] = useState("0");


  const [selectedPatient, setSelectedPatient] = useState<any>(null);
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
  const [addAmount, setAddAmount] = useState(0);
  const [addBalanceLoading, setAddBalanceLoading] = useState(false);
  const [payWithCash, setPayWithCash] = useState(true);
  const [payWithCard, setPayWithCard] = useState(false);
  const [cardAmount, setCardAmount] = useState<number>(0);

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
            selectParam: "balance"
          });
          // Assuming data contains at most one entry for a given patient_id
          const totalCredit = data && data.length > 0 ? data[0]?.balance : 0;
          setCreditAmount(totalCredit);

        } catch (error) {
          console.error("Error fetching credit balance:", error);
          setCreditAmount(0); // Set to 0 on error
        }
      } else {
        setCreditAmount(0); // Reset credit if no patient is selected
      }
    };

    fetchCreditBalance();
  }, [selectedPatient]); // Fetch credit when selectedPatient changes

  const quantityHandle = (qty: number) => {
    setProductQty(qty);
  };

  // Remove location dropdown from default add-to-cart
  // Default add to cart only uses current location
  const addToCartHandle = () => {
    const findCategory: any = categories.find(
      ({ category_id }: any) => +selectedProduct.category_id === +category_id
    );
    let addProduct: CartArrayInterface | null = null;
    if (findCategory && selectedLocation) {
      addProduct = {
        product_id: selectedProduct.product_id,
        product_name: selectedProduct.product_name,
        quantity: productQty,
        category_name: findCategory.category_name,
        category_id: findCategory.category_id,
        quantity_available: selectedProduct.quantity_available,
        price: selectedProduct.price,
        fulfillment_location_id: selectedLocation.id,
        fulfillment_location_name: selectedLocation.title || selectedLocation.name || "Unknown",
      };
      if (addProduct) {
        cartArray.push(addProduct);
        setCartArray([...cartArray]);
        selectProductHandle(0);
        setProductQty(0);
        getCategoriesByLocationId(0);
      }
    }
  };

  // Add from other location logic
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
    // Fetch categories for this location
    fetch_content_service({ table: 'categories' }).then((cats: any[]) => {
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
      table: 'inventory',
      matchCase: [
        { key: 'products.category_id', value: catId },
        { key: 'location_id', value: otherLocationId! },
        { key: 'archived', value: false },
        { key: 'products.archived', value: false }
      ],
      selectParam: ',products(price,category_id, product_name,archived, unlimited)',
      filterOptions: [
        { operator: 'not', column: 'products', value: null },
        { operator: 'neq', column: 'products.price', value: 0 }
      ]
    }).then((data: any[]) => {
      const formattedData = data.filter((elem) => elem.quantity > 0 || (elem.products.unlimited && elem.products.price > 0)).map(({ quantity, inventory_id, product_id, products: { price, product_name, category_id, unlimited } }: any) => {
        return {
          product_id: inventory_id,
          category_id,
          product_name: product_name,
          price,
          quantity_available: quantity,
          unlimited,
          main_product_id: product_id,
        }
      });
      setOtherLocationProducts(formattedData);
      setOtherLocationProductId(null);
    });
  };

  const handleAddOtherLocationProduct = () => {
    const findCategory: any = otherLocationCategories.find(({ category_id }: any) => +otherLocationCategoryId! === +category_id);
    const selectedProduct = otherLocationProducts.find((p: any) => p.product_id === otherLocationProductId);
    const fulfillmentLocation = locations.find((loc: any) => loc.id === otherLocationId);
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
        fulfillment_location_name: fulfillmentLocation.title || fulfillmentLocation.name || "Unknown",
      };
      if (addProduct) {
        cartArray.push(addProduct);
        setCartArray([...cartArray]);
        setShowOtherLocationModal(false);
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
      const { data } = await axios.post('/api/orders', {
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      const response = await fetch_content_service({
        table: "Locations",
        matchCase: [{ key: "id", value: selectedLocation.id }],
        selectParam: "balance,credit_limit"
      });
      const updatedLocation = response as Array<{ balance: number; credit_limit: number }>;
      if (updatedLocation && updatedLocation.length > 0) {
        selectedLocation.balance = updatedLocation[0].balance;
        selectedLocation.credit_limit = updatedLocation[0].credit_limit;
      }
      setCartArray([]);
      localStorage.removeItem("@pos-patient");
      setSelectedPatient(null);
      setCreditAmount(0);
      setReceivedAmount(0);
      setCardAmount(0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message, {
        style: {
          background: "var(--background)",
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

  // // Calculate displayedBalanceLimit whenever relevant state changes
  // const displayedBalanceLimit = React.useMemo(() => {
  //   // Ensure selectedLocation and its balance are available
  //   if (!selectedLocation || selectedLocation.balance === undefined) {
  //     return 0; // Or handle this case as appropriate, maybe return selectedLocation.balance if it exists but is 0
  //   }


  //   const subtotal = grandTotalHandle(cartArray, appliedDiscount).amount;
  //   const finalCreditAfterCheckout = receivedAmount - (subtotal - creditAmount);
  //   const displayedLimit = selectedLocation.balance + Math.min(0, finalCreditAfterCheckout);

  //   return Math.min(selectedLocation.credit_limit, Math.max(0, displayedLimit));

  // }, [selectedLocation, receivedAmount, cartArray, appliedDiscount, creditAmount]);
  // console.log("🧮 displayedBalanceLimit:", displayedBalanceLimit);

  const subtotal = grandTotalHandle(cartArray, appliedDiscount).amount + creditAmount;
  console.log("🔢 Subtotal:", subtotal);


  const creditUsed = useMemo(() => {
    const paid = receivedAmount + cardAmount;
    const rawCreditNeeded = subtotal - paid;

    // ✅ Use actual available balance from DB (not predictive)
    const availableCredit = Math.max(0, selectedLocation?.balance ?? 0);

    const result = Math.min(Math.max(0, rawCreditNeeded), availableCredit);

    console.log("🧮 Subtotal:", subtotal);
    console.log("💵 Paid (Cash + Card):", paid);
    console.log("📉 Raw Credit Needed:", rawCreditNeeded);
    console.log("✅ Available Credit (from DB):", availableCredit);
    console.log("📌 Final Credit Used:", result);

    return result;
  }, [receivedAmount, cardAmount, subtotal, selectedLocation]);




  const displayedBalanceLimit = React.useMemo(() => {
    if (!selectedLocation || selectedLocation.balance === undefined) {
      return 0;
    }

    return Math.max(0, selectedLocation.balance - creditUsed);
  }, [selectedLocation, creditUsed]);




  const finalCredit = useMemo(() => {
    const totalDue = grandTotalHandle(cartArray, appliedDiscount).amount;
    const totalPaid = receivedAmount + cardAmount;
    return totalDue - totalPaid; // This is the new balance (amount owed)
  }, [receivedAmount, cardAmount, cartArray, appliedDiscount]);


  // Calculate credit used
  // const creditUsed = useMemo(() => {
  //   const totalDue = grandTotalHandle(cartArray, appliedDiscount).amount;
  //   const paid = receivedAmount + cardAmount;
  //   return Math.max(0, totalDue - paid);
  // }, [receivedAmount, cardAmount, cartArray, appliedDiscount]);


  // Handler to add balance
  const handleAddBalance = async () => {
    if (!selectedPatient?.id || isNaN(addAmount) || addAmount === 0) return;
    setAddBalanceLoading(true);
    try {
      // Fetch current credit (to avoid race conditions)
      const data: any = await fetch_content_service({
        table: "credit_audit",
        matchCase: [{ key: "patient_id", value: selectedPatient.id }],
        selectParam: "balance,id"
      });
      let newBalance = addAmount;
      let creditAuditId = null;
      if (data && data.length > 0) {
        newBalance = Number(data[0].balance) - Number(addAmount);
        creditAuditId = data[0].id;
        // Update existing
        await update_content_service({
          table: "credit_audit",
          post_data: { id: creditAuditId, balance: newBalance },
        });
      } else {
        // Insert new
        await create_content_service({
          table: "credit_audit",
          post_data: { patient_id: selectedPatient.id, balance: newBalance },
        });
      }
      // Add to transaction_history
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
    // Prevent both from being unchecked
    if (!payWithCash && !payWithCard) setPayWithCash(true);
  }, [payWithCash, payWithCard]);

  const totalPaid = (payWithCash ? receivedAmount : 0) + (payWithCard ? cardAmount : 0);

  const handleFulfillmentSearch = async () => {
    if (!fulfillmentOrderRef || !fulfillmentToken) return;
    setFulfillmentLoading(true);
    try {
      const response = await fetch('/api/fulfillment/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderRef: fulfillmentOrderRef,
          token: fulfillmentToken,
          location_id: selectedLocation.id
        })
      });
      const data = await response.json();
      if (data.success) {
        setFulfillmentResults(data.data);
      } else {
        toast.error(data.message || 'No fulfillment requests found');
        setFulfillmentResults([]);
      }
    } catch (error) {
      toast.error('Error searching fulfillment requests');
      setFulfillmentResults([]);
    } finally {
      setFulfillmentLoading(false);
    }
  };

  const handleFulfillmentMarkAsFulfilled = async (requestId: number) => {
    setFulfillmentLoading(true);
    try {
      const response = await fetch('/api/fulfillment/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Request marked as fulfilled');
        setFulfilledId(requestId);
        // Refresh results
        handleFulfillmentSearch();
      } else {
        toast.error(data.message || 'Failed to mark as fulfilled');
      }
    } catch (error) {
      toast.error('Error marking as fulfilled');
    } finally {
      setFulfillmentLoading(false);
    }
  };

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
                      className="flex items-center gap-2 px-4 py-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
                      onClick={() => setShowFulfillmentModal(true)}
                      type="button"
                    >
                      <FaHandshake className="text-sm" />
                      <span className="font-medium">Fulfillment Pickup</span>
                    </button>
                    <button
                      className="ml-2 px-3 py-1 bg-blue-600 text-white rounded  hover:bg-blue-700"
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
                          {currencyFormatHandle(
                            (selectedProduct?.price || 0)
                          )}
                          /unit
                        </p>

                        <p>
                          Total Cost {currencyFormatHandle(
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

              <div className="flex">
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
                  className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                  onClick={openOtherLocationModal}
                  type="button"
                >
                  Add from Other Location
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
                  {t("POS-Sales_k30")}: <span className={`font-bold`}>
                    {/* Calculate and display adjusted Balance Limit if Final Credit is negative */}
                    {/* Display calculated adjusted Balance Limit */}
                    {`$${selectedLocation?.credit_limit?.toFixed(2)}`}
                  </span>
                </h1>
              </div>
              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  {t("POS-Sales_k29")}: <span className={`font-bold ${displayedBalanceLimit < 0 ? 'text-red-500 dark:text-red-400' : ''}`}>
                    {isBalanceLoading ? (
                      <div className="inline-flex items-center">
                        {/* <CircularProgress size={14} className="mr-1" /> */}
                        <span className="text-xs opacity-35 font-light">Updating...</span>
                      </div>
                    ) : (
                      `$${displayedBalanceLimit.toFixed(2)}`
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
                />
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-700 mt-auto rounded-b">
            <div className="p-2 space-y-2 rounded dark:bg-[#0E1725]">
              <PromoCodeComponent
                patientId={selectedPatient?.id}
                applyDiscountHandle={applyDiscountHandle}
              />

              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  Discount %
                </h1>
                <p className="text-xs">
                  {appliedDiscount
                    ? `-${grandTotalHandle(cartArray, appliedDiscount).discountAmount.toFixed(2)}`
                    : "NILL"}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  Product Total
                </h1>
                <p className="text-xs">
                  ${grandTotalHandle(cartArray, appliedDiscount).amount.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  Patient Balance
                </h1>
                <p className="text-xs">
                  {creditAmount < 0 ? `-$${Math.abs(creditAmount).toFixed(2)}` : `$${creditAmount.toFixed(2)}`}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  Sub total
                </h1>
                <p className="text-xs">
                  {/* ${(grandTotalHandle(cartArray, appliedDiscount).amount - creditAmount).toFixed(2)} */}
                  ${(grandTotalHandle(cartArray, appliedDiscount).amount + creditAmount).toFixed(2)}
                </p>
              </div>

              <div className="flex items-center mb-2 space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payWithCash}
                    onChange={() => {
                      setPayWithCash((prev) => !prev);
                      if (payWithCash && !payWithCard) setCardAmount(0); // If unchecking last, keep at least one
                    }}
                    className="mr-1"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Cash</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payWithCard}
                    onChange={() => {
                      setPayWithCard((prev) => !prev);
                      if (payWithCard && !payWithCash) setReceivedAmount(0); // If unchecking last, keep at least one
                    }}
                    className="mr-1"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Card</span>
                </label>
              </div>

              {payWithCash && (
                <div className="flex items-center justify-between mt-1">
                  <h1 className="text-xs text-gray-700 dark:text-gray-300">
                    Cash Amount
                  </h1>
                  <div className="border border-gray-400 dark:border-blue-400 rounded-md text-xl font-bold focus:outline-none dark:bg-[#122136] dark:text-white text-black">
                    <input
                      type="text"
                      value={cashInput}
                      onChange={(e) => {
                        const raw = e.target.value;

                        // Allow only digits and optional decimal
                        if (/^[0-9]*\.?[0-9]*$/.test(raw)) {
                          const normalized = raw.replace(/^0+(?!\.)/, '') || '0';
                          setCashInput(normalized);
                          setReceivedAmount(parseFloat(normalized) || 0);
                        }
                      }}
                      className="w-40 border-gray-500 dark:border-blue-400 rounded-md text-lg font-bold focus:outline-none dark:bg-[#122136] dark:text-white bg-white text-right text-black p-1"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>
              )}

              {payWithCard && (
                <div className="flex items-center justify-between mt-1">
                  <h1 className="text-xs text-gray-700 dark:text-gray-300">
                    Card Amount
                  </h1>
                  <div className="border border-gray-400 dark:border-blue-400 rounded-md text-xl font-bold focus:outline-none dark:bg-[#122136] dark:text-white text-black">
                    <input
                      type="text"
                      value={cardInput}
                      onChange={(e) => {
                        const raw = e.target.value;

                        // Allow only digits and optional decimal
                        if (/^[0-9]*\.?[0-9]*$/.test(raw)) {
                          const normalized = raw.replace(/^0+(?!\.)/, '') || '0';
                          setCardInput(normalized);
                          setCardAmount(parseFloat(normalized) || 0);
                        }
                      }}
                      className="w-40 border-gray-500 dark:border-blue-400 rounded-md text-lg font-bold focus:outline-none dark:bg-[#122136] dark:text-white bg-white text-right text-black p-1"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>
              )}


              <div className="flex items-center justify-between mt-1">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  Credit Used
                </h1>
                <p className="text-xs text-gray-900 dark:text-white">
                  {creditUsed < 0 ? `-$${Math.abs(creditUsed).toFixed(2)}` : `$${creditUsed.toFixed(2)}`}
                </p>
              </div>

              <div className="flex items-center justify-between mt-1">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  Total Paid
                </h1>
                <p className="text-xs text-gray-900 dark:text-white">
                  {`$${totalPaid.toFixed(2)}`}
                </p>
              </div>

              <div className="flex justify-end pt-0.5">
                <button
                  onClick={placeOrderHandle}
                  disabled={!cartArray.length || totalPaid > subtotal || (receivedAmount + cardAmount + creditUsed !== subtotal)}
                  className={`
          rounded py-1 px-3 text-white w-1/2 
          flex justify-between items-center text-sm
          ${(totalPaid > subtotal || (receivedAmount + cardAmount + creditUsed !== subtotal))
                      ? 'bg-red-600'
                      : 'bg-blue-600'
                    }
          ${(!cartArray.length || totalPaid > subtotal || (receivedAmount + cardAmount + creditUsed !== subtotal))
                      ? 'opacity-50'
                      : ''
                    }
        `}
                >
                  {placeOrderLoading ? (
                    <CircularProgress size={14} color="secondary" />
                  ) : (
                    <>
                      <span className="font-medium">
                        {`$${totalPaid.toFixed(2)}`}
                      </span>
                      <PiCaretCircleRightFill size={16} />
                    </>
                  )}
                </button>

              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal show={showOtherLocationModal} onClose={() => setShowOtherLocationModal(false)}>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
          <div className="mb-2">
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-200">Select Location</label>
            <select
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1"
              value={String(otherLocationId ?? '')}
              onChange={e => handleOtherLocationChange(Number(e.target.value))}
            >
              <option value="">Select Location</option>
              {locations.map((loc: any) => (
                <option key={String(loc.id)} value={String(loc.id)} disabled={loc.id === selectedLocation?.id}>
                  {loc.title || loc.name}
                  {loc.id === selectedLocation?.id ? ' (Current Location)' : ''}
                </option>
              ))}
            </select>
          </div>
          {otherLocationId && (
            <div className="mb-2">
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-200">Select Category</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1"
                value={String(otherLocationCategoryId ?? '')}
                onChange={e => handleOtherLocationCategoryChange(Number(e.target.value))}
              >
                <option value="">Select Category</option>
                {otherLocationCategories.map((cat: any) => (
                  <option key={String(cat.category_id)} value={String(cat.category_id)}>{cat.category_name}</option>
                ))}
              </select>
            </div>
          )}
          {otherLocationCategoryId && (
            <div className="mb-2">
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-200">Select Product</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1"
                value={String(otherLocationProductId ?? '')}
                onChange={e => setOtherLocationProductId(Number(e.target.value))}
              >
                <option value="">Select Product</option>
                {otherLocationProducts.map((prod: any) => (
                  <option key={String(prod.product_id)} value={String(prod.product_id)}>{prod.product_name}</option>
                ))}
              </select>
            </div>
          )}
          {otherLocationProductId !== null && (
            <div className="mb-2">
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-200">Quantity</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-lg font-bold text-gray-700 dark:text-gray-200 disabled:opacity-50"
                  onClick={() => setOtherLocationProductQty(qty => Math.max(1, qty - 1))}
                  disabled={otherLocationProductQty <= 1}
                >
                  -
                </button>
                <span className="px-3 py-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded text-gray-900 dark:text-gray-100 min-w-[40px] text-center">
                  {otherLocationProductQty}
                </span>
                <button
                  type="button"
                  className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-lg font-bold text-gray-700 dark:text-gray-200 disabled:opacity-50"
                  onClick={() => setOtherLocationProductQty(qty => Math.min(
                    otherLocationProducts.find((p: any) => p.product_id === otherLocationProductId)?.quantity_available || 1,
                    qty + 1
                  ))}
                  disabled={
                    otherLocationProductQty >= (otherLocationProducts.find((p: any) => p.product_id === otherLocationProductId)?.quantity_available || 1)
                  }
                >
                  +
                </button>
              </div>
              <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                Available: {otherLocationProducts.find((p: any) => p.product_id === otherLocationProductId)?.quantity_available ?? 0}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
              onClick={handleAddOtherLocationProduct}
              disabled={!otherLocationId || !otherLocationCategoryId || !otherLocationProductId}
              type="button"
            >
              Add to Cart
            </button>
            <button
              className="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded text-xs hover:bg-gray-400 dark:hover:bg-gray-600"
              onClick={() => setShowOtherLocationModal(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
      <Modal show={showFulfillmentModal} onClose={() => setShowFulfillmentModal(false)} size="2xl">
        <Modal.Header className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center gap-3">
            <FaHandshake className="text-xl" />
            <h3 className="text-xl font-semibold">Fulfillment Pickup Portal</h3>
          </div>
        </Modal.Header>
        <Modal.Body className="p-6">
          {/* Search Section */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white flex items-center gap-2">
              <FaSearch className="text-blue-500" />
              Search Pickup Request
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order Reference</label>
                <input
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter order #"
                  value={fulfillmentOrderRef}
                  onChange={e => setFulfillmentOrderRef(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pickup Token</label>
                <input
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="Enter token"
                  value={fulfillmentToken}
                  onChange={e => setFulfillmentToken(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <button
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                  onClick={handleFulfillmentSearch}
                  disabled={fulfillmentLoading || !fulfillmentOrderRef || !fulfillmentToken}
                >
                  {fulfillmentLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <FaSearch />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div>
            <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Pickup Requests</h4>
            {fulfillmentResults.length === 0 && !fulfillmentLoading && (
              <div className="text-center py-8">
                <FaSearch className="mx-auto text-4xl text-gray-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No pickup requests found. Search by order reference and token.</p>
              </div>
            )}
            {fulfillmentResults.map(req => (
              <div key={req.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Reference</span>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">#{req.main_order_id}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Pickup Token</span>
                        <p className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">{req.token}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Product</span>
                        <p className="text-gray-900 dark:text-white">{req.product_name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantity</span>
                        <p className="text-gray-900 dark:text-white">{req.quantity} units</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
                      {req.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full text-sm font-medium">
                          <FaClock className="text-xs" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
                          <FaCheckCircle className="text-xs" />
                          Fulfilled
                        </span>
                      )}
                    </div>
                  </div>
                  {req.status === 'pending' && (
                    <button
                      className="ml-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                      onClick={() => handleFulfillmentMarkAsFulfilled(req.id)}
                      disabled={fulfillmentLoading || fulfilledId === req.id}
                    >
                      {fulfilledId === req.id ? (
                        <>
                          <FaCheckCircle />
                          <span>Fulfilled</span>
                        </>
                      ) : (
                        <>
                          <FaHandshake />
                          <span>Mark as Fulfilled</span>
                        </>
                      )}
                    </button>
                  )}
                  {req.status === 'fulfilled' && (
                    <div className="ml-4 flex items-center gap-2 text-green-600 dark:text-green-400">
                      <FaCheckCircle className="text-xl" />
                      <span className="font-semibold">✓ Fulfilled</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-gray-50 dark:bg-gray-800">
          <button
            className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            onClick={() => setShowFulfillmentModal(false)}
            type="button"
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </main>
  );
};

export default Orders;
