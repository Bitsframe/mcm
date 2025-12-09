"use client";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Spinner } from "flowbite-react";
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
import { Archive, ShieldCheck, Filter } from "lucide-react";

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
    align: "text-centet",
    Render_Value: ({
      clickHandle,
      getDataArchiveType,
    }: {
      clickHandle: (state: string) => void;
      getDataArchiveType: boolean;
    }) => {
      return (
        <div className="flex items-end justify-start">
          <Action_Button
            label={getDataArchiveType ? "Unarchive" : "Archive"}
            text_color={
              getDataArchiveType
                ? "text-[#0EA542] dark:text-green-400"
                : "text-[#F71B1B] dark:text-red-400"
            }
            icon={<Archive size={18} />}
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
  const { t } = useTranslation(translationConstant.INVENTORY);
  const [dataList, setDataList] = useState<DataListInterface[]>([]);
  const [allData, setAllData] = useState<DataListInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [excludeZeroQuantity, setExcludeZeroQuantity] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
      selectParam: `,products(price,product_name,product_id,category_id, unlimited, categories(category_name))`,
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
        unlimited: products.unlimited,
        price: products.price,
        quantity_available: quantity,
        categories: products.categories,
      })
    );
    setDataList(inventoryData);
    setAllData(inventoryData);
    setLoading(false);
  };

  const onChangeHandle = useCallback((e: any) => {
    const val = e.target.value;
    let filteredData = allData;

    // Apply zero quantity filter
    if (excludeZeroQuantity) {
      filteredData = filteredData.filter(
        (elem) => elem.quantity_available > 0 || elem.unlimited
      );
    }

    // Apply search filter
    if (val !== "") {
      filteredData = filteredData.filter((elem) =>
        elem.product_name.toLocaleLowerCase().includes(val.toLocaleLowerCase())
      );
    }

    setDataList([...filteredData]);
  }, [allData, excludeZeroQuantity]);

  // Add effect to handle zero quantity filter changes
  useEffect(() => {
    onChangeHandle({ target: { value: "" } });
  }, [onChangeHandle]);

  // fetch when selected location or archive type changes (handled below as well)
  // removed duplicate effect to avoid double-fetching; the effect with [getDataArchiveType, selectedLocation]
  // further down handles both changes.

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

  const modalSubmitHandle = async (e: any) => {
    e.preventDefault();
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

  const handleZeroQuantityToggle = useCallback(() => {
    setExcludeZeroQuantity((prev) => !prev);
  }, []);

  const RightSideComponent = useMemo(
    () => (
      <div className="text-sm text-gray-500 flex flex-col sm:flex-row items-start sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="flex items-center space-x-0 bg-gray-100 rounded-md overflow-hidden dark:bg-gray-700">
          <button
            onClick={handleActiveClick}
            className={`flex items-center gap-x-1 px-3 sm:px-4 py-2 text-xs sm:text-sm ${
              !getDataArchiveType
                ? "bg-blue-600 text-white dark:bg-blue-700"
                : "bg-transparent text-gray-500 dark:text-gray-300"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">{t("Inventory_k5")}</span>
          </button>
          <button
            onClick={handleArchiveClick}
            className={`flex items-center gap-x-1 px-3 sm:px-4 py-2 text-xs sm:text-sm ${
              getDataArchiveType
                ? "bg-blue-600 text-white dark:bg-blue-700"
                : "bg-transparent text-gray-500 dark:text-gray-300"
            }`}
          >
            <Archive className="w-4 h-4" />
            <span className="hidden sm:inline">{t("Inventory_k33")}</span>
          </button>
        </div>
        <button
          onClick={handleZeroQuantityToggle}
          className={`flex items-center gap-x-1 px-3 sm:px-4 py-2 transition-colors duration-200 rounded-md text-xs sm:text-sm ${
            excludeZeroQuantity
              ? "bg-blue-600 text-white dark:bg-blue-700"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
          }`}
          title="Exclude zero quantity products"
        >
          <Filter className="w-4 h-4" />
          <span className="hidden lg:inline">{t("Inventory_k21")}</span>
          <span className="lg:hidden">{t("Inventory_k21")}</span>
        </button>
      </div>
    ),
    [
      t,
      getDataArchiveType,
      handleActiveClick,
      handleArchiveClick,
      excludeZeroQuantity,
      handleZeroQuantityToggle,
    ]
  );

  const MobileRightSideComponent = useMemo(
    () => (
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 flex items-center space-x-0 bg-gray-100 rounded-md overflow-hidden dark:bg-gray-700">
          <button
            onClick={handleActiveClick}
            className={`flex-1 flex items-center justify-center gap-x-1 px-2 py-2 text-xs ${
              !getDataArchiveType
                ? "bg-blue-600 text-white dark:bg-blue-700"
                : "bg-transparent text-gray-500 dark:text-gray-300"
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Active</span>
          </button>
          <button
            onClick={handleArchiveClick}
            className={`flex-1 flex items-center justify-center gap-x-1 px-2 py-2 text-xs ${
              getDataArchiveType
                ? "bg-blue-600 text-white dark:bg-blue-700"
                : "bg-transparent text-gray-500 dark:text-gray-300"
            }`}
          >
            <Archive className="w-3 h-3" />
            <span>Archived</span>
          </button>
        </div>
        <button
          onClick={handleZeroQuantityToggle}
          className={`flex items-center gap-x-1 px-2 py-2 text-xs rounded-md ${
            excludeZeroQuantity
              ? "bg-blue-600 text-white dark:bg-blue-700"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
          }`}
        >
          <Filter className="w-3 h-3" />
          <span>Filter</span>
        </button>
      </div>
    ),
    [
      getDataArchiveType,
      handleActiveClick,
      handleArchiveClick,
      excludeZeroQuantity,
      handleZeroQuantityToggle,
    ]
  );

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return dataList.slice(startIndex, endIndex);
  }, [dataList, currentPage]);

  const totalPages = Math.ceil(dataList.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <main className="w-full h-full font-[500] text-[20px] dark:bg-[#0e1725] dark:text-white">
      <div className="w-full overflow-auto py-2 px-2">
        <div className="h-[100%] col-span-2 rounded-md py-2">
          <div className=" pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div className="flex items-center gap-x-2 w-full sm:w-auto">
              <input
                onChange={onChangeHandle}
                type="text"
                placeholder={t("Inventory_k20")}
                className="px-3 py-2 w-full sm:w-64 text-sm rounded-md focus:outline-none border border-gray-300 bg-[#F1F4F9] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div className="w-full sm:w-auto hidden sm:block">
              {RightSideComponent}
            </div>
            <div className="w-full sm:hidden">{MobileRightSideComponent}</div>
          </div>

          <div className=" border rounded-md dark:border-gray-700 dark:bg-[#0e1725] min-h-[60dvh] flex flex-col">
            {/* Desktop Table View */}
            <div className="hidden md:block flex-1">
              <Table className="h-full flex flex-col">
                <TableHeader className="border-b border-gray-200 dark:bg-[#0e1725] dark:border-gray-700">
                  <TableRow className="flex hover:bg-transparent dark:hover:bg-gray-800">
                    <TableHead className="w-10 p-4"></TableHead>
                    {tableHeader.map(
                      ({ label, align, can_sort, id }, index) => (
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
                      )
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody className="dark:bg-[#0e1725] flex-1">
                  {loading ? (
                    <TableRow className="flex h-full">
                      <TableCell
                        colSpan={tableHeader.length}
                        className="h-full flex items-center justify-center"
                      >
                        <Spinner size="xl" className="dark:text-white" />
                      </TableCell>
                    </TableRow>
                  ) : dataList.length === 0 ? (
                    <TableRow className="flex h-full">
                      <TableCell
                        colSpan={tableHeader.length}
                        className="h-full flex items-center justify-center dark:text-gray-300"
                      >
                        <h1>No Product is available</h1>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((elem: DataListInterface, index) => (
                      <TableRow
                        key={index}
                        className={`
                flex 
                items-center 
                hover:bg-gray-100 
                dark:hover:bg-gray-700
                dark:bg-[#0e1725]
              `}
                      >
                        <TableCell className="w-10 p-4"></TableCell>
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
                              {id === "category" ? (
                                elem.categories.category_name
                              ) : id === "quantity_available" ? (
                                elem.unlimited ? (
                                  "Unlimited"
                                ) : (
                                  <span className="ms-6">{elem[id]}</span>
                                )
                              ) : (
                                content
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex-1">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Spinner size="xl" className="dark:text-white" />
                </div>
              ) : dataList.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <h1 className="dark:text-gray-300">
                    No Product is available
                  </h1>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedData.map((elem: DataListInterface, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-gray-200 dark:bg-[#0e1725] dark:border-gray-700"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {t("Inventory_k15")}
                            </div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {elem.product_id}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <Action_Button
                              label={
                                getDataArchiveType ? "Unarchive" : "Archive"
                              }
                              text_color={
                                getDataArchiveType
                                  ? "text-[#0EA542] dark:text-green-400"
                                  : "text-[#F71B1B] dark:text-red-400"
                              }
                              icon={<Archive size={16} />}
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
                              onClick={() =>
                                buttonClickActionHandle(
                                  modalStateEnum.DELETE,
                                  elem
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {t("Inventory_k1")}
                            </div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {elem.categories.category_name}
                            </div>
                          </div>

                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {t("Inventory_k18")}
                            </div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {elem.price}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {t("Inventory_k8")}
                            </div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {elem.product_name}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {t("Inventory_k19")}
                          </div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {elem.unlimited
                              ? "Unlimited"
                              : elem.quantity_available}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!loading && dataList.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                {/* Showing x to y of z using translations */}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {dataList.length === 0
                    ? `${t("Inventory_k27")} 0 ${t("Inventory_k29")} 0`
                    : `${t("Inventory_k27")} ${
                        (currentPage - 1) * itemsPerPage + 1
                      } ${t("Inventory_k28")} ${Math.min(
                        currentPage * itemsPerPage,
                        dataList.length
                      )} ${t("Inventory_k29")} ${dataList.length}`}
                </div>

                {/* Pagination buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
                  >
                    {t("Inventory_k23") || "Previous"}
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
                  >
                    {t("Inventory_k22") || "Next"}
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
        //@ts-ignore
        create_new_handle={modalSubmitHandle}
        buttonLabel={modalState}
        //@ts-ignore
        Trigger_Button={null}
      >
        <div className="w-full grid grid-cols-2 gap-4 dark:bg-[#080e16]">
          {requiredInputFields.map((elem, index) => {
            const { id, label, colSpan, type } = elem;
            return (
              <div key={index} className={`${colSpan || "col-span-2"}`}>
                {id === "category_id" ? (
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
                ) : id === "master_product_id" ? (
                  <Searchable_Dropdown
                    initialValue={0}
                    value={modalData[id]}
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
                ) : (
                  <Input_Component
                    type={type}
                    value={modalData[id]}
                    onChange={(e: string) => modalInputChangeHandle(id, e)}
                    py="py-3"
                    border="border-[1px] border-gray-300 rounded-md dark:border-none"
                    label={label}
                    bg_color="bg-white dark:bg-[#0e1725]"
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
