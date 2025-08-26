"use client";

import React, { useEffect, useState, useContext } from "react";
import { fetch_content_service } from "@/utils/supabase/data_services/data_services";
import { LocationContext } from "@/context";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

interface StockAlert {
  uuid: string;
  inventory_id: number;
  product_id: number;
  location_id: number;
  quantity: number;
  threshold: number;
  priority: 'Critical' | 'Warning' | 'Healthy';
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
  const [selectedAlert, setSelectedAlert] = useState<DataListInterface | null>(null);

  const { selectedLocation } = useContext(LocationContext);
  const { t } = useTranslation(translationConstant.STOCKPANEL);



  const fetchStockAlerts = async (location_id: number) => {
    setLoading(true);
    console.log("🔍 Fetching stock alerts for location_id:", location_id);
    
    try {
      let fetched_data = await fetch_content_service({
        table: "stock_alerts",
        language: "",
        selectParam: "inventory_id, product_id, location_id, quantity, threshold, priority, message, anomaly_severity, anomaly_message, forecasted_runout_months, created_at, inventory(products(product_name))",
        matchCase: [
          { key: "location_id", value: location_id }
        ],
        sortOptions: {
          column: "created_at",
          order: "desc"
        }
      });

      if (!fetched_data || fetched_data.length === 0) {
        const all_data = await fetch_content_service({
          table: "stock_alerts",
          language: "",
          selectParam: ", inventory(products(product_name))",
          matchCase: null,
          sortOptions: {
            column: "created_at",
            order: "desc"
          }
        });
        
        if (all_data && all_data.length > 0) {
          fetched_data = all_data;
        }
      }

      setDataList(fetched_data || []);
      setAllData(fetched_data || []);
    } catch (error) {
      console.error("❌ Error fetching stock alerts:", error);
      setDataList([]);
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  const onSearchHandle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    
    let filteredData = allData;

    if (val !== "") {
      filteredData = filteredData.filter((elem) =>
        (elem.inventory_id?.toString() || "").includes(val) ||
        (elem.product_id?.toString() || "").includes(val) ||
        (elem.priority?.toLowerCase() || "").includes(val.toLowerCase()) ||
        (elem.message?.toLowerCase() || "").includes(val.toLowerCase()) ||
        (elem.inventory?.products?.product_name?.toLowerCase() || "").includes(val.toLowerCase()) ||
        (elem.product_name?.toLowerCase() || "").includes(val.toLowerCase())
      );
    }

    setDataList([...filteredData]);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil((dataList?.length || 0) / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, dataList.length);
  const currentData = dataList.slice(startIndex, endIndex);

  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

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
      case 'Critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Warning':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'Critical';
      case 'Warning':
        return 'High';
      default:
        return 'Medium';
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <span>AI-Powered Stock Alerts</span>
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
              </svg>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Intelligent inventory monitoring with predictive insights
            </p>
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
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
              <span className="text-gray-600 dark:text-gray-400">Loading AI Analysis...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Inventory ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Threshold</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Anomaly</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentData.map((item, index) => {
                  const isLowStock = item.quantity <= item.threshold;
                  return (
                    <tr 
                      key={index} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => openModal(item)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                        {item.inventory_id || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                        {item.product_id || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <span>{item.inventory?.products?.product_name || item.product_name || "-"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {isLowStock && (
                            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                            </svg>
                          )}
                          <span className={`text-sm font-medium ${isLowStock ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>
                            {item.quantity || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                        {item.threshold || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {getPriorityText(item.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.message ? `${item.message.substring(0, 20)}...` : "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.anomaly_severity === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          item.anomaly_severity === 'Medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {item.anomaly_severity || "-"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="flex flex-row justify-between items-center gap-2 py-3 border-t border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-500 dark:text-gray-300 bg-white dark:bg-gray-800 px-4">
              <div>
                {dataList.length === 0
                  ? `Showing 0 to 0 of 0`
                  : `Showing ${startIndex + 1} to ${endIndex} of ${dataList.length}`}
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
                  disabled={currentPage === totalPages || dataList.length === 0}
                  className={`px-3 py-1 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors duration-150 ${
                    currentPage === totalPages || dataList.length === 0
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

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 mt-6 border border-blue-200 dark:border-blue-700/50">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-3 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Insight</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Based on usage patterns, 3 critical items need immediate attention. AI recommends bulk ordering to optimize costs.
            </p>
          </div>
        </div>
      </div>

      {modalOpen && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stock Alert Details</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Inventory ID</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAlert.inventory_id || "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product ID</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAlert.product_id || "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAlert.quantity || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Threshold</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAlert.threshold || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAlert.priority || "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Anomaly Severity</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAlert.anomaly_severity || "-"}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAlert.message || "-"}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Anomaly Message</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAlert.anomaly_message || "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Forecasted Runout (Months)</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedAlert.forecasted_runout_months || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAlertsComponent;
