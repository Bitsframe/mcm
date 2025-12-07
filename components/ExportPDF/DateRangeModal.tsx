import React from 'react';
import Modal from '@mui/material/Modal';
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main styles for react-date-range
import 'react-date-range/dist/theme/default.css'; // theme styles for react-date-range
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { translationConstant } from '@/utils/translationConstants';
import { FileClock } from 'lucide-react';

interface DateRange extends Range {
    key: string;
}

interface PropsInterface {
    open: boolean;
    handleOpen: () => void;
    handleClose: () => void;
    generatePdfHandle: (startDate: string, endDate: string) => void;
    loading: boolean;
}

export default function DateRangeModal({
    open,
    handleOpen,
    handleClose,
    generatePdfHandle,
    loading
}: PropsInterface) {
    const [selectionRange, setSelectionRange] = React.useState<DateRange>({
        startDate: (() => { const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(0,0,0,0); return d })(),
        endDate: (() => { const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(23,59,59,999); return d })(),
        key: 'selection',
    });

    // compute yesterday in local timezone as Date object
    const getYesterdayDate = () => {
        const d = new Date()
        d.setDate(d.getDate() - 1)
        d.setHours(0, 0, 0, 0)
        return d
    }

    const handleSelect = (ranges: RangeKeyDict) => {
        setSelectionRange(ranges.selection as DateRange);
    };

    const applyHandle = () => {
        const { startDate, endDate } = selectionRange;
        
        // Ensure both dates are set to the start of their respective days in UTC
        const formattedStartDate = moment(startDate).startOf('day').utc().format('YYYY-MM-DD');
        const formattedEndDate = moment(endDate).endOf('day').utc().format('YYYY-MM-DD');

        // Generate PDF regardless of data availability
        generatePdfHandle(formattedStartDate, formattedEndDate);
    };

    const { t } = useTranslation(translationConstant.POSHISTORY);

    return (
        <div>
            <button
                onClick={handleOpen}
                className="bg-[#0066FF] text-base px-3 py-2 text-white rounded-md flex items-center space-x-2 hover:bg-[#0052cc] transition-colors duration-200"
            >
                <FileClock className="w-5 h-5" />
                <span className="hidden sm:inline">{t("POS-Historyk1")}</span>
                <span className="sm:hidden">Report</span>
            </button>
            
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="date-range-modal-title"
                aria-describedby="date-range-modal-description"
            >
                <div className="w-full h-full flex justify-center items-center p-2 sm:p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md sm:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                            <h2 
                                id="date-range-modal-title" 
                                className="text-lg font-semibold text-gray-900 dark:text-white"
                            >
                                Select a Date Range
                            </h2>
                        </div>

                        {/* Date Range Picker Container */}
                        <div className="p-4">
                            <div className="date-range-picker-container">
                                <style jsx global>{`
                                    /* Light mode styles */
                                    .date-range-picker-container .rdrCalendarWrapper {
                                        background: transparent !important;
                                        color: #111827 !important;
                                    }
                                    
                                    .date-range-picker-container .rdrMonth {
                                        background: #ffffff !important;
                                    }
                                    
                                    .date-range-picker-container .rdrDefinedRangesWrapper {
                                        background: #ffffff !important;
                                        color: #111827 !important;
                                        border-right: 1px solid #e5e7eb !important;
                                    }
                                    
                                    .date-range-picker-container .rdrDefinedRangesWrapper .rdrStaticRange {
                                        color: #111827 !important;
                                        background: transparent !important;
                                    }
                                    
                                    .date-range-picker-container .rdrDefinedRangesWrapper .rdrStaticRange:hover {
                                        background: #f3f4f6 !important;
                                    }
                                    
                                    .date-range-picker-container .rdrDefinedRangesWrapper .rdrStaticRangeSelected {
                                        color: #0066FF !important;
                                        background: #eff6ff !important;
                                    }
                                    
                                    .date-range-picker-container .rdrInputRanges {
                                        background: #ffffff !important;
                                        border-top: 1px solid #e5e7eb !important;
                                    }
                                    
                                    .date-range-picker-container .rdrInputRange {
                                        background: #ffffff !important;
                                        color: #111827 !important;
                                    }
                                    
                                    .date-range-picker-container .rdrInputRangeInput {
                                        background: #ffffff !important;
                                        color: #111827 !important;
                                        border: 1px solid #d1d5db !important;
                                    }
                                    
                                    .date-range-picker-container .rdrWeekDay {
                                        color: #374151 !important;
                                        font-weight: 600 !important;
                                    }
                                    
                                    .date-range-picker-container .rdrWeekDays {
                                        color: #374151 !important;
                                    }
                                    
                                    .date-range-picker-container .rdrDay {
                                        color: #111827 !important;
                                    }
                                    
                                    .date-range-picker-container .rdrDayNumber span {
                                        color: #111827 !important;
                                    }
                                    
                                    .date-range-picker-container .rdrMonthAndYearWrapper {
                                        color: #111827 !important;
                                        background: #ffffff !important;
                                    }
                                    
                                    .date-range-picker-container .rdrMonthAndYearWrapper * {
                                        color: #111827 !important;
                                    }
                                    
                                    .date-range-picker-container .rdrMonthAndYearPickers select {
                                        background: #ffffff !important;
                                        color: #111827 !important;
                                        border: 1px solid #d1d5db !important;
                                    }
                                    
                                    .date-range-picker-container .rdrMonthName,
                                    .date-range-picker-container .rdrYearPicker,
                                    .date-range-picker-container .rdrMonthPicker {
                                        color: #111827 !important;
                                    }
                                    
                                    .date-range-picker-container .rdrPrevNextButton {
                                        background: #f3f4f6 !important;
                                        color: #111827 !important;
                                    }
                                    
                                    /* Dark mode styles */
                                    .dark .date-range-picker-container .rdrCalendarWrapper {
                                        background: transparent !important;
                                        color: #f9fafb !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrMonth {
                                        background: #374151 !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrDefinedRangesWrapper {
                                        background: #374151 !important;
                                        color: #f9fafb !important;
                                        border-right: 1px solid #6b7280 !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrDefinedRangesWrapper .rdrStaticRange {
                                        color: #f9fafb !important;
                                        background: transparent !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrDefinedRangesWrapper .rdrStaticRange:hover {
                                        background: #4b5563 !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrDefinedRangesWrapper .rdrStaticRangeSelected {
                                        color: #60a5fa !important;
                                        background: #1e40af !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrInputRanges {
                                        background: #374151 !important;
                                        border-top: 1px solid #6b7280 !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrInputRange {
                                        background: #374151 !important;
                                        color: #f9fafb !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrInputRangeInput {
                                        background: #4b5563 !important;
                                        color: #f9fafb !important;
                                        border: 1px solid #6b7280 !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrWeekDay {
                                        color: #f9fafb !important;
                                        font-weight: 600 !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrWeekDays {
                                        color: #f9fafb !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrDay {
                                        color: #f9fafb !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrDayNumber span {
                                        color: #f9fafb !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrMonthAndYearWrapper {
                                        color: #f9fafb !important;
                                        background: #374151 !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrMonthAndYearWrapper * {
                                        color: #f9fafb !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrMonthAndYearPickers select {
                                        background: #4b5563 !important;
                                        color: #f9fafb !important;
                                        border: 1px solid #6b7280 !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrMonthName,
                                    .dark .date-range-picker-container .rdrYearPicker,
                                    .dark .date-range-picker-container .rdrMonthPicker {
                                        color: #f9fafb !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrPrevNextButton {
                                        background: #4b5563 !important;
                                        color: #f9fafb !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrPrevNextButton:hover {
                                        background: #6b7280 !important;
                                    }
                                    
                                    /* Day hover states */
                                    .date-range-picker-container .rdrDayHovered .rdrDayNumber span {
                                        color: #0066FF !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrDayHovered .rdrDayNumber span {
                                        color: #60a5fa !important;
                                    }
                                    
                                    /* Today indicator */
                                    .date-range-picker-container .rdrDayToday .rdrDayNumber span:after {
                                        background: #0066FF !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrDayToday .rdrDayNumber span:after {
                                        background: #60a5fa !important;
                                    }
                                    
                                    /* Disabled days */
                                    .date-range-picker-container .rdrDayDisabled .rdrDayNumber span {
                                        color: #9ca3af !important;
                                    }
                                    
                                    .dark .date-range-picker-container .rdrDayDisabled .rdrDayNumber span {
                                        color: #6b7280 !important;
                                    }
                                    
                                    /* Selected range */
                                    .date-range-picker-container .rdrDayInRange .rdrDayNumber span,
                                    .date-range-picker-container .rdrDayStartEdge .rdrDayNumber span,
                                    .date-range-picker-container .rdrDayEndEdge .rdrDayNumber span {
                                        color: #ffffff !important;
                                    }
                                    
                                    /* Responsive adjustments */
                                    @media (max-width: 640px) {
                                        .date-range-picker-container .rdrCalendarWrapper {
                                            font-size: 14px !important;
                                        }
                                        
                                        .date-range-picker-container .rdrMonth {
                                            width: 100% !important;
                                        }
                                        
                                        .date-range-picker-container .rdrWeekDays,
                                        .date-range-picker-container .rdrDays {
                                            width: 100% !important;
                                        }
                                        
                                        .date-range-picker-container .rdrDay {
                                            width: calc(100% / 7) !important;
                                            height: 2.5rem !important;
                                        }
                                        
                                        .date-range-picker-container .rdrDayNumber {
                                            font-size: 12px !important;
                                        }
                                        
                                        .date-range-picker-container .rdrMonthAndYearWrapper {
                                            padding: 0.5rem !important;
                                        }
                                        
                                        .date-range-picker-container .rdrMonthAndYearPickers {
                                            font-size: 14px !important;
                                        }
                                    }
                                    
                                    @media (max-width: 480px) {
                                        .date-range-picker-container .rdrCalendarWrapper {
                                            font-size: 12px !important;
                                        }
                                        
                                        .date-range-picker-container .rdrDay {
                                            height: 2rem !important;
                                        }
                                        
                                        .date-range-picker-container .rdrDayNumber {
                                            font-size: 11px !important;
                                        }
                                    }
                                `}</style>
                                
                                {/* @ts-ignore */}
                                <DateRangePicker
                                    ranges={[selectionRange]}
                                    onChange={handleSelect}
                                    moveRangeOnFirstSelection={false}
                                    months={1}
                                    direction="vertical"
                                    //@ts-ignore
                                    showSelectionPreview={true}
                                    showDateDisplay={false}
                                    rangeColors={['#0066FF']}
                                    // Prevent selecting today or future dates by capping maxDate to yesterday
                                    maxDate={getYesterdayDate()}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
                            <button
                                onClick={handleClose}
                                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
                            >
                                Close
                            </button>
                            <button
                                onClick={applyHandle}
                                disabled={loading}
                                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-[#0066FF] hover:bg-[#0052cc] disabled:bg-gray-400 disabled:hover:bg-gray-400 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Loading...
                                    </div>
                                ) : (
                                    'Apply'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}