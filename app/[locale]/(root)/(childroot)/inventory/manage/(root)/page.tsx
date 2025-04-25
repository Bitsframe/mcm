"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button, Checkbox, Spinner } from "flowbite-react";
import Image from "next/image";
import PlusIcon from "@/assets/images/Logos/plus-icon.png";
import { Action_Button } from "@/components/Action_Button";
import {
  create_content_service,
  fetch_content_service,
  update_content_service,
} from "@/utils/supabase/data_services/data_services";
import { toast } from "react-toastify";
import { Custom_Modal } from "@/components/Modal_Components/Custom_Modal";
import { Input_Component } from "@/components/Input_Component";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TabContext } from "@/context";
import { Archive, ShieldCheck } from "lucide-react";
import { translationConstant } from "@/utils/translationConstants";

interface DataListInterface {
  [key: string]: any;
}

const tableHeader = [
  {
    id: "category_id",
    label: "Inventory_k7",
    align: "text-start",
  },
  {
    id: "category_name",
    label: "Inventory_k8",
    align: "text-center",
  },
  {
    id: "actions",
    label: "Inventory_k9",
    align: "text-end",
    component: true,
    Render_Value: ({
      val,
      onClickHandle,
      isLoading,
      getDataArchiveType,
    }: {
      val?: string;
      onClickHandle?: () => void;
      isLoading?: boolean;
      getDataArchiveType: boolean;
    }) => {
      return (
        <div className="space-x-4 flex justify-end">
          <Action_Button
            isLoading={isLoading}
            onClick={onClickHandle}
            label={getDataArchiveType ? "Unarchive" : "Archive"}
            bg_color={getDataArchiveType ? "bg-[#E7FDEF]" : "bg-[#FFE8E5]"}
            text_color={
              getDataArchiveType ? "text-[#0EA542]" : "text-[#F71B1B]"
            }
            border={
              getDataArchiveType ? "border-[#81F5A9]" : "border-[#F71B1B]"
            }
            icon = {<Archive size={18}/>}
          />
        </div>
      );
    },
  },
];

const modalStateEnum = {
  CREATE: "Create",
  UPDATE: "Update",
  EMPTY: "",
};

