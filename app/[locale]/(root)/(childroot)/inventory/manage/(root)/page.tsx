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
import { translationConstant } from "@/utils/translationConstants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TabContext } from "@/context";
interface DataListInterface {
  [key: string]: any; // This allows dynamic property access
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
        <div className="space-x-4">
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
          />
          {/* <Action_Button  isLoading={isLoading} onClick={onClickHandle} label={'Delete'} bg_color={'bg-red-700'} /> */}
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

  const openModalHandle = (state: string) => {
    setOpenModal(true);
    setModalState(state);
  };
  const closeModalHandle = () => {
    setOpenModal(false);
    setModalState(modalStateEnum.EMPTY);
    setModalData({});
  };

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
      <div className="text-sm text-gray-500 bg-[#F1F4F9] p-1 space-x-4 mr-6 flex items-center justify-end w-full">
        <button
          onClick={handleActiveClick}
          className={`${
            !getDataArchiveType
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600"
          } px-4 py-2 rounded-lg flex items-center space-x-1`}
        >
          <span>Active</span>
        </button>
        <button
          onClick={handleArchiveClick}
          className={`${
            getDataArchiveType
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600"
          } px-4 py-2 rounded-lg flex items-center space-x-1`}
        >
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
      // throw new Error(error.message);
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

  // const select_location_handle = (val: React.ChangeEvent<HTMLSelectElement>) => {
  //   const value = val.target.value

  //   set_location_handle(value)
  // }

  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k11");
  }, []);

  const { t } = useTranslation(translationConstant.INVENTORY);
  return (
    <main className="w-full h-full font-medium text-base">
      <div className="w-full min-h-[81.5dvh] h-full overflow-auto py-2 px-2">
        <div className="h-full rounded-md py-2">
          <div className="px-3 flex justify-between w-full">
            <div className="space-y-1">
              <div className="flex items-center w-full justify-between gap-x-3">
                <div className="relative w-72">
                  <input
                    onChange={onChangeHandle}
                    type="text"
                    placeholder={t("Inventory_k4")}
                    className="block px-3 py-2 w-72 text-sm rounded-md focus:outline-none bg-white border border-gray-200"
                  />
                </div>
                <button
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Create Category
                </button>
              </div>
            </div>

            <div className="flex gap-2">{RightSideComponent}</div>
          </div>

          <div className="px-3 pt-5">
            <div className="border rounded-md">
              <Table>
                <TableHeader className="bg-gray-50 border-b border-b-[#E4E4E7]">
                  <TableRow className="flex hover:bg-transparent">
                    <TableHead className="w-12 p-3">
                      <Checkbox />
                    </TableHead>
                    {tableHeader.map(({ label, align }, index) => (
                      <TableHead
                        key={index}
                        className={`flex-1 ${
                          align || "text-start"
                        } text-base text-[#71717A] font-normal p-3`}
                      >
                        {t(label)}{" "}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody className="mb-4 h-[60dvh] overflow-y-auto block">
                  {loading ? (
                    <TableRow className="flex h-full">
                      <TableCell className="h-[60dvh] w-full flex items-center justify-center">
                        <Spinner size="xl" />
                      </TableCell>
                    </TableRow>
                  ) : dataList.length === 0 ? (
                    <TableRow className="flex h-full">
                      <TableCell className="h-[60dvh] w-full flex flex-col justify-center items-center">
                        <h1>No Category is available</h1>
                      </TableCell>
                    </TableRow>
                  ) : (
                    dataList.map((elem, index) => (
                      <TableRow
                        key={index}
                        className="flex items-center hover:bg-gray-100 border-b border-b-[#E4E4E7] px-3 py-4"
                      >
                        <TableCell className="w-12 p-0">
                          <Checkbox />
                        </TableCell>
                        {tableHeader.map(({ id, Render_Value, align }, ind) => {
                          const content = Render_Value ? (
                            <Render_Value
                              getDataArchiveType={getDataArchiveType}
                              isLoading={deleteLoading}
                              onClickHandle={() =>
                                onClickHandle(elem.category_id)
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
                              } text-base p-0`}
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

              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-gray-500">
                  0 of {dataList.length} row(s) selected.
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50">
                    Previous
                  </button>
                  <button className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* @ts-ignore */}
      <Custom_Modal
        open_handle={() => openModalHandle(modalStateEnum.CREATE)}
        Title={`${modalState} Category`}
        loading={modalEventLoading}
        is_open={openModal}
        close_handle={closeModalHandle}
        create_new_handle={createNewHandle}
        buttonLabel={modalState}
        //@ts-ignore
        Trigger_Button={null}
      >
        <Input_Component
          value={modalData["category_name"]}
          onChange={(e) => modalInputChangeHandle("category_name", e)}
          py="py-3"
          border="border-[1px] border-gray-300 rounded-md"
          label="Category"
        />
      </Custom_Modal>

      {activeDeleteId ? (
        <div className="fixed bg-black/75 h-screen w-screen top-0 left-0 right-0 bottom-0 z-20">
          <div className="flex justify-center items-center w-full h-full">
            <div className="bg-white w-full max-w-xl px-4 py-3 rounded-lg">
              <h1 className="font-bold text-xl text-black mb-5">
                Confirmation
              </h1>
              <p className="text-lg">
                Do you really want to{" "}
                {getDataArchiveType ? "Unarchive" : "Archive"} this category
              </p>
              <p className="text-sm">
                Remember All of the associated products will also be{" "}
                {getDataArchiveType ? "Unarchive" : "Archive"} with the category
              </p>

              <div className="mt-4 flex items-center space-x-3 justify-end">
                <Button
                  disabled={deleteLoading}
                  onClick={() => setActiveDeleteId(0)}
                  color="gray"
                >
                  Cancel
                </Button>
                <Button
                  isProcessing={deleteLoading}
                  color={"failure"}
                  onClick={deleteHandle}
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
