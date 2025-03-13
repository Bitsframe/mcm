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
            isOpen ? <div className="fixed inset-0 z-30 bg-black bg-opacity-50 flex items-center justify-center">
                {loading ? <div className='h-full w-full flex justify-center items-center '>
                    <CircularProgress />
                </div> : <div className="bg-white rounded-lg w-3/4 p-6">
                    <div className="flex justify-between items-center border-b pb-3">
                        <h2 className="text-xl font-bold">{t("POS-Historyk11")}# {order_id} {t("POS-Historyk10")}</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
                    </div>


                    <PatientDetailsRender order_id={order_id?.order_id} patientData={dataList?.pos}

                        // paymentType={[null, true].includes(dataList[0].paymentcash) ? "Cash" : "Creadit Card"}
                        paymentType={dataList?.sales_history?.[0]?.paymentcash ? "Cash" : "Debit"}

                    />




                    <div className='flex items-center justify-between'>
                        <h3 className="font-bold">{t("POS-Historyk21")}</h3>

                        <div className='mx-5 flex flex-1 items-center justify-center space-x-4'>
                            <p className='text-sm '>
                                Order ID: <span className='font-bold'>
                                    {dataList?.order_id}
                                </span>
                            </p>
                            {/* <span>|</span> */}
                            <p className='text-sm '>
                                Order Date: <span className='font-bold'>
                                    {moment(dataList?.order_date).utcOffset(-6).format("DD-MM-YYYY")}
                                </span>
                            </p>
                            {/* <span>|</span> */}
                            <p className='text-sm '>
                                Payment Type: <span className='font-bold'>
                                    {dataList?.sales_history?.[0]?.paymentcash ? "Cash" : "Debit"}
                                </span>
                            </p>
                            {/* <span>|</span> */}
                            <p className='text-sm '>
                                {t("POS-Historyk22")}: <span className='font-bold'>
                                    {calcTotalAmount(dataList)}
                                </span>
                            </p>

                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                            <span className="text-gray-400">Pagination</span>
                            <button
                                onClick={() => changeHistoryHandle("prev")}
                                disabled={page === 1}
                                className={`text-gray-600 ${page === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <ArrowLeftFromLine />
                            </button>
                            <span className="text-gray-400">{page}/{totalPages}</span>
                            <button
                                onClick={() => changeHistoryHandle("next")}
                                disabled={page === totalPages}
                                className={`text-gray-600 ${page === totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <ArrowRightFromLine />
                            </button>
                        </div>


                    </div>

                    <div className='h-[1px] w-full mt-3 bg-[#E2E8F0]' />



                    <div className='mt-4'>
                        <div className='flex border-[#E2E8F0] border-[1px] items-center space-x-3 px-1 py-1 w-72 text-sm bg-white rounded-md'>
                            <CiSearch size={22} color='gray' />
                            <input
                                onChange={searchProductHandle}
                                type="text" placeholder="Product" className='px-1 focus:outline-none placeholder-gray-400 text-sm font-light' />
                        </div>
                    </div>



                    <div className='pt-5'>
                        <div className='pb-3 flex text-base text-[#71717A] items-center flex-1 font-normal border-b-2 border-b-[#E4E4E7]'>
                            {tableHeader.map(({ label, align, flex }, index) => (
                                <h1 key={index} className={`${flex ? flex : 'flex-[4]'} ${align || 'text-center'}`}>
                                    {t(label)}
                                </h1>
                            ))}
                        </div>


                        <div className='mb-4 h-[25dvh] overflow-y-auto'>
                            {
                                salesHistory.map((elem: DataListInterface, index: number) => (

                                    <TableRowRender preDefinedReasonList={preDefinedReasonList} hasReturnedHandle={hasReturnedHandle} isAnyReturned={isAnyReturned || page > 1} key={index} dataList={elem} order_id={order_id} />
                                ))
                            }

                            {/* <PatientPreviousRecord patientId={dataList?.pos?.patientid} currentOrderId={order_id} /> */}
                        </div>
                    </div>
                </div>}
            </div> : null
        );
    };

    export default OrderDetailsModal;
