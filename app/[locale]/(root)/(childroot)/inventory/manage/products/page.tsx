"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Spinner } from "flowbite-react";
import Image from "next/image";
import PlusIcon from "@/assets/images/Logos/plus-icon.png";
import { Action_Button } from "@/components/Action_Button";
import {
  create_content_service,
  fetch_content_service,
  update_content_service,
} from "@/utils/supabase/data_services/data_services";
import { Custom_Modal } from "@/components/Modal_Components/Custom_Modal";
import { Input_Component } from "@/components/Input_Component";
import { toast } from "react-toastify";
import { useCategoriesClinica } from "@/hooks/useCategoriesClinica";
import { PiCaretUpDownBold } from "react-icons/pi";
import { Searchable_Dropdown } from "@/components/Searchable_Dropdown";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Archive, CirclePlus, RefreshCcw, ShieldCheck } from "lucide-react";

interface DataListInterface {
  [key: string]: any;
}

const modalStateEnum = {
  CREATE: "Create",
  UPDATE: "Update",
  DELETE: "delete",
  EMPTY: "",
};

const tableHeader = [
  {
    id: "product_id",
    label: "Inventory_k15",
  },
  {
    id: "category",
    label: "Inventory_k1",
    can_sort: true,
  },
  {
    id: "product_name",
    label: "Inventory_k8",
    can_sort: true,
  },
  {
    id: "actions",
    label: "Inventory_k9",
    align: "text-right",
    Render_Value: ({
      clickHandle,
      getDataArchiveType,
    }: {
      clickHandle: (state: string) => void;
      getDataArchiveType: boolean;
    }) => {
      return (
        <div className="flex items-end justify-end space-x-2">
          <Action_Button
            icon={<RefreshCcw size={18} />}
            onClick={() => clickHandle(modalStateEnum.UPDATE)}
            label="Update"
            text_color="text-[#0066ff] dark:text-blue-400"
            bg_color="bg-[#E5F0FF] dark:bg-blue-900/30"
            border={
              getDataArchiveType
                ? "border-[#CCE0FF] dark:border-blue-800"
                : "border-[#CCE0FF] dark:border-blue-800"
            }
          />
          <Action_Button
            icon={<Archive size={18} />}
            label={getDataArchiveType ? "Unarchive" : "Archive"}
            text_color={
              getDataArchiveType
                ? "text-[#0EA542] dark:text-green-400"
                : "text-[#F71B1B] dark:text-red-400"
            }
            bg_color={
              getDataArchiveType
                ? "bg-[#E7FDEF] dark:bg-green-900/30"
                : "bg-[#FFE8E5] dark:bg-red-900/30"
            }
            border={
              getDataArchiveType
                ? "border-[#72F39E] dark:border-green-800"
                : "border-[#FFD2CC] dark:border-red-800"
            }
            onClick={() => clickHandle(modalStateEnum.DELETE)}
          />
        </div>
      );
    },
  },
];

const requiredInputFields = [
  {
    id: "category_id",
    label: "Category",
  },
  {
    id: "product_name",
    label: "Name",
  },
];

