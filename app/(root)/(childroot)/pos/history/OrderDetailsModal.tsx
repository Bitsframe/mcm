import { currencyFormatHandle } from '@/helper/common_functions';
import { create_content_service, fetch_content_service } from '@/utils/supabase/data_services/data_services';
import { CircularProgress } from '@mui/material';
import { Button } from 'flowbite-react';
import React, { FC, useEffect, useState } from 'react';
import { CiSearch } from 'react-icons/ci';
import { IoCloseOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';


interface PreDefinedReasonListInterface {
    created_at: string;
    id: number;
    reason: string;

}
interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderDetails: any;
    preDefinedReasonList: PreDefinedReasonListInterface[]
}

interface PatientDetailsInterface {
    id: number;
    treatmenttype: string;
    firstname: string;
    lastname: string;
    gender: string;
    email: string;
    phone: string;
    Locations: {
        title: string
    }
}

interface PatientDetailsRenderPropsInterface {
    patientData: PatientDetailsInterface;
    paymentType: string;
}
interface TableListRenderInterface {
    dataList: any;
    order_id: any;
    isAnyReturned: boolean;
    hasReturnedHandle: (val: boolean) => void
    preDefinedReasonList: PreDefinedReasonListInterface[];

}

interface DataListInterface {
    [key: string]: any; // This allows dynamic property access
}

const calcTotalAmount = (list: any) => {
    const totalVal = list?.sales_history?.reduce((a: number, b: { total_price: number }) => a + b.total_price, 0);
    return currencyFormatHandle(totalVal)
}


const tableHeader = [
    // Same table headers as before
    {
        id: 'category',
        label: 'Category',
        align: 'text-center',
        flex: 'flex-1',
        render_value: (val: string, elem: any) => elem?.inventory?.products?.categories?.category_name,

    },
    {
        id: 'product_name',
        label: 'Product',
        render_value: (val: string, elem: any) => elem?.inventory?.products?.product_name,

    },
    {
        id: 'quantity_sold',
        label: 'Quantity',
        flex: 'flex-1',
    },
    {
        id: 'total_price',
        label: 'Amount',
        render_value: (val: any, elem?: any) => currencyFormatHandle(val)
    },
    {
        id: 'actions',
        label: 'Action',
        align: 'text-center',
        flex: 'flex-1',
    },
];



const PatientDetailsRender: FC<PatientDetailsRenderPropsInterface> = ({ patientData, paymentType = 'Cash' }) => {

    const { firstname = '', lastname = '', gender = '', email = '', phone = '', id, treatmenttype, Locations } = patientData
    return <div className="py-4 space-y-3">
        <h3 className="font-bold">Patient Details</h3>
        <div className="text-base grid grid-cols-3 gap-6">
            <p>Patient ID: <strong>{id}</strong> </p>
            <p>Patient Name: <strong>{firstname} {lastname}</strong> </p>
            <p>Gender: <strong>{gender}</strong> </p>
            <p>Phone: <strong>{phone}</strong></p>
            <p className=''>Email: <strong>{email}</strong></p>
            <p className=''>payment Type: <strong>{paymentType}</strong></p>
            <p>Treatment Type: <strong>{treatmenttype}</strong></p>
            <p>Location: <strong>{Locations?.title}</strong></p>
        </div>
    </div>
}


