import React from 'react';
import Modal from '@mui/material/Modal';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main styles for react-date-range
import 'react-date-range/dist/theme/default.css'; // theme styles for react-date-range
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { translationConstant } from '@/utils/translationConstants';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    pt: 2,
    px: 4,
    pb: 3,
};

interface PropsInterface {
    open: boolean;
    handleOpen: () => void;
    handleClose: () => void;
    generatePdfHandle: (startDate: string, endDate: string) => void;
    loading:boolean;
}

export default function DateRangeModal({
    open,
    handleOpen,
    handleClose,
    generatePdfHandle,
    loading
}: PropsInterface) {
    const [selectionRange, setSelectionRange] = React.useState({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection',
    });

    const handleSelect = (ranges: any) => {
        console.log('Selected Range:', ranges);
        const { startDate, endDate } = ranges.selection;
        setSelectionRange({ startDate, endDate, key: 'selection' });
    };

    const applyHandle = () => {
        const { startDate, endDate } = selectionRange;

        // Convert the dates to UTC and then format them
        const formattedStartDate = moment(startDate).utc().format('YYYY-MM-DD');
        const formattedEndDate = moment(endDate).utc().format('YYYY-MM-DD');

        generatePdfHandle(formattedStartDate, formattedEndDate)
    };

    const {t} = useTranslation(translationConstant.POSHISTORY)

    return (
        <div>
            <button
                onClick={handleOpen}
                className="bg-black text-base px-3 py-2 text-white rounded-md"
            >
                {t("POS-Historyk1")}
            </button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="date-range-modal-title"
                aria-describedby="date-range-modal-description"
            >
                <div className='w-full h-full flex justify-center items-center ' >
                    <div className='bg-white rounded-md px-3 py-3'>
                        <h2 id="date-range-modal-title" className='mb-4 font-bold'>Select a Date Range</h2>
                        {/* @ts-ignore */}
                        <DateRangePicker
                            ranges={[selectionRange]}
                            onChange={handleSelect}
                            // showSelectionPreview={true}
                            moveRangeOnFirstSelection={false}
                            months={1}
                            direction="vertical"
                        />
                        <div className='flex justify-between space-x-4'>
                            <button
                                onClick={handleClose}
                                className="border-2 border-gray-600  text-gray-600 px-4 py-1 rounded-md"
                            >
                                Close
                            </button>
                            <button
                                onClick={applyHandle}
                                disabled={loading}
                                className="bg-black border-2 border-black text-white px-4 py-1 rounded-md disabled:bg-gray-400 disabled:border-gray-400"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
