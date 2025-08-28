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

// Validation function for email
const validateEmail = (email: string) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

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
  const [emailValid, setEmailValid] = useState(true); // New state for email validation

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
      const filteredData = fetched_data.filter((elem) => elem.pos !== null);
      setDataList(filteredData);
      setAllData(filteredData);
    } catch (error) {
      console.error("Error fetching sales history", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtering logic with email validation
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
      // Check if email is valid and set the validation state
      const isValid = validateEmail(emailSearch);
      setEmailValid(isValid); // Update the validation state
      if (!isValid) {
        return; // Stop further filtering if email is invalid
      }
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
    if (selectedLocation) {
      fetch_handle(selectedLocation.id);
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

      {/* Email input with validation */}
      <div className="my-4">
        <label htmlFor="emailSearch" className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="text"
          id="emailSearch"
          value={emailSearch}
          onChange={(e) => setEmailSearch(e.target.value)}
          className={`mt-1 block w-full p-2 border ${emailValid ? 'border-gray-300' : 'border-red-500'} rounded-md`}
          placeholder="Enter Email"
        />
        {!emailValid && <p className="text-red-500 text-xs mt-1">Please enter a valid email address.</p>}
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
