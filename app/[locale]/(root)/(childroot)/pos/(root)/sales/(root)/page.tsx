"use client";
import React, { FC, useContext, useEffect, useState, useMemo } from "react";
import { Quantity_Field } from "@/components/Quantity_Field";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import { IoCloseOutline } from "react-icons/io5";
import { Select } from "flowbite-react";
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
  fetch_content_service
} from "@/utils/supabase/data_services/data_services";
import axios from 'axios';

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

const Payment_Method_Select = ({ handleSelectChange, selectedMethod }: any) => {
  return (
    <div className="w-30">
      <Select
        onChange={handleSelectChange}
        className="w-full border rounded-md text-xs focus:outline-none dark:bg-[#122136] dark:border-gray-700 dark:text-white bg-white text-black"
        id="section"
        required={true}
      >
        <option
          value="Cash"
          className="dark:bg-[#122136] dark:text-white text-black"
        >
          Cash
        </option>
        <option
          value="Debit Card"
          className="dark:bg-[#122136] dark:text-white text-black"
        >
          Debit Card
        </option>
      </Select>
    </div>
  );
};

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
  } = data;

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
    <div className="bg-[#F1F4F9] dark:bg-gray-800 py-2 px-3 rounded-md">
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
  const [selectedMethod, setSelectedMethod] = useState("Cash");
  const [lastLocationId, setLastLocationId] = useState(0);
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

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
    if (findCategory) {
      addProduct = {
        product_id: selectedProduct.product_id,
        product_name: selectedProduct.product_name,
        quantity: productQty,
        category_name: findCategory.category_name,
        category_id: findCategory.category_id,
        quantity_available: selectedProduct.quantity_available,
        price: selectedProduct.price,
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
        patient_id: selectedPatient.patientid,
        cartArray,
        appliedDiscount,
        creditAmount,
        receivedAmount,
        selectedMethod,
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

      // Wait for 2 seconds to allow trigger updates to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fetch updated location data
      const response = await fetch_content_service({
        table: "Locations",
        matchCase: [{ key: "id", value: selectedLocation.id }],
        selectParam: "balance,credit_limit"
      });

      const updatedLocation = response as Array<{ balance: number; credit_limit: number }>;

      if (updatedLocation && updatedLocation.length > 0) {
        // Update the selectedLocation context with new balance
        selectedLocation.balance = updatedLocation[0].balance;
        selectedLocation.credit_limit = updatedLocation[0].credit_limit;
      }

      setCartArray([]);
      localStorage.removeItem("@pos-patient");
      setSelectedPatient(null);
      setCreditAmount(0);
      setReceivedAmount(0);

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

  const selectPaymentHandle = (event: any) => {
    setSelectedMethod(event.target.value);
  };

  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k19");
  }, []);

  // Calculate displayedBalanceLimit whenever relevant state changes
  const displayedBalanceLimit = React.useMemo(() => {
    // Ensure selectedLocation and its balance are available
    if (!selectedLocation || selectedLocation.balance === undefined) {
      return 0; // Or handle this case as appropriate, maybe return selectedLocation.balance if it exists but is 0
    }
    const subtotal = grandTotalHandle(cartArray, appliedDiscount).amount;
    const finalCreditAfterCheckout = receivedAmount - (subtotal - creditAmount);
    const displayedLimit = selectedLocation.balance + Math.min(0, finalCreditAfterCheckout);
    return displayedLimit;
  }, [selectedLocation, receivedAmount, cartArray, appliedDiscount, creditAmount]);

  const finalCredit = useMemo(() => {
    return receivedAmount - (grandTotalHandle(cartArray, appliedDiscount).amount - creditAmount);
  }, [receivedAmount, cartArray, appliedDiscount, creditAmount]);

  const { t } = useTranslation(translationConstant.POSSALES);
  return (
    <main className="w-full h-full font-medium text-sm dark:bg-gray-900 dark:text-white">
      <div className="w-full p-1 grid grid-cols-1 md:grid-cols-3 gap-1">
        <div className="bg-[#F1F4F9] dark:bg-[#080E16] h-[65dvh] md:h-[60dvh] overflow-auto md:col-span-2 rounded w-full">
          <div className="space-y-3 dark:bg-[#080E16]">
            {fetchingDataLoading ? (
              <div className="w-full flex flex-col justify-center h-full space-y-1">
                <CircularProgress size={16} className="dark:text-white" />
                <h1 className="text-xs text-gray-400 dark:text-gray-300">
                  Fetching patient details
                </h1>
              </div>
            ) : (
              <div className="bg-[#F1F4F9] dark:bg-[#080E16] p-2 rounded shadow-sm">
                <h2 className="text-sm font-semibold mb-2 dark:text-white">
                  {t("POS-Sales_k3")}
                </h2>
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
                  Credit Limit: <span className={`font-bold`}>
                    {/* Calculate and display adjusted Balance Limit if Final Credit is negative */}
                    {/* Display calculated adjusted Balance Limit */}
                    {`$${selectedLocation?.credit_limit?.toFixed(2)}`}
                  </span>
                </h1>
              </div>
              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  Balance Available: <span className={`font-bold ${displayedBalanceLimit < 0 ? 'text-red-500 dark:text-red-400' : ''}`}>
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
                  {t("POS-Sales_k12")}
                </h1>
                <Payment_Method_Select
                  selectedMethod={selectedMethod}
                  handleSelectChange={selectPaymentHandle}
                />
              </div>

              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  {t("POS-Sales_k13")}%
                </h1>
                <p
                  className={`text-xs ${appliedDiscount
                    ? "text-red-500 dark:text-red-400"
                    : "text-gray-700 dark:text-gray-300"
                    }`}
                >
                  {appliedDiscount
                    ? `-${grandTotalHandle(cartArray, appliedDiscount)
                      .discountAmount
                    }`
                    : "NILL"}
                </p>
              </div>

              {/* Sub Total */}
              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  Sub total
                </h1>
                <p className="text-xs text-gray-900 dark:text-white">
                  ${grandTotalHandle(cartArray, appliedDiscount).amount.toFixed(2)}
                </p>
              </div>

              {/* Display Fetched Credit */}
              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  {t("POS-Sales_k32")}
                </h1>
                <p className="text-xs text-gray-900 dark:text-white">
                  {creditAmount < 0 ? `-$${Math.abs(creditAmount).toFixed(2)}` : `$${creditAmount.toFixed(2)}`}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  {t("POS-Sales_k14")}
                </h1>
                <p className="text-xs text-gray-900 dark:text-white">
                  ${(grandTotalHandle(cartArray, appliedDiscount).amount - creditAmount).toFixed(2)}
                </p>
              </div>


              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  {t("POS-Sales_k33")}
                </h1>
                <div className="border  border-gray-400 dark:border-blue-400 rounded-md text-xl font-bold focus:outline-none dark:bg-[#122136] dark:text-white  text-black ">
                  <input
                    type="number"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                    className="w-40  border-gray-500 dark:border-blue-400 rounded-md text-lg font-bold focus:outline-none dark:bg-[#122136] dark:text-white bg-white text-right text-black p-1"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Display Calculated Final Credit */}
              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  {t("POS-Sales_k34")}
                </h1>
                <p className="text-xs text-gray-900 dark:text-white">
                  {finalCredit < 0 ? `-$${Math.abs(finalCredit).toFixed(2)}` : `$${finalCredit.toFixed(2)}`}
                </p>
              </div>

              <div className="flex justify-end pt-0.5">
                <button
                  onClick={placeOrderHandle}
                  disabled={!cartArray.length || displayedBalanceLimit < 0}
                  className="bg-blue-600 rounded py-1 px-3 text-white w-1/2 disabled:opacity-50 flex justify-between items-center text-sm"
                >
                  {placeOrderLoading ? (
                    <CircularProgress size={14} color="secondary" />
                  ) : (
                    <>
                      <span className="font-medium">
                        ${receivedAmount}
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
    </main>
  );
};

export default Orders;
