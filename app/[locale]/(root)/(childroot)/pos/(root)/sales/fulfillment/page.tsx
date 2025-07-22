"use client";
import React, { FC, useContext, useEffect, useState } from "react";
import { FaHandshake, FaSearch, FaCheckCircle, FaClock, FaBoxes, FaTruck } from "react-icons/fa";
import { CircularProgress } from "@mui/material";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { LocationContext } from "@/context";
import { TabContext } from "@/context";
import { fetch_content_service } from "@/utils/supabase/data_services/data_services";
import { Modal } from "flowbite-react";


interface FulfillmentRequest {
  id: number;
  order_id: string;
  main_order_id?: string; 
  token: string;
  status: 'pending' | 'fulfilled';
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

const StatsCard: FC<StatsCardProps> = ({ title, value, icon, color, bgColor }) => (
  <div className={`p-6 rounded-lg shadow-sm w-full ${bgColor}`}>
    <div className="flex items-center justify-between flex-wrap gap-4">
      
      <div className="min-w-0 overflow-hidden">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate max-w-full">
          {title}
        </p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>

      <div className={`flex-shrink-0 p-3 rounded-full ${color} bg-opacity-10`}>
        {icon}
      </div>
    </div>
  </div>
);





const FulfillmentPage = () => {
  const { selectedLocation } = useContext(LocationContext);
  const [fulfillmentRequests, setFulfillmentRequests] = useState<FulfillmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [fulfillmentOrderRef, setFulfillmentOrderRef] = useState('');
  const [fulfillmentToken, setFulfillmentToken] = useState('');
  const [searchResults, setSearchResults] = useState<FulfillmentRequest[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [fulfillingId, setFulfillingId] = useState<number | null>(null);
  const [fulfillingToken, setFulfillingToken] = useState<string | null>(null);


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
      const response = await fetch(`/api/fulfillment/requests?locationId=${selectedLocation.id}`);
      const result = await response.json();
    

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch fulfillment requests');
      }

      setFulfillmentRequests(result.data);
    } catch (error) {
      console.error('Error fetching fulfillment requests:', error);
      toast.error('Failed to fetch fulfillment requests');
    } finally {
      setLoading(false);
    }
  };

  // const handleSearch = async () => {
  //   if (!fulfillmentOrderRef || !fulfillmentToken || !selectedLocation?.id) return;

  //   setSearchLoading(true);
  //   try {
  //     const response = await fetch('/api/fulfillment/search', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         orderRef: fulfillmentOrderRef,
  //         token: fulfillmentToken,
  //         location_id: selectedLocation.id
  //       })
  //     });

  //     const data = await response.json();
  //     if (data.success) {
  //       setSearchResults(data.data);
  //       toast.success(t("POS-Sales_k68"));
  //     } else {
  //       toast.error(data.message || t("POS-Sales_k69"));
  //       setSearchResults([]);
  //     }
  //   } catch (error) {
  //     toast.error(t("POS-Sales_k70"));
  //     setSearchResults([]);
  //   } finally {
  //     setSearchLoading(false);
  //   }
  // };
  const handleSearch = async () => {
    if (!fulfillmentOrderRef || !fulfillmentToken || !selectedLocation?.id) return;
  

  
    setSearchLoading(true);
    try {
      const response = await fetch('/api/fulfillment/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderRef: fulfillmentOrderRef,
          token: fulfillmentToken,
          location_id: selectedLocation.id
        })
      });
  
     
  
      const data = await response.json();
      console.log("🔍 Fulfillment Search Response:", data);
    
  
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
  




  // const handleMarkAsFulfilled = async (requestId: number) => {
  //   setFulfillingId(requestId);
  //   try {
  //     const response = await fetch('/api/fulfillment/fulfill', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ requestId })
  //     });

  //     const data = await response.json();


  //     if (data.success) {
  //       toast.success(t("POS-Sales_k71"));
  //       fetchFulfillmentRequests(); // Refresh the list
  //       setSearchResults([]); 
  //       setShowSearchModal(false); // Clear search results
  //     } else {
  //       toast.error(data.message || t("POS-Sales_k72"));
  //     }
  //   } catch (error) {
  //     toast.error(t("POS-Sales_k73"));
  //   } finally {
  //     setFulfillingId(null);
  //   }
  // };


  // const handleMarkAsFulfilled = async (token: string, requestIds: number[]) => {
  //   setFulfillingToken(token); // New token-based loading tracker
  //   try {
  //     const response = await fetch('/api/fulfillment/fulfill-batch', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ requestIds }) // 👈 pass an array of IDs
  //     });
  
  //     const data = await response.json();
  
  //     if (data.success) {
  //       toast.success(t("POS-Sales_k71"));
  //       fetchFulfillmentRequests(); // Refresh the list
  //       setSearchResults([]);
  //       setShowSearchModal(false);
  //     } else {
  //       toast.error(data.message || t("POS-Sales_k72"));
  //     }
  //   } catch (error) {
  //     toast.error(t("POS-Sales_k73"));
  //   } finally {
  //     setFulfillingToken(null);
  //   }
  // };

  const handleMarkAsFulfilled = async (
    tokenOrId: string | number,
    requestIds?: number[]
  ) => {
    const isBatch = Array.isArray(requestIds);
    
    // Set loading states
    if (isBatch) {
      setFulfillingToken(tokenOrId as string);
    } else {
      setFulfillingId(tokenOrId as number);
    }
  
    try {
      const response = await fetch('/api/fulfillment/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isBatch
            ? { requestIds }                    // 👈 batch fulfillment
            : { requestId: tokenOrId }          // 👈 single fulfillment
        )
      });
  
      const data = await response.json();
  
      if (data.success) {
        toast.success(t("POS-Sales_k71"));
        fetchFulfillmentRequests();
        setSearchResults([]);
        setShowSearchModal(false);
        setFulfillmentOrderRef('');
        setFulfillmentToken('');
      } else {
        toast.error(data.message || t("POS-Sales_k72"));
      }
    } catch (error) {
      toast.error(t("POS-Sales_k73"));
    } finally {
      // Reset appropriate loading state
      if (isBatch) {
        setFulfillingToken(null);
      } else {
        setFulfillingId(null);
      }
    }
  };
  
  

  const stats = {
    total: fulfillmentRequests.length,
    pending: fulfillmentRequests.filter(req => req.status === 'pending').length,
    fulfilled: fulfillmentRequests.filter(req => req.status === 'fulfilled').length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  const groupedResults: Record<string, any[]> = {};

  searchResults.forEach((req) => {
    if (!groupedResults[req.token]) {
      groupedResults[req.token] = [];
    }
    groupedResults[req.token].push(req);
  });

  return (
    <main className="w-full max-w-screen-lg font-medium text-sm dark:bg-gray-900 dark:text-white py-4 overflow-x-hidden ">
  <div className="space-y-6 w-full max-w-[90%] sm:max-w-[500px] md:max-w-[768px] lg:max-w-[900px] xl:max-w-[1000px] mx-auto md:mx-0">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between flex-wrap gap-4 w-full min-w-0">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("POS-Sales_k43")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t("POS-Sales_k44")}
        </p>
      </div>

      <div className="w-full sm:w-auto">
        <button
          className="flex items-center justify-center gap-2 max-w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
          onClick={() => setShowSearchModal(true)}
        >
          <FaSearch className="text-sm" />
          <span className="font-medium">{t("POS-Sales_k45")}</span>
        </button>
      </div>
    </div>

    {/* Statistics Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
      <StatsCard
        title={t("POS-Sales_k46")}
        value={stats.total}
        icon={<FaBoxes className="text-xl" />}
        color="text-blue-600"
        bgColor="bg-blue-50 dark:bg-blue-900/20"
      />

      <StatsCard
        title={t("POS-Sales_k47")}
        value={stats.pending}
        icon={<FaClock className="text-xl" />}
        color="text-orange-600"
        bgColor="bg-orange-50 dark:bg-orange-900/20"
      />

      <StatsCard
        title={t("POS-Sales_k48")}
        value={stats.fulfilled}
        icon={<FaCheckCircle className="text-xl" />}
        color="text-green-600"
        bgColor="bg-green-50 dark:bg-green-900/20"
      />
    </div>


        </div>
        {/* Fulfillment Requests Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("POS-Sales_k49")}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("POS-Sales_k50")} {selectedLocation?.title || selectedLocation?.name}
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <CircularProgress size={24} />
              <p className="text-gray-600 dark:text-gray-400 mt-2">{t("POS-Sales_k51")}</p>
            </div>
          ) : fulfillmentRequests.length === 0 ? (
            <div className="p-8 text-center">
              <FaHandshake className="mx-auto text-4xl text-gray-400 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{t("POS-Sales_k52")}</p>
            </div>
          ) : (
            <div className="hidden md:block w-full overflow-x-auto">
  <div className="min-w-[800px]">
    <table className="w-full table-auto">

                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("POS-Sales_k53")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("POS-Sales_k55")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("POS-Sales_k54")}
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
                    <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {request.order_id}
                          </div>
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
                        <div className="text-sm text-gray-900 dark:text-white">{request.product_name}</div>
                      </td>
                     
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{request.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.status === 'pending' ? (
                          <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full text-sm font-medium">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
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
            </div>
          )}
        </div>
      


{/* Mobile Cards (only visible on small screens) */}
<div className="md:hidden space-y-4">
  {fulfillmentRequests.map((request) => (
    <div
      key={request.id}
      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700"
    >
      <div className="mb-2">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {t("POS-Sales_k53")}
        </div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {request.order_id}
        </div>
      </div>

      <div className="mb-2">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {t("POS-Sales_k54")}
        </div>
        <div className="text-sm text-gray-900 dark:text-white">{request.product_name}</div>
      </div>

      <div className="mb-2">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {t("POS-Sales_k55")}
        </div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {request.patient_name}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {request.patient_email}
        </div>
      </div>

      <div className="mb-2">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {t("POS-Sales_k56")}
        </div>
        <div className="text-sm text-gray-900 dark:text-white">{request.quantity}</div>
      </div>

      <div className="mb-2">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {t("POS-Sales_k57")}
        </div>
        {request.status === 'pending' ? (
          <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full text-sm font-medium">
            Pending
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
            Fulfilled
          </span>
        )}
      </div>

      <div className="mb-2">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {t("POS-Sales_k58")}
        </div>
        <div className="text-sm text-gray-900 dark:text-white">
          {formatDate(request.created_at)}
        </div>
        {request.fulfilled_at && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Fulfilled: {formatDate(request.fulfilled_at)}
          </div>
        )}
      </div>

      <div className="pt-2">
        {request.status === 'pending' ? (
          <button
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2 w-full justify-center"
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
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <FaCheckCircle className="text-xl" />
            <span className="font-semibold">✓ Fulfilled</span>
          </div>
        )}
      </div>
    </div>
  ))}
</div>



      {/* Search Modal */}
      <Modal show={showSearchModal} onClose={() => {
    setShowSearchModal(false);
    setFulfillmentOrderRef("");
    setFulfillmentToken("");
    setSearchResults([]);
  }}size="2xl">
        <Modal.Header className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center gap-3">
            <FaSearch className="text-xl" />
            <h3 className="text-xl font-semibold">{t("POS-Sales_k61")}</h3>
          </div>
        </Modal.Header>
        <Modal.Body className="p-6">
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white flex items-center gap-2">
              <FaSearch className="text-blue-500" />
              {t("POS-Sales_k62")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("POS-Sales_k63")}</label>
                <input
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter order #"
                  value={fulfillmentOrderRef}
                  onChange={e => setFulfillmentOrderRef(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("POS-Sales_k64")}</label>
                <input
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="Enter token"
                  value={fulfillmentToken}
                    onChange={e => setFulfillmentToken(e.target.value.toUpperCase())}
                />
              </div>
              <div className="flex items-end">
                <button
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                  onClick={handleSearch}
                  disabled={searchLoading || !fulfillmentOrderRef || !fulfillmentToken}
                >
                  {searchLoading ? (
                    <>
                      <CircularProgress size={14} color="inherit" />
                      <span>{t("POS-Sales_k66")}</span>
                    </>
                  ) : (
                    <>
                      
                      <span>Confirmed Fullfillment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
      <div className="max-h-[500px] overflow-y-auto pr-2">


              <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">{t("POS-Sales_k67")}</h4>
             {Object.entries(groupedResults).map(([token, items]) => {
              const isPending = items.some(i => i.status === 'pending');
              const isFulfilling = fulfillingToken === token;


  return (
    <div key={token} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("POS-Sales_k63")}</span>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">#{items[0].main_order_id}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("POS-Sales_k64")}</span>
              <p className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">{token}</p>
            </div>
          </div>

          {items.map((req) => (
            <div key={req.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 border p-2 rounded-md dark:border-gray-700">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("POS-Sales_k54")}</span>
                <p className="text-gray-900 dark:text-white">{req.product_name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</span>
                <p className="text-gray-900 dark:text-white">{req.category_name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("POS-Sales_k56")}</span>
                <p className="text-gray-900 dark:text-white">{req.quantity}</p>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
            {isPending ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full text-sm font-medium">
                <FaClock className="text-xs" />
                Pending
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
                <FaCheckCircle className="text-xs" />
                Fulfilled
              </span>
            )}
          </div>
        </div>

        {isPending ? (
          <button
            className="ml-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
            onClick={() => handleMarkAsFulfilled(token, items.map(i => i.id))}

            disabled={isFulfilling}
          >
            {isFulfilling ? (
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
          <div className="ml-4 flex items-center gap-2 text-green-600 dark:text-green-400">
            <FaCheckCircle className="text-xl" />
            <span className="font-semibold">✓ Fulfilled</span>
          </div>
        )}
      </div>
    </div>
  );
})}

            </div>

            
          )}
        </Modal.Body>
        <Modal.Footer className="bg-gray-50 dark:bg-gray-800">
          <button
            className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            onClick={() => setShowSearchModal(false)}
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </main>
  );
};

export default FulfillmentPage; 