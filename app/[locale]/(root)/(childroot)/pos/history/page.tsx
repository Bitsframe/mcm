"use client";

import { classifyError, logError } from '@/utils/logging/safe-log';
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
import { CalendarRange, Eye } from "lucide-react";
import DateRangeModal from "@/components/ExportPDF/DateRangeModal";
import ConfirmDeleteModal from '@/components/Modal_Components/ConfirmDeleteModal';
import { convertUTCtoCtDate, formatCtDateTime, todayInCtDate } from "@/utils/datetime/centralTime";

interface DataListInterface {
  [key: string]: any;
}

const tableHeader = [
  {
    id: "order_id",
    label: "ID de orden",
    align: "text-center",
    flex: "flex-1",
  },
  {
    id: "order_date",
    label: "Fecha de venta",
    render_value: (val: any) => (val ? `${formatCtDateTime(val)} CT` : "—"),
    align: "text-center",
    flex: "flex-1",
  },
  {
    id: "patient_name",
    label: "Nombre del paciente",
    render_value: (_val: any, elem?: any) => `${elem?.pos?.firstname || ''} ${elem?.pos?.lastname || ''}`,
    align: "text-center",
    flex: "flex-1",
  },
  {
    id: "phone",
    label: "Número de teléfono",
    render_value: (_val: any, elem?: any) => elem?.pos?.phone || '',
    align: "text-center",
    flex: "flex-1",
  },
  {
    id: "email",
    label: "Correo electrónico",
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
  // Date range filter, as CT calendar days ("YYYY-MM-DD" compares correctly as a string)
  // Opens on today (CT); Clear returns here.
  const [today] = useState(todayInCtDate);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [rangeOpen, setRangeOpen] = useState(false);

  const fetchReasonsList = useCallback(async () => {
    try {
      const fetched_data = await fetch_content_service({
        table: "returnreasons",
        language: "",
      });
      // @ts-ignore
      setPreDefinedReasonList(fetched_data || []);
    } catch (error) {
      console.error("Error fetching return reasons", classifyError(error));
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
      
      // Orders + embedded sales_history in one query times out for large IN lists; load pos here, sales_history below.
      const orderSelectLight = `, order_date, paid_amount, cash, card, zelle, pos:allpatients (
          lastname,
          firstname,
          email,
          phone,
          dob,
          locationid,
          treatmenttype,
          patientid:id
        )`;

      const chunk = <T,>(arr: T[], size: number): T[][] => {
        const out: T[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      };

      // Avoid full-table orders scan (times out on large DBs); scope by location via patients + sales_team.
      const patientsAtLocation = await fetch_content_service({
        table: "allpatients",
        language: "",
        selectParam: ",id",
        matchCase: { key: "locationid", value: location_id },
        skipLocationFilter: true,
        fetchAll: true,
      });
      const patientIds = (patientsAtLocation || [])
        .map((p: any) => p?.id)
        .filter(Boolean);

      const salesTeamsAtLocation = await fetch_content_service({
        table: "sales_team",
        language: "",
        selectParam: ",id",
        matchCase: { key: "location_id", value: location_id },
        fetchAll: true,
      });
      const salesTeamIds = (salesTeamsAtLocation || [])
        .map((t: any) => t?.id)
        .filter(Boolean);

      if (!patientIds.length && !salesTeamIds.length) {
        setDataList([]);
        setAllData([]);
        return;
      }

      const PATIENT_CHUNK = 40;
      const TEAM_CHUNK = 40;
      const ordersByPatient: any[] = [];
      const patientChunks = chunk(patientIds, PATIENT_CHUNK);
      for (let i = 0; i < patientChunks.length; i += 2) {
        const batch = patientChunks.slice(i, i + 2);
        const parts = await Promise.all(
          batch.map((pidChunk) =>
            fetch_content_service({
              table: "orders",
              language: "",
              selectParam: orderSelectLight,
              filterOptions: [{ operator: "in", column: "patient_id", value: pidChunk }],
              fetchAll: true,
            })
          )
        );
        for (const part of parts) ordersByPatient.push(...(part || []));
      }

      const ordersByTeam: any[] = [];
      const teamChunks = chunk(salesTeamIds, TEAM_CHUNK);
      for (const tidChunk of teamChunks) {
        const part = await fetch_content_service({
          table: "orders",
          language: "",
          selectParam: orderSelectLight,
          filterOptions: [{ operator: "in", column: "sales_team_id", value: tidChunk }],
          fetchAll: true,
        });
        ordersByTeam.push(...(part || []));
      }

      const mergedMap = new Map<number, any>();
      [...ordersByPatient, ...ordersByTeam].forEach((order: any) => {
        if (order?.order_id != null) mergedMap.set(order.order_id, order);
      });
      let rows = Array.from(mergedMap.values());

      rows = rows.filter(
        (order: any) => Number(order?.pos?.locationid) === Number(location_id)
      );

      const orderIdsForHistory = rows
        .map((o: any) => o.order_id)
        .filter((id: any) => id != null);
      const HISTORY_CHUNK = 80;
      const historyRows: any[] = [];
      for (const oidChunk of chunk(orderIdsForHistory, HISTORY_CHUNK)) {
        const h = await fetch_content_service({
          table: "sales_history",
          language: "",
          selectParam:
            ",sales_history_id,order_id,inventory_id,date_sold,quantity_sold,total_price",
          filterOptions: [{ operator: "in", column: "order_id", value: oidChunk }],
          fetchAll: true,
        });
        historyRows.push(...(h || []));
      }
      const historyByOrder = new Map<number, any[]>();
      for (const h of historyRows) {
        const oid = h.order_id;
        if (oid == null) continue;
        if (!historyByOrder.has(oid)) historyByOrder.set(oid, []);
        historyByOrder.get(oid)!.push(h);
      }
      rows.forEach((o: any) => {
        o.sales_history = historyByOrder.get(o.order_id) || [];
      });

      setDataList(rows);
      setAllData(rows);
    } catch (error) {
      console.error("Error fetching sales history", classifyError(error));
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
    if (dateFrom || dateTo) {
      filtered = filtered.filter((item) => {
        if (!item?.order_date) return false;
        const orderDateInCT = convertUTCtoCtDate(item.order_date);
        return (!dateFrom || orderDateInCT >= dateFrom) && (!dateTo || orderDateInCT <= dateTo);
      });
    }
    setDataList(filtered);
  }, [orderIdSearch, patientNameSearch, phoneSearch, emailSearch, dateFrom, dateTo, allData]);

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
        logError('order.delete_failed', { status: res.status });
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
      console.error('Error deleting order', classifyError(error));
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
      const dateFilter = dateFrom || dateTo ? `${dateFrom || "…"} – ${dateTo || "…"}` : "All dates";
      console.log("SalesHistory.openModal called", {
        dateFilter,
        selectedOrder: orderDetails,
        // include a note about what goes into the PDF
        pdfFields: ["Order ID", "Date", "Patient Name", "Total Amount", "Payment Type"],
      });
    } catch (e) {
      // ignore in non-browser environments
    }
  }, [dateFrom, dateTo]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedOrder(null);
  }, []);

  const { t, i18n } = useTranslation(translationConstant.POSHISTORY);

  // The day figures cover the selected range, or today (CT) when none is set.
  const hasRange = Boolean(dateFrom || dateTo);
  const inFigureRange = (ctDate: string) =>
    hasRange
      ? (!dateFrom || ctDate >= dateFrom) && (!dateTo || ctDate <= dateTo)
      : ctDate === todayInCtDate();
  const fmtDay = (d: string) =>
    new Intl.DateTimeFormat(i18n.language === "es" ? "es-ES" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(d + "T00:00:00"));
  const isTodayRange = dateFrom === today && dateTo === today;
  const resetDates = () => {
    setDateFrom(today);
    setDateTo(today);
  };
  // The range spelled out as dates ("Sep 28, 2026" or "Sep 1, 2026 – Sep 23, 2026").
  // Same-year ranges drop the first year: "Sep 20 – Sep 26, 2026".
  const fmtDayNoYear = (d: string) =>
    new Intl.DateTimeFormat(i18n.language === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric" })
      .format(new Date(d + "T00:00:00"));
  const rangeDates = dateFrom && dateTo && dateFrom === dateTo
    ? fmtDay(dateFrom)
    : dateFrom && dateTo && dateFrom.slice(0, 4) === dateTo.slice(0, 4)
      ? `${fmtDayNoYear(dateFrom)} – ${fmtDay(dateTo)}`
      : `${dateFrom ? fmtDay(dateFrom) : "…"} – ${dateTo ? fmtDay(dateTo) : "…"}`;

  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k21");
  }, [setActiveTitle]);

  return (
    <main className="w-full h-full font-[500] bg-white text-gray-800">
      {/* Title row, then the day figures — the table is the page. */}
      <div className="flex items-start justify-between gap-3 px-4 pt-1 pb-3">
        <div>
          <h1 className="text-title2 text-label">{t("POS-Historyk1")}</h1>
          <p className="text-footnote text-label-2">{t("POS-Historyk28")}</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeModal
            open={rangeOpen}
            handleOpen={() => setRangeOpen(true)}
            handleClose={() => setRangeOpen(false)}
            loading={false}
            title={t("POS-HistoryFilterRangeTitle")}
            maxDate={null}
            value={dateFrom ? { startDate: dateFrom, endDate: dateTo || dateFrom } : null}
            generatePdfHandle={(start, end) => {
              setDateFrom(start);
              setDateTo(end);
              setRangeOpen(false);
            }}
            onClear={() => {
              resetDates();
              setRangeOpen(false);
            }}
            renderTrigger={(open) => (
              <div className="flex items-center gap-3">
              <span className="hidden text-callout text-label-2 sm:inline whitespace-nowrap">
                {isTodayRange ? `${t("POS-Historyk50")} · ${rangeDates}` : rangeDates}
              </span>
              <button
                type="button"
                onClick={open}
                className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-base transition-colors ${
                  !isTodayRange
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-border bg-white text-label hover:bg-gray-50"
                }`}
              >
                <CalendarRange className="h-5 w-5" />
                <span>{t("POS-HistoryFilter")}</span>
              </button>
              </div>
            )}
          />
          <ExportAsPDF />
        </div>
      </div>

      {/* Figures for the selected date range (today when none is set) */}
      <div className="px-4 pb-2 pt-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Card 1 - Products Sold Today */}
          <div className="rounded-lg border border-border bg-white px-4 py-3 shadow-mac-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-footnote text-label-2">
                  {t("POS-Historyk35").trim()}
                </p>
                <p className="mt-0.5 text-title3 text-label">
                  {(() => {
                    let totalProductsSold = 0;
                    
                    dataList.forEach((order) => {
                      if (order.sales_history) {
                        order.sales_history.forEach((sale: any) => {
                          if (!sale.date_sold) return;
                          const saleDateInCT = convertUTCtoCtDate(sale.date_sold);
                          if (inFigureRange(saleDateInCT)) {
                            totalProductsSold += sale.quantity_sold || 0;
                          }
                        });
                      }
                    });
                    
                    return totalProductsSold;
                  })()}
                </p>
              </div>
              <div className="p-3 bg-brand-100 rounded-full">
                <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 2 - Total Amount Received Today */}
          <div className="rounded-lg border border-border bg-white px-4 py-3 shadow-mac-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-footnote text-label-2">
                  {t("POS-Historyk36").trim()}
                </p>
                <p className="mt-0.5 text-title3 text-label">
                  ${(() => {
                    let totalAmount = 0;
                    
                    allData.forEach((order) => {
                      if (!order?.order_date) return;
                      const orderDateInCT = convertUTCtoCtDate(order.order_date);
                      if (inFigureRange(orderDateInCT)) {
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
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 3 - Total Sales */}
          <div className="rounded-lg border border-border bg-white px-4 py-3 shadow-mac-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-footnote text-label-2">
                  {t("POS-Historyk37").trim()}
                </p>
                <p className="mt-0.5 text-title3 text-label">
                  ${(() => {
                    let totalSales = 0;
                    
                    dataList.forEach((order) => {
                      if (order.sales_history) {
                        order.sales_history.forEach((sale: any) => {
                          if (!sale.date_sold) return;
                          const saleDateInCT = convertUTCtoCtDate(sale.date_sold);
                          if (inFigureRange(saleDateInCT)) {
                            totalSales += sale.total_price || 0;
                          }
                        });
                      }
                    });
                    
                    return totalSales.toFixed(2);
                  })()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          dateFrom,
          dateTo,
          dateLabel: hasRange ? rangeDates : "",
          datesChanged: !isTodayRange,
          clearDates: resetDates,
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