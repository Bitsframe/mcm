import { fetch_content_service } from "@/utils/supabase/data_services/data_services";
import { translationConstant } from "@/utils/translationConstants";
import { CircularProgress } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
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
import { ArrowLeftFromLine, ArrowRightFromLine } from "lucide-react";

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
  const [isAnyReturned, setIsAnyReturned] = useState(false);
  const { order_id, pos, patient_id } = orderDetails || {};

  const renderIndexHandle = (fetched_data: any, index: number) => {
    setDataList(fetched_data?.[index] || {});
    const listHistory = fetched_data?.[index]?.sales_history || [];
    const checkRtn = listHistory.filter(
      ({ return_qty }: { return_qty: number }) => return_qty > 0
    );
    setIsAnyReturned(() => checkRtn.length > 0);
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
          patientId: pos.patientid,
          currentOrderId: order_id,
        });

        const fetched_data = response?.data?.data || [];
        setHistoryRecord(fetched_data);
        renderIndexHandle(fetched_data, page - 1);
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

  const hasReturnedHandle = (val: boolean) => {
    setIsAnyReturned(() => val);
  };

  const { t } = useTranslation(translationConstant.POSHISTORY);

  return isOpen ? (
    <div className="fixed inset-0 z-30 dark:bg-black/60 flex items-center justify-center backdrop-blur-sm">
      {loading ? (
        <div className="h-full w-full flex justify-center items-center">
          <CircularProgress />
        </div>
      ) : (
        <div className="bg-white dark:bg-[#080e16] rounded-lg shadow-xl w-[85%] max-w-5xl mt-6 p-4 max-h-[80vh] overflow-y-auto">
          {/* Header Section */}
          <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              {t("POS-Historyk11")}# {order_id} {t("POS-Historyk10")}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <span className="text-2xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                &times;
              </span>
            </button>
          </div>

          {/* Patient Details */}
          <div className="my-4 p-4 bg-gray-50 dark:bg-[#080e16] rounded-lg">
            <PatientDetailsRender
              order_id={order_id?.order_id}
              patientData={dataList?.pos}
              paymentType={
                dataList?.sales_history?.[0]?.paymentcash ? "Cash" : "Debit"
              }
            />
          </div>

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
            <div className="space-y-1">
              <p className="text-gray-500 dark:text-gray-400">
                {t("Discount")}: {dataList?.promo_code_percentage ? `${dataList.promo_code_percentage}%` : "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500 dark:text-gray-400">
                {t("POS-Historyk22")}: {calcTotalAmount(dataList)}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <CiSearch
                size={20}
                className="absolute left-3 top-3 text-gray-400 dark:text-gray-500"
              />
              <input
                onChange={searchProductHandle}
                type="text"
                placeholder="Search product..."
                className=" pl-10 pr-4 py-2 border rounded-lg bg-[#f1f4f9] border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          {/* Table Section */}
          <div className="border rounded-lg overflow-hidden border-gray-200 dark:border-gray-700">
            {/* Table Header */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 grid grid-cols-12 gap-28">
              {tableHeader.map(({ label, align, flex }, index) => (
                <div
                  key={index}
                  className={`col-span-2 text-sm font-medium text-gray-500 dark:text-gray-400 ${
                    align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {t(label)}
                </div>
              ))}
            </div>

            {/* Table Body */}
            <div className="overflow-y-auto divide-y divide-gray-200 dark:-gray-700">
              {salesHistory.map((elem: DataListInterface, index: number) => (
                <TableRowRender
                  key={index}
                  preDefinedReasonList={preDefinedReasonList}
                  hasReturnedHandle={hasReturnedHandle}
                  isAnyReturned={isAnyReturned || page > 1}
                  dataList={elem}
                  order_id={order_id}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 justify-between dark:bg-[#080e16] px-3 py-2 rounded-md">
              {/* <span className="text-sm text-gray-500 dark:text-gray-400">
                Page
              </span> */}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Showing {page} out of {totalPages}
              </span>
              <div className="flex justify-center gap-2 items-center">
              <button
                onClick={() => changeHistoryHandle("prev")}
                disabled={page === 1}
                className={`p-1 rounded border-2 border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 ${
                  page === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Previous
                {/* <ArrowLeftFromLine className="w-4 h-4 text-gray-700 dark:text-gray-300" /> */}
              </button>
              
              <button
                onClick={() => changeHistoryHandle("next")}
                disabled={page === totalPages}
                className={`p-1 rounded border-2 border-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 ${
                  page === totalPages ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Next
                {/* <ArrowRightFromLine className="w-4 h-4 text-gray-700 dark:text-gray-300" /> */}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : null;
};

export default OrderDetailsModal;
