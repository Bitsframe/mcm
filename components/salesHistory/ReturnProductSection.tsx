import { create_content_service } from "@/utils/supabase/data_services/data_services"
import { useEffect, useState } from "react"
import { IoCloseOutline } from "react-icons/io5"
import { toast } from "sonner"
import React from 'react';
import { Button } from 'flowbite-react';
import { useTranslation } from 'react-i18next';
import { translationConstant } from '@/utils/translationConstants';


export const ReturnProductSection = ({ data, order_id, setOtherReturned, isAnyReturned, preDefinedReasonList }: any) => {
    const { t, i18n } = useTranslation(translationConstant.POSSALES);
    const isSpanishLocale = (i18n.resolvedLanguage || i18n.language || "")
        .toLowerCase()
        .startsWith("es");

    const getLocalizedReturnReason = (reason: string) => {
        if (!isSpanishLocale) {
            return reason;
        }

        const normalizedReason = reason.trim().toLowerCase();

        const localizedReasons: Record<string, string> = {
            "incorrect item": "Artículo incorrecto",
            "expired product": "Producto vencido",
            "not needed anymore": "Ya no se necesita",
            "damaged or defective": "Dañado o defectuoso",
            other: "Otro",
        };

        return localizedReasons[normalizedReason] ?? reason;
    };


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
                toast.success("Devolución procesada correctamente")
                setShowModal(false)
            }
        } catch (error: any) {
            if (error && error?.message) {
                toast.error(error?.message)
            } else {
                toast.error("¡Algo salió mal!")
            }
        } finally {
            setLoading(false)
        }
    }







    useEffect(() => {
        setReturnedQty(data?.return_qty ?? 0)
        }, [data?.return_qty])



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
                                    {t('POS-Sales_kReturnQuantityLabel')}
                                </label>
                                <div className=' border-2 text-sm rounded-md px-2 py-2 flex items-center space-x-2'>
                                    <input required onChange={changeQtyHandle} className='w-full focus:outline-none placeholder-gray-400' placeholder={t('POS-Sales_kReturnPlaceholder')} max={data?.quantity_sold} />
                                </div>
                        </div>
                        <div className='flex justify-start flex-col space-y-1'>
                                <label className='text-start font-semibold text-gray-600'>
                                    {t('POS-Sales_kReturnReasonLabel')}
                                </label>
                                <select onChange={changeReasonHandle} className='border-2 text-sm rounded-md px-2 py-2 flex items-center space-x-2 '>
                                    <option value={''} disabled selected >{t('POS-Sales_kSelectReturnReason')}</option>
                                {/* @ts-ignore */}
                                {preDefinedReasonList.map((opt, ind) => <option key={ind} value={opt?.reason} >{getLocalizedReturnReason(opt?.reason)}

                                </option>)}
                            </select>
                            {/* <textarea required onChange={changeReasonHandle} className='border-2 text-sm rounded-md border-gray-200 w-full  resize-none outline-none  focus:border-none focus:ring-offset-0' placeholder='Enter reason of return' rows={4} /> */}
                        </div>


                        <Button type='submit' disabled={loading || !forReturnReason || !forReturnQty ? true : false} className='disabled:opacity-60 w-full' color="success">
                            {t('POS-Sales_kProcessReturn')}
                        </Button>
                    </form>
                </div>
            </div>
        )
    }

    if (returnedQty && !loading) {
        return <button className='border-[#E4E4E7] text-[#696969] border-2 text-xs px-3 py-3 rounded-md' disabled>
            <strong>{returnedQty}</strong> {t('POS-Sales_kReturned')}
        </button>
    }


    return <button disabled={isAnyReturned} onClick={() => setShowModal(true)} className='bg-[#E1BBB8] text-sm px-3 py-3 rounded-md disabled:opacity-60'>
        {t('POS-Sales_kReturnButton')}
    </button>



}