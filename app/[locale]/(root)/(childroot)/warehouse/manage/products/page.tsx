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
            text_color="text-[#166534]"
            bg_color="bg-[#F0F7F2]"
            border={
              getDataArchiveType
                ? "border-[#B9DCC6]"
                : "border-[#B9DCC6]"
            }
          />
          <Action_Button
            icon={<Archive size={18} />}
            label={getDataArchiveType ? "" : ""}
            text_color={
              getDataArchiveType
                ? "text-[#0EA542]"
                : "text-[#D70015]"
            }
            bg_color={
              getDataArchiveType
                ? "bg-[#E7FDEF]"
                : "bg-[#FFE8E5]"
            }
            border={
              getDataArchiveType
                ? "border-[#72F39E]"
                : "border-[#FFD2CC]"
            }
            onClick={() => clickHandle(modalStateEnum.DELETE)}
          />
          <Action_Button
            icon={<CirclePlus size={18} />}
            label=""
            text_color="text-[#0EA542]"
            bg_color="bg-[#E7FDEF]"
            border="border-[#72F39E]"
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
  // Every active product in one scrolling list; the pager only appears if the
  // list ever outgrows this.
  const itemsPerPage = 500;
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
        // The catalogue is past PostgREST's 1,000-row page; page through it all.
        fetchAll: true,
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
    <main className="w-full text-body">
      <div className="w-full">
        <div className="rounded-md">
          <div className=" flex flex-col gap-3 sm:flex-row sm:justify-between items-center">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
              <input
                onChange={onChangeHandle}
                type="text"
                placeholder={t("Inventory_k20")}
                className="h-8 w-full rounded-md border border-input bg-white px-2.5 text-body text-label shadow-[inset_0_1px_1px_rgba(0,0,0,0.04)] placeholder:text-label-3 focus:outline-none sm:w-72"
              />
              <button
                onClick={() => openModalHandle(modalStateEnum.CREATE)}
                className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-brand-600 px-3.5 text-body font-medium text-white shadow-mac-sm transition-colors hover:bg-brand-700 sm:w-auto"
              >
                <CirclePlus size={15} />
                <span>{t("Inventory_k26")}</span>
              </button>
              <button
                onClick={() => setTransferModalOpen(true)}
                className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-input bg-white px-3.5 text-body font-medium text-label shadow-mac-sm transition-colors hover:bg-surface sm:w-auto"
              >
                <CirclePlus size={15} />
                <span>{t("Inventory_k44")}</span>
              </button>
            </div>

            <div className="flex w-full items-center justify-start sm:w-auto">
              <div className="inline-flex items-center gap-0.5 rounded-lg bg-surface-2 p-0.5 text-body shadow-mac-inset">
                <button
                  onClick={handleActiveClick}
                  className={`flex h-7 items-center gap-1.5 rounded-md px-3 font-medium transition-colors ${
                    !getDataArchiveType ? "bg-white text-label shadow-mac-sm" : "text-label-2 hover:text-label"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t("Inventory_k5")}</span>
                </button>
                <button
                  onClick={handleArchiveClick}
                  className={`flex h-7 items-center gap-1.5 rounded-md px-3 font-medium transition-colors ${
                    getDataArchiveType ? "bg-white text-label shadow-mac-sm" : "text-label-2 hover:text-label"
                  }`}
                >
                  <Archive className="w-4 h-4" />
                  <span>{t("Inventory_k33")}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-5">
            <div className="overflow-hidden rounded-lg border border-border shadow-mac-sm">
              {/* Table for larger screens */}
              <div className="hidden md:block overflow-x-auto">
                <div className="min-h-[70dvh] max-h-[70dvh] overflow-y-auto">
                  <Table className="min-w-full">
                    <TableHeader className="sticky top-0 z-10 bg-surface/95 backdrop-blur">
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
                            } text-base text-[#6E6E73] font-normal p-2 truncate`}
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
                                        ? "text-brand-600"
                                        : "text-gray-400"
                                    } hover:text-label-2`}
                                  />
                                </button>
                              )}
                            </div>
                          </TableHead>
                        )
                      )}
                    </TableRow>
                  </TableHeader>

                    <TableBody className="bg-white">
                      {loading ? (
                        <TableRow className="flex h-[70dvh]">
                          <TableCell className="h-[70dvh] w-full flex flex-col justify-center items-center">
                            <Spinner size="xl" className="" />
                          </TableCell>
                        </TableRow>
                      ) : dataList.length === 0 ? (
                        <TableRow className="flex h-[70dvh]">
                          <TableCell className="h-[70dvh] w-full flex flex-col justify-center items-center">
                            <h1>{t("Inventory_k45")}</h1>
                          </TableCell>
                        </TableRow>
                      ) : (
                      paginatedData.map((elem: DataListInterface, index) => (
                        <TableRow
                          key={index}
                          className="flex items-center border-b border-b-[#E5E5EA] py-2 hover:bg-gray-100 transition-colors"
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
                                      text_color="text-[#166534]"
                                      bg_color="bg-[#F0F7F2]"
                                      border="border-[#B9DCC6]"
                                    />
                                    <Action_Button
                                      icon={<Archive size={16} />}
                                      onClick={() =>
                                        buttonClickActionHandle("Delete", elem)
                                      }
                                      label={
                                        getDataArchiveType
                                          ? t("Inventory_k30")
                                          : t("Inventory_k33")
                                      }
                                      text_color={
                                        getDataArchiveType
                                          ? "text-[#0EA542]"
                                          : "text-[#D70015]"
                                      }
                                      bg_color={
                                        getDataArchiveType
                                          ? "bg-[#E7FDEF]"
                                          : "bg-[#FFE8E5]"
                                      }
                                      border={
                                        getDataArchiveType
                                          ? "border-[#72F39E]"
                                          : "border-[#FFD2CC]"
                                      }
                                    />
                                    <Action_Button
                                      icon={<CirclePlus size={16} />}
                                      onClick={() =>
                                        buttonClickActionHandle("Assign", elem)
                                      }
                                      label={t("Inventory_k6")}
                                      text_color="text-[#0EA542]"
                                      bg_color="bg-[#E7FDEF]"
                                      border="border-[#72F39E]"
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
                                } text-base p-2 truncate`}
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
                    <Spinner size="xl" className="" />
                  </div>
                ) : dataList.length === 0 ? (
                  <div className="h-[70dvh] w-full flex flex-col justify-center items-center">
                    <h1>{t("Inventory_k45")}</h1>
                  </div>
                ) : (
                  <>
                    {paginatedData.map((elem: DataListInterface, index) => (
                      <div
                        key={index}
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-label-2">
                              {t("Inventory_k1")}:
                            </span>
                            <span className="text-sm truncate">
                              {elem?.categories?.category_name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-label-2">
                              {t("Inventory_k8")}:
                            </span>
                            <span className="text-sm truncate">
                              {elem.product_name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-label-2">
                              {t("Inventory_k18")}:
                            </span>
                            <span className="text-sm">
                              {elem.price}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-label-2">
                              {t("Inventory_k19")}:
                            </span>
                            <span className="text-sm">
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
                              text_color="text-[#166534]"
                              bg_color="bg-[#F0F7F2]"
                              border="border-[#B9DCC6]"
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
                                  ? "text-[#0EA542]"
                                  : "text-[#D70015]"
                              }
                              bg_color={
                                getDataArchiveType
                                  ? "bg-[#E7FDEF]"
                                  : "bg-[#FFE8E5]"
                              }
                              border={
                                getDataArchiveType
                                  ? "border-[#72F39E]"
                                  : "border-[#FFD2CC]"
                              }
                            />
                            <Action_Button
                              icon={<CirclePlus size={16} />}
                              onClick={() =>
                                buttonClickActionHandle("Assign", elem)
                              }
                              label="Assign"
                              text_color="text-[#0EA542]"
                              bg_color="bg-[#E7FDEF]"
                              border="border-[#72F39E]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <div className="text-footnote text-label-2">
                  {dataList.length === 0
                    ? `${t("Inventory_k27")} 0 ${t("Inventory_k29")} 0`
                    : `${t("Inventory_k27")} ${
                        (currentPage - 1) * itemsPerPage + 1
                      } ${t("Inventory_k28")} ${Math.min(
                        currentPage * itemsPerPage,
                        dataList.length
                      )} ${t("Inventory_k29")} ${dataList.length}`}
                </div>

                {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    {t("Inventory_k23") || "Previous"}
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    {t("Inventory_k22") || "Next"}
                  </button>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Custom_Modal
        open_handle={() => openModalHandle(modalStateEnum.CREATE)}
        Title={modalState === modalStateEnum.CREATE ? t("Inventory_k61") : modalState === modalStateEnum.UPDATE ? t("Inventory_k62") : `${modalState} Product`}
        loading={modalEventLoading}
        is_open={openModal}
        close_handle={closeModalHandle}
        create_new_handle={
          modalState === modalStateEnum.ASSIGN
            ? assignSubmitHandle
            : modalSubmitHandle
        }
        buttonLabel={modalState === modalStateEnum.CREATE ? t("Inventory_k47") : modalState === modalStateEnum.UPDATE ? t("Inventory_k17") : modalState}
        Trigger_Button={null}
        disabled={modalState === modalStateEnum.ASSIGN && !isAssignValid()}
      >
        {modalState === modalStateEnum.ASSIGN ? (
          <div className="w-full grid grid-cols-2 h-[300px] gap-4">
            <div className="col-span-2 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-label">
                  {t("Inventory_k65")}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="select-all-locations"
                    checked={
                      assignModalData.location_ids?.length === locations.length
                    }
                    onChange={handleSelectAll}
                    className="h-5 w-5 rounded border-2 border-gray-400 text-brand-600 focus:ring-brand-500 cursor-pointer ring-1 ring-gray-300"
                  />
                  <label
                    htmlFor="select-all-locations"
                    className="text-sm text-label"
                  >
                    {t("Inventory_k41")}
                  </label>
                </div>
              </div>
              <div className="max-h-[200px] overflow-y-auto border rounded-md">
                {locations.map((location: any) => (
                  <div
                    key={location.id}
                    className="p-2 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`location-${location.id}`}
                        checked={assignModalData.location_ids?.includes(
                          location.id
                        )}
                        onChange={() => handleLocationSelect(location.id)}
                        className="h-4 w-4 rounded border-2 border-gray-400 text-brand-600 focus:ring-brand-500 cursor-pointer ring-1 ring-gray-300"
                      />
                      <label
                        htmlFor={`location-${location.id}`}
                        className="text-sm text-label"
                      >
                        {location.title}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-sm text-label-2">
                {assignModalData.location_ids?.length || 0} {t("Inventory_k42")}
              </div>
            </div>
            <div className="col-span-2 space-y-4">
              <div>
                <Input_Component
                  type="number"
                  value={assignModalData.quantity?.toString() || ""}
                  onChange={handleQuantityChange}
                  border="border-[1px] border-gray-300 rounded-md"
                  label={t("Inventory_k66")}
                  bg_color="bg-[#F5F5F7]"
                />
              </div>
              <div className="space-y-2 p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between text-sm">
                  <span className="text-label-2">
                  {t("Inventory_k37")}
                  </span>
                  <span className="font-medium">
                    {modalData.unlimited ? "Unlimited" : "Limited"}
                  </span>
                </div>
                {!modalData.unlimited && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-label-2">
                      {t("Inventory_k38")}
                      </span>
                      <span className="font-medium">
                        {modalData.stock}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-label-2">
                      {t("Inventory_k39")}
                      </span>
                      <span
                        className={`font-medium ${
                          calculateTotalAssigned() > modalData.stock
                            ? "text-red-500"
                            : ""
                        }`}
                      >
                        {calculateTotalAssigned()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-label-2">
                      {t("Inventory_k40")}
                      </span>
                      <span
                        className={`font-medium ${
                          getRemainingStock() === 0
                            ? "text-red-500"
                            : ""
                        }`}
                      >
                        {getRemainingStock()}
                      </span>
                    </div>
                    {calculateTotalAssigned() > modalData.stock && (
                      <div className="text-sm text-red-500 mt-2">
                        {t("Inventory_k67")}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full grid grid-cols-2 gap-4">
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
                    label={t("Inventory_k32")}
                  />
                </div>
              ) : (
                <div key={index} className={colSpan || "col-span-2"}>
                  <Input_Component
                    type={type || "text"}
                    value={modalData[id]}
                    onChange={(e: string) => modalInputChangeHandle(id, e)}
                    border="border-[1px] border-gray-300 rounded-md"
                    label={id === "product_name" ? t("Inventory_k8") : id === "price" ? t("Inventory_k63") : id === "stock" ? t("Inventory_k53") : label}
                    bg_color="bg-[#F5F5F7]"
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
                  className="h-4 w-4 rounded border-2 border-gray-400 text-brand-600 focus:ring-brand-500 cursor-pointer ring-1 ring-gray-300"
                />
                <label
                  htmlFor="unlimited"
                  className="text-sm font-medium text-label"
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
                  className="h-4 w-4 rounded border-2 border-gray-400 text-brand-600 focus:ring-brand-500 cursor-pointer ring-1 ring-gray-300"
                />
                <label
                  htmlFor="bonus_eligible"
                  className="text-sm font-medium text-label"
                >
                  {t("Inventory_k64")}
                </label>
              </div>
            </div>
          </div>
        )}
      </Custom_Modal>

      {activeDeleteId ? (
        <div className="fixed bg-black/75 h-screen w-screen top-0  left-0 right-0 bottom-0 z-50">
          <div className="flex justify-center items-center w-full h-full">
            <div className="bg-white w-full max-w-xl px-4 py-3 rounded-lg">
              <h1 className="mb-5 text-title3 text-label">
              {t("Inventory_k10")}
              </h1>
              <p className="text-lg">
              {t("Inventory_k11")}{" "}
                {getDataArchiveType ? t("Inventory_k30") : t("Inventory_k14")} this product
              </p>
              <p className="text-sm">
              {t("Inventory_k35")}{" "}
                {getDataArchiveType ? t("Inventory_k30") : t("Inventory_k14")} {t("Inventory_k36")}
              </p>

              <div className="mt-4 flex items-center space-x-3 justify-end">
                <Button
                  disabled={deleteLoading}
                  onClick={() => setActiveDeleteId(0)}
                  color="gray"
                  className=""
                >
                  {t("Inventory_k13")}
                </Button>
                <Button
                  isProcessing={deleteLoading}
                  color={"failure"}
                  onClick={deleteHandle}
                  className=""
                >
                  {getDataArchiveType ? t("Inventory_k30") : t("Inventory_k33")}
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
