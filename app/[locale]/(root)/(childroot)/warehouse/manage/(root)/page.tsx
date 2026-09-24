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
import { Archive, MapPin, PlusCircle, ShieldCheck } from "lucide-react";
import { InventoryView } from "@/components/Inventory/InventoryView";
import { useLocationClinica } from "@/hooks/useLocationClinica";
import { translationConstant } from "@/utils/translationConstants";

import { LocationPicker } from "@/components/ui/location-picker";

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
      t,
    }: {
      val?: string;
      onClickHandle?: () => void;
      isLoading?: boolean;
      getDataArchiveType: boolean;
      t: (key: string) => string;
    }) => {
      return (
        <div className="space-x-4 flex justify-end">
          <Action_Button
            isLoading={isLoading}
            onClick={onClickHandle}
            label={getDataArchiveType ? t("Inventory_k30") : t("Inventory_k14")}
            bg_color={getDataArchiveType ? "bg-[#E7FDEF]" : "bg-[#FFE8E5]"}
            text_color={
              getDataArchiveType ? "text-[#0EA542]" : "text-[#D70015]"
            }
            border={
              getDataArchiveType ? "border-[#81F5A9]" : "border-[#D70015]"
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
  // "" = the warehouse catalogue; a location id = that location's stock (the
  // Inventory view), so any location can be inspected without leaving the page.
  const [viewLocationId, setViewLocationId] = useState<string>("");
  const { locations: posLocations } = useLocationClinica();
  const viewLocation = posLocations.find((l: any) => String(l.id) === viewLocationId);
  const [page, setPage] = useState(1);
  const { t } = useTranslation(translationConstant.INVENTORY);
  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(dataList.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, dataList.length);
  const currentPageData = dataList.slice(startIndex, endIndex);
  // Patch: inject t into tableHeader Render_Value
  tableHeader.forEach((header) => {
    if (header.Render_Value) {
      const original = header.Render_Value;
      header.Render_Value = (props: any) => original({ ...props, t });
    }
  });

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
      <div className="inline-flex items-center gap-0.5 rounded-lg bg-surface-2 p-0.5 text-body shadow-mac-inset">
        <button
          onClick={handleActiveClick}
          className={`flex h-7 items-center gap-1.5 rounded-md px-3 font-medium transition-colors ${
            !getDataArchiveType ? "bg-white text-label shadow-mac-sm" : "text-label-2 hover:text-label"
          }`}
        >
          <ShieldCheck size={14} />
          <span>{t("Inventory_k5")}</span>
        </button>
        <button
          onClick={handleArchiveClick}
          className={`flex h-7 items-center gap-1.5 rounded-md px-3 font-medium transition-colors ${
            getDataArchiveType ? "bg-white text-label shadow-mac-sm" : "text-label-2 hover:text-label"
          }`}
        >
          <Archive size={14} />
          <span>{t("Inventory_k33")}</span>
        </button>
      </div>
    ),
    [getDataArchiveType, handleActiveClick, handleArchiveClick, t]
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
  }, [setActiveTitle]);

  return (
    <main className="w-full text-body">
      <div className="w-full h-full overflow-auto">
          <div className="flex items-center justify-end gap-2 pb-3">
            <MapPin size={15} className="text-label-3" />
            <label htmlFor="warehouse-view-location" className="text-footnote text-label-2">
              {t("Inventory_kViewStockAt")}
            </label>
            <LocationPicker
              id="warehouse-view-location"
              locations={posLocations}
              value={viewLocationId}
              onChange={setViewLocationId}
              allLabel={t("Inventory_kWarehouseAll")}
              searchPlaceholder={t("Inventory_kSearchLocations")}
            />
          </div>
        <div className="h-full rounded-md pt-2">
          {viewLocation ? (
            <InventoryView location={viewLocation} />
          ) : (
          <>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 w-full sm:w-auto">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full justify-between gap-x-3">
                <div className="relative w-full sm:w-72">
                  <input
                    onChange={onChangeHandle}
                    type="text"
                    placeholder={t("Inventory_k4")}
                    className="block px-3 py-[10px] w-full text-sm rounded-md focus:outline-none bg-[#F5F5F7] border-2 border-gray-300 focus:border-brand-600 text-label"
                  />
                </div>
                <button
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-brand-600 px-3.5 text-body font-medium text-white shadow-mac-sm transition-colors hover:bg-brand-700 w-full sm:w-auto"
                  onClick={() => openModalHandle(modalStateEnum.CREATE)}
                >
                  <PlusCircle size={15} />
                  {t("Inventory_k25")}
                </button>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {RightSideComponent}
            </div>
          </div>

          <div className="pt-4">
            <div className="overflow-hidden rounded-lg border border-border shadow-mac-sm">
              <div className="hidden md:block overflow-x-auto">
                <div className="min-h-[70dvh] max-h-[70dvh] overflow-y-auto">
                  <Table className="min-w-full">
                    <TableHeader className="sticky top-0 z-10 bg-surface/95 backdrop-blur">
                      <TableRow className="flex hover:bg-transparent">
                        <TableHead className="w-12 p-3"></TableHead>
                        {tableHeader.map(({ label, align }, index) => (
                          <TableHead
                            key={index}
                            className={`flex-1 ${
                              align || "text-start"
                            } p-3`}
                          >
                            {t(label)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {loading ? (
                        <TableRow className="flex h-[45dvh]">
                          <TableCell
                            colSpan={tableHeader.length + 1}
                            className="w-full flex items-center justify-center bg-white"
                          >
                            <Spinner size="xl" />
                          </TableCell>
                        </TableRow>
                      ) : dataList.length === 0 ? (
                        <TableRow className="flex h-[45dvh]">
                          <TableCell
                            colSpan={tableHeader.length + 1}
                            className="w-full flex items-center justify-center bg-white"
                          >
                            <h1 className="text-label">
                              {t("Inventory_k48")}
                            </h1>
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentPageData.map((elem, index) => (
                          <TableRow
                            key={index}
                            className="flex items-center hover:bg-gray-100 border-b border-b-gray-200 px-3 py-4"
                          >
                            <TableCell className="w-12 p-0"></TableCell>
                            {tableHeader.map(
                              ({ id, Render_Value, align }, ind) => {
                                const content = Render_Value ? (
                                  <Render_Value
                                    getDataArchiveType={getDataArchiveType}
                                    isLoading={deleteLoading}
                                    onClickHandle={() =>
                                      onClickHandle(elem.category_id)
                                    }
                                    t={t}
                                  />
                                ) : (
                                  <span className="text-label">
                                    {elem[id]}
                                  </span>
                                );

                                return (
                                  <TableCell
                                    key={ind}
                                    className={`flex-1 ${
                                      align || "text-start"
                                    } text-base p-0 text-label`}
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
                  <div className="h-[70dvh] w-full flex items-center justify-center bg-white">
                    <Spinner size="xl" />
                  </div>
                ) : dataList.length === 0 ? (
                  <div className="h-[70dvh] w-full flex items-center justify-center bg-white">
                    <h1 className="text-label">
                      {t("Inventory_k48")}
                    </h1>
                  </div>
                ) : (
                  <>
                    {currentPageData.map((elem, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-300 rounded-md p-4 shadow-sm"
                      >
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-label">
                              {t("Inventory_k7")}
                            </span>
                            <span className="text-sm text-label">
                              {elem.category_id}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-label">
                              {t("Inventory_k8")}
                            </span>
                            <span className="text-sm text-label">
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
              <div className="flex flex-row items-center justify-between gap-2 p-4 border-t border-t-gray-300">
                <div className="text-sm text-label-2 whitespace-nowrap">
                  {dataList.length === 0
                    ? `${t("Inventory_k27")} 0 ${t("Inventory_k29")} 0`
                    : `${t("Inventory_k27")} ${startIndex + 1} ${t(
                        "Inventory_k28"
                      )} ${endIndex} ${t("Inventory_k29")} ${dataList.length}`}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded-md text-sm text-label bg-white hover:bg-gray-100"
                  >
                    {t("Inventory_k23") || "Previous"}
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border rounded-md text-sm text-label bg-white hover:bg-gray-100"
                  >
                    {t("Inventory_k22") || "Next"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      </div>

      <Custom_Modal
        open_handle={() => openModalHandle(modalStateEnum.CREATE)}
        Title={t("Inventory_k46")}
        loading={modalEventLoading}
        is_open={openModal}
        close_handle={closeModalHandle}
        create_new_handle={createNewHandle}
        buttonLabel={t("Inventory_k47")}
        Trigger_Button={null}
      >
        <Input_Component
          value={modalData["category_name"]}
          onChange={(e) => modalInputChangeHandle("category_name", e)}
          py="py-3"
          label={t("Inventory_k32")}
          darkMode={true}
          bg_color="bg-[#F5F5F7]"
        />
      </Custom_Modal>

      {activeDeleteId ? (
        <div className="fixed bg-black/90 h-screen w-screen top-0 left-0 right-0 bottom-0 z-50">
        <div className="flex justify-center items-center w-full h-full">
          <div className="bg-white w-full max-w-xl px-4 py-3 rounded-lg">
            <h1 className="mb-5 text-title3 text-label">
              {t("Inventory_k10")}
            </h1>
      
            <p className="text-lg text-black">
              {t("Inventory_k11").replace(
                "Archive",
                t(getDataArchiveType ? "Inventory_k30" : "Inventory_k14")
              ).trim()}
            </p>
      
            <p className="text-sm text-label">
              {t("Inventory_k12").replace(
                "Archive",
                t(getDataArchiveType ? "Inventory_k30" : "Inventory_k14")
              ).trim()}
            </p>
      
            <div className="mt-4 flex items-center space-x-3 justify-end">
              <Button
                disabled={deleteLoading}
                onClick={() => setActiveDeleteId(0)}
                color="gray"
                className="bg-white text-black"
              >
                {t("Inventory_k13")}
              </Button>
              <Button
                isProcessing={deleteLoading}
                color="failure"
                onClick={deleteHandle}
                className="bg-red-700 hover:bg-red-800"
              >
                {t(getDataArchiveType ? "Inventory_k30" : "Inventory_k14")}
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
