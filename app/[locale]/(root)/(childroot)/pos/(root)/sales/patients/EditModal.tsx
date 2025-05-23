"use client";

import { Button, Modal } from "flowbite-react";
import Image from "next/image";
import PlusIcon from "@/assets/images/Logos/plus-icon.png";
import { Input_Component } from "@/components/Input_Component";
import { Select_Dropdown } from "@/components/Select_Dropdown";

export function Edit_Modal({
  is_open,
  close_handle,
}: {
  is_open: boolean;
  close_handle: () => void;
}) {
  const category_change_handle = () => {};

  return (
    <Modal size="3xl" show={is_open} onClose={close_handle}>
      <Modal.Body className="bg-white dark:bg-[#1E293B] text-black dark:text-white rounded-lg">
        <div className="flex flex-col items-center">
          <div className="w-1/2 py-4">
            <div>
              <h1 className="text-center text-xl font-bold">Edit Details</h1>
            </div>
            <div className="w-full space-y-4">
              <Input_Component
                onChange={() => ""}
                bg_color="bg-[#D9D9D9] dark:bg-[#334155]"
                label="Name"
              />
              <Input_Component
                onChange={() => ""}
                bg_color="bg-[#D9D9D9] dark:bg-[#334155]"
                label="Email Address"
              />
              <Input_Component
                onChange={() => ""}
                bg_color="bg-[#D9D9D9] dark:bg-[#334155]"
                label="Phone Number"
              />
              <Select_Dropdown
                bg_color="#D9D9D9"
                //@ts-ignore
                dark_bg_color="#334155"
                start_empty={true}
                options_arr={[]}
                required={true}
                on_change_handle={category_change_handle}
                label="Treatment Type"
              />
            </div>

            <div className="flex items-end justify-end mt-6 gap-2">
              <button
                onClick={close_handle}
                className="text-red-600 dark:text-red-400 font-medium py-2 px-6 rounded-l"
              >
                Reset
              </button>
              <button className="bg-[#11252C] text-white py-2 px-6 rounded-lg hover:bg-[#11252C]/95 active:bg-[#11252C]">
                Save
              </button>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
