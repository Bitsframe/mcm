"use client";
import type React from "react";
import { type FC, useContext, useEffect, useState } from "react";
import {
  FaHandshake,
  FaSearch,
  FaCheckCircle,
  FaClock,
  FaBoxes,
} from "react-icons/fa";
import { CircularProgress } from "@mui/material";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { LocationContext } from "@/context";
import { TabContext } from "@/context";
import { Modal } from "flowbite-react";

interface FulfillmentRequest {
  id: number;
  order_id: string;
  main_order_id?: string;
  token: string;
  status: "pending" | "fulfilled";
  quantity: number;
  product_name: string;
  created_at: string;
  fulfilled_at?: string;
  patient_name?: string;
  patient_email?: string;
  category_name?: string; // Added property
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const StatsCard: FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  bgColor,
}) => (
  <div
    className={`p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 w-full ${bgColor} hover:shadow-md transition-all duration-200`}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">
          {title}
        </p>
        <p className={`text-xl sm:text-2xl font-bold ${color} mt-1`}>{value}</p>
      </div>
      <div
        className={`flex-shrink-0 p-2 sm:p-3 rounded-full ${color} bg-opacity-10 border border-current border-opacity-20`}
      >
        {icon}
      </div>
    </div>
  </div>
);

const FulfillmentPage = () => {
  const { selectedLocation } = useContext(LocationContext);
  const [fulfillmentRequests, setFulfillmentRequests] = useState<
    FulfillmentRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [fulfillmentOrderRef, setFulfillmentOrderRef] = useState("");
  const [fulfillmentToken, setFulfillmentToken] = useState("");
  const [searchResults, setSearchResults] = useState<FulfillmentRequest[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [fulfillingId, setFulfillingId] = useState<number | null>(null);
  const { setActiveTitle } = useContext(TabContext);
  const { t } = useTranslation(translationConstant.POSSALES);

  useEffect(() => {
    setActiveTitle("Sidebar_k19");
    fetchFulfillmentRequests();
  }, [selectedLocation]);

  const fetchFulfillmentRequests = async () => {
    if (!selectedLocation?.id) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/fulfillment/requests?locationId=${selectedLocation.id}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch fulfillment requests");
      }
      setFulfillmentRequests(result.data);
    } catch (error) {
      console.error("Error fetching fulfillment requests:", error);
      toast.error("Failed to fetch fulfillment requests");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!fulfillmentOrderRef || !fulfillmentToken || !selectedLocation?.id)
      return;

    setSearchLoading(true);
    try {
      const response = await fetch("/api/fulfillment/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderRef: fulfillmentOrderRef,
          token: fulfillmentToken,
          location_id: selectedLocation.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
        toast.success(t("POS-Sales_k68"));
      } else {
        toast.error(data.message || t("POS-Sales_k69"));
        setSearchResults([]);
      }
    } catch (error) {
      console.error("❌ Search request failed:", error);
      toast.error(t("POS-Sales_k70"));
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleMarkAsFulfilled = async (requestId: number) => {
    setFulfillingId(requestId);
    try {
      const response = await fetch("/api/fulfillment/fulfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(t("POS-Sales_k71"));
        fetchFulfillmentRequests(); // Refresh the list
        setSearchResults([]);
        setShowSearchModal(false); // Clear search results
      } else {
        toast.error(data.message || t("POS-Sales_k72"));
      }
    } catch (error) {
      toast.error(t("POS-Sales_k73"));
    } finally {
      setFulfillingId(null);
    }
  };

  const stats = {
    total: fulfillmentRequests.length,
    pending: fulfillmentRequests.filter((req) => req.status === "pending")
      .length,
    fulfilled: fulfillmentRequests.filter((req) => req.status === "fulfilled")
      .length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="w-full max-w-7xl mx-auto font-medium text-sm dark:bg-gray-900 dark:text-white py-4 px-4 sm:px-6 lg:px-4">
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t("POS-Sales_k43")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
              {t("POS-Sales_k44")}
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 hover:shadow-lg font-medium"
              onClick={() => setShowSearchModal(true)}
            >
              <FaSearch className="text-sm" />
              <span>{t("POS-Sales_k45")}</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <StatsCard
            title={t("POS-Sales_k46")}
            value={stats.total}
            icon={<FaBoxes className="text-lg sm:text-xl" />}
            color="text-blue-600"
            bgColor="bg-blue-50 dark:bg-blue-900/20"
          />
          <StatsCard
            title={t("POS-Sales_k47")}
            value={stats.pending}
            icon={<FaClock className="text-lg sm:text-xl" />}
            color="text-orange-600"
            bgColor="bg-orange-50 dark:bg-orange-900/20"
          />
          <StatsCard
            title={t("POS-Sales_k48")}
            value={stats.fulfilled}
            icon={<FaCheckCircle className="text-lg sm:text-xl" />}
            color="text-green-600"
            bgColor="bg-green-50 dark:bg-green-900/20"
          />
        </div>

        {/* Fulfillment Requests Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {t("POS-Sales_k49")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("POS-Sales_k50")}{" "}
              {selectedLocation?.title || selectedLocation?.name}
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <CircularProgress size={24} />
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {t("POS-Sales_k51")}
              </p>
            </div>
          ) : fulfillmentRequests.length === 0 ? (
            <div className="p-8 text-center">
              <FaHandshake className="mx-auto text-4xl text-gray-400 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {t("POS-Sales_k52")}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("POS-Sales_k53")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("POS-Sales_k54")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("POS-Sales_k55")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("POS-Sales_k56")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("POS-Sales_k57")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("POS-Sales_k58")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {fulfillmentRequests.map((request) => (
                      <tr
                        key={request.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {request.order_id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {request.product_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {request.patient_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {request.patient_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {request.quantity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {request.status === "pending" ? (
                            <span className="inline-flex items-center px-2.5 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full text-sm font-medium">
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
                              Fulfilled
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(request.created_at)}
                          </div>
                          {request.fulfilled_at && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Fulfilled: {formatDate(request.fulfilled_at)}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet Cards */}
              <div className="lg:hidden space-y-4 p-4">
                {fulfillmentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {t("POS-Sales_k53")}
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                            {request.order_id}
                          </div>
                        </div>
                        {request.status === "pending" ? (
                          <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full text-xs font-medium">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">
                            Fulfilled
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {t("POS-Sales_k54")}
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white mt-1">
                            {request.product_name}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {t("POS-Sales_k56")}
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white mt-1">
                            {request.quantity}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {t("POS-Sales_k55")}
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                          {request.patient_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {request.patient_email}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {t("POS-Sales_k58")}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white mt-1">
                          {formatDate(request.created_at)}
                        </div>
                        {request.fulfilled_at && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Fulfilled: {formatDate(request.fulfilled_at)}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                        {request.status === "pending" ? (
                          <button
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2 w-full justify-center shadow-md hover:shadow-lg"
                            onClick={() => handleMarkAsFulfilled(request.id)}
                            disabled={fulfillingId === request.id}
                          >
                            {fulfillingId === request.id ? (
                              <>
                                <CircularProgress size={14} color="inherit" />
                                <span>{t("POS-Sales_k74")}</span>
                              </>
                            ) : (
                              <>
                                <FaHandshake />
                                <span>{t("POS-Sales_k60")}</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 py-2">
                            <FaCheckCircle className="text-lg" />
                            <span className="font-semibold">✓ Fulfilled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Search Modal */}
        <Modal
          show={showSearchModal}
          onClose={() => {
            setShowSearchModal(false);
            setFulfillmentOrderRef("");
            setFulfillmentToken("");
            setSearchResults([]);
          }}
          size="4xl"
        >
          <Modal.Header className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center gap-3">
              <FaSearch className="text-xl" />
              <h3 className="text-xl font-semibold">{t("POS-Sales_k61")}</h3>
            </div>
          </Modal.Header>
          <Modal.Body className="p-4 sm:p-6">
            <div className="mb-6 p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
              <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                <FaSearch className="text-blue-500" />
                {t("POS-Sales_k62")}
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("POS-Sales_k63")}
                  </label>
                  <input
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder={t("POS-Sales_k103")}
                    value={fulfillmentOrderRef}
                    onChange={(e) => setFulfillmentOrderRef(e.target.value)}
                  />
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("POS-Sales_k64")}
                  </label>
                  <input
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono transition-all"
                    placeholder={t("POS-Sales_k102")}
                    value={fulfillmentToken}
                    onChange={(e) =>
                      setFulfillmentToken(e.target.value.toUpperCase())
                    }
                  />
                </div>
                <div className="lg:col-span-1 flex items-end">
                  <button
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    onClick={handleSearch}
                    disabled={
                      searchLoading || !fulfillmentOrderRef || !fulfillmentToken
                    }
                  >
                    {searchLoading ? (
                      <>
                        <CircularProgress size={14} color="inherit" />
                        <span>{t("POS-Sales_k66")}</span>
                      </>
                    ) : (
                      <span>{t("POS-Sales_k101")}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                  {t("POS-Sales_k67")}
                </h4>
                <div className="space-y-4">
                  {searchResults.map((req) => (
                    <div
                      key={req.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 sm:p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {t("POS-Sales_k63")}
                              </span>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {" "}
                                #{req.main_order_id}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {t("POS-Sales_k64")}
                              </span>
                              <p className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                                {req.token}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {t("POS-Sales_k54")}
                              </span>
                              <p className="text-gray-900 dark:text-white">
                                {req.product_name}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Category
                              </span>
                              <p className="text-gray-900 dark:text-white">
                                {req.category_name}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {t("POS-Sales_k56")}
                              </span>
                              <p className="text-gray-900 dark:text-white">
                                {req.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Status:
                            </span>
                            {req.status === "pending" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full text-sm font-medium">
                                <FaClock className="text-xs" />
                                Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
                                <FaCheckCircle className="text-xs" />
                                Fulfilled
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {req.status === "pending" ? (
                            <button
                              className="w-full lg:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                              onClick={() => handleMarkAsFulfilled(req.id)}
                              disabled={fulfillingId === req.id}
                            >
                              {fulfillingId === req.id ? (
                                <>
                                  <CircularProgress size={14} color="inherit" />
                                  <span>{t("POS-Sales_k74")}</span>
                                </>
                              ) : (
                                <>
                                  <FaHandshake />
                                  <span>{t("POS-Sales_k75")}</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 py-2.5">
                              <FaCheckCircle className="text-xl" />
                              <span className="font-semibold">✓ Fulfilled</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600">
            <button
              className="px-6 py-2.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              onClick={() => setShowSearchModal(false)}
            >
              {t("POS-Sales_k89")}
            </button>
          </Modal.Footer>
        </Modal>
      </div>
    </main>
  );
};

export default FulfillmentPage;