const ReturnProductSection = ({ data, order_id, setOtherReturned, isAnyReturned, preDefinedReasonList }: any) => {


    const [returnedQty, setReturnedQty] = useState(0)
    const [processReturn, setProcessReturn] = useState(false)
    const [forReturnQty, setForReturnQty] = useState(0)
    const [forReturnReason, setForReturnReason] = useState('0')
    const [loading, setLoading] = useState(false)


    const returnHandle = () => {
        setProcessReturn(true)
    }


    const ClosereturnHandle = () => {
        setProcessReturn(false)
    }

    const changeQtyHandle = (e: any) => {
        const val = e.target.value

        setForReturnQty(val)

    }
    const changeReasonHandle = (e: any) => {
        const val = e.target.value

        setForReturnReason(val)

    }

    // console.log('------------------>', isAnyReturned, data)

    const processReturnHandle = async (e: React.FormEvent) => {
        e.preventDefault()

        console.log({ data })

        if (forReturnQty > data.quantity_sold) {
            toast.error(`Return quantity should not be higher than the sold quantity`)
            return

        }
        setLoading(true)

        const postData = {
            sales_id: data.sales_history_id,
            inventory_id: data.inventory_id,
            quantity: forReturnQty,
            reason: forReturnReason
        }

        const { data: resData, error } = await create_content_service({ table: 'returns', language: '', post_data: postData })

        if (error) {
            toast.error(`Error processing return: ${error?.message}`)
        } else {
            setProcessReturn(false)
            setReturnedQty(forReturnQty)
            setOtherReturned(true)
            setForReturnQty(0)
            toast.success("Return processed successfully!");
        }
        setLoading(false)
    }







    useEffect(() => {
        setReturnedQty(data.return_qty)
    }, [])



    if (processReturn) {
        return <div className=' fixed bg-black/40 top-0 bottom-0 left-0 right-0 flex justify-center items-center'>
            <div className='bg-white max-w-[850px] w-[100%] py-3 px-3 rounded-md'>
                <div className='flex justify-between pt-2 py-5'>
                    <h1 className='text-xl font-semibold'>
                        Process Return
                    </h1>
                    <IoCloseOutline className='pointer-events-auto cursor-pointer' size={24} onClick={ClosereturnHandle} />
                </div>
                <div>
                    <form onSubmit={processReturnHandle} className='space-y-6'>

                        <div className='flex justify-start flex-col space-y-1'>
                            <label className='text-start font-semibold text-gray-600'>
                                Quantity
                            </label>
                            <div className=' border-2 text-sm rounded-md px-2 py-2 flex items-center space-x-2'>
                                <input required onChange={changeQtyHandle} className='w-full focus:outline-none placeholder-gray-400' placeholder='Enter return QTY' max={data?.quantity_sold} />
                            </div>
                        </div>
                        <div className='flex justify-start flex-col space-y-1'>
                            <label className='text-start font-semibold text-gray-600'>
                                Reason of return
                            </label>
                            <select onChange={changeReasonHandle} className='border-2 text-sm rounded-md px-2 py-2 flex items-center space-x-2 '>
                                <option value={''} disabled selected >Select Reason</option>
                                {/* @ts-ignore */}
                                {preDefinedReasonList.map((opt, ind) => <option key={ind} value={opt?.reason} >{opt?.reason}

                                </option>)}
                            </select>
                            {/* <textarea required onChange={changeReasonHandle} className='border-2 text-sm rounded-md border-gray-200 w-full  resize-none outline-none  focus:border-none focus:ring-offset-0' placeholder='Enter reason of return' rows={4} /> */}
                        </div>


                        <Button type='submit' disabled={loading || !forReturnReason || !forReturnQty ? true : false} className='disabled:opacity-60 w-full' color="success">
                            Process Return
                        </Button>
                    </form>
                </div>
            </div>

        </div>

    }

    if (returnedQty && !loading) {
        return <button className='border-[#E4E4E7] text-[#696969] border-2 text-xs px-3 py-3 rounded-md' disabled>
            <strong>{returnedQty}</strong> Returned
        </button>
    }


    return <button disabled={isAnyReturned} onClick={returnHandle} className='bg-[#E1BBB8] text-sm px-3 py-3 rounded-md disabled:opacity-60'>
        Return
    </button>



}


const TableRowRender: FC<TableListRenderInterface> = ({ dataList, order_id, isAnyReturned, hasReturnedHandle, preDefinedReasonList }) => {




    return <div className={` flex items-center flex-1 text-base py-5 border-b-2 border-b-[#E4E4E7]`}>
        {tableHeader.map(({ id, render_value, align, flex }, ind) => {
            const content = render_value ? render_value(dataList[id], dataList) : dataList[id];
            return (
                <h1 key={ind} className={`${flex ? flex : 'flex-[4]'} ${align || 'text-center'}`}>
                    {id === 'actions' ? <ReturnProductSection preDefinedReasonList={preDefinedReasonList} isAnyReturned={isAnyReturned} setOtherReturned={hasReturnedHandle} data={dataList} order_id={order_id} /> : content}
                </h1>
            );
        })}
    </div>
}

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
                lastname,
                email, gender, phone, treatmenttype,locationid, Locations(title)
                
              ),
              sales_history (
                sales_history_id,
                inventory_id,
                inventory(product_id, products(product_name, category_id, categories(category_name))),
                date_sold,
                quantity_sold,
                total_price,
                return_qty,
                paymentcash
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


    return (
        isOpen ? <div className="fixed inset-0 z-30 bg-black bg-opacity-50 flex items-center justify-center">
            {loading ? <div className='h-full w-full flex justify-center items-center '>
                <CircularProgress />
            </div> : <div className="bg-white rounded-lg w-3/4 p-6">
                <div className="flex justify-between items-center border-b pb-3">
                    <h2 className="text-xl font-bold">Order# {order_id} Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
                </div>


                <PatientDetailsRender patientData={dataList?.pos}

                    // paymentType={[null, true].includes(dataList[0].paymentcash) ? "Cash" : "Creadit Card"}
                    paymentType={dataList?.paymentType}

                />




                <div className='flex items-center justify-between'>
                    <h3 className="font-bold">Order Details</h3>

                    <p className='text-base'>Sales Amount: <strong>{calcTotalAmount(dataList)}</strong></p>
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
                                {label}
                            </h1>
                        ))}
                    </div>


                    <div className='mb-4 h-[25dvh] overflow-y-auto'>
                        {
                            salesHistory.map((elem: DataListInterface, index: number) => (

                                <TableRowRender preDefinedReasonList={preDefinedReasonList} hasReturnedHandle={hasReturnedHandle} isAnyReturned={isAnyReturned} key={index} dataList={elem} order_id={order_id} />
                            ))
                        }
                    </div>
                </div>
            </div>}
        </div> : null
    );
};

export default OrderDetailsModal;
