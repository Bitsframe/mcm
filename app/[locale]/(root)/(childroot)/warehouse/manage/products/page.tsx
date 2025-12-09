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
import LocationModal from "@/components/UserManagementComponents/LocationModal";
import { useLocationClinica } from "@/hooks/useLocationClinica";
import axios from "axios";
import { TransferUnits } from "@/components/Inventory/TransferUnits";

interface DataListInterface {
  [key: string]: any;
  location_ids?: number[];
  quantity?: number;
}

const modalStateEnum = {
  CREATE: "Create",
  UPDATE: "Update",
  DELETE: "Delete",
  ASSIGN: "Assign",
  EMPTY: "",
};

const tableHeader = [
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
    align: "text-center",
    width: 1,
  },
  {
    id: "stock",
    label: "Inventory_k19",
    can_sort: true,
    align: "text-center",
    width: 1,
    render_value: (val: any, elem?: any) => {
      return elem?.unlimited ? "Unlimited" : val;
    },
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
            label=""
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
            label={getDataArchiveType ? "" : ""}
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
          <Action_Button
            icon={<CirclePlus size={18} />}
            label=""
            text_color="text-[#0EA542] dark:text-green-400"
            bg_color="bg-[#E7FDEF] dark:bg-green-900/30"
            border="border-[#72F39E] dark:border-green-800"
            onClick={() => clickHandle(modalStateEnum.ASSIGN)}
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
  {
    id: "price",
    label: "Price",
    colSpan: "col-span-1",
    type: "number",
  },
  {
    id: "stock",
    label: "Units",
    colSpan: "col-span-1",
    type: "number",
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
  const { locations } = useLocationClinica();
  const [assignModalData, setAssignModalData] = useState<DataListInterface>({
    location_ids: [],
    quantity: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  const calculateTotalAssigned = useCallback(() => {
    if (!assignModalData.location_ids?.length || !assignModalData.quantity)
      return 0;
    return assignModalData.location_ids.length * assignModalData.quantity;
  }, [assignModalData.location_ids, assignModalData.quantity]);

  const isAssignValid = useCallback(() => {
    if (!assignModalData.location_ids?.length) return false;
    if (!assignModalData.quantity || assignModalData.quantity <= 0)
      return false;
    if (!modalData.unlimited) {
      const totalAssigned = calculateTotalAssigned();
      if (totalAssigned > modalData.stock) return false;
    }
    return true;
  }, [
    assignModalData.location_ids,
    assignModalData.quantity,
    modalData.unlimited,
    modalData.stock,
    calculateTotalAssigned,
  ]);

  const getRemainingStock = useCallback(() => {
    if (modalData.unlimited) return "Unlimited";
    const remaining = modalData.stock - calculateTotalAssigned();
    return remaining < 0 ? 0 : remaining;
  }, [modalData.unlimited, modalData.stock, calculateTotalAssigned]);

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
    setCurrentPage(1);
  };

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return dataList.slice(startIndex, endIndex);
  }, [dataList, currentPage]);

  const totalPages = Math.ceil(dataList.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    fetch_handle(getDataArchiveType);
  }, [getDataArchiveType]);

  const modalInputChangeHandle = (
    key: string,
    value: string | number | boolean
  ) => {
    if (key === "unlimited") {
      setModalData((pre) => {
        return { ...pre, [key]: value, stock: 0 };
      });
    } else {
      setModalData((pre) => {
        return { ...pre, [key]: value };
      });
    }
  };

  const modalSubmitHandle = async () => {
    setModalEventLoading(true);
    try {
      if (modalState === modalStateEnum.CREATE) {
        const { data: res_data, error } = await create_content_service({
          table: "products",
          language: "",
          post_data: {
            ...modalData,
            stock: modalData.unlimited ? 0 : modalData.stock,
            price: parseFloat(modalData.price) || 0,
              bonus_eligible: !!modalData.bonus_eligible,
          },
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
          unlimited: modalData.unlimited || false,
            stock: modalData.unlimited ? 0 : modalData.stock,
            bonus_eligible: !!modalData.bonus_eligible,
          price: parseFloat(modalData.price) || 0,
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

  const handleLocationSelect = (locationId: number) => {
    setAssignModalData((prev) => {
      const location_ids = prev.location_ids?.includes(locationId)
        ? prev.location_ids.filter((id: number) => id !== locationId)
        : [...(prev.location_ids || []), locationId];
      return { ...prev, location_ids };
    });
  };

  const handleSelectAll = () => {
    setAssignModalData((prev) => ({
      ...prev,
      location_ids:
        prev.location_ids?.length === locations.length
          ? []
          : locations.map((loc: any) => loc.id),
    }));
  };

  const handleQuantityChange = (value: string) => {
    const newQuantity = parseInt(value) || 0;
    const totalAssigned =
      newQuantity * (assignModalData.location_ids?.length || 0);

    if (!modalData.unlimited && totalAssigned > modalData.stock) {
      toast.error(
        `Cannot assign more than available stock (${modalData.stock})`
      );
      return;
    }

    setAssignModalData((prev) => ({ ...prev, quantity: newQuantity }));
  };

  const assignSubmitHandle = async () => {
    if (!assignModalData.location_ids?.length) {
      toast.error("Please select at least one location");
      return;
    }

    if (!assignModalData.quantity || assignModalData.quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const totalAssigned = calculateTotalAssigned();
    if (!modalData.unlimited && totalAssigned > modalData.stock) {
      toast.error(
        `Cannot assign more than available stock (${modalData.stock})`
      );
      return;
    }

    setModalEventLoading(true);
    try {
      const { data: result } = await axios.post("/api/inventory/assign", {
        product_id: modalData.product_id,
        location_id: assignModalData.location_ids,
        quantity: assignModalData.quantity,
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to assign inventory");
      }

      toast.success("Assigned successfully");
      closeModalHandle();
      fetch_handle(getDataArchiveType);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Something went wrong!"
      );
    } finally {
      setModalEventLoading(false);
    }
  };

  const buttonClickActionHandle = (action: string, elem: any) => {
    if (action === modalStateEnum.DELETE) {
      setActiveDeleteId(elem.product_id);
    } else if (action === modalStateEnum.UPDATE) {
      const normalized = {
        ...elem,
        bonus_eligible:
          elem?.bonus_eligible === true ||
          elem?.bonus_eligible === "TRUE" ||
          elem?.bonus_eligible === "true"
            ? true
            : false,
      };
      setModalData(normalized);
      openModalHandle(modalStateEnum.UPDATE);
    } else if (action === modalStateEnum.ASSIGN) {
      const normalizedAssign = {
        ...elem,
        bonus_eligible:
          elem?.bonus_eligible === true ||
          elem?.bonus_eligible === "TRUE" ||
          elem?.bonus_eligible === "true"
            ? true
            : false,
      };
      setModalData(normalizedAssign);
      setAssignModalData({ location_ids: [], quantity: 0 });
      openModalHandle(modalStateEnum.ASSIGN);
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

  const { t } = useTranslation(translationConstant.INVENTORY);
  return (
    <main className="w-full h-full font-[500] text-[20px] dark:bg-[#0e1725] dark:text-white">
      <div className="w-full h-full overflow-auto py-2 px-2">
        <div className="h-[100%] col-span-2 rounded-md py-2">
          <div className=" flex flex-col gap-3 sm:flex-row sm:justify-between items-center">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
              <input
                onChange={onChangeHandle}
                type="text"
                placeholder={t("Inventory_k20")}
                className="px-4 py-2 w-full sm:w-72 text-sm rounded-md focus:outline-none border border-gray-300 bg-[#f1f4f9] dark:bg-[#122136] dark:border-gray-700 dark:text-white"
              />
              <button
                onClick={() => openModalHandle(modalStateEnum.CREATE)}
                className="flex w-full sm:w-[200px] items-center justify-center gap-x-2 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium px-4 py-[6px] rounded-md dark:bg-blue-700 dark:hover:bg-blue-800 mt-2 sm:mt-0"
              >
                <CirclePlus className="w-6 h-6" />
                <span>{t("Inventory_k26")}</span>
              </button>
              <button
                onClick={() => setTransferModalOpen(true)}
                className="flex w-full sm:w-[200px] items-center justify-center gap-x-2 bg-green-600 hover:bg-green-700 text-white text-base font-medium px-4 py-[6px] rounded-md dark:bg-green-700 dark:hover:bg-green-800 mt-2 sm:mt-0"
              >
                <CirclePlus className="w-6 h-6" />
                <span>{t("Inventory_k44")}</span>
              </button>
            </div>

            <div className="text-sm text-gray-500 flex items-center justify-start w-full sm:w-auto">
              <div className="flex rounded-md overflow-hidden border dark:border-gray-700 bg-white dark:bg-[#122136]">
                <button
                  onClick={handleActiveClick}
                  className={`flex items-center gap-x-2 px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    !getDataArchiveType
                      ? "bg-blue-600 text-white dark:bg-blue-700"
                      : "bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t("Inventory_k5")}</span>
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
                  <span>{t("Inventory_k33")}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-5">
            <div className="border rounded-md dark:border-gray-700 dark:bg-[#0e1725] overflow-hidden">
              {/* Table for larger screens */}
              <div className="hidden md:block overflow-x-auto">
                <div className="min-h-[70dvh] max-h-[70dvh] overflow-y-auto">
                  <Table className="min-w-full">
                    <TableHeader className="bg-gray-50 border-b border-b-[#E4E4E7] dark:bg-[#0e1725] dark:border-gray-700 sticky top-0 z-10">
                      <TableRow className="flex hover:bg-transparent">
                      <TableHead className="w-8 p-2"></TableHead>
                      {tableHeader.map(
                        ({ label, align, can_sort, id }, index) => (
                          <TableHead
                            key={index}
                            className={`${
                              id === "category"
                                ? "w-[20%]"
                                : id === "product_name"
                                ? "w-[25%]"
                                : id === "price" || id === "stock"
                                ? "w-[12%]"
                                : id === "actions"
                                ? "w-[31%]"
                                : "flex-1"
                            } ${
                              id === "price" ||
                              id === "stock" ||
                              id === "actions"
                                ? "text-center"
                                : "text-start"
                            } text-base text-[#71717A] font-normal p-2 dark:text-gray-400 truncate`}
                          >
                            <div className="flex items-center justify-between">
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

                    <TableBody className="bg-white dark:bg-[#0e1725]">
                      {loading ? (
                        <TableRow className="flex h-[70dvh]">
                          <TableCell className="h-[70dvh] w-full flex flex-col justify-center items-center">
                            <Spinner size="xl" className="dark:text-white" />
                          </TableCell>
                        </TableRow>
                      ) : dataList.length === 0 ? (
                        <TableRow className="flex h-[70dvh]">
                          <TableCell className="h-[70dvh] w-full flex flex-col justify-center items-center dark:text-gray-300">
                            <h1>No Product is available</h1>
                          </TableCell>
                        </TableRow>
                      ) : (
                      paginatedData.map((elem: DataListInterface, index) => (
                        <TableRow
                          key={index}
                          className="flex items-center border-b border-b-[#E4E4E7] py-2 dark:hover:bg-gray-700 dark:border-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <TableCell className="w-8 p-2"></TableCell>
                          {tableHeader.map((element, ind) => {
                            const {
                              id,
                              Render_Value,
                              align,
                              width,
                              render_value,
                            } = element;
                            const content = Render_Value ? (
                              <Render_Value
                                getDataArchiveType={getDataArchiveType}
                                clickHandle={(action: string) =>
                                  buttonClickActionHandle(action, elem)
                                }
                              />
                            ) : (
                              <div
                                className={
                                  width === 1
                                    ? "w-1/2 truncate"
                                    : "truncate"
                                }
                                title={elem[id]}
                              >
                                {id === "product_name" ? (
                                  <div className="flex items-center gap-2">
                                    {elem?.bonus_eligible ? (
                                      <Image
                                        src="/assets/bonusicon.png"
                                        alt="bonus"
                                        width={18}
                                        height={18}
                                        className="inline-block w-4 h-4 object-contain"
                                      />
                                    ) : null}
                                    <span className="truncate">
                                      {render_value
                                        ? render_value(elem[id], elem)
                                        : elem[id]}
                                    </span>
                                  </div>
                                ) : (
                                  render_value ? render_value(elem[id], elem) : elem[id]
                                )}
                              </div>
                            );

                            if (id === "actions") {
                              return (
                                <TableCell
                                  key={ind}
                                  className="w-[31%] text-center p-2"
                                >
                                  <div className="flex flex-row justify-center items-center gap-x-2 whitespace-nowrap">
                                    <Action_Button
                                      icon={<RefreshCcw size={16} />}
                                      onClick={() =>
                                        buttonClickActionHandle("Update", elem)
                                      }
                                      label={t("Inventory_k17")}
                                      text_color="text-[#0066ff] dark:text-blue-400"
                                      bg_color="bg-[#E5F0FF] dark:bg-blue-900/30"
                                      border="border-[#CCE0FF] dark:border-blue-800"
                                    />
                                    <Action_Button
                                      icon={<Archive size={16} />}
                                      onClick={() =>
                                        buttonClickActionHandle("Delete", elem)
                                      }
                                      label={
                                        getDataArchiveType
                                          ? t("Inventory_k30")
                                          : t("Inventory_k5")
                                      }
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
                                    />
                                    <Action_Button
                                      icon={<CirclePlus size={16} />}
                                      onClick={() =>
                                        buttonClickActionHandle("Assign", elem)
                                      }
                                      label={t("Inventory_k6")}
                                      text_color="text-[#0EA542] dark:text-green-400"
                                      bg_color="bg-[#E7FDEF] dark:bg-green-900/30"
                                      border="border-[#72F39E] dark:border-green-800"
                                    />
                                  </div>
                                </TableCell>
                              );
                            }

                            return (
                              <TableCell
                                key={ind}
                                className={`${
                                  id === "category"
                                    ? "w-[20%]"
                                    : id === "product_name"
                                    ? "w-[25%]"
                                    : id === "price" || id === "stock"
                                    ? "w-[12%]"
                                    : "flex-1"
                                } ${
                                  id === "price" || id === "stock"
                                    ? "text-center"
                                    : "text-start"
                                } text-base p-2 dark:text-gray-300 truncate`}
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
                </div>
              </div>

              <div className="md:hidden space-y-4 p-4">
                {loading ? (
                  <div className="h-[70dvh] w-full flex flex-col justify-center items-center">
                    <Spinner size="xl" className="dark:text-white" />
                  </div>
                ) : dataList.length === 0 ? (
                  <div className="h-[70dvh] w-full flex flex-col justify-center items-center dark:text-gray-300">
                    <h1>No Product is available</h1>
                  </div>
                ) : (
                  <>
                    {paginatedData.map((elem: DataListInterface, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-[#0e1725] p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {t("Inventory_k1")}:
                            </span>
                            <span className="text-sm dark:text-gray-300 truncate">
                              {elem?.categories?.category_name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {t("Inventory_k8")}:
                            </span>
                            <span className="text-sm dark:text-gray-300 truncate">
                              {elem.product_name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {t("Inventory_k18")}:
                            </span>
                            <span className="text-sm dark:text-gray-300">
                              {elem.price}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {t("Inventory_k19")}:
                            </span>
                            <span className="text-sm dark:text-gray-300">
                              {elem.unlimited ? "Unlimited" : elem.stock}
                            </span>
                          </div>
                          <div className="flex flex-wrap justify-end gap-2 mt-3">
                            <Action_Button
                              icon={<RefreshCcw size={16} />}
                              onClick={() =>
                                buttonClickActionHandle("Update", elem)
                              }
                              label="Update"
                              text_color="text-[#0066ff] dark:text-blue-400"
                              bg_color="bg-[#E5F0FF] dark:bg-blue-900/30"
                              border="border-[#CCE0FF] dark:border-blue-800"
                            />
                            <Action_Button
                              icon={<Archive size={16} />}
                              onClick={() =>
                                buttonClickActionHandle("Delete", elem)
                              }
                              label={
                                getDataArchiveType ? "Unarchive" : "Archive"
                              }
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
                            />
                            <Action_Button
                              icon={<CirclePlus size={16} />}
                              onClick={() =>
                                buttonClickActionHandle("Assign", elem)
                              }
                              label="Assign"
                              text_color="text-[#0EA542] dark:text-green-400"
                              bg_color="bg-[#E7FDEF] dark:bg-green-900/30"
                              border="border-[#72F39E] dark:border-green-800"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="flex items-center justify-between p-4 border-t dark:border-gray-700">
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-md text-sm dark:hover:bg-gray-600 dark:text-white"
                  >
                    {t("Inventory_k23") || "Previous"}
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded-md text-sm dark:hover:bg-gray-600 dark:text-white"
                  >
                    {t("Inventory_k22") || "Next"}
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
        create_new_handle={
          modalState === modalStateEnum.ASSIGN
            ? assignSubmitHandle
            : modalSubmitHandle
        }
        buttonLabel={modalState}
        Trigger_Button={null}
        disabled={modalState === modalStateEnum.ASSIGN && !isAssignValid()}
      >
        {modalState === modalStateEnum.ASSIGN ? (
          <div className="w-full grid grid-cols-2 h-[300px] gap-4 dark:bg-[#0e1725]">
            <div className="col-span-2 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select clinic
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="select-all-locations"
                    checked={
                      assignModalData.location_ids?.length === locations.length
                    }
                    onChange={handleSelectAll}
                    className="h-5 w-5 rounded border-2 border-gray-400 text-blue-600 focus:ring-blue-500 dark:border-gray-500 dark:bg-[#0e1725] cursor-pointer ring-1 ring-gray-300 dark:ring-gray-600"
                  />
                  <label
                    htmlFor="select-all-locations"
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    {t("Inventory_k41")}
                  </label>
                </div>
              </div>
              <div className="max-h-[200px] overflow-y-auto border rounded-md dark:border-gray-700">
                {locations.map((location: any) => (
                  <div
                    key={location.id}
                    className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 border-b last:border-b-0 dark:border-gray-700"
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`location-${location.id}`}
                        checked={assignModalData.location_ids?.includes(
                          location.id
                        )}
                        onChange={() => handleLocationSelect(location.id)}
                        className="h-4 w-4 rounded border-2 border-gray-400 text-blue-600 focus:ring-blue-500 dark:border-gray-500 dark:bg-[#0e1725] cursor-pointer ring-1 ring-gray-300 dark:ring-gray-600"
                      />
                      <label
                        htmlFor={`location-${location.id}`}
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        {location.title}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {assignModalData.location_ids?.length || 0} {t("Inventory_k42")}
              </div>
            </div>
            <div className="col-span-2 space-y-4">
              <div>
                <Input_Component
                  type="number"
                  value={assignModalData.quantity?.toString() || ""}
                  onChange={handleQuantityChange}
                  border="border-[1px] border-gray-300 rounded-md dark:border-none"
                  label="Number of Units"
                  bg_color="bg-[#f1f4f9] dark:bg-[#122136]"
                />
              </div>
              <div className="space-y-2 p-3 bg-gray-50 rounded-md dark:bg-[#0e1725]">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                  {t("Inventory_k37")}
                  </span>
                  <span className="font-medium dark:text-white">
                    {modalData.unlimited ? "Unlimited" : "Limited"}
                  </span>
                </div>
                {!modalData.unlimited && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                      {t("Inventory_k38")}
                      </span>
                      <span className="font-medium dark:text-white">
                        {modalData.stock}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                      {t("Inventory_k39")}
                      </span>
                      <span
                        className={`font-medium ${
                          calculateTotalAssigned() > modalData.stock
                            ? "text-red-500"
                            : "dark:text-white"
                        }`}
                      >
                        {calculateTotalAssigned()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                      {t("Inventory_k40")}
                      </span>
                      <span
                        className={`font-medium ${
                          getRemainingStock() === 0
                            ? "text-red-500"
                            : "dark:text-white"
                        }`}
                      >
                        {getRemainingStock()}
                      </span>
                    </div>
                    {calculateTotalAssigned() > modalData.stock && (
                      <div className="text-sm text-red-500 mt-2">
                        Cannot assign more than available stock
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full grid grid-cols-2 gap-4 dark:bg-[#0e1725]">
            {requiredInputFields.map((elem, index) => {
              const { id, label, colSpan, type } = elem;
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
                <div key={index} className={colSpan || "col-span-2"}>
                  <Input_Component
                    type={type || "text"}
                    value={modalData[id]}
                    onChange={(e: string) => modalInputChangeHandle(id, e)}
                    border="border-[1px] border-gray-300 rounded-md dark:border-none"
                    label={label}
                    bg_color="bg-[#f1f4f9] dark:bg-[#122136]"
                    disabled={id === "stock" && modalData.unlimited}
                  />
                </div>
              );
            })}
            <div className="col-span-2 flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="unlimited"
                  checked={modalData.unlimited}
                  onChange={(e) =>
                    modalInputChangeHandle("unlimited", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-2 border-gray-400 text-blue-600 focus:ring-blue-500 dark:border-gray-500 dark:bg-[#0e1725] cursor-pointer ring-1 ring-gray-300 dark:ring-gray-600"
                />
                <label
                  htmlFor="unlimited"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {t("Inventory_k43")}
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="bonus_eligible"
                  checked={!!modalData.bonus_eligible}
                  onChange={(e) =>
                    modalInputChangeHandle("bonus_eligible", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-2 border-gray-400 text-blue-600 focus:ring-blue-500 dark:border-gray-500 dark:bg-[#0e1725] cursor-pointer ring-1 ring-gray-300 dark:ring-gray-600"
                />
                <label
                  htmlFor="bonus_eligible"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Bonus-eligible
                </label>
              </div>
            </div>
          </div>
        )}
      </Custom_Modal>

      {activeDeleteId ? (
        <div className="fixed bg-black/75 h-screen w-screen top-0  left-0 right-0 bottom-0 z-50">
          <div className="flex justify-center items-center w-full h-full">
            <div className="bg-white w-full max-w-xl px-4 py-3 rounded-lg dark:bg-gray-800">
              <h1 className="font-bold text-xl text-black mb-5 dark:text-white">
              {t("Inventory_k10")}
              </h1>
              <p className="text-lg dark:text-gray-300">
              {t("Inventory_k11")}{" "}
                {getDataArchiveType ? t("Inventory_k30") : t("Inventory_k14")} this product
              </p>
              <p className="text-sm dark:text-gray-400">
              {t("Inventory_k35")}{" "}
                {getDataArchiveType ? t("Inventory_k30") : t("Inventory_k14")} {t("Inventory_k36")}
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
      ) : null}

      <TransferUnits
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onTransferSuccess={() => fetch_handle(getDataArchiveType)}
      />
    </main>
  );
};

export default Products;
