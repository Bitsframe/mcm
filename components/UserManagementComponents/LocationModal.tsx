import { Modal } from '@mui/material';
import { MdArrowBackIos } from 'react-icons/md';
import React, { useState, useEffect } from 'react';
import { useLocationClinica } from '@/hooks/useLocationClinica';
import { RiCheckboxBlankFill, RiCheckboxBlankLine } from 'react-icons/ri';
import { LuChevronDown } from 'react-icons/lu';

interface LocationModalProps {
  onChange: (selectedLocations: number[]) => void;
  selectionLocationIds: number[]
}

const LocationModal: React.FC<LocationModalProps> = ({ onChange,selectionLocationIds }) => {
  const [open, setOpen] = useState(false);
  const [selectedLocationList, setSelectedLocationList] = useState<number[]>(selectionLocationIds);
  const { locations } = useLocationClinica(); // Assuming this hook provides location data.

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    onChange(selectedLocationList);
  }, [selectedLocationList]);

  const selectLocationHandle = (id: number, add: boolean) => {
    if (add) {
      setSelectedLocationList((prev) => [...prev, id]);
    } else {
      setSelectedLocationList((prev) => prev.filter((locationId) => locationId !== id));
    }
  };

  return (
    <div>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="border-[1px] w-full border-gray-300 text-start px-3 py-2 text-gray-500 rounded-md"
      >
        <div className="flex items-center justify-between">
          <span>{selectedLocationList.length > 0 ? `${selectedLocationList.length} Selected` : 'Select Locations'}</span>
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
          <div className="bg-white rounded-md px-4 py-5 min-w-[650px] h-[450px]">
            <div className="flex items-center space-x-2">
              <button onClick={handleClose}>
                <MdArrowBackIos />
              </button>
              <h2 id="location-modal-title" className="font-bold">
                Locations ({selectedLocationList.length} Selected)
              </h2>
            </div>

            {/* Locations List */}
            <div className="flex flex-col w-full space-y-4 flex-1 mt-4">
              <div className="h-[380px] overflow-y-auto space-y-3">
                {locations.map(({ title, id }: { title: string; id: number }) => {
                  const isAdded = selectedLocationList.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => selectLocationHandle(id, !isAdded)}
                      className="border-[1px] w-full border-gray-300 rounded-lg py-3 px-2 flex items-center space-x-4"
                    >
                      <div>
                        {isAdded ? (
                          <RiCheckboxBlankFill color="green" />
                        ) : (
                          <RiCheckboxBlankLine color="lightgray" />
                        )}
                      </div>
                      <h1>{title}</h1>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LocationModal;