const Categories = () => {
  const [dataList, setDataList] = useState<DataListInterface[]>([]);
  const [allData, setAllData] = useState<DataListInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [modalEventLoading, setModalEventLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [modalData, setModalData] = useState<DataListInterface>({});
  const [modalState, setModalState] = useState("");
  const [activeDeleteId, setActiveDeleteId] = useState(0);
  const [getDataArchiveType, setGetDataArchiveType] = useState(false);

  const fetch_handle = async (archive: boolean) => {
    setLoading(true);
    const fetched_data = await fetch_content_service({
      table: "categories",
      selectParam: ",products:products!inner()",
      matchCase: { key: "archived", value: archive },
      language: "",
    });
    setDataList(fetched_data);
    setAllData(fetched_data);
    setLoading(false);
  };
  const openModalHandle = (state: string) => {
    setOpenModal(true);
    setModalState(state);
  };
  
  const closeModalHandle = () => {
    setOpenModal(false);
    setModalState(modalStateEnum.EMPTY);
    setModalData({});
  };

  const onChangeHandle = (e: any) => {
    const val = e.target.value;
    if (val === "") {
      setDataList([...allData]);
    } else {
      const filteredData = allData.filter((elem) =>
        elem.category_name.toLocaleLowerCase().includes(val.toLocaleLowerCase())
      );
      setDataList([...filteredData]);
    }
  };

  useEffect(() => {
    fetch_handle(getDataArchiveType);
  }, [getDataArchiveType]);

  const onClickHandle = async (id: number) => {
    setActiveDeleteId(id);
  };

  const deleteHandle = async () => {
    setDeleteLoading(true);
    try {
      const res_data = await update_content_service({
        table: "categories",
        matchKey: "category_id",
        post_data: {
          category_id: activeDeleteId,
          archived: !getDataArchiveType,
        },
      });
      if (res_data?.length) {
        setDataList((elem) =>
          elem.filter((data: any) => data.category_id !== activeDeleteId)
        );
        setAllData((elem) =>
          elem.filter((data: any) => data.category_id !== activeDeleteId)
        );
        setActiveDeleteId(0);
        toast.success(
          getDataArchiveType
            ? "Category no longer archived"
            : "Archived successfully"
        );
      }
    } catch (error: any) {
      console.log(error.message);
      toast.error(error.message);
      setDeleteLoading(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleActiveClick = useCallback(() => {
    setGetDataArchiveType(false);
  }, []);

  const handleArchiveClick = useCallback(() => {
    setGetDataArchiveType(true);
  }, []);

  const RightSideComponent = useMemo(
    () => (
      <div className="text-sm p-1 space-x-1 flex items-center justify-end w-full rounded-lg bg-[#F1F4F7] dark:bg-[#080e16]">
  <button
    onClick={handleActiveClick}
    className={`px-4 py-2 rounded-md flex items-center space-x-2 transition ${
      !getDataArchiveType
        ? "bg-blue-700 text-white"
        : "text-gray-700 dark:text-gray-300"
    }`}
  >
    <ShieldCheck size={16} />
    <span>Active</span>
  </button>
  <button
    onClick={handleArchiveClick}
    className={`px-4 py-2 rounded-md flex items-center space-x-2 transition ${
      getDataArchiveType
        ? "bg-blue-700 text-white"
        : "text-gray-700 dark:text-gray-300"
    }`}
  >
    <Archive size={16} />
    <span>Archived</span>
  </button>
</div>

    ),
    [getDataArchiveType, handleActiveClick, handleArchiveClick]
  );

  const createNewHandle = async () => {
    setModalEventLoading(true);
    const { data: res_data, error } = await create_content_service({
      table: "categories",
      language: "",
      post_data: modalData,
    });
    if (error) {
      console.log(error.message);
      toast.error(error.message);
    }

    if (res_data?.length) {
      toast.success("Created successfully");
      closeModalHandle();
      dataList.push(res_data[0]);
      allData.push(res_data[0]);
      setAllData([...allData]);
      setDataList([...dataList]);
    }

    setModalEventLoading(false);
  };

  const modalInputChangeHandle = (key: string, value: string) => {
    setModalData((pre) => {
      return { ...pre, [key]: value };
    });
  };

  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k11");
  }, []);

  const { t } = useTranslation(translationConstant.INVENTORY);

  return (
    <main className="w-full h-full font-medium text-base dark:bg-gray-900 text-white">
      <div className="w-full min-h-[81.5dvh] h-full overflow-auto">
        <div className="h-full rounded-md py-2">
          <h1 className="text-lg font-semibold px-3 mb-3 text-white">Categories</h1>
          <div className="px-3 flex justify-between w-full">
            <div className="space-y-1">
              <div className="flex items-center w-full justify-between gap-x-3">
                <div className="relative w-72">
                  <input
                    onChange={onChangeHandle}
                    type="text"
                    placeholder={t("Inventory_k4")}
                    className="block px-3 py-[10px] w-72 text-sm rounded-md focus:outline-none bg-[#F1F4F7] dark:bg-gray-800 border-2 border-gray-600 focus:border-blue-600 text-white"
                  />
                </div>
                <button
                  className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition"
                  onClick={() => openModalHandle(modalStateEnum.CREATE)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12h8" />
                    <path d="M12 8v8" />
                  </svg>
                  Create Category
                </button>
              </div>
            </div>

            <div className="flex gap-2">{RightSideComponent}</div>
          </div>

          <div className="px-3 pt-5">
  <div className="border rounded-md border-gray-300 dark:border-gray-700">
    <Table>
      <TableHeader className="bg-gray-100 dark:bg-gray-800 border-b border-b-gray-300 dark:border-b-gray-700">
        <TableRow className="flex hover:bg-transparent">
          <TableHead className="w-12 p-3">
            {/* <Checkbox className="border-gray-400 dark:border-gray-600 checked:bg-blue-600 checked:border-blue-600" /> */}
          </TableHead>
          {tableHeader.map(({ label, align }, index) => (
            <TableHead
              key={index}
              className={`flex-1 ${align || "text-start"} text-base font-normal p-3 text-gray-700 dark:text-gray-300`}
            >
              {t(label)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody className="mb-4 h-[30dvh] overflow-y-auto block bg-white dark:bg-gray-900">
        {loading ? (
          <TableRow className="flex h-full">
            <TableCell className="h-[60dvh] w-full flex items-center justify-center bg-white dark:bg-gray-900">
              <Spinner size="xl" />
            </TableCell>
          </TableRow>
        ) : dataList.length === 0 ? (
          <TableRow className="flex h-full">
            <TableCell className="h-[60dvh] w-full flex flex-col justify-center items-center bg-white dark:bg-gray-900">
              <h1 className="text-gray-700 dark:text-white">No Category is available</h1>
            </TableCell>
          </TableRow>
        ) : (
          dataList.map((elem, index) => (
            <TableRow
              key={index}
              className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-b-gray-200 dark:border-b-gray-700 px-3 py-4"
            >
              <TableCell className="w-12 p-0">
                {/* <Checkbox className="border-gray-400 dark:border-gray-600 checked:bg-blue-600 checked:border-blue-600" /> */}
              </TableCell>
              {tableHeader.map(({ id, Render_Value, align }, ind) => {
                const content = Render_Value ? (
                  <Render_Value
                    getDataArchiveType={getDataArchiveType}
                    isLoading={deleteLoading}
                    onClickHandle={() => onClickHandle(elem.category_id)}
                  />
                ) : (
                  <span className="text-gray-800 dark:text-white">{elem[id]}</span>
                );

                return (
                  <TableCell
                    key={ind}
                    className={`flex-1 ${align || "text-start"} text-base p-0 text-gray-800 dark:text-white`}
                  >
                    {content}
                  </TableCell>
                );
              })}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>

    <div className="flex items-center justify-between p-4 border-t border-t-gray-300 dark:border-t-gray-700">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        0 of {dataList.length} row(s) selected.
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-1 border rounded-md text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white disabled:opacity-50">
          Previous
        </button>
        <button className="px-3 py-1 border rounded-md text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white">
          Next
        </button>
      </div>
    </div>
  </div>
</div>

        </div>
      </div>

      <Custom_Modal
        open_handle={() => openModalHandle(modalStateEnum.CREATE)}
        Title={`${modalState} Category`}
        loading={modalEventLoading}
        is_open={openModal}
        close_handle={closeModalHandle}
        create_new_handle={createNewHandle}
        buttonLabel={modalState}
        Trigger_Button={null}
      >
        <Input_Component
          value={modalData["category_name"]}
          onChange={(e) => modalInputChangeHandle("category_name", e)}
          py="py-3"
          border="border-[1px] border-gray-600 rounded-md"
          label="Category"
          darkMode={true}
        />
      </Custom_Modal>

      {activeDeleteId ? (
        <div className="fixed bg-black/90 h-screen w-screen top-0 left-0 right-0 bottom-0 z-20">
          <div className="flex justify-center items-center w-full h-full">
            <div className="bg-gray-800 w-full max-w-xl px-4 py-3 rounded-lg">
              <h1 className="font-bold text-xl text-white mb-5">
                Confirmation
              </h1>
              <p className="text-lg text-gray-300">
                Do you really want to{" "}
                {getDataArchiveType ? "Unarchive" : "Archive"} this category
              </p>
              <p className="text-sm text-gray-400">
                Remember All of the associated products will also be{" "}
                {getDataArchiveType ? "Unarchive" : "Archive"} with the category
              </p>

              <div className="mt-4 flex items-center space-x-3 justify-end">
                <Button
                  disabled={deleteLoading}
                  onClick={() => setActiveDeleteId(0)}
                  color="gray"
                  className="bg-gray-700 text-white hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  isProcessing={deleteLoading}
                  color={"failure"}
                  onClick={deleteHandle}
                  className="bg-red-700 hover:bg-red-800"
                >
                  {getDataArchiveType ? "Unarchive" : "Archive"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default Categories;