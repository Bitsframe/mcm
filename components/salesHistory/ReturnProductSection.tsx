import { create_content_service } from "@/utils/supabase/data_services/data_services"
import { useEffect, useState } from "react"
import { IoCloseOutline } from "react-icons/io5"
import { toast } from "sonner"
import React from 'react';
import { Button } from 'flowbite-react';


export const ReturnProductSection = ({ data, order_id, setOtherReturned, isAnyReturned, preDefinedReasonList }: any) => {


    const [returnedQty, setReturnedQty] = useState(0)
    const [processReturn, setProcessReturn] = useState(false)
    const [forReturnQty, setForReturnQty] = useState(0)
    const [forReturnReason, setForReturnReason] = useState('0')
    const [loading, setLoading] = useState(false)
    const [showModal, setShowModal] = useState(false);


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

    const processReturnHandle = async (e: any) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data: response, error } = await create_content_service({
                table: "returns",
                language: "",
                post_data: {
                    inventory_id: data?.inventory_id,
                    return_date: new Date(),
                    quantity: forReturnQty,
                    reason: forReturnReason,
                    sales_id: data?.sales_history_id,
                    merge: false
                }
            })
            if (error) {
                throw error;
            }
            if (response) {
                setReturnedQty(forReturnQty)
                setOtherReturned(true, data?.inventory?.products?.product_name)
                toast.success("Return processed successfully")
                setProcessReturn(false)
            }
        } catch (error: any) {
            if (error && error?.message) {
                toast.error(error?.message)
            } else {
                toast.error("Something went wrong!")
            }
        } finally {
            setLoading(false)
        }
    }







    useEffect(() => {
        setReturnedQty(data.return_qty)
    }, [])



    if (showModal) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative">
                    <button
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowModal(false)}
                    >
                        &times;
                    </button>
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
        )
    }

    if (returnedQty && !loading) {
        return <button className='border-[#E4E4E7] text-[#696969] border-2 text-xs px-3 py-3 rounded-md' disabled>
            <strong>{returnedQty}</strong> Returned
        </button>
    }


    return <button disabled={isAnyReturned} onClick={() => setShowModal(true)} className='bg-[#E1BBB8] text-sm px-3 py-3 rounded-md disabled:opacity-60'>
        Return
    </button>



}