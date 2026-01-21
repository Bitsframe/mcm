"use client";

import React, { useState, useEffect, useContext, useCallback } from "react";
import moment from "moment";
import { supabase } from "@/services/supabase";
import { fetch_content_service } from "@/utils/supabase/data_services/data_services";
import { currencyFormatHandle } from "@/helper/common_functions";
import OrderDetailsModal from "../../../../../../components/salesHistory/OrderDetailsModal";
import TableComponent from "@/components/TableComponent";
import ExportAsPDF from "@/components/ExportPDF";
import { LocationContext } from "@/context";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { TabContext } from "@/context";
import { Eye } from "lucide-react";
import ConfirmDeleteModal from '@/components/Modal_Components/ConfirmDeleteModal';

interface DataListInterface {
  [key: string]: any;
}

// Helper function to convert UTC datetime to CT date string (YYYY-MM-DD)
const convertUTCtoCtDate = (utcDateString: string): string => {
  if (!utcDateString) return "";
  const date = new Date(utcDateString);
  // CT is UTC-6 (Central Standard Time)
  const ctOffset = -6 * 60 * 60 * 1000; // 6 hours in milliseconds
  const ctDate = new Date(date.getTime() + ctOffset);
  const year = ctDate.getUTCFullYear();
  const month = String(ctDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(ctDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const tableHeader = [
  {
    id: "order_id",
    label: "Order ID",
    align: "text-center",
    flex: "flex-1",
  },
  {
    id: "patient_name",
    label: "Patient Name",
    render_value: (_val: any, elem?: any) => `${elem?.pos?.firstname || ''} ${elem?.pos?.lastname || ''}`,
    align: "text-center",
    flex: "flex-1",
  },
  {
    id: "phone",
    label: "Phone Number",
    render_value: (_val: any, elem?: any) => elem?.pos?.phone || '',
    align: "text-center",
    flex: "flex-1",
  },
  {
    id: "email",
    label: "Email",
    render_value: (_val: any, elem?: any) => elem?.pos?.email || '',
    align: "text-center",
    flex: "flex-1",
  },
];

const SalesHistory = () => {
  const [dataList, setDataList] = useState<DataListInterface[]>([]);
  const [allData, setAllData] = useState<DataListInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DataListInterface | null>(null);
  const { selectedLocation } = useContext(LocationContext);
  const [preDefinedReasonList, setPreDefinedReasonList] = useState([]);
  // Search states for each column
  const [orderIdSearch, setOrderIdSearch] = useState("");
  const [patientNameSearch, setPatientNameSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [dobSearch, setDobSearch] = useState("");

  const fetchReasonsList = useCallback(async () => {
    try {
      const fetched_data = await fetch_content_service({
        table: "returnreasons",
        language: "",
      });
      // @ts-ignore
      setPreDefinedReasonList(fetched_data || []);
    } catch (error) {
      console.error("Error fetching return reasons", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetch_handle = useCallback(async (location_id: number) => {
    setLoading(true);
    try {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log("POS History - current user:", user?.id);
      } catch (e) {
        console.debug("POS History - could not read user from supabase client", e);
      }
      
      const fetched_data = await fetch_content_service({
        table: "orders",
        language: "",
        selectParam: `, order_date, paid_amount, cash, card, zelle, pos:allpatients (
          lastname,
          firstname,
          email,
          phone,
          dob,
          locationid,
          patientid:id
        ),
        sales_history (
          sales_history_id,
          inventory_id,
          date_sold,
          quantity_sold,
          total_price
        )`,
        matchCase: {
          key: "pos.locationid",
          value: location_id,
        },
        filterOptions: [
          { operator: "not", column: "pos", value: null },
          { operator: "not", column: "allpatients.id", value: null },
        ],
      });
      
      const filteredData = fetched_data.filter((elem) => elem.pos !== null);
      
      setDataList(filteredData);
      setAllData(filteredData);
    } catch (error) {
      console.error("Error fetching sales history", error);
    } finally {
      setLoading(false);
    }
  }, []);


  // Filtering logic
  useEffect(() => {
    console.log('[FILTER] dobSearch:', dobSearch, 'allData.length:', allData.length, 'first order_date:', allData[0]?.order_date);
    let filtered = allData;
    if (orderIdSearch.trim() !== "") {
      filtered = filtered.filter((item) =>
        String(item.order_id).toLowerCase().includes(orderIdSearch.toLowerCase())
      );
    }
    if (patientNameSearch.trim() !== "") {
      filtered = filtered.filter((item) => {
        const name = `${item?.pos?.firstname || ''} ${item?.pos?.lastname || ''}`.toLowerCase();
        return name.includes(patientNameSearch.toLowerCase());
      });
    }
    if (phoneSearch.trim() !== "") {
      filtered = filtered.filter((item) =>
        (item?.pos?.phone || "").toLowerCase().includes(phoneSearch.toLowerCase())
      );
    }
    if (emailSearch.trim() !== "") {
      filtered = filtered.filter((item) =>
        (item?.pos?.email || "").toLowerCase().includes(emailSearch.toLowerCase())
      );
    }
    if (dobSearch.trim() !== "") {
      filtered = filtered.filter((item) => {
        if (!item?.order_date) return false;
        const orderDateInCT = convertUTCtoCtDate(item.order_date);
        return orderDateInCT === dobSearch;
      });
    }
    setDataList(filtered);
  }, [orderIdSearch, patientNameSearch, phoneSearch, emailSearch, dobSearch, allData]);

  useEffect(() => {
    if (selectedLocation) {
      fetch_handle(selectedLocation.id);
    }
  }, [selectedLocation, fetch_handle]);

  useEffect(() => {
    fetchReasonsList();
  }, [fetchReasonsList]);

  // Delete workflow: open confirm modal, then perform delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const requestDelete = (orderId: number) => {
    try {
      console.log("SalesHistory.requestDelete called", { orderId, ts: new Date().toISOString() });
    } catch (e) {
      // ignore in non-browser
    }
    setOrderToDelete(orderId);
    setDeleteModalOpen(true);
  };

  const performDelete = async () => {
    if (!orderToDelete) return;
    try {
      setDeleteLoading(true);
      try {
        console.log("SalesHistory.performDelete: sending delete request", { orderToDelete });
      } catch (e) {}

      const res = await fetch('/api/orders/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderToDelete }),
      });
      const data = await res.json();
      try {
        console.log("SalesHistory.performDelete: delete response", { status: res.status, body: data });
      } catch (e) {}

      if (!res.ok || !data.success) {
        console.error('Failed to delete order', data);
        alert(data.message || 'Failed to delete order');
      } else {
        // refresh list
        if (selectedLocation) {
          fetch_handle(selectedLocation.id);
        }
        setDeleteModalOpen(false);
        setOrderToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting order', error);
      alert('Error deleting order');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openModal = useCallback((orderDetails: DataListInterface) => {
    setSelectedOrder(orderDetails);
    setModalOpen(true);
    try {
      // Log info to console for debugging instead of alert
      const dateFilter = dobSearch ? dobSearch : "All dates";
      console.log("SalesHistory.openModal called", {
        dateFilter,
        selectedOrder: orderDetails,
        // include a note about what goes into the PDF
        pdfFields: ["Order ID", "Date", "Patient Name", "Total Amount", "Payment Type"],
      });
    } catch (e) {
      // ignore in non-browser environments
    }
  }, [dobSearch]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedOrder(null);
  }, []);

  const { t } = useTranslation(translationConstant.POSHISTORY);

  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k21");
  }, [setActiveTitle]);

  return (
    <main className="w-full h-full font-[500] bg-white dark:bg-[#0e1725] text-gray-800 dark:text-gray-200">
      <div className="flex justify-between items-center px-4 pt-4 space-x-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {t("POS-Historyk1")}
          </h1>
          <h1 className="mt-1 mb-2 text-gray-600 dark:text-gray-400">
            {t("POS-Historyk28")}
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <ExportAsPDF />
        </div>
      </div>

      {/* Statistics Cards Container */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 - Products Sold Today */}
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("POS-Historyk35")} {dobSearch ? `on ${new Date(dobSearch + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : `${t("POS-Historyk50")}`}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(() => {
                    // Use selected date or today's date in CT
                    const targetDateString = dobSearch || (() => {
                      // If no date selected, show today in CT
                      const today = new Date();
                      const ctOffset = -6 * 60 * 60 * 1000;
                      const todayInCT = new Date(today.getTime() + ctOffset);
                      const year = todayInCT.getUTCFullYear();
                      const month = String(todayInCT.getUTCMonth() + 1).padStart(2, '0');
                      const day = String(todayInCT.getUTCDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    })();
                    
                    let totalProductsSold = 0;
                    
                    dataList.forEach((order) => {
                      if (order.sales_history) {
                        order.sales_history.forEach((sale: any) => {
                          if (!sale.date_sold) return;
                          const saleDateInCT = convertUTCtoCtDate(sale.date_sold);
                          if (saleDateInCT === targetDateString) {
                            totalProductsSold += sale.quantity_sold || 0;
                          }
                        });
                      }
                    });
                    
                    return totalProductsSold;
                  })()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 2 - Total Amount Received Today */}
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("POS-Historyk36")} {dobSearch ? `on ${new Date(dobSearch + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : `${t("POS-Historyk50")}`}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${(() => {
                    // Use selected date or today's date in CT
                    const targetDateString = dobSearch || (() => {
                      const today = new Date();
                      const ctOffset = -6 * 60 * 60 * 1000;
                      const todayInCT = new Date(today.getTime() + ctOffset);
                      const year = todayInCT.getUTCFullYear();
                      const month = String(todayInCT.getUTCMonth() + 1).padStart(2, '0');
                      const day = String(todayInCT.getUTCDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    })();
                    
                    let totalAmount = 0;
                    
                    allData.forEach((order) => {
                      if (!order?.order_date) return;
                      const orderDateInCT = convertUTCtoCtDate(order.order_date);
                      if (orderDateInCT === targetDateString) {
                        const paidAmount =
                          Number(order.cash || 0) +
                          Number(order.card || 0) +
                          Number(order.zelle || 0);
                        const fallbackPaid = Number(order.paid_amount || 0);
                        // prefer explicit tender breakdown; fall back to paid_amount if present
                        totalAmount += paidAmount || fallbackPaid;
                      }
                    });
                    
                    return totalAmount.toFixed(2);
                  })()}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 3 - Total Sales */}
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("POS-Historyk37")} {dobSearch ? `on ${new Date(dobSearch + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : `${t("POS-Historyk50")}`}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${(() => {
                    // Use selected date or today's date in CT
                    const targetDateString = dobSearch || (() => {
                      const today = new Date();
                      const ctOffset = -6 * 60 * 60 * 1000;
                      const todayInCT = new Date(today.getTime() + ctOffset);
                      const year = todayInCT.getUTCFullYear();
                      const month = String(todayInCT.getUTCMonth() + 1).padStart(2, '0');
                      const day = String(todayInCT.getUTCDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    })();
                    
                    let totalSales = 0;
                    
                    dataList.forEach((order) => {
                      if (order.sales_history) {
                        order.sales_history.forEach((sale: any) => {
                          if (!sale.date_sold) return;
                          const saleDateInCT = convertUTCtoCtDate(sale.date_sold);
                          if (saleDateInCT === targetDateString) {
                            totalSales += sale.total_price || 0;
                          }
                        });
                      }
                    });
                    
                    return totalSales.toFixed(2);
                  })()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Component */}
      <TableComponent
        tableHeader={tableHeader}
        loading={loading}
        dataList={dataList}
        openModal={openModal}
        onDelete={requestDelete}
        tableBodyHeight="h-[50dvh]"
        tableHeight="h-[67dvh] md:h-[58dvh]"
        itemPerPage={6}
        searchInputs={{
          orderIdSearch,
          setOrderIdSearch,
          patientNameSearch,
          setPatientNameSearch,
          phoneSearch,
          setPhoneSearch,
          emailSearch,
          setEmailSearch,
          dobSearch,
          setDobSearch,
        }}
      />

      {selectedOrder && (
        <OrderDetailsModal
          preDefinedReasonList={preDefinedReasonList}
          isOpen={modalOpen}
          onClose={closeModal}
          orderDetails={selectedOrder}
        />
      )}
      {/* Confirm delete modal */}
      <ConfirmDeleteModal
        is_open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setOrderToDelete(null);
        }}
        onConfirm={performDelete}
        loading={deleteLoading}
        title="Delete Order"
        description="Are you sure you want to delete this order? This action cannot be undone."
      />
    </main>
  );
};

export default SalesHistory;