const Products = () => {
  const [dataList, setDataList] = useState<DataListInterface[]>([]);
  const [allData, setAllData] = useState<DataListInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalEventLoading, setModalEventLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [modalData, setModalData] = useState<DataListInterface>({});
  const [modalState, setModalState] = useState("");
  const { categories } = useCategoriesClinica();
  const [sortOrder, setSortOrder] = useState(-1);
  const [sortColumn, setSortColumn] = useState("");
  const [getDataArchiveType, setGetDataArchiveType] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeDeleteId, setActiveDeleteId] = useState(0);

  const openModalHandle = (state: string) => {
    setOpenModal(true);
    setModalState(state);
  };

  const closeModalHandle = () => {
    setOpenModal(false);
    setModalState(modalStateEnum.EMPTY);
    setModalData({});
  };

  const fetch_handle = async (getDataArchiveType: boolean) => {
    try {
      setLoading(true);
      const fetched_data = await fetch_content_service({
        table: "products",
        language: "",
        selectParam: ",categories(category_name)",
        matchCase: [
          {
            key: "archived",
            value: getDataArchiveType,
          },
        ],
        sortOptions: { column: "product_id", order: "desc" },
      });

      setDataList(fetched_data);
      setAllData(fetched_data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onChangeHandle = (e: any) => {
    const val = e.target.value;
    if (val === "") {
      setDataList([...allData]);
    } else {
      const filteredData = allData.filter((elem) =>
        elem.product_name.toLocaleLowerCase().includes(val.toLocaleLowerCase())
      );
      setDataList([...filteredData]);
    }
  };

  useEffect(() => {
    fetch_handle(getDataArchiveType);
  }, [getDataArchiveType]);

  const modalInputChangeHandle = (key: string, value: string | number) => {
    setModalData((pre) => {
      return { ...pre, [key]: value };
    });
  };

  const modalSubmitHandle = async () => {
    setModalEventLoading(true);
    try {
      if (modalState === modalStateEnum.CREATE) {
        const { data: res_data, error } = await create_content_service({
          table: "products",
          language: "",
          post_data: { ...modalData },
        });

        if (error) throw new Error(error.message);
        if (res_data?.length) {
          toast.success("Created successfully");
          closeModalHandle();
          fetch_handle(getDataArchiveType);
        }
      } else {
        const postData = {
          product_id: +modalData.product_id,
          category_id: +modalData.category_id,
          product_name: modalData.product_name,
        };
        const res_data = await update_content_service({
          table: "products",
          language: "",
          post_data: postData,
          matchKey: "product_id",
        });

        if (res_data?.length) {
          toast.success("Updated successfully");
          fetch_handle(getDataArchiveType);
          closeModalHandle();
        }
      }
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong!");
    } finally {
      setModalEventLoading(false);
    }
  };

  const buttonClickActionHandle = (action: string, elem: any) => {
    if (action === modalStateEnum.DELETE) {
      setActiveDeleteId(elem.product_id);
    } else if (action === modalStateEnum.UPDATE) {
      setModalData(elem);
      openModalHandle(modalStateEnum.UPDATE);
    }
  };

  const sortHandle = (column: string) => {
    let sortedList: any = [];
    if (column === "category") {
      sortedList = dataList.sort((a, b) =>
        sortOrder === 1
          ? a.categories.category_name.localeCompare(b.categories.category_name)
          : b.categories.category_name.localeCompare(a.categories.category_name)
      );
    } else if (column === "product_name") {
      sortedList = dataList.sort((a, b) =>
        sortOrder === 1
          ? a.product_name.localeCompare(b.product_name)
          : b.product_name.localeCompare(a.product_name)
      );
    } else {
      sortedList = dataList.sort((a, b) =>
        sortOrder === 1 ? a[column] - b[column] : b[column] - a[column]
      );
    }

    setSortOrder((order) => (order === -1 ? 1 : -1));
    setDataList([...sortedList]);
    setSortColumn(column);
  };

  const handleActiveClick = useCallback(() => {
    setGetDataArchiveType(false);
  }, []);

  const handleArchiveClick = useCallback(() => {
    setGetDataArchiveType(true);
  }, []);

  const deleteHandle = async () => {
    setDeleteLoading(true);
    try {
      const res_data = await update_content_service({
        table: "products",
        matchKey: "product_id",
        post_data: {
          product_id: activeDeleteId,
          archived: !getDataArchiveType,
        },
      });

      if (res_data?.length) {
        setDataList((elem) =>
          elem.filter((data: any) => data.product_id !== activeDeleteId)
        );
        setAllData((elem) =>
          elem.filter((data: any) => data.product_id !== activeDeleteId)
        );
        setActiveDeleteId(0);
        toast.success(
          getDataArchiveType
            ? "Product no longer archived"
            : "Archived successfully"
        );
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const RightSideComponent = useMemo(
    () => (
      <div className="text-sm text-gray-500 flex items-center justify-end w-full mr-6">
        <div className="flex rounded-md overflow-hidden border dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            onClick={handleActiveClick}
            className={`flex items-center gap-x-2 px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              !getDataArchiveType
                ? "bg-blue-600 text-white dark:bg-blue-700"
                : "bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Active
          </button>
          <button
            onClick={handleArchiveClick}
            className={`flex items-center gap-x-2 px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              getDataArchiveType
                ? "bg-blue-600 text-white dark:bg-blue-700"
                : "bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Archive className="w-4 h-4" />
            Archived
          </button>
        </div>
      </div>
    ),
    [getDataArchiveType, handleActiveClick, handleArchiveClick]
  );

  const { t } = useTranslation(translationConstant.INVENTORY);
  return (
    <main className="w-full h-full font-[500] text-[20px] dark:bg-gray-900 dark:text-white">
      <div className="w-full min-h-[81.5dvh] h-[100%] overflow-auto py-2 px-2">
        <div className="h-[100%] col-span-2 rounded-md py-2">
          <h1 className="text-xl font-bold px-3 py-2 dark:text-white">
            Products
          </h1>
          <div className="px-3 py-4 flex justify-between items-center">
            <div className="flex items-center gap-x-3">
              <input
                onChange={onChangeHandle}
                type="text"
                placeholder={t("Inventory_k20")}
                className="px-4 py-2 w-72 text-sm rounded-md focus:outline-none border border-gray-300 bg-[#F1F4F7] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />

              <button
                onClick={() => openModalHandle(modalStateEnum.CREATE)}
                className="flex w-full items-center gap-x-2 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium px-4 py-2 rounded-md dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                <CirclePlus className="w-6 h-6" />
                Add Product
              </button>
            </div>

            {RightSideComponent}
          </div>

          <div className="pt-5">
            <div className="border rounded-md dark:border-gray-700 dark:bg-[#0e1725]">
              <Table>
                <TableHeader className="bg-gray-50 border-b border-b-[#E4E4E7] dark:bg-[#0e1725] dark:border-gray-700">
                  <TableRow className="flex hover:bg-transparent dark:hover:bg-gray-800">
                    <TableHead className="w-12 p-3">
                      {/* <input
                        type="checkbox"
                        className="h-4 w-4 dark:bg-gray-700 dark:border-gray-600"
                      /> */}
                    </TableHead>
                    {tableHeader.map(
                      ({ label, align, can_sort, id }, index) => (
                        <TableHead
                          key={index}
                          className={`flex-1 ${
                            align || "text-start"
                          } text-base text-[#71717A] font-normal p-3 dark:text-gray-400`}
                        >
                          <div className="flex items-center">
                            {t(label)}
                            {can_sort && (
                              <button
                                onClick={() => sortHandle(id)}
                                className="active:opacity-50 ml-1"
                              >
                                <PiCaretUpDownBold
                                  className={`inline ${
                                    sortColumn === id
                                      ? "text-blue-600 dark:text-blue-400"
                                      : "text-gray-400 dark:text-gray-500"
                                  } hover:text-gray-600 dark:hover:text-gray-300`}
                                />
                              </button>
                            )}
                          </div>
                        </TableHead>
                      )
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody className="mb-4 h-[25dvh] overflow-y-auto block">
                  {loading ? (
                    <TableRow className="flex h-full">
                      <TableCell className="h-[60dvh] w-full flex flex-col justify-center items-center">
                        <Spinner size="xl" className="dark:text-white" />
                      </TableCell>
                    </TableRow>
                  ) : dataList.length === 0 ? (
                    <TableRow className="flex h-full">
                      <TableCell className="h-[60dvh] w-full flex flex-col justify-center items-center dark:text-gray-300">
                        <h1>No Product is available</h1>
                      </TableCell>
                    </TableRow>
                  ) : (
                    dataList.map((elem: DataListInterface, index) => (
                      <TableRow
                        key={index}
                        className="flex items-center hover:bg-gray-100 border-b border-b-[#E4E4E7] py-2 dark:hover:bg-gray-700 dark:border-gray-700"
                      >
                        <TableCell className="w-12 p-3">
                          {/* <input
                            type="checkbox"
                            className="h-4 w-4 dark:bg-gray-700 dark:border-gray-600"
                          /> */}
                        </TableCell>
                        {tableHeader.map((element, ind) => {
                          const { id, Render_Value, align } = element;
                          const content = Render_Value ? (
                            <Render_Value
                              getDataArchiveType={getDataArchiveType}
                              clickHandle={(action: string) =>
                                buttonClickActionHandle(action, elem)
                              }
                            />
                          ) : (
                            elem[id]
                          );

                          return (
                            <TableCell
                              key={ind}
                              className={`flex-1 ${
                                align || "text-start"
                              } text-base p-3 dark:text-gray-300`}
                            >
                              {id === "category"
                                ? elem?.categories?.category_name
                                : content}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between p-4 border-t dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  0 of {dataList.length} row(s) selected.
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:text-white">
                    Previous
                  </button>
                  <button className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:text-white">
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
        Title={`${modalState} Product`}
        loading={modalEventLoading}
        is_open={openModal}
        close_handle={closeModalHandle}
        create_new_handle={modalSubmitHandle}
        buttonLabel={modalState}
        Trigger_Button={null}
      >
        <div className="w-full grid grid-cols-2 gap-4 dark:bg-[#080e16]">
          {requiredInputFields.map((elem, index) => {
            const { id, label } = elem;
            return id === "category_id" ? (
              <div key={index} className="col-span-2 space-y-2">
                <Searchable_Dropdown
                  initialValue={0}
                  value={modalData[id]}
                  start_empty={true}
                  options_arr={categories.map(
                    ({ category_id, category_name }: any) => ({
                      value: category_id,
                      label: category_name,
                    })
                  )}
                  required={true}
                  on_change_handle={(e: any) =>
                    modalInputChangeHandle(id, e.target.value)
                  }
                  label="Category"
                />
              </div>
            ) : (
              <div key={index} className={`col-span-2`}>
                <Input_Component
                  value={modalData[id]}
                  onChange={(e: string) => modalInputChangeHandle(id, e)}
                  border="border-[1px] border-gray-300 rounded-md dark:border-none"
                  label={label}
                  bg_color="bg-white dark:bg-[#0e1725]"
                />
              </div>
            );
          })}
        </div>
      </Custom_Modal>

      {activeDeleteId && (
        <div className="fixed bg-black/75 h-screen w-screen top-0 left-0 right-0 bottom-0 z-20">
          <div className="flex justify-center items-center w-full h-full">
            <div className="bg-white w-full max-w-xl px-4 py-3 rounded-lg dark:bg-gray-800">
              <h1 className="font-bold text-xl text-black mb-5 dark:text-white">
                Confirmation
              </h1>
              <p className="text-lg dark:text-gray-300">
                Do you really want to{" "}
                {getDataArchiveType ? "Unarchive" : "Archive"} this product
              </p>
              <p className="text-sm dark:text-gray-400">
                Remember All of the locations inventories will also be{" "}
                {getDataArchiveType ? "Unarchive" : "Archive"} with the product
              </p>

              <div className="mt-4 flex items-center space-x-3 justify-end">
                <Button
                  disabled={deleteLoading}
                  onClick={() => setActiveDeleteId(0)}
                  color="gray"
                  className="dark:bg-gray-700 dark:text-white"
                >
                  Cancel
                </Button>
                <Button
                  isProcessing={deleteLoading}
                  color={"failure"}
                  onClick={deleteHandle}
                  className="dark:bg-red-700 dark:hover:bg-red-800"
                >
                  {getDataArchiveType ? "Unarchive" : "Archive"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Products;
