import { fetch_content_service } from '@/utils/supabase/data_services/data_services';
import { translationConstant } from '@/utils/translationConstants';
import { CircularProgress } from '@mui/material';
import React, {  useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CiSearch } from 'react-icons/ci';
import PatientPreviousRecord from './PatientPreviousRecord';
import { TableRowRender } from '@/components/salesHistory/RenderRow';
import { calcTotalAmount, tableHeader } from '@/components/salesHistory/utils';
import { DataListInterface, OrderDetailsModalProps } from './types/interfaces';
import { PatientDetailsRender } from './PatientDetailsRender';








const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, orderDetails, preDefinedReasonList }) => {
    const [dataList, setDataList] = useState<DataListInterface>({});
    const [salesHistory, setSalesHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAnyReturned, setIsAnyReturned] = useState(false)

    const { order_id, pos, patient_id } = orderDetails || {};


    useEffect(() => {

        ; (async () => {
            setLoading(true);
            try {
                const fetched_data: any = await fetch_content_service({
                    table: 'orders',
                    language: '',
                    selectParam: `,pos(
                id,
                firstname,
                patientid,
                lastname,
                email, gender, phone, treatmenttype,locationid, Locations(title)
                
              ),
              sales_history (
                sales_history_id,
                paymentcash,
                inventory_id,
                inventory(product_id, products(product_name, category_id, categories(category_name))),
                date_sold,
                quantity_sold,
                total_price,
                return_qty
                
              )
            `,
                    // @ts-ignore
                    matchCase: { key: 'order_id', value: order_id }
                });

                const listHistory = fetched_data?.[0]?.sales_history || []

                setDataList(fetched_data?.[0] || []);
            
                const checkRtn = listHistory.filter(({ return_qty }: { return_qty: number }) => return_qty > 0)
                setIsAnyReturned(() => checkRtn.length > 0)
                setSalesHistory(listHistory);


            } catch (error) {
                // toast.error()
                console.log(error)


            } finally {
                setLoading(false);
            }
        })();

    }, [order_id])


    const searchProductHandle = (e: any) => {
        const val = e.target.value
        if (val === '') {
            setSalesHistory(dataList.sales_history)

        }
        else {

            const filteredData = dataList.sales_history.filter((elem: any) => elem.products.product_name.toLocaleLowerCase().includes(val.toLocaleLowerCase()))
            setSalesHistory([...filteredData])
        }

    }

    const hasReturnedHandle = (val: boolean) => {
        setIsAnyReturned(() => val)
    }

    const {t} = useTranslation(translationConstant.POSHISTORY)
    return (
        isOpen ? <div className="fixed inset-0 z-30 bg-black bg-opacity-50 flex items-center justify-center">
            {loading ? <div className='h-full w-full flex justify-center items-center '>
                <CircularProgress />
            </div> : <div className="bg-white rounded-lg w-3/4 p-6">
                <div className="flex justify-between items-center border-b pb-3">
                    <h2 className="text-xl font-bold">{t("POS-Historyk11")}# {order_id} {t("POS-Historyk10")}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
                </div>


                <PatientDetailsRender patientData={dataList?.pos}

                    // paymentType={[null, true].includes(dataList[0].paymentcash) ? "Cash" : "Creadit Card"}
                    paymentType={dataList?.sales_history?.[0]?.paymentcash ? "Cash" : "Debit"}

                />




                <div className='flex items-center justify-between'>
                    <h3 className="font-bold">{t("POS-Historyk21")}</h3>

                    <p className='text-base'>{t("POS-Historyk22")}: <strong>{calcTotalAmount(dataList)}</strong></p>
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

                                <TableRowRender preDefinedReasonList={preDefinedReasonList} hasReturnedHandle={hasReturnedHandle} isAnyReturned={isAnyReturned} key={index} dataList={elem} order_id={order_id}  />
                            ))
                        }

                        <PatientPreviousRecord patientId={dataList?.pos?.patientid} currentOrderId={order_id} />
                    </div>
                </div>
            </div>}
        </div> : null
    );
};

export default OrderDetailsModal;
