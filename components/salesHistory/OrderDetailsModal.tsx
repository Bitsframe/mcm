import { fetch_content_service } from '@/utils/supabase/data_services/data_services';
import { translationConstant } from '@/utils/translationConstants';
import { CircularProgress } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CiSearch } from 'react-icons/ci';
import PatientPreviousRecord from './PatientPreviousRecord';
import { TableRowRender } from '@/components/salesHistory/RenderRow';
import { calcTotalAmount, tableHeader } from '@/components/salesHistory/utils';
import { DataListInterface, OrderDetailsModalProps } from './types/interfaces';
import { PatientDetailsRender } from './PatientDetailsRender';
import axios from 'axios';
import { toast } from 'sonner';
import moment from 'moment';
import { ArrowLeftFromLine, ArrowRightFromLine } from 'lucide-react';








const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, orderDetails, preDefinedReasonList }) => {
    const [dataList, setDataList] = useState<DataListInterface>({});
    const [salesHistory, setSalesHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [historyRecord, setHistoryRecord] = useState([])
    const [isAnyReturned, setIsAnyReturned] = useState(false)
    const { order_id, pos, patient_id } = orderDetails || {};



    const renderIndexHandle = (fetched_data: any, index: number) => {
        setDataList(fetched_data?.[index] || {});
        const listHistory = fetched_data?.[index]?.sales_history || []
        const checkRtn = listHistory.filter(({ return_qty }: { return_qty: number }) => return_qty > 0)
        setIsAnyReturned(() => checkRtn.length > 0)
        setSalesHistory(listHistory);
    }

    const totalPages = useMemo(() => historyRecord.length, [historyRecord]);

    const changeHistoryHandle = (direction: "prev" | "next") => {
        setPage((prev) => {
            let newPage = prev;
            if (direction === "prev" && prev > 1) newPage = prev - 1;
            if (direction === "next" && prev < totalPages) newPage = prev + 1;

            // Ensure valid page index before calling renderIndexHandle
            if (newPage > 0 && newPage <= totalPages) {
                renderIndexHandle(historyRecord, newPage - 1); // Convert page to zero-based index
            }

            return newPage;
        });


    }


        useEffect(() => {

            ; (async () => {
                setLoading(true);

                try {
                    const response = await axios.post('/api/previous-order-history',
                        { patientId: pos.patientid, currentOrderId: order_id },
                    );

                    const fetched_data = response?.data?.data || []

                    setHistoryRecord(fetched_data)
                    renderIndexHandle(fetched_data, page - 1)



                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                    toast.error(errorMessage);
                    console.error('Error fetching patient history:', error);
                } finally {
                    setLoading(false);
                }


            })();

        }, [order_id])


        const searchProductHandle = (e: any) => {
            const val = e.target.value
            if (val === '') {
                setSalesHistory(dataList.sales_history)
                console.log({val, dataList})

            }
            else {

                const filteredData = dataList.sales_history.filter((elem: any) => elem?.inventory?.products?.product_name?.toLocaleLowerCase().includes(val.toLocaleLowerCase()))
                setSalesHistory([...filteredData])
            }

        }

        const hasReturnedHandle = (val: boolean) => {
            setIsAnyReturned(() => val)
        }

        const { t } = useTranslation(translationConstant.POSHISTORY)
        return (
           isOpen ? (
  <div className="fixed inset-0 z-30 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm"> {/* NEW: Added backdrop blur */}
    {loading ? (
      <div className='h-full w-full flex justify-center items-center'>
        <CircularProgress />
      </div>
    ) : (
      <div className="bg-white rounded-xl shadow-2xl w-11/12 max-w-4xl p-6"> {/* NEW: Increased max width, shadow */}
        {/* Header Section */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200"> {/* NEW: Border color change */}
          <h2 className="text-2xl font-semibold text-gray-800"> {/* NEW: Larger text */}
            {t("POS-Historyk11")}# {order_id} {t("POS-Historyk10")}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 rounded-full transition-colors" // NEW: Hover effect
          >
            <span className="text-2xl text-gray-500 hover:text-gray-700">&times;</span>
          </button>
        </div>

        {/* Patient Details */}
        <div className="my-4 p-4 bg-gray-50 rounded-lg"> {/* NEW: Background container */}
          <PatientDetailsRender 
            order_id={order_id?.order_id} 
            patientData={dataList?.pos}
            paymentType={dataList?.sales_history?.[0]?.paymentcash ? "Cash" : "Debit"}
          />
        </div>

        {/* Order Summary */}
        <div className="flex flex-col md:flex-row gap-4 items-start justify-between mb-6"> {/* NEW: Responsive layout */}
          <h3 className="text-lg font-semibold text-gray-700">{t("POS-Historyk21")}</h3>
          
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm"> {/* NEW: Grid layout */}
            <div className="space-y-1">
              <p className="text-gray-500">Order ID:</p>
              <p className="font-medium text-gray-700">{dataList?.order_id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Order Date:</p>
              <p className="font-medium text-gray-700">
                {moment(dataList?.order_date).utcOffset(-6).format("DD-MM-YYYY")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Payment Type:</p>
              <p className="font-medium text-gray-700">
                {dataList?.sales_history?.[0]?.paymentcash ? "Cash" : "Debit"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">{t("POS-Historyk22")}:</p>
              <p className="font-medium text-gray-700">
                {calcTotalAmount(dataList)}
              </p>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-md"> {/* NEW: Styled container */}
            <span className="text-sm text-gray-500">Page</span>
            <button
              onClick={() => changeHistoryHandle("prev")}
              disabled={page === 1}
              className={`p-1 rounded hover:bg-gray-200 ${
                page === 1 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <ArrowLeftFromLine className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {page}/{totalPages}
            </span>
            <button
              onClick={() => changeHistoryHandle("next")}
              disabled={page === totalPages}
              className={`p-1 rounded hover:bg-gray-200 ${
                page === totalPages ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <ArrowRightFromLine className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <CiSearch 
              size={20} 
              className="absolute left-3 top-3 text-gray-400" // NEW: Position adjustment
            />
            <input
              onChange={searchProductHandle}
              type="text" 
              placeholder="Search product..." 
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" // NEW: Better focus state
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="border rounded-lg overflow-hidden"> {/* NEW: Container styling */}
          {/* Table Header */}
          <div className="bg-gray-50 px-4 py-3 grid grid-cols-12 gap-4"> {/* NEW: Grid layout */}
            {tableHeader.map(({ label, align, flex }, index) => (
              <div 
                key={index}
                className={`col-span-2 text-sm font-medium text-gray-500 ${
                  align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {t(label)}
              </div>
            ))}
          </div>

          {/* Table Body */}
          <div className=" overflow-y-auto divide-y"> {/* NEW: Added divide */}
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
        </div>
      </div>
    )}
  </div>
) : null
        );
    };

    export default OrderDetailsModal;
