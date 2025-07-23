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
import { Archive, PlusCircle, ShieldCheck } from "lucide-react";
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
            icon={<Archive size={18} />}
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
  const [page, setPage] = useState(1);
  const { t } = useTranslation(translationConstant.INVENTORY);
  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.ceil(dataList.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, dataList.length);
  const currentPageData = dataList.slice(startIndex, endIndex);

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

  useEffect(() => {
    setPage(1);
  }, [dataList]);

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
      <div className="text-sm p-1 space-x-1 flex items-center justify-start rounded-lg bg-[#F1F4F7] dark:bg-[#122136]">
        <button
          onClick={handleActiveClick}
          className={`px-4 py-2 rounded-md flex items-center space-x-2 transition ${
            !getDataArchiveType
              ? "bg-blue-700 text-white"
              : "text-gray-700 dark:text-gray-300"
          }`}
        >
          <ShieldCheck size={16} />
          <span>{t("Inventory_k5")}</span>
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
          <span>{t("Inventory_k6")}</span>
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

  return (
    <main className="w-full h-full font-medium text-base dark:bg-[#0e1725] text-white">
      <div className="w-full h-full overflow-auto">
        <div className="h-full rounded-md pt-2">
          <div className="px-3 flex flex-col gap-3 sm:flex-row sm:justify-between w-full">
            <div className="space-y-1 w-full sm:w-auto">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full justify-between gap-x-3">
                <div className="relative w-full sm:w-72">
                  <input
                    onChange={onChangeHandle}
                    type="text"
                    placeholder={t("Inventory_k4")}
                    className="block px-3 py-[10px] w-full text-sm rounded-md focus:outline-none bg-[#F1F4F7] dark:bg-[#122136] border-2 border-gray-600 focus:border-blue-600 text-white"
                  />
                </div>
                <button
                  className="flex items-center justify-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition w-full sm:w-auto"
                  onClick={() => openModalHandle(modalStateEnum.CREATE)}
                >
                  <PlusCircle className="w-5 h-5" />
                  {t("Inventory_k25")}
                </button>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {RightSideComponent}
            </div>
          </div>

          <div className="px-3 pt-5">
            <div className="border rounded-md border-gray-300 dark:border-gray-700">
              <div className="hidden md:block overflow-x-auto">
                <div className="min-h-[45dvh] max-h-[45dvh] overflow-y-auto">
                  <Table className="min-w-full">
                    <TableHeader className="bg-gray-100 dark:bg-[#0e1725] border-b border-b-gray-300 dark:border-b-gray-700 sticky top-0 z-10">
                      <TableRow className="flex hover:bg-transparent">
                        <TableHead className="w-12 p-3">
                        </TableHead>
                        {tableHeader.map(({ label, align }, index) => (
                          <TableHead
                            key={index}
                            className={`flex-1 ${
                              align || "text-start"
                            } text-base font-normal p-3 text-gray-700 dark:text-gray-300`}
                          >
                            {t(label)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>

                    <TableBody className="bg-white dark:bg-[#0e1725]">
                      {loading ? (
                        <TableRow className="flex h-[45dvh]">
                          <TableCell
                            colSpan={tableHeader.length + 1}
                            className="w-full flex items-center justify-center bg-white dark:bg-[#0e1725]"
                          >
                            <Spinner size="xl" />
                          </TableCell>
                        </TableRow>
                      ) : dataList.length === 0 ? (
                        <TableRow className="flex h-[45dvh]">
                          <TableCell
                            colSpan={tableHeader.length + 1}
                            className="w-full flex items-center justify-center bg-white dark:bg-[#0e1725]"
                          >
                            <h1 className="text-gray-700 dark:text-white">
                              No Category is available
                            </h1>
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentPageData.map((elem, index) => (
                          <TableRow
                            key={index}
                            className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-b-gray-200 dark:border-b-gray-700 px-3 py-4"
                          >
                            <TableCell className="w-12 p-0">
                            </TableCell>
                            {tableHeader.map(
                              ({ id, Render_Value, align }, ind) => {
                                const content = Render_Value ? (
                                  <Render_Value
                                    getDataArchiveType={getDataArchiveType}
                                    isLoading={deleteLoading}
                                    onClickHandle={() =>
                                      onClickHandle(elem.category_id)
                                    }
                                  />
                                ) : (
                                  <span className="text-gray-800 dark:text-white">
                                    {elem[id]}
                                  </span>
                                );

                                return (
                                  <TableCell
                                    key={ind}
                                    className={`flex-1 ${
                                      align || "text-start"
                                    } text-base p-0 text-gray-800 dark:text-white`}
                                  >
                                    {content}
                                  </TableCell>
                                );
                              }
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="md:hidden p-4 space-y-4">
                {loading ? (
                  <div className="h-[45dvh] w-full flex items-center justify-center bg-white dark:bg-[#0e1725]">
                    <Spinner size="xl" />
                  </div>
                ) : dataList.length === 0 ? (
                  <div className="h-[45dvh] w-full flex items-center justify-center bg-white dark:bg-[#0e1725]">
                    <h1 className="text-gray-700 dark:text-white">
                      No Category is available
                    </h1>
                  </div>
                ) : (
                  <>
                    {currentPageData.map((elem, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-[#0e1725] border border-gray-300 dark:border-gray-700 rounded-md p-4 shadow-sm"
                      >
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("Inventory_k7")}
                            </span>
                            <span className="text-sm text-gray-800 dark:text-white">
                              {elem.category_id}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("Inventory_k8")}
                            </span>
                            <span className="text-sm text-gray-800 dark:text-white">
                              {elem.category_name}
                            </span>
                          </div>
                          <div className="flex justify-end">
                            {/* @ts-ignore */}
                            {tableHeader[2].Render_Value({
                              getDataArchiveType,
                              isLoading: deleteLoading,
                              onClickHandle: () =>
                                onClickHandle(elem.category_id),
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Pagination */}
              <div className="flex flex-row items-center justify-between gap-2 p-4 border-t border-t-gray-300 dark:border-t-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  Rows {dataList.length === 0 ? 0 : startIndex + 1}-{endIndex}{" "}
                  of {dataList.length}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded-md text-sm dark:hover:bg-gray-600 dark:text-white"
                  >
                    {t("Inventory_k23")}
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border rounded-md text-sm dark:hover:bg-gray-600 dark:text-white"
                  >
                    {t("Inventory_k22")}
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
          label="Category"
          darkMode={true}
          bg_color="bg-[#F1F4F7] dark:bg-[#1F2937]"
        />
      </Custom_Modal>

      {activeDeleteId ? (
        <div className="fixed bg-black/90 h-screen w-screen top-0 left-0 right-0 bottom-0 z-50">
          <div className="flex justify-center items-center w-full h-full">
            <div className="bg-white dark:bg-gray-800 w-full max-w-xl px-4 py-3 rounded-lg">
              <h1 className="font-bold text-xl text-gray-800 dark:text-white mb-5">
                Confirmation
              </h1>
              <p className="text-lg text-black dark:text-white">
                Do you really want to
                {getDataArchiveType ? "Unarchive" : "Archive"} this category
              </p>
              <p className="text-sm text-gray-800 dark:text-white">
                Remember All of the associated products will also be
                {getDataArchiveType ? "Unarchive" : "Archive"} with the category
              </p>

              <div className="mt-4 flex items-center space-x-3 justify-end">
                <Button
                  disabled={deleteLoading}
                  onClick={() => setActiveDeleteId(0)}
                  color="gray"
                  className="bg-white text-black"
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
