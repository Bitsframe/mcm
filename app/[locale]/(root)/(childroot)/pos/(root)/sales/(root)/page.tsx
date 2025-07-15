"use client";
import React, { FC, useContext, useEffect, useState, useMemo } from "react";
import { Quantity_Field } from "@/components/Quantity_Field";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import { IoCloseOutline } from "react-icons/io5";
import { PiCaretCircleRightFill } from "react-icons/pi";

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
import SplitToLocationModal from "@/components/SplitToLocationModal";

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
                Fulfillment at: {fulfillment_location_name}
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

  

  // Split to location modal state
  const [showSplitModal, setShowSplitModal] = useState(false);

  // Add these at the top (state hooks):
  const [cashInput, setCashInput] = useState('');
  const [cardInput, setCardInput] = useState('');


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
  const [addBalanceLoading, setAddBalanceLoading] = useState(false);
  const [payWithCash, setPayWithCash] = useState(true);
  const [payWithCard, setPayWithCard] = useState(false);
  const [cardAmount, setCardAmount] = useState<number>(0);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountInput, setDiscountInput] = useState<string>("");
  const [addAmount, setAddAmount] = useState(0);
const [addAmountInput, setAddAmountInput] = useState("");

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
  
      console.log("🛒 Placing order for patient:", selectedPatient);
      console.log("📦 Cart array:", cartArray);
      console.log("💸 Applied Discount:", appliedDiscount);
      console.log("💳 Card Amount:", cardAmount);
      console.log("💵 Cash Amount:", receivedAmount);
      console.log("🧾 Credit Amount:", creditAmount);
      console.log("💳 Credit Used (initial):", creditUsed);
      console.log("🌍 Selected Location:", selectedLocation);
  
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
  
      // Step 4: Update Locations.balance in DB using displayedBalanceLimit logic
      const totalAfterDiscount = grandTotalHandle(cartArray, appliedDiscount).amount;
      const totalPaid = (payWithCash ? receivedAmount : 0) + (payWithCard ? cardAmount : 0);
  
      console.log("🧮 Total After Discount:", totalAfterDiscount);
      console.log("💰 Total Paid:", totalPaid);
  
      let newBalance;
  
      if (totalPaid > totalAfterDiscount) {
        const newAmount = totalPaid - totalAfterDiscount;
        const newAmount2 = selectedLocation.balance - newAmount;
        newBalance = Number(newAmount2.toFixed(2));
        console.log("📉 Overpaid — Reducing balance by:", newAmount);
      } else {
        const amount = totalAfterDiscount - totalPaid;
        const creditUsedCalculated = creditUsed + amount;
        newBalance = Number((selectedLocation.balance + creditUsedCalculated).toFixed(2));
        console.log("📈 Underpaid — Increasing balance by credit used:", creditUsedCalculated);
      }
  
      console.log("🧾 New Location Balance (before DB update):", newBalance);
  
      await update_content_service({
        table: "Locations",
        post_data: {
          id: selectedLocation.id,
          balance: newBalance,
        },
      });
  
      // Step 5: Optionally update local state immediately
      selectedLocation.balance = newBalance;
  
      const response = await fetch_content_service({
        table: "Locations",
        matchCase: [{ key: "id", value: selectedLocation.id }],
        selectParam: "balance,credit_limit",
      });
  
      const updatedLocation = response as Array<{ balance: number; credit_limit: number }>;
  
      if (updatedLocation && updatedLocation.length > 0) {
        selectedLocation.balance = updatedLocation[0].balance;
        selectedLocation.credit_limit = updatedLocation[0].credit_limit;
        console.log("📥 Refreshed Location Balance & Limit from DB:", updatedLocation[0]);
      }
  
      // Reset UI
      setCartArray([]);
      localStorage.removeItem("@pos-patient");
      setSelectedPatient(null);
      setCreditAmount(0);
      setReceivedAmount(0);
      setCardAmount(0);
      setCardInput('');
      setCashInput('');
    } catch (err: any) {
      console.error("❌ Order placement failed:", err);
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

  const subtotal = grandTotalHandle(cartArray, appliedDiscount).amount + creditAmount;
  console.log("🔢 Subtotal:", subtotal);



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
    const productTotalAfterDiscount = grandTotalHandle(cartArray, appliedDiscount).amount;
  
    const creditNeeded = productTotalAfterDiscount - paid;
    const allowedCredit = Math.min(creditNeeded, creditAvailable);
  
    return Math.max(0, allowedCredit);
  }, [cashInput, cardInput, receivedAmount, cardAmount, creditAvailable, cartArray, appliedDiscount]);
  



  
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


  const isValidPayment = () => {
    if (!selectedLocation || cartArray.length === 0) return false;
  
    const totalDue = grandTotalHandle(cartArray, appliedDiscount).amount;
    const totalPaid = receivedAmount + cardAmount;
    const patientBalance = selectedLocation.balance;
  
    if (totalPaid > totalDue) {
      const overpay = totalPaid - totalDue;
      const resultBalance = patientBalance - overpay;
      return resultBalance >= 0;
    } else {
      const creditShort = totalDue - totalPaid;
      const resultBalance = patientBalance + creditUsed + creditShort;
      return resultBalance >= 0;
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
  type="text"
  inputMode="decimal"
  value={addAmountInput}
  onChange={(e) => {
    const raw = e.target.value;

    // Allow only valid float input (digits and optional one decimal point)
    if (/^\d*\.?\d{0,2}$/.test(raw)) {
      setAddAmountInput(raw); // update display text
      const parsed = parseFloat(raw);
      setAddAmount(isNaN(parsed) ? 0 : parsed); // store numeric value
    }

    // Clear state if input is empty
    if (raw === "") {
      setAddAmountInput("");
      setAddAmount(0);
    }
  }}
  placeholder="Enter amount"
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
                          
                          { Math.max(0, creditAmount - (addAmount || 0)).toFixed(2) }
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

              <div className="flex gap-2">
                <button
                  disabled={!productQty}
                  onClick={addToCartHandle}
                  className="bg-[#0066FF] my-2 text-white font-medium py-1 px-4 rounded hover:opacity-90 active:opacity-70 disabled:opacity-50 text-base"
                  type="submit"
                >
                  {t("POS-Sales_k8")}
                </button>
                <button
                  disabled={!selectedProduct || (selectedProduct.quantity_available - productQty) > 0 || selectedProduct?.unlimited}
                  onClick={() => setShowSplitModal(true)}
                  className="bg-orange-500 my-2 text-white font-medium py-1 px-4 rounded hover:opacity-90 active:opacity-70 disabled:opacity-50 text-base"
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
                  Product Total
                </h1>
                <p className="text-xs">
                  ${grandTotalHandle(cartArray, 0).amount.toFixed(2)}
                </p>
              </div>


 <div className="flex items-center justify-between">
  <h1 className="text-xs text-gray-700 dark:text-gray-300">Discount %</h1>
  <div className="flex items-center gap-2">
        <p className="text-xs">
        {appliedDiscount
          ? `$${Math.abs(grandTotalHandle(cartArray, appliedDiscount).discountAmount).toFixed(2)} (${appliedDiscount}%)`
          : "NILL"}
      </p>
    <button
      className={`text-xs px-2 py-0.5 rounded ${
        cartArray.length === 0
          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
          : 'bg-blue-500 text-white'
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

    // Allow empty value
    if (value === "") {
      setDiscountInput("");
      return;
    }

    // Allow only numeric input with optional decimal
    if (/^\d{0,3}(\.\d{0,2})?$/.test(value)) {
      const num = parseFloat(value);

      // Restrict max to 100
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
            const numValue = typeof discountInput === 'string' ? parseFloat(discountInput) : discountInput;
            if (numValue >= 0 && numValue <= 100) {
              setAppliedDiscount(numValue);
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
            Product Total After Discount
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
    <h1 className="text-xs text-gray-700 dark:text-gray-300">Cash Amount</h1>
    <div className="border border-gray-400 dark:border-blue-400 rounded-md text-xl font-bold focus:outline-none dark:bg-[#122136] dark:text-white text-black">
      <input
        type="text"
        value={cashInput}
        onChange={(e) => {
          const raw = e.target.value;
          // Only allow numbers and decimal (no letters)
          if (/^\d*\.?\d*$/.test(raw)) {
            const normalized = raw.replace(/^0+(?!\.)/, raw === '0' ? '0' : '');
            setCashInput(normalized);
            setReceivedAmount(parseFloat(normalized) || 0);
          }
        }}
        placeholder="Enter amount"
         className="w-40 border border-gray-50 rounded-md text-lg focus:outline-none dark:bg-[#122136] dark:text-white bg-white text-left text-black p-1"
      />
    </div>
  </div>
)}

{payWithCard && (
  <div className="flex items-center justify-between mt-1">
    <h1 className="text-xs text-gray-700 dark:text-gray-300">Card Amount</h1>
    <div className="border border-gray-400 dark:border-blue-400 rounded-md text-xl font-bold focus:outline-none dark:bg-[#122136] dark:text-white text-black">
      <input
        type="text"
        value={cardInput}
        onChange={(e) => {
          const raw = e.target.value;
          // Only allow numbers and decimal (no letters)
          if (/^\d*\.?\d*$/.test(raw)) {
            const normalized = raw.replace(/^0+(?!\.)/, raw === '0' ? '0' : '');

            setCardInput(normalized);
            setCardAmount(parseFloat(normalized) || 0);
          }
        }}
        placeholder="Enter amount"
        className="w-40 border-gray-500 dark:border-blue-400 rounded-md text-lg focus:outline-none dark:bg-[#122136] dark:text-white bg-white text-left text-black p-1"
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
  disabled={
    !cartArray.length ||
    totalPaid > subtotal ||
    creditUsed > (selectedLocation?.balance ?? 0)
  }
  className={`
    rounded py-1 px-3 text-white w-1/2 
    flex justify-between items-center text-sm
    ${
      (!cartArray.length ||
        totalPaid > subtotal ||
        creditUsed > (selectedLocation?.balance ?? 0))
        ? 'bg-red-600'
        : 'bg-blue-600'
    }
    ${
      (!cartArray.length ||
        totalPaid > subtotal ||
        creditUsed > (selectedLocation?.balance ?? 0))
        ? 'opacity-50'
        : ''
    }
  `}
>
  {placeOrderLoading ? (
    <CircularProgress size={14} color="secondary" />
  ) : (
    <>
      <span className="font-medium">{`$${totalPaid.toFixed(2)}`}</span>
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

      <SplitToLocationModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        selectedProduct={selectedProduct}
        selectedCategory={categories.find((cat: any) => cat.category_id === selectedCategory)}
        onAddToCart={handleAddFromSplitModal}
        currentLocationId={selectedLocation?.id || 0}
      />
    </main>
  );
};

export default Orders;
