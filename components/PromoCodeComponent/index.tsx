import { Button } from 'flowbite-react'
import React, { FC, useState } from 'react'
import { IoCloseOutline } from 'react-icons/io5'
import PromoCodeModal from './PromoCodeModal'
import { PromoCodeDataInterface } from '@/types/typesInterfaces';
import { useTranslation } from 'react-i18next';
import { translationConstant } from '@/utils/translationConstants';

interface Props {
    applyDiscountHandle: (codeData: PromoCodeDataInterface | null, discount: number) => void;
    patientId: number;

}

const PromoCodeComponent: FC<Props> = ({ applyDiscountHandle, patientId }) => {

    const [promoCode, setPromoCode] = useState('')
    const [promoModalOpen, setPromoModalOpen] = useState(false)
    const [checkPromoLoading, setCheckPromoLoading] = useState(false)


    const openModal = () => {
        setPromoModalOpen(true)
    }
    const closeModal = () => {
        setPromoModalOpen(false)
    }

    const applySuccessPromoHandle = (codeData: PromoCodeDataInterface, discount: number) => {
        setPromoCode(codeData.code)
        applyDiscountHandle(codeData, discount)
        closeModal()

    }
    const removePromoHandle = () => {
        setPromoCode('')
        applyDiscountHandle(null, 0)

    }

    const {t} = useTranslation(translationConstant.POSSALES)

    return (

        <div className='flex items-center py-2'>
            <h1 className='text-lg flex-1'>
               {t("POS-Sales_k11")}
            </h1>
            {promoCode ? <div className='w-52 flex rounded-md  items-center p-2 px-2'>
                <div className='flex-1 text-sm'>
                    {promoCode}
                </div>
                <IoCloseOutline onClick={removePromoHandle} className='cursor-pointer pointer-events-auto' />
            </div> : <div>
                <button disabled={!patientId} onClick={openModal} className='text-sm underline text-blue-600 disabled:text-gray-400'>
                    Apply promo
                </button>
            </div>}


            {promoModalOpen && <PromoCodeModal closeModal={closeModal} checkPromoLoading={checkPromoLoading} patientId={patientId} applyOnSuccess={applySuccessPromoHandle} />}
        </div>

    )
}

export default PromoCodeComponent


