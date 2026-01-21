"use client";

import React, { useEffect, useState, useContext, useMemo } from "react";
import { fetch_content_service } from "@/utils/supabase/data_services/data_services";
import { LocationContext } from "@/context";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";

interface StockAlert {
  uuid: string;
  inventory_id: number;
  product_id: number;
  location_id: number;
  quantity: number;
  threshold: number;
  priority: "Critical" | "Warning" | "Healthy";
  message: string;
  anomaly_severity: string;
  anomaly_message: string;
  forecasted_runout_months: number;
  created_at: string;
  product_name?: string;
  sku?: string;
  inventory?: {
    products?: {
      product_name?: string;
    };
  };
}

interface DataListInterface {
  [key: string]: any;
}

const StockAlertsComponent: React.FC = () => {
  const [dataList, setDataList] = useState<DataListInterface[]>([]);
  const [allData, setAllData] = useState<DataListInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<DataListInterface | null>(
    null
  );
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "",
    direction: "asc",
  });
  const { selectedLocation } = useContext(LocationContext);
  const { t } = useTranslation(translationConstant.STOCKPANEL);

  const fetchStockAlerts = async (location_id: number) => {
    setLoading(true);
    console.log("🔍 Fetching stock alerts for location_id:", location_id);

    try {
      let fetched_data = await fetch_content_service({
        table: "stock_alerts",
        language: "",
        selectParam: ", inventory(products(product_name))",
        matchCase: [{ key: "location_id", value: location_id }],
        sortOptions: {
          column: "created_at",
          order: "desc",
        },
      });

      if (!fetched_data || fetched_data.length === 0) {
        const all_data = await fetch_content_service({
          table: "stock_alerts",
          language: "",
          selectParam: ", inventory(products(product_name))",
          matchCase: null,
          sortOptions: {
            column: "created_at",
            order: "desc",
          },
        });

        if (all_data && all_data.length > 0) {
          fetched_data = all_data;
        }
      }

      const normalizedData = (fetched_data || []).map((item: StockAlert) => ({
        ...item,
        product_name:
          item.inventory?.products?.product_name ?? item.product_name ?? "",
      }));

      setDataList(normalizedData);
      setAllData(normalizedData);
      setLoading(false);
    } catch (error) {
      console.error(" Error fetching stock alerts:", error);
      setDataList([]);
      setAllData([]);
      setLoading(false);
    }
  };

  const getProductName = (item: DataListInterface) =>
    (
      item.inventory?.products?.product_name ||
      item.product_name ||
      ""
    ).toString();

  const onSearchHandle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);

    let filteredData = allData;

    if (val !== "") {
      const searchTermLower = val.toLowerCase();
      filteredData = filteredData.filter((elem) =>
        getProductName(elem).toLowerCase().includes(searchTermLower)
      );
    }

    setDataList([...filteredData]);
    setCurrentPage(1);
  };

  const priorityRank = (priority: string | undefined) => {
    switch ((priority || "").toLowerCase()) {
      case "critical":
        return 3;
      case "warning":
        return 2;
      case "healthy":
        return 1;
      default:
        return 0;
    }
  };

  const anomalyRank = (severity: string | undefined) => {
    switch ((severity || "").toLowerCase()) {
      case "high":
        return 3;
      case "medium":
        return 2;
      case "low":
        return 1;
      default:
        return 0;
    }
  };

  const sortedData = useMemo(() => {
    const data = [...dataList];

    if (!sortConfig.key) {
      return data;
    }

    return data.sort((a, b) => {
      const multiplier = sortConfig.direction === "asc" ? 1 : -1;

      switch (sortConfig.key) {
        case "product_name": {
          const aName = getProductName(a).toLowerCase();
          const bName = getProductName(b).toLowerCase();
          return aName.localeCompare(bName) * multiplier;
        }
        case "quantity": {
          const aQty = Number(a.quantity ?? 0);
          const bQty = Number(b.quantity ?? 0);
          return (aQty - bQty) * multiplier;
        }
        case "threshold": {
          const aThreshold = Number(a.threshold ?? 0);
          const bThreshold = Number(b.threshold ?? 0);
          return (aThreshold - bThreshold) * multiplier;
        }
        case "priority": {
          const diff = priorityRank(a.priority) - priorityRank(b.priority);
          if (diff !== 0) {
            return diff * multiplier;
          }
          return (
            getProductName(a)
              .toLowerCase()
              .localeCompare(getProductName(b).toLowerCase()) * multiplier
          );
        }
        case "anomaly_severity": {
          const diff =
            anomalyRank(a.anomaly_severity) - anomalyRank(b.anomaly_severity);
          if (diff !== 0) {
            return diff * multiplier;
          }
          return (
            getProductName(a)
              .toLowerCase()
              .localeCompare(getProductName(b).toLowerCase()) * multiplier
          );
        }
        default:
          return 0;
      }
    });
  }, [dataList, sortConfig]);

  const totalPages = Math.ceil((sortedData?.length || 0) / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, sortedData.length);
  const currentData = sortedData.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "asc",
      };
    });

    setCurrentPage(1);
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }

    if (sortConfig.direction === "asc") {
      return <ChevronUp className="w-4 h-4 text-blue-500" />;
    }

    return <ChevronDown className="w-4 h-4 text-blue-500" />;
  };

  const handlePreviousPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const openModal = (alert: DataListInterface) => {
    setSelectedAlert(alert);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedAlert(null);
  };

  useEffect(() => {
    if (selectedLocation?.id) {
      fetchStockAlerts(selectedLocation.id);
    } else {
      setDataList([]);
      setAllData([]);
      setLoading(false);
    }
  }, [selectedLocation]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "Warning":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "Critical";
      case "Warning":
        return "High";
      default:
        return "Medium";
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-[#0e1725] rounded-2xl shadow-sm mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search alerts..."
            onChange={onSearchHandle}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Loading AI Analysis...
              </span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#0e1725]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort("product_name")}
                      className="flex items-center gap-1"
                    >
                      {t("product_name")}
                      {renderSortIcon("product_name")}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort("quantity")}
                      className="flex items-center justify-center gap-1 w-full"
                    >
                      {t("stock")}
                      {renderSortIcon("quantity")}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort("threshold")}
                      className="flex items-center justify-center gap-1 w-full"
                    >
                      {t("threshold")}
                      {renderSortIcon("threshold")}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort("priority")}
                      className="flex items-center justify-center gap-1 w-full"
                    >
                      {t("priority")}
                      {renderSortIcon("priority")}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort("anomaly_severity")}
                      className="flex items-center justify-center gap-1 w-full"
                    >
                      {t("anomaly")}
                      {renderSortIcon("anomaly_severity")}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#0e1725] divide-y divide-gray-200 dark:divide-gray-700">
                {currentData.map((item, index) => {
                  const isLowStock = item.quantity <= item.threshold;
                  return (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => openModal(item)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <span>
                            {item.inventory?.products?.product_name ||
                              item.product_name ||
                              "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {isLowStock && (
                            <svg
                              className="w-4 h-4 text-orange-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                          )}
                          <span
                            className={`text-sm font-medium ${
                              isLowStock
                                ? "text-orange-500"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {item.quantity || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                        {item.threshold || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                            item.priority
                          )}`}
                        >
                          {getPriorityText(item.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.anomaly_severity === "High"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : item.anomaly_severity === "Medium"
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                        >
                          {item.anomaly_severity || "-"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex flex-row justify-between items-center gap-2 py-3 border-t border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-500 dark:text-gray-300 bg-white dark:bg-[#0e1725] px-4">
              <div>
                {sortedData.length === 0
                  ? `Showing 0 to 0 of 0`
                  : `Showing ${startIndex + 1} to ${endIndex} of ${
                      sortedData.length
                    }`}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors duration-150 ${
                    currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={
                    currentPage === totalPages || sortedData.length === 0
                  }
                  className={`px-3 py-1 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors duration-150 ${
                    currentPage === totalPages || sortedData.length === 0
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {modalOpen && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("stock_alert_details")}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("product_name")}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedAlert.inventory?.products?.product_name ||
                        selectedAlert.product_name ||
                        "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("quantity")}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedAlert.quantity || 0}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("threshold")}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedAlert.threshold || 0}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("priority")}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedAlert.priority || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("anomaly_severity")}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedAlert.anomaly_severity || "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("anomaly_message")}
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedAlert.anomaly_message || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("forecasted_runout_months")}
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedAlert.forecasted_runout_months || "-"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  {t("stock_trend_analysis")}
                </h4>
                <div className="h-[300px]">
                  {/* Shadcn Chart Component */}
                  <ChartContainer
                    config={{
                      quantity: {
                        label: "Quantity",
                        color: "#2563eb",
                      },
                      threshold: {
                        label: "Threshold",
                        color: "#dc2626",
                      },
                      forecast: {
                        label: "Forecast",
                        color: "#16a34a",
                      },
                    }}
                  >
                    <LineChart
                      data={[
                        {
                          name: "Current",
                          quantity: selectedAlert.quantity,
                          threshold: selectedAlert.threshold,
                          forecast: Math.max(
                            0,
                            selectedAlert.quantity -
                              Math.round(
                                selectedAlert.quantity /
                                  (selectedAlert.forecasted_runout_months || 1)
                              )
                          ),
                        },
                        {
                          name: "1 Month",
                          quantity: Math.max(
                            0,
                            selectedAlert.quantity -
                              Math.round(
                                selectedAlert.quantity /
                                  (selectedAlert.forecasted_runout_months || 1)
                              )
                          ),
                          threshold: selectedAlert.threshold,
                          forecast: Math.max(
                            0,
                            selectedAlert.quantity -
                              Math.round(
                                (selectedAlert.quantity /
                                  (selectedAlert.forecasted_runout_months ||
                                    1)) *
                                  2
                              )
                          ),
                        },
                        {
                          name: "2 Months",
                          quantity: Math.max(
                            0,
                            selectedAlert.quantity -
                              Math.round(
                                (selectedAlert.quantity /
                                  (selectedAlert.forecasted_runout_months ||
                                    1)) *
                                  2
                              )
                          ),
                          threshold: selectedAlert.threshold,
                          forecast: Math.max(
                            0,
                            selectedAlert.quantity -
                              Math.round(
                                (selectedAlert.quantity /
                                  (selectedAlert.forecasted_runout_months ||
                                    1)) *
                                  3
                              )
                          ),
                        },
                        {
                          name: "3 Months",
                          quantity: Math.max(
                            0,
                            selectedAlert.quantity -
                              Math.round(
                                (selectedAlert.quantity /
                                  (selectedAlert.forecasted_runout_months ||
                                    1)) *
                                  3
                              )
                          ),
                          threshold: selectedAlert.threshold,
                          forecast: Math.max(
                            0,
                            selectedAlert.quantity -
                              Math.round(
                                (selectedAlert.quantity /
                                  (selectedAlert.forecasted_runout_months ||
                                    1)) *
                                  4
                              )
                          ),
                        },
                      ]}
                      margin={{
                        top: 20,
                        right: 20,
                        bottom: 20,
                        left: 20,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis dataKey="name" className="text-sm" />
                      <YAxis className="text-sm" />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        cursor={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="quantity"
                        strokeWidth={2}
                        activeDot={{
                          r: 6,
                          style: { fill: "#2563eb", opacity: 0.8 },
                        }}
                        className="stroke-[--color-quantity] fill-[--color-quantity]"
                      />
                      <Line
                        type="monotone"
                        dataKey="threshold"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        activeDot={{
                          r: 6,
                          style: { fill: "#dc2626", opacity: 0.8 },
                        }}
                        className="stroke-[--color-threshold] fill-[--color-threshold]"
                      />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        activeDot={{
                          r: 6,
                          style: { fill: "#16a34a", opacity: 0.8 },
                        }}
                        className="stroke-[--color-forecast] fill-[--color-forecast]"
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                    </LineChart>
                  </ChartContainer>
                </div>
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    {t("projected_runout_in", { count: selectedAlert.forecasted_runout_months || t("unknown") })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAlertsComponent;
