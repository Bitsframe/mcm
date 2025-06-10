"use client"

import { Modal } from "@mui/material"
import type React from "react"
import { useState, useEffect } from "react"
import { useLocationClinica } from "@/hooks/useLocationClinica"
import { LuChevronDown, LuX } from "react-icons/lu"
import { getUserAllowedLocations } from "@/utils/supabase/data_services/data_services"
//@ts-ignore
import type { Location } from "@/types/location"

interface LocationModalProps {
  onChange: (selectedLocations: number[]) => void
  selectionLocationIds: number[]
  userId?: string
}

const LocationModal: React.FC<LocationModalProps> = ({ onChange, selectionLocationIds, userId }) => {
  const [open, setOpen] = useState(false)
  const [selectedLocationList, setSelectedLocationList] = useState<number[]>(selectionLocationIds)
  const [selectAll, setSelectAll] = useState(false)
  const [allowedLocations, setAllowedLocations] = useState<Location[]>([])
  const { locations } = useLocationClinica()

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  useEffect(() => {
    onChange(selectedLocationList)
  }, [selectedLocationList, onChange])

  useEffect(() => {
    const filterLocations = async () => {
      if (userId) {
        const allowedIds = await getUserAllowedLocations(userId)
        const filtered = locations.filter((loc: Location) => allowedIds.includes(loc.id))
        setAllowedLocations(filtered)
      } else {
        setAllowedLocations(locations)
      }
    }
    filterLocations()
  }, [userId, locations])

  useEffect(() => {
    setSelectAll(allowedLocations.length > 0 && selectedLocationList.length === allowedLocations.length)
  }, [selectedLocationList, allowedLocations])

  const selectLocationHandle = (id: number, add: boolean) => {
    if (add) {
      setSelectedLocationList((prev) => [...prev, id])
    } else {
      setSelectedLocationList((prev) => prev.filter((locationId) => locationId !== id))
    }
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLocationList([])
    } else {
      setSelectedLocationList(allowedLocations.map((location) => location.id))
    }
    setSelectAll(!selectAll)
  }

  const handleDone = () => {
    onChange(selectedLocationList)
    handleClose()
  }

  return (
    <div>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="border-[1px] w-full bg-[#f1f4f9] dark:bg-[#122136] text-start px-3 py-2 text-gray-500 dark:text-gray-200 rounded-md"
      >
        <div className="flex items-center justify-between">
          <span>
            {selectedLocationList.length > 0 ? `${selectedLocationList.length} Selected` : "Select Locations"}
          </span>
          <LuChevronDown className="text-gray-500 dark:text-gray-200" />
        </div>
      </button>

      {/* Modal */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="location-modal-title"
        aria-describedby="location-modal-description"
      >
        <div className="w-full h-full flex justify-center items-center p-4">
          <div className="bg-white dark:bg-[#122136] rounded-lg w-full sm:w-[90%] md:w-[70%] lg:w-[50%] xl:w-[35%] max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700">
              <h2 id="location-modal-title" className="text-base sm:text-lg font-medium dark:text-white">
                Locations
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-[#1a2c4a]"
              >
                <LuX size={20} />
              </button>
            </div>

            {/* Select All */}
            <div className="p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-500 dark:bg-[#1a2c4a] dark:ring-offset-[#122136] dark:focus:ring-blue-500"
                />
                <label htmlFor="select-all" className="ml-2 text-sm text-gray-700 dark:text-gray-200">
                  Select All
                </label>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{selectedLocationList.length} Selected</span>
            </div>

            {/* Locations List */}
            <div className="flex-1 overflow-y-auto min-h-[150px] max-h-[50vh] sm:max-h-[300px]">
              {allowedLocations.map(({ title, id }) => {
                const isSelected = selectedLocationList.includes(id)
                return (
                  <div key={id} className="bg-gray-50 dark:bg-[#1a2c4a] m-2 rounded-lg">
                    <div className="p-3 flex items-center">
                      <input
                        type="checkbox"
                        id={`location-${id}`}
                        checked={isSelected}
                        onChange={() => selectLocationHandle(id, !isSelected)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-500 dark:bg-[#1a2c4a] dark:ring-offset-[#122136] dark:focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`location-${id}`}
                        className="ml-2 text-sm text-gray-700 dark:text-gray-200 flex-1 break-words"
                      >
                        {title}
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer with buttons */}
            <div className="p-3 sm:p-4 border-t dark:border-gray-700 flex justify-end space-x-2">
              <button
                onClick={handleClose}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-[#1a2c4a] dark:text-gray-200 dark:hover:bg-[#233657]"
              >
                Cancel
              </button>
              <button
                onClick={handleDone}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default LocationModal
