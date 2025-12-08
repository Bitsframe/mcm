import { fetch_content_service, update_content_service } from "@/utils/supabase/data_services/data_services";
import { translationConstant } from "@/utils/translationConstants";
import { CircularProgress } from "@mui/material";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { CiSearch } from "react-icons/ci";
import PatientPreviousRecord from "./PatientPreviousRecord";
import { TableRowRender } from "@/components/salesHistory/RenderRow";
import { calcTotalAmount, tableHeader } from "@/components/salesHistory/utils";
import { DataListInterface, OrderDetailsModalProps } from "./types/interfaces";
import { PatientDetailsRender } from "./PatientDetailsRender";
import axios from "axios";
import { toast } from "sonner";
import moment from "moment";
import { ArrowLeftFromLine, ArrowRightFromLine } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  orderDetails,
  preDefinedReasonList,
}) => {
  const [dataList, setDataList] = useState<DataListInterface>({});
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [historyRecord, setHistoryRecord] = useState([]);
  const [returnedItems, setReturnedItems] = useState<Set<string>>(new Set());
  const { order_id, pos, patient_id } = orderDetails || {};

  // Keep stable refs for values used inside the fetch effect so
  // we don't need to add them to the effect dependency array
  // (prevents unwanted re-fetches when page or pos.patientid change).
  const pageRef = useRef<number>(page);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const patientIdRef = useRef<string | undefined>(pos?.patientid);
  useEffect(() => {
    patientIdRef.current = pos?.patientid;
  }, [pos?.patientid]);

  const renderIndexHandle = (fetched_data: any, index: number) => {
    const currentOrderData = fetched_data?.[index] || {};
    setDataList(currentOrderData);
    
    // Console log discount data
    console.log("=== DISCOUNT DATA DEBUG ===");
    console.log("Full order data:", currentOrderData);
    console.log("Discounts array:", currentOrderData.discounts);
    console.log("Number of discounts:", currentOrderData.discounts?.length || 0);
    if (currentOrderData.discounts?.length > 0) {
      currentOrderData.discounts.forEach((discount: any, idx: number) => {
        console.log(`Discount ${idx + 1}:`, discount);
      });
    }
    console.log("=== CREDIT BALANCE DEBUG ===");
    console.log("Cash:", currentOrderData.cash);
    console.log("Card:", currentOrderData.card);
    console.log("Previous Credit Amount:", currentOrderData.previous_credit_amount);
    console.log("Credit Balance:", currentOrderData.credit_balance);
    console.log("Available fields:", Object.keys(currentOrderData));
    console.log("=========================")
    
    const listHistory = currentOrderData?.sales_history || [];
    const returnedItemsSet = new Set<string>();
    listHistory.forEach((item: any) => {
      if (item.return_qty > 0) {
        returnedItemsSet.add(item.inventory?.products?.product_name);
      }
    });
    setReturnedItems(returnedItemsSet);
    setSalesHistory(listHistory);
  };

  const totalPages = useMemo(() => historyRecord.length, [historyRecord]);

  const changeHistoryHandle = (direction: "prev" | "next") => {
    setPage((prev) => {
      let newPage = prev;
      if (direction === "prev" && prev > 1) newPage = prev - 1;
      if (direction === "next" && prev < totalPages) newPage = prev + 1;

      if (newPage > 0 && newPage <= totalPages) {
        renderIndexHandle(historyRecord, newPage - 1);
      }

      return newPage;
    });
  };

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        const response = await axios.post("/api/previous-order-history", {
          patientId: patientIdRef.current,
          currentOrderId: order_id,
        });

        const fetched_data = response?.data?.data || [];
        setHistoryRecord(fetched_data);
        renderIndexHandle(fetched_data, pageRef.current - 1);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        toast.error(errorMessage);
        console.error("Error fetching patient history:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [order_id]);

  const searchProductHandle = (e: any) => {
    const val = e.target.value;
    if (val === "") {
      setSalesHistory(dataList.sales_history);
    } else {
      const filteredData = dataList.sales_history.filter((elem: any) =>
        elem?.inventory?.products?.product_name
          ?.toLocaleLowerCase()
          .includes(val.toLocaleLowerCase())
      );
      setSalesHistory([...filteredData]);
    }
  };

  const hasReturnedHandle = (val: boolean, productName: string) => {
    setReturnedItems(prev => {
      const newSet = new Set(prev);
      if (val) {
        newSet.add(productName);
      } else {
        newSet.delete(productName);
      }
      return newSet;
    });
  };

  const { t } = useTranslation(translationConstant.POSHISTORY);
  // UI state for editable payment method dropdown
  type PaymentOption = "Cash" | "Card" | "Card & Cash";
  const [paymentMethodUI, setPaymentMethodUI] = useState<PaymentOption | undefined>(undefined);
  // Local editable inputs for cash/card amounts when Card & Cash is selected
  const [cashInput, setCashInput] = useState<string>("");
  const [cardInput, setCardInput] = useState<string>("");
  // When splitting totals between cash & card this holds the total that must be preserved
  const [splitTotal, setSplitTotal] = useState<number>(0);
  // Track whether amounts have been saved (render as non-editable)
  const [amountsSaved, setAmountsSaved] = useState<boolean>(false);
  // When true the cash/card inputs are editable (entered by clicking the amount)
  const [amountsEditable, setAmountsEditable] = useState<boolean>(false);

  // Initialize dropdown from database values when data loads
  useEffect(() => {
    const cashVal = !!dataList?.cash;
    const cardVal = !!dataList?.card;
    let init: PaymentOption | undefined = undefined;
    if (cashVal && cardVal) init = "Card & Cash";
    else if (cashVal) init = "Cash";
    else if (cardVal) init = "Card";
    setPaymentMethodUI(init);
    // Sync editable inputs with latest values
    const currentCash = Number(dataList?.cash || 0);
    const currentCard = Number(dataList?.card || 0);
    setCashInput(dataList?.cash != null ? String(Number(dataList.cash).toFixed(2)) : "");
    setCardInput(dataList?.card != null ? String(Number(dataList.card).toFixed(2)) : "");
    // Keep the total that should be split when in editable mode
    setSplitTotal(Number((currentCash + currentCard).toFixed(2)));
  }, [dataList?.cash, dataList?.card]);

  // Persist cash/card values to backend when edited (called onBlur)
  const persistCashCard = async (newCashStr: string, newCardStr: string) => {
    try {
      const newCash = newCashStr === "" ? 0 : Number(Number(newCashStr).toFixed(2));
      const newCard = newCardStr === "" ? 0 : Number(Number(newCardStr).toFixed(2));

      // Avoid unnecessary updates
      if (Number(dataList?.cash || 0) === newCash && Number(dataList?.card || 0) === newCard) return;

      await update_content_service({
        table: "orders",
        post_data: {
          order_id: dataList?.order_id,
          cash: newCash,
          card: newCard,
        },
        matchKey: "order_id",
      });

      // Optimistically update local state
      setDataList((prev: any) => ({ ...prev, cash: newCash, card: newCard }));
      // mark amounts saved so fields render as text
      setAmountsSaved(true);
    } catch (e: any) {
      console.error("Failed to persist cash/card amounts", e);
      toast.error(e?.message || "Failed to save amounts");
      // Re-sync inputs from server state in case of failure
      setCashInput(dataList?.cash != null ? String(Number(dataList.cash).toFixed(2)) : "");
      setCardInput(dataList?.card != null ? String(Number(dataList.card).toFixed(2)) : "");
    }
  };

  // (No checkbox state) Reset behaviors handled elsewhere

  return isOpen ? (
    <div className="fixed inset-0 z-50 dark:bg-black/60 flex items-center justify-center backdrop-blur-sm">
      {loading ? (
        <div className="h-full w-full flex justify-center items-center">
          <CircularProgress />
        </div>
      ) : (
        <div className="bg-white dark:bg-[#080e16] rounded-lg shadow-xl w-[85%] max-w-5xl mt-6 max-h-[80vh] flex flex-col">
          {/* Fixed Header Section */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#080e16] rounded-t-lg sticky top-0 z-10">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              {t("POS-Historyk11")}# {order_id} {t("POS-Historyk10")}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                Patient ID: <strong className="text-gray-800 dark:text-gray-200">{pos?.patientid || patient_id}</strong>
              </span>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <span className="text-2xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  &times;
                </span>
              </button>
            </div>
          </div>

          {/* Scrollable Content Section */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Patient Details and Invoice Summary */}
            <div className="mb-4 p-4 bg-gray-50 dark:bg-[#080e16] rounded-lg">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Side - Patient Details */}
                <div className="flex-1">
                  <PatientDetailsRender
                    order_id={order_id}
                    patientData={{...dataList?.pos, patientid:patient_id}}
                    paymentType={
                      {cash: dataList?.cash, card: dataList?.card}
                    }
                  />
                </div>
                
                {/* Right Side - Invoice Summary */}
                <div className="lg:w-80 bg-white dark:bg-[#0e1725] rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <h4 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">Invoice Summary</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Invoice Date:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {(() => {
                          // Extract date part directly from ISO string without timezone conversion
                          const dateString = dataList?.order_date?.split('T')[0]; // YYYY-MM-DD
                          if (!dateString) return 'N/A';
                          const [year, month, day] = dateString.split('-');
                          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          return `${day} ${months[parseInt(month) - 1]} ${year}`;
                        })()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                        <div className="flex items-center gap-2">
                        {/* indicator removed: no inline '(Card & Cash)' label */}
                        <Select
                          value={paymentMethodUI}
                          onValueChange={async (v: PaymentOption) => {
                            try {
                              // If user selects combined option, enable editable inputs immediately
                              if (v === "Card & Cash") {
                                setPaymentMethodUI(v);
                                setAmountsSaved(false);
                                setCashInput(dataList?.cash != null ? String(Number(dataList.cash).toFixed(2)) : "");
                                setCardInput(dataList?.card != null ? String(Number(dataList.card).toFixed(2)) : "");
                                setSplitTotal(Number((Number(dataList?.cash || 0) + Number(dataList?.card || 0)).toFixed(2)));
                                return;
                              }

                              // For singular modes (Card or Cash) move the full total to the selected side and persist immediately
                              const total = Number(dataList?.cash || 0) + Number(dataList?.card || 0);
                              let newCash = 0;
                              let newCard = 0;
                              if (v === "Cash") {
                                newCash = total;
                                newCard = 0;
                              } else if (v === "Card") {
                                newCard = total;
                                newCash = 0;
                              }

                              // If values didn't change, just set the UI and return
                              if (newCash === Number(dataList?.cash || 0) && newCard === Number(dataList?.card || 0)) {
                                setPaymentMethodUI(v);
                                setAmountsSaved(true);
                                return;
                              }

                              // Persist immediately
                              await update_content_service({
                                table: "orders",
                                post_data: {
                                  order_id: dataList?.order_id,
                                  cash: newCash,
                                  card: newCard,
                                },
                                matchKey: "order_id",
                              });

                              // Update UI state
                              setDataList((prev: any) => ({ ...prev, cash: newCash, card: newCard }));
                              setPaymentMethodUI(v);
                              setAmountsSaved(true);
                              // also update inputs in case user switches back to Card & Cash
                              setCashInput(String(newCash.toFixed(2)));
                              setCardInput(String(newCard.toFixed(2)));
                            } catch (e: any) {
                              console.error("Failed to update payment method", e);
                              toast.error(e?.message || "Failed to update payment method");
                            }
                          }}
                        >
                          <SelectTrigger className="w-[110px] h-8 bg-white dark:bg-[#0e1725] border border-gray-200 dark:border-gray-600 text-sm">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-[#080e16] border dark:border-[#0e1725]">
                            <SelectGroup>
                              <SelectItem value="Card & Cash" className="text-sm">Card & Cash</SelectItem>
                              <SelectItem value="Cash" className="text-sm">Cash</SelectItem>
                              <SelectItem value="Card" className="text-sm">Card</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {/* Save button next to Payment Method - visible only when editing split amounts */}
                        {paymentMethodUI === "Card & Cash" && !amountsSaved && amountsEditable && (
                          <button
                            type="button"
                            onClick={() => persistCashCard(cashInput, cardInput)}
                            disabled={(() => {
                              const currentCash = Number(Number(cashInput || 0).toFixed(2));
                              const currentCard = Number(Number(cardInput || 0).toFixed(2));
                              const sum = Number((currentCash + currentCard).toFixed(2));
                              const matchesTotal = Math.abs(sum - Number(splitTotal)) < 0.005;
                              const unchanged =
                                Number(dataList?.cash || 0) === currentCash &&
                                Number(dataList?.card || 0) === currentCard;
                              return !(matchesTotal && !unchanged);
                            })()}
                            aria-label="Save"
                            title="Save"
                            className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                              <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L8 11.086l6.793-6.793a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Cash Amount:</span>
                      {paymentMethodUI === "Card & Cash" ? (
                        amountsSaved || !amountsEditable ? (
                          <span
                            onClick={() => {
                              if (!amountsSaved) setAmountsEditable(true);
                            }}
                            className="font-medium text-gray-800 dark:text-gray-200 cursor-pointer"
                          >
                            ${(() => {
                              const cashAmt = Number(dataList?.cash) || 0;
                              return cashAmt.toFixed(2);
                            })()}
                          </span>
                        ) : (
                          <div className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="text-gray-600">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={cashInput}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const parsed = raw === "" ? 0 : Number(raw);
                                const clamped = isNaN(parsed) ? 0 : parsed;
                                const other = Number((splitTotal - clamped).toFixed(2));
                                setCashInput(clamped === 0 ? "" : String(clamped.toFixed(2)));
                                setCardInput(String(Math.max(0, other).toFixed(2)));
                              }}
                              className="w-28 bg-white dark:bg-[#0e1725] border border-gray-200 dark:border-gray-600 text-sm px-2 py-1 rounded"
                            />
                          </div>
                        )
                      ) : (
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          ${(() => {
                            const cashAmt = Number(dataList?.cash) || 0;
                            return cashAmt.toFixed(2);
                          })()}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Card Amount:</span>
                      {paymentMethodUI === "Card & Cash" ? (
                        amountsSaved || !amountsEditable ? (
                          <span
                            onClick={() => {
                              if (!amountsSaved) setAmountsEditable(true);
                            }}
                            className="font-medium text-gray-800 dark:text-gray-200 cursor-pointer"
                          >
                            ${(() => {
                              const cardAmt = Number(dataList?.card) || 0;
                              return cardAmt.toFixed(2);
                            })()}
                          </span>
                        ) : (
                          <div className="font-medium text-gray-800 dark:text-gray-200 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={cardInput}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const parsed = raw === "" ? 0 : Number(raw);
                                  const clamped = isNaN(parsed) ? 0 : parsed;
                                  const other = Number((splitTotal - clamped).toFixed(2));
                                  setCardInput(clamped === 0 ? "" : String(clamped.toFixed(2)));
                                  setCashInput(String(Math.max(0, other).toFixed(2)));
                                }}
                                className="w-28 bg-white dark:bg-[#0e1725] border border-gray-200 dark:border-gray-600 text-sm px-2 py-1 rounded"
                              />
                            </div>
                            {(() => {
                              const currentCash = Number(Number(cashInput || 0).toFixed(2));
                              const currentCard = Number(Number(cardInput || 0).toFixed(2));
                              const sum = Number((currentCash + currentCard).toFixed(2));
                              if (Math.abs(sum - Number(splitTotal)) > 0.005) {
                                return (
                                  <div className="text-sm text-red-600">{"Sum must equal $" + Number(splitTotal).toFixed(2)}</div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )
                      ) : (
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          ${(() => {
                            const cardAmt = Number(dataList?.card) || 0;
                            return cardAmt.toFixed(2);
                          })()}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Gross Amount:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        ${(() => {
                          const total = dataList?.sales_history?.reduce((sum: number, item: any) => 
                            sum + (item.total_price || 0), 0) || 0;
                          return total.toFixed(2);
                        })()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Discount({(() => {
                          const cartDiscount = dataList?.discounts?.find((d: any) => 
                            d.discount_type === 'cart' && d.product_id === null
                          );
                          return cartDiscount ? `${cartDiscount.discount_amount}%` : '0%';
                        })()}):
                      </span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        -${(() => {
                          const cartDiscount = dataList?.discounts?.find((d: any) => 
                            d.discount_type === 'cart' && d.product_id === null
                          );
                          return cartDiscount ? cartDiscount.discount_value.toFixed(2) : '0.00';
                        })()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Product Discount:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        -${(() => {
                          let totalProductDiscount = 0;
                          
                          // Calculate sum of all product-level discounts
                          if (dataList?.sales_history && dataList?.discounts) {
                            dataList.sales_history.forEach((item: any) => {
                              const productId = item?.inventory?.product_id;
                              const productDiscount = dataList.discounts.find((discount: any) => 
                                discount.product_id === productId && discount.discount_type === 'product'
                              );
                              
                              if (productDiscount) {
                                const originalAmount = item.total_price || 0;
                                const discountAmount = (originalAmount * productDiscount.discount_amount) / 100;
                                totalProductDiscount += discountAmount;
                              }
                            });
                          }
                          
                          return totalProductDiscount.toFixed(2);
                        })()}
                      </span>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                      <div className="flex justify-between font-semibold text-base">
                        <span className="text-gray-800 dark:text-gray-200">Net Amount:</span>
                        <span className="text-gray-800 dark:text-gray-200">
                          ${(() => {
                            // Calculate Gross Amount
                            const grossAmount = dataList?.sales_history?.reduce((sum: number, item: any) => 
                              sum + (item.total_price || 0), 0) || 0;
                            
                            // Calculate Cart Discount
                            const cartDiscount = dataList?.discounts?.find((d: any) => 
                              d.discount_type === 'cart' && d.product_id === null
                            );
                            const cartDiscountValue = cartDiscount ? cartDiscount.discount_value : 0;
                            
                            // Calculate Product Discount
                            let totalProductDiscount = 0;
                            if (dataList?.sales_history && dataList?.discounts) {
                              dataList.sales_history.forEach((item: any) => {
                                const productId = item?.inventory?.product_id;
                                const productDiscount = dataList.discounts.find((discount: any) => 
                                  discount.product_id === productId && discount.discount_type === 'product'
                                );
                                
                                if (productDiscount) {
                                  const originalAmount = item.total_price || 0;
                                  const discountAmount = (originalAmount * productDiscount.discount_amount) / 100;
                                  totalProductDiscount += discountAmount;
                                }
                              });
                            }
                            
                            // Net Amount = Gross Amount - Cart Discount - Product Discount
                            return (grossAmount - cartDiscountValue - totalProductDiscount).toFixed(2);
                          })()}
                        </span>
                      </div>
                    </div>
                    
                 
                  </div>
                </div>
              </div>
            </div>
      
                  {/* Sales Person Section — moved below to sit above the table */}

            {/* Order Summary */}
            <div className="flex flex-col md:flex-row gap-4 items-start justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {t("POS-Historyk21")}
              </h3>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {/* <div className="space-y-1">
                  <p className="text-gray-500 dark:text-gray-400">Order ID:</p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {dataList?.order_id}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 dark:text-gray-400">Order Date:</p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {moment(dataList?.order_date)
                      .utcOffset(-6)
                      .format("DD-MM-YYYY")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 dark:text-gray-400">
                    Payment Type:
                  </p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {dataList?.sales_history?.[0]?.paymentcash ? "Cash" : "Debit"}
                  </p>
                </div> */}
              </div>
            </div>

            {/* Search + Sales Person (same row on md+, stacked on small screens) */}
            <div className="mb-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="relative max-w-xl">
                  <CiSearch
                    size={20}
                    className="absolute left-3 top-3 text-gray-400 dark:text-gray-500"
                  />
                  <input
                    onChange={searchProductHandle}
                    type="text"
                    placeholder={t("POS-Historyk33")}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg bg-[#f1f4f9] border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  />
                </div>
              </div>

              <div className="md:shrink-0 w-full md:w-72">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sales Person</h3>
                <div className="p-2 bg-gray-50 dark:bg-[#071025] border rounded text-sm">
                  {dataList?.sales_team_members && dataList.sales_team_members.length > 0 ? (
                    <ul className="space-y-1 text-sm text-gray-800 dark:text-gray-200">
                      {dataList.sales_team_members.map((name: string, idx: number) => (
                        <li key={idx} className="py-0.5">{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-gray-500">No sales person assigned</div>
                  )}
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="border rounded-lg overflow-hidden border-gray-200 dark:border-gray-700">
              {/* Table Header - Only visible on md and larger screens */}
              <div className="hidden md:grid bg-gray-50 dark:bg-gray-700 px-4 py-3 grid-cols-7 gap-4">
                {tableHeader.map(({ label, align, flex }, index) => (
                  <div
                    key={index}
                    className={`text-sm font-medium text-gray-500 dark:text-gray-400 ${
                      align === "right" ? "text-right" : align === "text-center" ? "text-center" : "text-left"
                    }`}
                  >
                    {t(label)}
                  </div>
                ))}
              </div>

              {/* Table Body - Cards for small screens, Table for larger screens */}
              <div className="overflow-y-auto divide-y divide-gray-200 dark:-gray-700">
                {salesHistory.map((elem: DataListInterface, index: number) => (
                  <div key={index}>
                    {/* Mobile Card View */}
                    <div className="md:hidden p-4 space-y-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t("Product")}</p>
                            <p className="font-medium text-gray-700 dark:text-gray-300 break-words">
                              {elem?.inventory?.products?.product_name}
                            </p>
                          </div>
                          <div className="ml-4 text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t("Price")}</p>
                            <p className="font-medium text-gray-700 dark:text-gray-300">
                              ${elem?.inventory?.price}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t("Quantity")}</p>
                            <p className="font-medium text-gray-700 dark:text-gray-300">
                              {elem?.quantity}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Product Discount %</p>
                            <p className="font-medium text-gray-700 dark:text-gray-300">
                              {(() => {
                                const productId = elem?.inventory?.product_id;
                                const productDiscount = dataList?.discounts?.find((discount: any) => 
                                  discount.product_id === productId && discount.discount_type === 'product'
                                );
                                return productDiscount ? `${productDiscount.discount_amount}%` : '0%';
                              })()}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Amount After Discount</p>
                            <p className="font-medium text-gray-700 dark:text-gray-300">
                              {(() => {
                                const originalAmount = elem?.total_price || 0;
                                const productId = elem?.inventory?.product_id;
                                const productDiscount = dataList?.discounts?.find((discount: any) => 
                                  discount.product_id === productId && discount.discount_type === 'product'
                                );
                                
                                if (productDiscount) {
                                  const discountAmount = (originalAmount * productDiscount.discount_amount) / 100;
                                  return `$${(originalAmount - discountAmount).toFixed(2)}`;
                                }
                                
                                return `$${originalAmount.toFixed(2)}`;
                              })()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t("Total")}</p>
                            <p className="font-medium text-gray-700 dark:text-gray-300">
                              ${calcTotalAmount({ sales_history: [elem] })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="w-full">
                        <TableRowRender
                          preDefinedReasonList={preDefinedReasonList}
                          hasReturnedHandle={hasReturnedHandle}
                          isAnyReturned={returnedItems.has(elem?.inventory?.products?.product_name) || page > 1}
                          dataList={elem}
                          order_id={order_id}
                          discounts={dataList?.discounts || []}
                        />
                      </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <TableRowRender
                        preDefinedReasonList={preDefinedReasonList}
                        hasReturnedHandle={hasReturnedHandle}
                        isAnyReturned={returnedItems.has(elem?.inventory?.products?.product_name) || page > 1}
                        dataList={elem}
                        order_id={order_id}
                        discounts={dataList?.discounts || []}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 justify-between dark:bg-[#080e16] px-3 py-2 rounded-md">
                {/* <span className="text-sm text-gray-500 dark:text-gray-400">
                  Page
                </span> */}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("POS-Historyk29")} {page} {t("POS-Historyk30")} {totalPages}
                </span>
                <div className="flex justify-center gap-2 items-center">
                <button
                  onClick={() => changeHistoryHandle("prev")}
                  disabled={page === 1}
                  className={`p-1 rounded border-2 border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 ${
                    page === 1 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {t("POS-Historyk32")}
                  {/* <ArrowLeftFromLine className="w-4 h-4 text-gray-700 dark:text-gray-300" /> */}
                </button>
                
                <button
                  onClick={() => changeHistoryHandle("next")}
                  disabled={page === totalPages}
                  className={`p-1 rounded border-2 border-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 ${
                    page === totalPages ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {t("POS-Historyk31")}
                  {/* <ArrowRightFromLine className="w-4 h-4 text-gray-700 dark:text-gray-300" /> */}
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : null;
};

export default OrderDetailsModal;