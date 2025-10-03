"use client";

import React, { useState, useEffect, useContext, useCallback } from "react";
import moment from "moment";
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

interface DataListInterface {
  [key: string]: any;
}

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
    console.log("🔄 Starting API call for POS History page");
    console.log("📍 Location ID:", location_id);
    
    setLoading(true);
    try {
      console.log("📡 Calling fetch_content_service with parameters:");
      console.log("  - Table: orders");
      console.log("  - Select Params: pos:allpatients + sales_history");
      console.log("  - Match Case: pos.locationid =", location_id);
      
      const fetched_data = await fetch_content_service({
        table: "orders",
        language: "",
        selectParam: `,pos:allpatients (
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
      
      console.log("📊 Raw API Response (from orders table):", fetched_data);
      console.log("📈 Total records fetched:", fetched_data?.length || 0);
      
      if (fetched_data && fetched_data.length > 0) {
        console.log("🔍 Sample record structure:", fetched_data[0]);
        console.log("🏥 Patient data (pos):", fetched_data[0]?.pos);
        console.log("🛒 Sales history:", fetched_data[0]?.sales_history);
      }
      
      const filteredData = fetched_data.filter((elem) => elem.pos !== null);
      console.log("✅ Filtered data (after removing null pos):", filteredData);
      console.log("📊 Final records count:", filteredData.length);
      
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
      filtered = filtered.filter((item) =>
        (item?.pos?.dob || "").toLowerCase().includes(dobSearch.toLowerCase())
      );
    }
    setDataList(filtered);
  }, [orderIdSearch, patientNameSearch, phoneSearch, emailSearch, dobSearch, allData]);

  useEffect(() => {
    console.log("🎯 useEffect triggered - selectedLocation changed");
    console.log("📍 Selected Location:", selectedLocation);
    
    if (selectedLocation) {
      console.log("✅ Location found, calling fetch_handle with ID:", selectedLocation.id);
      fetch_handle(selectedLocation.id);
    } else {
      console.log("❌ No location selected");
    }
  }, [selectedLocation, fetch_handle]);

  useEffect(() => {
    fetchReasonsList();
  }, [fetchReasonsList]);

  const openModal = useCallback((orderDetails: DataListInterface) => {
    setSelectedOrder(orderDetails);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedOrder(null);
  }, []);

  const { t } = useTranslation(translationConstant.POSHISTORY);

  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    console.log("🚀 POS History page mounted");
    console.log("📋 Setting active title to: Sidebar_k21");
    setActiveTitle("Sidebar_k21");
  }, []);

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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Products Sold Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(() => {
                    // Get today's date in CST
                    const today = new Date();
                    const cstOffset = -6; // CST is UTC-6
                    const todayCST = new Date(today.getTime() + (cstOffset * 60 * 60 * 1000));
                    const todayDateString = todayCST.toISOString().split('T')[0]; // YYYY-MM-DD format
                    
                    console.log("📅 Today's date in CST:", todayDateString);
                    
                    let totalProductsSoldToday = 0;
                    
                    allData.forEach((order) => {
                      if (order.sales_history) {
                        order.sales_history.forEach((sale: any) => {
                          // Convert UTC time to CST
                          const saleDate = new Date(sale.date_sold);
                          const saleDateCST = new Date(saleDate.getTime() + (cstOffset * 60 * 60 * 1000));
                          const saleDateString = saleDateCST.toISOString().split('T')[0];
                          
                          // If sale date matches today's date, add the quantity
                          if (saleDateString === todayDateString) {
                            totalProductsSoldToday += sale.quantity_sold || 0;
                          }
                        });
                      }
                    });
                    
                    console.log("📊 Total products sold today (CST):", totalProductsSoldToday);
                    return totalProductsSoldToday;
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount Received</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${(() => {
                    // Get today's date in CST
                    const today = new Date();
                    const cstOffset = -6; // CST is UTC-6
                    const todayCST = new Date(today.getTime() + (cstOffset * 60 * 60 * 1000));
                    const todayDateString = todayCST.toISOString().split('T')[0]; // YYYY-MM-DD format
                    
                    console.log("💰 Calculating Total Amount Received for today (CST):", todayDateString);
                    
                    let totalAmountToday = 0;
                    
                    allData.forEach((order) => {
                      // Convert order_date from UTC to CST
                      const orderDate = new Date(order.order_date);
                      const orderDateCST = new Date(orderDate.getTime() + (cstOffset * 60 * 60 * 1000));
                      const orderDateString = orderDateCST.toISOString().split('T')[0];
                      
                      console.log(`📋 Order ${order.order_id}: UTC=${order.order_date}, CST=${orderDateCST.toISOString()}, Date=${orderDateString}`);
                      
                      // If order date matches today's date, add the paid_amount
                      if (orderDateString === todayDateString) {
                        const paidAmount = order.paid_amount || 0;
                        totalAmountToday += paidAmount;
                        console.log(`✅ Order ${order.order_id} matches today - Added: $${paidAmount}`);
                      } else {
                        console.log(`❌ Order ${order.order_id} is not from today`);
                      }
                    });
                    
                    console.log("💰 Total Amount Received Today (CST):", totalAmountToday);
                    return totalAmountToday.toFixed(2);
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

          {/* Card 3 - Average Order Value */}
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${allData.length > 0 ? (allData.reduce((sum, order) => sum + (order.paid_amount || 0), 0) / allData.length).toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
    </main>
  );
};

export default SalesHistory;
