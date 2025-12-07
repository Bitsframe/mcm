import { Modal } from "@mui/material";
import { MdClose } from "react-icons/md";
import React, { useState } from "react";
import { useLocationClinica } from "@/hooks/useLocationClinica";
import { RiCheckboxBlankFill, RiCheckboxBlankLine } from "react-icons/ri";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

const ChangeLocationModal = () => {
  const [open, setOpen] = useState(false);

  // Search term to filter locations by title or address
  const [searchTerm, setSearchTerm] = useState<string>("");

  const {
    locations,
    set_location_handle,
    selected_location,
    selected_location_data,
  } = useLocationClinica({ defaultSetFirst: true });

  const [selectedId, setSelectedId] = useState<any>(0);

  const handleOpen = () => {
    setOpen(true);
    setSelectedId(selected_location);
  };
  const handleClose = () => setOpen(false);

  const applyChangeHandle = () => {
    set_location_handle(selectedId);
    handleClose();
  };

  const selectLocationHandle = (id: number) => {
    setSelectedId(id);
  };

  const { t } = useTranslation(translationConstant.SIDEBAR);

  // compute filtered list based on search term (name or address)
  const filteredLocations = (locations || []).filter((l: any) => {
    if (!searchTerm) return true;
    const q = searchTerm.toString().toLowerCase();
    const title = (l?.title || "").toString().toLowerCase();
    const addr = ((l?.address || l?.address1 || l?.address_line || "") as string)
      .toString()
      .toLowerCase();
    return title.includes(q) || addr.includes(q);
  });

  return (
    <div>
      <button onClick={handleOpen} className="text-white text-xs text-start">
        <div className="">
          <span>{selected_location_data?.title}</span>
        </div>
      </button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="date-range-modal-title"
        aria-describedby="date-range-modal-description"
        sx={{
          zIndex: 9999999,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <div className="w-full h-full flex justify-center items-center p-2">
          <div className="bg-white dark:bg-[#080e16] text-black dark:text-white rounded-md px-4 py-5 w-full max-w-[650px] mx-2 max-h-[90vh] h-[90vh] overflow-hidden relative">
            <div className="flex items-center space-x-2 justify-between">
              <h2 id="date-range-modal-title" className="font-bold text-lg sm:text-xl">
                {t("Sidebar_k28")}
              </h2>
              <button onClick={handleClose}>
                <MdClose size={22} className="text-black dark:text-white" />
              </button>
            </div>

            <div className="flex flex-col w-full space-y-4 flex-1 mt-4">
              {/* Search input */}
              <div className="w-full">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("Sidebar_k30") || "Search locations..."}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-[#0b1220] border-gray-300 dark:border-gray-600 text-sm"
                />
              </div>

              <div className="max-h-[60vh] overflow-y-auto space-y-3">
                {filteredLocations.map(({ title, id }: any) => {
                  const isSelected = selectedId === id;
                  return (
                    <button
                      key={id}
                      onClick={() => selectLocationHandle(id)}
                      className="border w-full border-gray-300 dark:border-gray-600 rounded-lg py-3 px-2 flex items-center space-x-4"
                    >
                      <div>
                        {isSelected ? (
                          <RiCheckboxBlankFill color="#0066ff" />
                        ) : (
                          <RiCheckboxBlankLine color="gray" />
                        )}
                      </div>
                      <div className="flex flex-col text-left">
                        <h1 className="text-black dark:text-white text-sm sm:text-base truncate">
                          {title}
                        </h1>
                        {/* Render address below the title in small grey text when present */}
                        {/** address field may be null/undefined; show only when available */}
                        {/** Use text-xs and muted colors to match design */}
                        {/** Truncate so long addresses don't break layout */}
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block max-w-[420px] truncate">
                          {/** prefer 'address' key but fall back to 'address1' or '' */}
                          {(/* @ts-ignore */ (locations.find((l: any) => l.id === id)?.address) ||
                            /* @ts-ignore */ locations.find((l: any) => l.id === id)?.address1 ||
                            "")}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {filteredLocations.length === 0 && (
                  <div className="w-full p-4 text-center">
                    <span className="text-red-500 text-sm">
                      {t("Sidebar_k31") || "No location found"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="my-5 flex justify-end sticky bottom-0 bg-white dark:bg-[#080e16] pt-2">
              <button
                onClick={applyChangeHandle}
                className="bg-[#0066ff] text-white w-full sm:w-36 py-2 rounded-md text-sm sm:text-base"
              >
                {t("Sidebar_k29")}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChangeLocationModal;