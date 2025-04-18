"use client";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Spinner } from "flowbite-react";
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
import { useMasterProductsClinica } from "@/hooks/useMasterProductsClinica";
import { Price_Input } from "@/components/Price_Input";
import { LocationContext } from "@/context";
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
import { Archive, ShieldCheck } from "lucide-react";

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
    id: "price",
    label: "Inventory_k18",
    can_sort: true,
  },
  {
    id: "quantity_available",
    label: "Inventory_k19",
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
    type: "select",
  },
  {
    id: "master_product_id",
    label: "Product",
    type: "select",
  },
  {
    id: "price",
    label: "Price",
    colSpan: "col-span-1",
    type: "number",
  },
  {
    id: "quantity_available",
    label: "Units",
    colSpan: "col-span-1",
    type: "number",
  },
];

const Inventory = () => {
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

  const {
    products,
    onChangeCategory,
    loadingProducts,
    selectedCategory,
    selectedProduct,
    selectProductHandle,
  } = useMasterProductsClinica();
  const { selectedLocation } = useContext(LocationContext);
  const [getDataArchiveType, setGetDataArchiveType] = useState(false);

  const openModalHandle = (state: string) => {
    setOpenModal(true);
    setModalState(state);
  };
  const closeModalHandle = () => {
    setOpenModal(false);
    setModalState(modalStateEnum.EMPTY);
    setModalData({});
  };

  const fetch_handle = async (archived: boolean, location_id: number) => {
    setLoading(true);
    const fetched_data = await fetch_content_service({
      table: "inventory",
      language: "",
      selectParam: `,products(product_name,product_id,category_id, categories(category_name))`,
      matchCase: [
        {
          key: "location_id",
          value: location_id,
        },
        {
          key: "archived",
          value: archived,
        },
        {
          key: "products.archived",
          value: false,
        },
      ],
      filterOptions: [{ operator: "not", column: "products", value: null }],
    });

    const inventoryData = fetched_data.map(
      ({ products, price, quantity, inventory_id }: any) => ({
        product_id: inventory_id,
        master_product_id: products.product_id,
        category_id: products.category_id,
        product_name: products.product_name,
        price: price,
        quantity_available: quantity,
        categories: products.categories,
      })
    );
    setDataList(inventoryData);
    setAllData(inventoryData);
    setLoading(false);
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
    if (selectedLocation) {
      fetch_handle(getDataArchiveType, selectedLocation.id);
    }
  }, [selectedLocation]);

  const modalInputChangeHandle = (key: string, value: string | number) => {
    if (key === "category_id") {
      onChangeCategory(+value);
    } else if (key === "master_product_id") {
      selectProductHandle(+value);
    }
    setModalData((pre) => {
      return { ...pre, [key]: value };
    });
  };

  const modalSubmitHandle = async () => {
    setModalEventLoading(true);
    if (modalState === modalStateEnum.CREATE) {
      const invenPostData = {
        price: modalData.price,
        quantity: modalData.quantity_available,
        location_id: selectedLocation.id,
        product_id: modalData.master_product_id,
      };

      const { data: res_data, error } = await create_content_service({
        table: "inventory",
        language: "",
        post_data: invenPostData,
      });

      if (error) {
        toast.error(error.message);
      }
      if (res_data?.length) {
        toast.success("Created successfully");
        closeModalHandle();
        fetch_handle(getDataArchiveType, selectedLocation.id);
      }
    } else {
      try {
        const postData = {
          inventory_id: +modalData.product_id,
          price: +modalData.price,
          quantity: +modalData.quantity_available,
          location_id: +selectedLocation.id,
          product_id: modalData.master_product_id,
        };

        const res_data = await update_content_service({
          table: "inventory",
          language: "",
          post_data: postData,
          matchKey: "inventory_id",
        });
        if (res_data?.length) {
          toast.success("Updated successfully");
          fetch_handle(getDataArchiveType, selectedLocation.id);
          closeModalHandle();
        }
      } catch (error: any) {
        if (error && error?.message) {
          toast.error(error?.message);
        } else {
          toast.error("Something went wrong!");
        }
      }
    }
    setModalEventLoading(false);
  };

  const onClickHandle = async (id: number) => {
    const { error }: any = await update_content_service({
      table: "inventory",
      matchKey: "inventory_id",
      post_data: { archived: !getDataArchiveType, inventory_id: id },
    });
    if (!error) {
      fetch_handle(getDataArchiveType, selectedLocation.id);
      toast.success(
        getDataArchiveType
          ? "Inventory no longer archived"
          : "Archived successfully"
      );
    } else if (error) {
      toast.error(error.message);
    }
  };

  const buttonClickActionHandle = (action: string, elem: any) => {
    if (action === modalStateEnum.DELETE) {
      onClickHandle(elem.product_id);
    } else if (action === modalStateEnum.UPDATE) {
      setModalData(elem);
      onChangeCategory(elem.category_id);
      openModalHandle(modalStateEnum.UPDATE);
    }
  };

  const sortHandle = (column: string) => {
    let sortedList: any = [];
    if (column === "category") {
      if (sortOrder === 1) {
        sortedList = dataList.sort((a, b) =>
          a.categories.category_name.localeCompare(b.categories.category_name)
        );
      } else {
        sortedList = dataList.sort((a, b) =>
          b.categories.category_name.localeCompare(a.categories.category_name)
        );
      }
    } else if (column === "product_name") {
      if (sortOrder === 1) {
        sortedList = dataList.sort((a, b) =>
          a.product_name.localeCompare(b.product_name)
        );
      } else {
        sortedList = dataList.sort((a, b) =>
          b.product_name.localeCompare(a.product_name)
        );
      }
    } else {
      if (sortOrder === 1) {
        sortedList = dataList.sort((a, b) => a[column] - b[column]);
      } else {
        sortedList = dataList.sort((a, b) => b[column] - a[column]);
      }
    }

    setSortOrder((order) => (order === -1 ? 1 : -1));
    setDataList([...sortedList]);
    setSortColumn(column);
  };

  useEffect(() => {
    if (selectedLocation?.id) {
      fetch_handle(getDataArchiveType, selectedLocation.id);
    }
  }, [getDataArchiveType, selectedLocation]);

  const handleActiveClick = useCallback(() => {
    setGetDataArchiveType(false);
  }, []);

  const handleArchiveClick = useCallback(() => {
    setGetDataArchiveType(true);
  }, []);

  const RightSideComponent = useMemo(
    () => (
      <div className="text-sm text-gray-500 flex items-center justify-end space-x-0 bg-gray-100 rounded-md overflow-hidden dark:bg-gray-700">
        <button
          onClick={handleActiveClick}
          className={`flex items-center gap-x-1 px-4 py-2 ${
            !getDataArchiveType
              ? "bg-blue-600 text-white dark:bg-blue-700"
              : "bg-transparent text-gray-500 dark:text-gray-300"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Active
        </button>
        <button
          onClick={handleArchiveClick}
          className={`flex items-center gap-x-1 px-4 py-2 ${
            getDataArchiveType
              ? "bg-blue-600 text-white dark:bg-blue-700"
              : "bg-transparent text-gray-500 dark:text-gray-300"
          }`}
        >
          <Archive className="w-4 h-4" />
          Archived
        </button>
      </div>
    ),
    [getDataArchiveType, handleActiveClick, handleArchiveClick]
  );

  const { t } = useTranslation(translationConstant.INVENTORY);
  return (
    <main className="w-full h-full font-[500] text-[20px] dark:bg-gray-900 dark:text-white">
      <div className="w-full min-h-[81.5dvh] h-[100%] overflow-auto py-2 px-2">
        <div className="h-[100%] col-span-2 rounded-md py-2">
          <h1 className="text-xl font-bold dark:text-white">Inventory</h1>
          <div className="px-3 py-4 flex justify-between items-center">
            <div className="flex items-center gap-x-2">
              <input
                onChange={onChangeHandle}
                type="text"
                placeholder={t("Inventory_k20")}
                className="px-3 py-2 w-64 text-sm rounded-md focus:outline-none border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
              <button
                onClick={() => openModalHandle(modalStateEnum.CREATE)}
                className="flex items-center gap-x-1 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                Create Product
              </button>
            </div>

            {RightSideComponent}
          </div>

          <div className="px-3 pt-5 border rounded-md dark:border-gray-700 dark:bg-gray-800">
            <Table>
              <TableHeader className="border-b border-gray-200 dark:border-gray-700">
                <TableRow className="flex hover:bg-transparent dark:hover:bg-gray-800">
                  <TableHead className="w-10 p-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                    />
                  </TableHead>
                  {tableHeader.map(({ label, align, can_sort, id }, index) => (
                    <TableHead
                      key={index}
                      className={`
                        flex-1 
                        ${align || "text-start"}
                        text-sm 
                        text-gray-500
                        font-medium
                        py-3
                        dark:text-gray-400
                      `}
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
                              } hover:text-gray-600 dark:hover:text-gray-300 active:text-gray-500`}
                            />
                          </button>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-200 mb-4 h-[60dvh] overflow-y-auto block dark:divide-gray-700">
                {loading ? (
                  <TableRow className="flex h-full">
                    <TableCell
                      colSpan={tableHeader.length}
                      className="h-[60dvh] text-center"
                    >
                      <Spinner size="xl" className="dark:text-white" />
                    </TableCell>
                  </TableRow>
                ) : dataList.length === 0 ? (
                  <TableRow className="flex h-full">
                    <TableCell
                      colSpan={tableHeader.length}
                      className="h-[60dvh] text-center dark:text-gray-300"
                    >
                      <h1>No Product is available</h1>
                    </TableCell>
                  </TableRow>
                ) : (
                  dataList.map((elem: DataListInterface, index) => (
                    <TableRow
                      key={index}
                      className={`
                        flex 
                        items-center 
                        hover:bg-gray-100 
                        border-b
                        border-gray-200
                        ${
                          index % 2 === 0
                            ? "bg-white dark:bg-gray-800"
                            : "bg-gray-50 dark:bg-gray-700"
                        }
                        dark:hover:bg-gray-700
                        dark:border-gray-700
                      `}
                    >
                      <TableCell className="w-10 p-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                        />
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
                            } text-sm py-4 dark:text-gray-300`}
                          >
                            {id === "category"
                              ? elem.categories.category_name
                              : content}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {!loading && dataList.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  0 of {dataList.length} row(s) selected.
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300">
                    Previous
                  </button>
                  <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* @ts-ignore */}
      <Custom_Modal
        open_handle={() => openModalHandle(modalStateEnum.CREATE)}
        Title={`${modalState} Product`}
        loading={modalEventLoading}
        is_open={openModal}
        close_handle={closeModalHandle}
        create_new_handle={modalSubmitHandle}
        buttonLabel={modalState}
        //@ts-ignore
        Trigger_Button={null}
      >
        <div className="w-full grid grid-cols-2 gap-4 dark:bg-gray-800">
          {requiredInputFields.map((elem) => {
            const { id, label, colSpan, type } = elem;
            return id === "category_id" ? (
              <div className="col-span-2 space-y-2">
                <Searchable_Dropdown
                  initialValue={0}
                  value={modalData[id]}
                  bg_color="#fff dark:bg-gray-700"
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
            ) : id === "master_product_id" ? (
              <div className="col-span-2 space-y-2">
                <Searchable_Dropdown
                  initialValue={0}
                  value={modalData[id]}
                  bg_color="#fff dark:bg-gray-700"
                  start_empty={true}
                  options_arr={products.map(
                    ({ product_id, product_name }: any) => ({
                      value: product_id,
                      label: product_name,
                    })
                  )}
                  required={true}
                  on_change_handle={(e: any) =>
                    modalInputChangeHandle(id, e.target.value)
                  }
                  label="Product"
                />
              </div>
            ) : (
              <div className={`${colSpan || "col-span-2"}`}>
                {id === "price" ? (
                  <Price_Input
                    type={type}
                    value={modalData[id]}
                    onChange={(e: string) => modalInputChangeHandle(id, e)}
                    py="py-3"
                    border="border-[1px] border-gray-300 rounded-md dark:border-gray-600"
                    label={label}
                  />
                ) : (
                  <Input_Component
                    type={type}
                    value={modalData[id]}
                    onChange={(e: string) => modalInputChangeHandle(id, e)}
                    py="py-3"
                    border="border-[1px] border-gray-300 rounded-md dark:border-gray-600"
                    label={label}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Custom_Modal>
    </main>
  );
};

export default Inventory;
