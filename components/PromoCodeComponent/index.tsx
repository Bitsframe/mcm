import { Button } from 'flowbite-react';
import React, { FC, useState } from 'react';
import { IoCloseOutline } from 'react-icons/io5';
import axios from 'axios';
import { toast } from 'react-toastify';
import { PromoCodeDataInterface } from '@/types/typesInterfaces';
import { useTranslation } from 'react-i18next';
import { translationConstant } from '@/utils/translationConstants';

interface Props {
    applyDiscountHandle: (codeData: PromoCodeDataInterface | null, discount: number) => void;
    patientId: number;
}

const PromoCodeComponent: FC<Props> = ({ applyDiscountHandle, patientId }) => {
    const [promoCode, setPromoCode] = useState('');
    const [inputVal, setInputVal] = useState('');
    const [loading, setLoading] = useState(false);

    const { t } = useTranslation(translationConstant.POSSALES);

    const applyPromoHandle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputVal) return;

        setLoading(true);
        try {
            const response = await axios.post('/api/promocode/validate', {
                promocode: inputVal,
                patientid: patientId
            });

            if (response.status === 200) {
                const { discount, promocodeId } = response.data.data;
                const codeData = { code: inputVal, id: promocodeId };
                setPromoCode(inputVal);
                applyDiscountHandle(codeData, discount);
                toast.success('Promo code applied successfully!');
                setInputVal('');
            } else {
                toast.error(response.data.message || 'Failed to apply promo code');
            }
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || 'Failed to apply promo code';
                toast.error(errorMessage);
            } else {
                toast.error('An error occurred while applying the promo code');
            }
        } finally {
            setLoading(false);
        }
    };

    const removePromoHandle = () => {
        setPromoCode('');
        applyDiscountHandle(null, 0);
    };

    return (
        <div className='flex items-center justify-between gap-3 py-2'>
            <h1 className='text-sm font-medium'>{t("POS-Sales_k11")}</h1>

            {promoCode ? (
                <div className='flex items-center bg-gray-100 dark:bg-gray-700 text-sm rounded-md px-2 py-1'>
                    <span className='text-gray-800 dark:text-white mr-2'>{promoCode}</span>
                    <IoCloseOutline
                        onClick={removePromoHandle}
                        className='cursor-pointer text-gray-600 dark:text-white'
                        size={18}
                    />
                </div>
            ) : (
                <form onSubmit={applyPromoHandle} className='flex items-center gap-2'>
                    <input
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        placeholder='Promo Code'
                        className='text-sm px-2 py-1 w-36 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none'
                        disabled={!patientId}
                        required
                    />
                    <button
                        type='submit'
                        disabled={loading || !patientId}
                        className='disabled:opacity-60 px-3 py-[2px] text-sm bg-[#0066ff] text-white rounded-lg'
                        color="info"
                    >
                        {loading ? '...' : 'Apply'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default PromoCodeComponent;
