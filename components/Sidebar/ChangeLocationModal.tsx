import { Modal } from '@mui/material'
import { MdClose } from "react-icons/md";
import React, { useState } from 'react'
import { useLocationClinica } from '@/hooks/useLocationClinica';
import { RiCheckboxBlankFill, RiCheckboxBlankLine } from "react-icons/ri";


const ChangeLocationModal = () => {
    const [open, setOpen] = useState(false);
    const { locations, setLocation, selectedLocationId, selectedLocationData } = useLocationClinica()
    const [selectedId, setSelectedId] = useState(0)

    const handleOpen = () => {
        setOpen(true)
        setSelectedId(Number(selectedLocationId))
    };
    const handleClose = () => setOpen(false);
    const selectLocationHandle = (id: number) => setSelectedId(id)

    const applyChangeHandle = () => {
        setLocation(selectedId)
        handleClose()
    }
    
    console.log("LOCATIONS ->", selectedLocationData)
    return (

        <div>
            <button
                onClick={handleOpen}
                className="text-sm font-bold">
                {selectedLocationData?.title || "Select Location"}
            </button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="date-range-modal-title"
                aria-describedby="date-range-modal-description"
            >
                <div className='w-full h-full  flex justify-center items-center ' >
                    <div className='bg-white rounded-md px-4 py-5 min-w-[650px] h-[480px]'>
                        <div className='flex items-center space-x-2 justify-between'>
                            <h2 id="date-range-modal-title" className='font-bold'>Change Location</h2>
                            <button onClick={handleClose}>
                                <MdClose size={22} color='gray' />
                            </button>
                        </div>
                        <div className='flex flex-col w-full space-y-4 flex-1 mt-4'>
                            <div className='h-[350px] overflow-y-auto space-y-3'>{
                                    locations.map(({ title, id }: any) => {
                                        const isSelected = selectedId === id
                                        return <button key={title} onClick={() => selectLocationHandle(id)} className='border-[1px] w-full border-gray-300 rounded-lg py-3 px-2 flex items-center space-x-4'>
                                            <div>
                                                {isSelected ? <RiCheckboxBlankFill color='green' /> : <RiCheckboxBlankLine color='lightgray' />}

                                            </div>
                                            <h1 key={title}>
                                                {title}
                                            </h1>
                                        </button>
                                    })}
                            </div>
                        </div>
                        <div className=' my-5 flex justify-end'>
                            <button onClick={applyChangeHandle} className='bg-green-600 text-white w-36 py-2 rounded-md'>
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default ChangeLocationModal
