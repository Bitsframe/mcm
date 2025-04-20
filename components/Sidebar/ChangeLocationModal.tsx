import { Modal } from '@mui/material'
import { MdArrowBackIos, MdClose } from "react-icons/md";
import React, { useState } from 'react'
import { useLocationClinica } from '@/hooks/useLocationClinica';
import { RiCheckboxBlankFill, RiCheckboxBlankLine } from "react-icons/ri";


const ChangeLocationModal = () => {
    const [open, setOpen] = useState(false);


    const { locations, set_location_handle, selected_location, selected_location_data } = useLocationClinica({ defaultSetFirst: true })

    const [selectedId, setSelectedId] = useState(0)


    const handleOpen = () => {
        setOpen(true)
        setSelectedId(selected_location)
    };
    const handleClose = () => setOpen(false);

    const applyChangeHandle = () => {
        set_location_handle(selectedId)
        handleClose()

    }

    const selectLocationHandle = (id: number) => {

        setSelectedId(id)
    };

    return (

        <div>
            <button
                onClick={handleOpen}
                className="text-white text-xs text-start"
            >
                <div className=''>
                    <span>
                        {selected_location_data?.title}
                    </span>

                </div>
            </button>
            <Modal
  open={open}
  onClose={handleClose}
  aria-labelledby="date-range-modal-title"
  aria-describedby="date-range-modal-description"
>
  <div className="w-full h-full flex justify-center items-center">
    <div className="bg-[#080e16] text-white rounded-md px-4 py-5 min-w-[650px] h-[480px]">
      <div className="flex items-center space-x-2 justify-between">
        <h2 id="date-range-modal-title" className="font-bold">
          Change Location
        </h2>
        <button onClick={handleClose}>
          <MdClose size={22} color="white" />
        </button>
      </div>

      <div className="flex flex-col w-full space-y-4 flex-1 mt-4">
        <div className="h-[350px] overflow-y-auto space-y-3">
          {locations.map(({ title, id }: any) => {
            const isSelected = selectedId === id;
            return (
              <button
                key={id}
                onClick={() => selectLocationHandle(id)}
                className="border w-full border-gray-600 rounded-lg py-3 px-2 flex items-center space-x-4"
              >
                <div>
                  {isSelected ? (
                    <RiCheckboxBlankFill color="#0066ff" />
                  ) : (
                    <RiCheckboxBlankLine color="gray" />
                  )}
                </div>
                <h1>{title}</h1>
              </button>
            );
          })}
        </div>
      </div>

      <div className="my-5 flex justify-end">
        <button
          onClick={applyChangeHandle}
          className="bg-[#0066ff] text-white w-36 py-2 rounded-md"
        >
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
