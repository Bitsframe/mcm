import { create_content_service } from "@/utils/supabase/data_services/data_services"
import { useEffect, useState } from "react"
import { IoCloseOutline } from "react-icons/io5"
import { toast } from "sonner"
import { Button } from 'flowbite-react';


export const ReturnProductSection = ({ data, order_id, setOtherReturned, isAnyReturned, preDefinedReasonList }: any) => {


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