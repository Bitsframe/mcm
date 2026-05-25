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
  type PaymentOption = "Cash" | "Card" | "Card & Cash" | "Zelle" | "Zelle & Cash" | "Zelle & Card" | "Zelle, Card, Cash";
  const [paymentMethodUI, setPaymentMethodUI] = useState<PaymentOption | undefined>(undefined);
  // Local editable inputs for cash/card amounts when Card & Cash is selected
  const [cashInput, setCashInput] = useState<string>("");
  const [cardInput, setCardInput] = useState<string>("");
  const [zelleInput, setZelleInput] = useState<string>("");
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
    const zelleVal = !!dataList?.zelle;
    let init: PaymentOption | undefined = undefined;
    if (cashVal && cardVal && zelleVal) init = "Zelle, Card, Cash";
    else if (cashVal && cardVal) init = "Card & Cash";
    else if (cashVal && zelleVal) init = "Zelle & Cash";
    else if (cardVal && zelleVal) init = "Zelle & Card";
    else if (cashVal) init = "Cash";
    else if (cardVal) init = "Card";
    else if (zelleVal) init = "Zelle";
    setPaymentMethodUI(init);
    // Sync editable inputs with latest values
    const currentCash = Number(dataList?.cash || 0);
    const currentCard = Number(dataList?.card || 0);
    setCashInput(dataList?.cash != null ? String(Number(dataList.cash).toFixed(2)) : "");
    setCardInput(dataList?.card != null ? String(Number(dataList.card).toFixed(2)) : "");
    // Keep the total that should be split when in editable mode
    setSplitTotal(Number((currentCash + currentCard).toFixed(2)));
  }, [dataList?.cash, dataList?.card, dataList?.zelle]);

  // Persist cash/card/zelle values to backend when edited
  const persistCashCard = async (newCashStr: string, newCardStr: string, newZelleStr?: string) => {
    try {
      // Only use the values for CHECKED payment methods, set others to 0
      const newCash = checks.cash ? (newCashStr === "" ? 0 : Number(Number(newCashStr).toFixed(2))) : 0;
      const newCard = checks.card ? (newCardStr === "" ? 0 : Number(Number(newCardStr).toFixed(2))) : 0;
      const newZelle = checks.zelle ? (newZelleStr === "" || newZelleStr === undefined ? 0 : Number(Number(newZelleStr).toFixed(2))) : 0;

      // Avoid unnecessary updates
      if (Number(dataList?.cash || 0) === newCash && Number(dataList?.card || 0) === newCard && Number(dataList?.zelle || 0) === newZelle) return;

      await update_content_service({
        table: "orders",
        post_data: {
          order_id: dataList?.order_id,
          cash: newCash,
          card: newCard,
          zelle: newZelle,
        },
        matchKey: "order_id",
      });

      // Optimistically update local state
      setDataList((prev: any) => ({ ...prev, cash: newCash, card: newCard, zelle: newZelle }));
      // mark amounts saved so fields render as text
      setAmountsSaved(true);
    } catch (e: any) {
      console.error("Failed to persist cash/card/zelle amounts", e);
      toast.error(e?.message || t("POS-Historyk67"));
      // Re-sync inputs from server state in case of failure
      setCashInput(dataList?.cash != null ? String(Number(dataList.cash).toFixed(2)) : "");
      setCardInput(dataList?.card != null ? String(Number(dataList.card).toFixed(2)) : "");
      setZelleInput(dataList?.zelle != null ? String(Number(dataList.zelle).toFixed(2)) : "");
    }
  };

  // Checkbox state
  const [checks, setChecks] = useState<{ cash: boolean; card: boolean; zelle: boolean }>({
    cash: Number(dataList?.cash || 0) > 0,
    card: Number(dataList?.card || 0) > 0,
    zelle: Number(dataList?.zelle || 0) > 0,
  });

  useEffect(() => {
    setChecks({
      cash: Number(dataList?.cash || 0) > 0,
      card: Number(dataList?.card || 0) > 0,
      zelle: Number(dataList?.zelle || 0) > 0,
    });
  }, [dataList?.cash, dataList?.card, dataList?.zelle]);

  const isCashCardSplitActive = checks.cash && checks.card && !checks.zelle;
  const isZelleCashSplitActive = checks.zelle && checks.cash && !checks.card;
  const isZelleCardSplitActive = checks.zelle && checks.card && !checks.cash;
  const isAllThreeSplitActive = checks.cash && checks.card && checks.zelle;
  const isSplitEditActive = isCashCardSplitActive || isZelleCashSplitActive || isZelleCardSplitActive || isAllThreeSplitActive;
  
  // Determine which fields should be editable
  const isCashEditable = (checks.cash && checks.card && !checks.zelle) || (checks.cash && checks.zelle && !checks.card) || isAllThreeSplitActive;
  const isCardEditable = (checks.card && checks.cash && !checks.zelle) || (checks.card && checks.zelle && !checks.cash) || isAllThreeSplitActive;
  const isZelleEditable = (checks.zelle && checks.cash && !checks.card) || (checks.zelle && checks.card && !checks.cash) || isAllThreeSplitActive;

  // Single-checkbox selection handler: moves total into selected tender and zeroes others
  const setSinglePayment = async (method: "cash" | "card" | "zelle") => {
    try {
      const total = Number(dataList?.cash || 0) + Number(dataList?.card || 0) + Number(dataList?.zelle || 0);
      const newCash = method === "cash" ? total : 0;
      const newCard = method === "card" ? total : 0;
      const newZelle = method === "zelle" ? total : 0;

      await update_content_service({
        table: "orders",
        post_data: {
          order_id: dataList?.order_id,
          cash: newCash,
          card: newCard,
          zelle: newZelle,
        },
        matchKey: "order_id",
      });

      // Update UI amounts immediately
      setDataList((prev: any) => ({ ...prev, cash: newCash, card: newCard, zelle: newZelle }));
      // Keep split editor coherent
      setCashInput(String(newCash.toFixed(2)));
      setCardInput(String(newCard.toFixed(2)));
      setSplitTotal(Number((newCash + newCard).toFixed(2)));
      setAmountsSaved(true);
      setAmountsEditable(false);
    } catch (e: any) {
      console.error("Failed to update single payment method", e);
      toast.error(e?.message || t("POS-Historyk67"));
    }
  };

  const toggleCheck = async (type: "cash" | "card" | "zelle") => {
    const next = { ...checks, [type]: !checks[type] };
    const selectedCount = Number(next.cash) + Number(next.card) + Number(next.zelle);

    // Prevent unchecking if it would result in zero selections
    if (selectedCount === 0) {
      toast.error(t("POS-Historyk66"));
      return;
    }

    // Only one selected → move entire total to that method
    if (selectedCount === 1) {
      setChecks(next);
      const chosen = next.cash ? "cash" : next.card ? "card" : "zelle";
      await setSinglePayment(chosen);
      return;
    }

    // Two or three checkboxes selected → enable split editing
    if (selectedCount === 2 || selectedCount === 3) {
      setChecks(next);
      setAmountsSaved(false);
      setAmountsEditable(true);
      // Use gross amount from order as the total to split
      const grossAmount = dataList?.sales_history?.reduce((sum: number, item: any) => 
        sum + (item.total_price || 0), 0) || 0;
      const cartDiscount = dataList?.discounts?.find((d: any) => 
        d.discount_type === 'cart' && d.product_id === null
      );
      const cartDiscountValue = cartDiscount ? cartDiscount.discount_value : 0;
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
      const netAmount = grossAmount - cartDiscountValue - totalProductDiscount;
      setSplitTotal(Number(netAmount.toFixed(2)));
      setCashInput(dataList?.cash != null ? String(Number(dataList.cash).toFixed(2)) : "");
      setCardInput(dataList?.card != null ? String(Number(dataList.card).toFixed(2)) : "");
      setZelleInput(dataList?.zelle != null ? String(Number(dataList.zelle).toFixed(2)) : "");
      return;
    }

    // Update checkbox state for any other combination (no auto-save for multi-zelle combos)
    setChecks(next);
  };

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
                {t("POS-Historyk13")}: <strong className="text-gray-800 dark:text-gray-200">{pos?.patientid || patient_id}</strong>
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
                  <h4 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">{t("POS-Historyk52")}</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t("POS-Historyk53")}:</span>
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
                      <span className="text-gray-600 dark:text-gray-400">{t("POS-Historyk54")}:</span>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={checks.cash}
                            onChange={() => toggleCheck("cash")}
                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                          />
                          {t("POS-Historyk55")}
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={checks.card}
                            onChange={() => toggleCheck("card")}
                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                          />
                          {t("POS-Historyk56")}
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={checks.zelle}
                            onChange={() => toggleCheck("zelle")}
                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                          />
                          Zelle
                        </label>
                      </div>
                    </div>
                    {isSplitEditActive && !amountsSaved && amountsEditable && (
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Reset to original values
                            setCashInput(dataList?.cash != null ? String(Number(dataList.cash).toFixed(2)) : "");
                            setCardInput(dataList?.card != null ? String(Number(dataList.card).toFixed(2)) : "");
                            setZelleInput(dataList?.zelle != null ? String(Number(dataList.zelle).toFixed(2)) : "");
                            // Close edit mode
                            setAmountsEditable(false);
                          }}
                          aria-label="Cancel"
                          title="Cancel"
                          className="inline-flex items-center justify-center px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm font-medium"
                        >
                          {t("POS-Historyk57")}
                        </button>
                        <button
                          type="button"
                          onClick={() => persistCashCard(cashInput, cardInput, zelleInput)}
                          disabled={(() => {
                            const currentCash = checks.cash ? Number(Number(cashInput || 0).toFixed(2)) : 0;
                            const currentCard = checks.card ? Number(Number(cardInput || 0).toFixed(2)) : 0;
                            const currentZelle = checks.zelle ? Number(Number(zelleInput || 0).toFixed(2)) : 0;
                            const sum = Number((currentCash + currentCard + currentZelle).toFixed(2));
                            const total = Number(splitTotal);
                            const matchesTotal = Math.abs(sum - total) < 0.005;
                            const unchanged =
                              Number(dataList?.cash || 0) === currentCash &&
                              Number(dataList?.card || 0) === currentCard &&
                              Number(dataList?.zelle || 0) === currentZelle;
                            return !(matchesTotal && !unchanged);
                          })()}
                          aria-label="Guardar"
                          title="Guardar"
                          className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L8 11.086l6.793-6.793a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                    {isSplitEditActive && !amountsSaved && amountsEditable && (() => {
                      const currentCash = checks.cash ? Number(Number(cashInput || 0).toFixed(2)) : 0;
                      const currentCard = checks.card ? Number(Number(cardInput || 0).toFixed(2)) : 0;
                      const currentZelle = checks.zelle ? Number(Number(zelleInput || 0).toFixed(2)) : 0;
                      const sum = Number((currentCash + currentCard + currentZelle).toFixed(2));
                      if (Math.abs(sum - Number(splitTotal)) > 0.005) {
                        return (
                          <div className="text-sm text-red-600 text-right">{t("POS-Historyk58")} ${Number(splitTotal).toFixed(2)}</div>
                        );
                      }
                      return null;
                    })()}
                    {(Number(dataList?.cash) > 0 || isCashEditable) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t("POS-Historyk59")}:</span>
                      {isCashEditable ? (
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
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-gray-600 dark:text-gray-400 font-medium pointer-events-none">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="0.00"
                              value={cashInput}
                              onChange={(e) => {
                                const raw = e.target.value;
                                setCashInput(raw);
                                
                                // Auto-adjust remaining field(s) during typing
                                const parsed = raw === "" ? 0 : Number(raw);
                                const clamped = isNaN(parsed) ? 0 : parsed;
                                
                                if (isCashCardSplitActive) {
                                  const remaining = Number((splitTotal - clamped).toFixed(2));
                                  setCardInput(String(Math.max(0, remaining).toFixed(2)));
                                } else if (isZelleCashSplitActive) {
                                  const remaining = Number((splitTotal - clamped).toFixed(2));
                                  setZelleInput(String(Math.max(0, remaining).toFixed(2)));
                                } else if (isAllThreeSplitActive) {
                                  const cardVal = Number(cardInput) || 0;
                                  const remaining = Number((splitTotal - clamped - cardVal).toFixed(2));
                                  setZelleInput(String(Math.max(0, remaining).toFixed(2)));
                                }
                              }}
                              onBlur={(e) => {
                                const raw = e.target.value;
                                const parsed = raw === "" ? 0 : Number(raw);
                                const clamped = isNaN(parsed) ? 0 : parsed;
                                const formatted = clamped === 0 ? "" : String(clamped.toFixed(2));
                                setCashInput(formatted);
                              }}
                              className="w-32 bg-white dark:bg-[#0e1725] border border-gray-300 dark:border-gray-500 text-sm px-3 py-2 pl-8 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
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
                    )}
                    
                    {(Number(dataList?.card) > 0 || isCardEditable) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t("POS-Historyk60")}:</span>
                      {isCardEditable ? (
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
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-gray-600 dark:text-gray-400 font-medium pointer-events-none">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="0.00"
                              value={cardInput}
                              onChange={(e) => {
                                const raw = e.target.value;
                                setCardInput(raw);
                                
                                // Auto-adjust remaining field(s) during typing
                                const parsed = raw === "" ? 0 : Number(raw);
                                const clamped = isNaN(parsed) ? 0 : parsed;
                                
                                if (isCashCardSplitActive) {
                                  const remaining = Number((splitTotal - clamped).toFixed(2));
                                  setCashInput(String(Math.max(0, remaining).toFixed(2)));
                                } else if (isZelleCardSplitActive) {
                                  const remaining = Number((splitTotal - clamped).toFixed(2));
                                  setZelleInput(String(Math.max(0, remaining).toFixed(2)));
                                } else if (isAllThreeSplitActive) {
                                  const cashVal = Number(cashInput) || 0;
                                  const remaining = Number((splitTotal - clamped - cashVal).toFixed(2));
                                  setZelleInput(String(Math.max(0, remaining).toFixed(2)));
                                }
                              }}
                              onBlur={(e) => {
                                const raw = e.target.value;
                                const parsed = raw === "" ? 0 : Number(raw);
                                const clamped = isNaN(parsed) ? 0 : parsed;
                                const formatted = clamped === 0 ? "" : String(clamped.toFixed(2));
                                setCardInput(formatted);
                              }}
                              className="w-32 bg-white dark:bg-[#0e1725] border border-gray-300 dark:border-gray-500 text-sm px-3 py-2 pl-8 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                            />
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
                    )}

                    {(Number(dataList?.zelle) > 0 || isZelleEditable) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t("POS-Historyk61")}:</span>
                      {isZelleEditable ? (
                        amountsSaved || !amountsEditable ? (
                          <span
                            onClick={() => {
                              if (!amountsSaved) setAmountsEditable(true);
                            }}
                            className="font-medium text-gray-800 dark:text-gray-200 cursor-pointer"
                          >
                            ${(() => {
                              const zelleAmt = Number(dataList?.zelle) || 0;
                              return zelleAmt.toFixed(2);
                            })()}
                          </span>
                        ) : (
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-gray-600 dark:text-gray-400 font-medium pointer-events-none">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="0.00"
                              value={zelleInput}
                              onChange={(e) => {
                                const raw = e.target.value;
                                setZelleInput(raw);
                                
                                // Auto-adjust remaining field(s) during typing
                                const parsed = raw === "" ? 0 : Number(raw);
                                const clamped = isNaN(parsed) ? 0 : parsed;
                                
                                if (isZelleCashSplitActive) {
                                  const remaining = Number((splitTotal - clamped).toFixed(2));
                                  setCashInput(String(Math.max(0, remaining).toFixed(2)));
                                } else if (isZelleCardSplitActive) {
                                  const remaining = Number((splitTotal - clamped).toFixed(2));
                                  setCardInput(String(Math.max(0, remaining).toFixed(2)));
                                } else if (isAllThreeSplitActive) {
                                  const cashVal = Number(cashInput) || 0;
                                  const remaining = Number((splitTotal - clamped - cashVal).toFixed(2));
                                  setCardInput(String(Math.max(0, remaining).toFixed(2)));
                                }
                              }}
                              onBlur={(e) => {
                                const raw = e.target.value;
                                const parsed = raw === "" ? 0 : Number(raw);
                                const clamped = isNaN(parsed) ? 0 : parsed;
                                const formatted = clamped === 0 ? "" : String(clamped.toFixed(2));
                                setZelleInput(formatted);
                              }}
                              className="w-32 bg-white dark:bg-[#0e1725] border border-gray-300 dark:border-gray-500 text-sm px-3 py-2 pl-8 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                            />
                          </div>
                        )
                      ) : (
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          ${(() => {
                            const zelleAmt = Number(dataList?.zelle) || 0;
                            return zelleAmt.toFixed(2);
                          })()}
                        </span>
                      )}
                    </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t("POS-Historyk62")}:</span>
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
                        {t("POS-Historyk63")}({(() => {
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
                      <span className="text-gray-600 dark:text-gray-400">{t("POS-Historyk64")}:</span>
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
                        <span className="text-gray-800 dark:text-gray-200">{t("POS-Historyk65")}:</span>
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
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t("POS-Historyk70")}</h3>
                <div className="p-2 bg-gray-50 dark:bg-[#071025] border rounded text-sm">
                  {dataList?.sales_team_members && dataList.sales_team_members.length > 0 ? (
                    <ul className="space-y-1 text-sm text-gray-800 dark:text-gray-200">
                      {dataList.sales_team_members.map((name: string, idx: number) => (
                        <li key={idx} className="py-0.5">{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-gray-500">{t("POS-Historyk71")}</div>
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
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t("POS-Historyk24")}</p>
                            <p className="font-medium text-gray-700 dark:text-gray-300 break-words">
                              {elem?.inventory?.products?.product_name}
                            </p>
                          </div>
                          <div className="ml-4 text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t("POS-Historyk26")}</p>
                            <p className="font-medium text-gray-700 dark:text-gray-300">
                              ${elem?.inventory?.price}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t("POS-Historyk25")}</p>
                            <p className="font-medium text-gray-700 dark:text-gray-300">
                              {elem?.quantity}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t("POS-Historyk68")}</p>
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
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t("POS-Historyk69")}</p>
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
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t("POS-Historyk26")}</p>
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