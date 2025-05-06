"use client"

import { Modal } from "@mui/material"
import type React from "react"
import { useState, useEffect } from "react"
import { useLocationClinica } from "@/hooks/useLocationClinica"
import { LuChevronDown, LuX } from "react-icons/lu"
import { getUserAllowedLocations } from "@/utils/supabase/data_services/data_services"
//@ts-ignore
import { Location } from "@/types/location"

interface LocationModalProps {
  onChange: (selectedLocations: number[]) => void
  selectionLocationIds: number[]
  userId?: string // Add userId prop
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
    // Filter locations based on user's allowed locations
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
    // Update selectAll state when all allowed locations are selected
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
      // If all are selected, deselect all
      setSelectedLocationList([])
    } else {
      // Select all allowed locations
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
        className="border-[1px] w-full bg-[#f1f4f9] text-start px-3 py-2 text-gray-500 rounded-md"
      >
        <div className="flex items-center justify-between dark:text-gray-600">
          <span>
            {selectedLocationList.length > 0 ? `${selectedLocationList.length} Selected` : "Select Locations"}
          </span>
          <LuChevronDown />
        </div>
      </button>

      {/* Modal */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="location-modal-title"
        aria-describedby="location-modal-description"
      >
        <div className="w-full h-full flex justify-center items-center">
          <div className="bg-white rounded-lg w-[35%] dark:bg-[#0e1725]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 id="location-modal-title" className="text-lg font-medium">
                Locations
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500 rounded-full p-1 hover:bg-gray-100"
              >
                <LuX size={20} />
              </button>
            </div>

            {/* Select All */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="select-all" className="ml-2 text-sm text-gray-700">
                  Select All
                </label>
              </div>
              <span className="text-sm text-gray-500">{selectedLocationList.length} Selected</span>
            </div>

            {/* Locations List */}
            <div className="max-h-[300px] overflow-y-auto">
              {allowedLocations.map(({ title, id }) => {
                const isSelected = selectedLocationList.includes(id)
                return (
                  <div key={id} className="bg-gray-50 m-2 rounded-lg">
                    <div className="p-3 flex items-center">
                      <input
                        type="checkbox"
                        id={`location-${id}`}
                        checked={isSelected}
                        onChange={() => selectLocationHandle(id, !isSelected)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`location-${id}`} className="ml-2 text-sm text-gray-700 flex-1">
                        {title}
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer with buttons */}
            <div className="p-4 border-t flex justify-end space-x-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button onClick={handleDone} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
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
