"use client";
import React, { FC, useContext, useEffect, useState } from "react";
import { Button, Spinner } from "flowbite-react";
import {
  delete_content_service,
  fetch_content_service,
  update_content_service,
} from "@/utils/supabase/data_services/data_services";
import { PiCaretUpDownBold } from "react-icons/pi";
import { toast } from "react-toastify";
import { LocationContext, TabContext } from "@/context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

interface DataListInterface {
  return_id: number;
  inventory_id: number;
  return_date: string;
  quantity: number;
  reason: string;
  sales_id: number;
  merge: boolean;
  inventory: {
    price: number;
    products: {
      product_name: string;
      categories: {
        category_name: string;
      };
    };
  };
  sales_history: {
    order_id: number;
    orders: {
      patient_id: number;
      pos: {
        firstname: string;
        lastname: string;
        phone: string;
        email: string;
        locationid: number;
      };
    };
  };
}

const detailsArray = (dataDetails: DataListInterface) => [
  {
    label: "Order ID",
    value: dataDetails?.sales_history?.order_id,
  },
  {
    label: "Return ID",
    value: dataDetails?.return_id,
  },
  {
    label: "Patient Name",
    value: `${dataDetails?.sales_history?.orders?.pos?.firstname} ${dataDetails?.sales_history?.orders?.pos?.lastname}`,
  },
  {
    label: "Patient ID",
    value: dataDetails?.sales_history?.orders.patient_id,
  },
  {
    label: "Amount",
    value: dataDetails.quantity * dataDetails.inventory.price,
  },
  {
    label: "Quantity",
    value: dataDetails.quantity,
  },
  {
    label: "Patient Email",
    value: dataDetails?.sales_history?.orders?.pos?.email,
    col_span_02: true,
  },
  {
    label: "Patient Phone",
    value: dataDetails?.sales_history?.orders?.pos?.phone,
  },
  {
    label: "Reason",
    value: dataDetails.reason,
  },
];

interface Props {}

const Returns: FC<Props> = () => {
  const [dataList, setDataList] = useState<DataListInterface[]>([]);
  const [allData, setAllData] = useState<DataListInterface[]>([]);
  const [dataDetails, setDataDetails] = useState<DataListInterface | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { selectedLocation } = useContext(LocationContext);
  const [sortOrder, setSortOrder] = useState(-1);
  const [sortColumn, setSortColumn] = useState("");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const handleCheckboxChange = (return_id: number, isChecked: boolean) => {
    if (isChecked) {
      setSelectedRows([...selectedRows, return_id]);
    } else {
      setSelectedRows(selectedRows.filter((id) => id !== return_id));
    }
  };

  const onChangeHandle = (e: any) => {
    const val = e.target.value;
    if (val === "") {
      setDataList([...allData]);
    } else {
      const filteredData = allData.filter((elem) => {
        const concatName = elem.inventory.products.product_name;
        return concatName.toLocaleLowerCase().includes(val.toLocaleLowerCase());
      });
      setDataList([...filteredData]);
    }
  };

  const detailsViewHandle = (param_data: DataListInterface) => {
    setDataDetails(param_data);
  };

  const fetch_handle = async (location_id: any) => {
    setLoading(true);
    const fetched_data: any = await fetch_content_service({
      table: "returns",
      selectParam: `,sales_history(order_id, orders(patient_id,  pos(firstname,lastname,phone,email,locationid ))),inventory(price, products(product_name, categories(category_name)))`,
      matchCase: [
        { key: "merge", value: false },
        { key: "sales_history.orders.pos.locationid", value: location_id },
      ],
      filterOptions: [
        { operator: "not", column: "sales_history.orders", value: null },
        { operator: "not", column: "sales_history.orders.pos", value: null },
        { operator: "not", column: "sales_history", value: null },
      ],
    });
    setDataList(fetched_data);
    setAllData(fetched_data);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedLocation) {
      fetch_handle(selectedLocation.id);
    }
  }, [selectedLocation]);

  const sortHandle = (
    column: "name" | "order_id" | "date" | "category" | "return_id" | "quantity"
  ) => {
    let sortedList: DataListInterface[] = [];

    if (column === "name") {
      sortedList = dataList.sort((a, b) => {
        const aConcatName = `${a.sales_history.orders.pos.firstname} ${a.sales_history.orders.pos.lastname}`;
        const bConcatName = `${b.sales_history.orders.pos.firstname} ${b.sales_history.orders.pos.lastname}`;
        return sortOrder === 1
          ? aConcatName.localeCompare(bConcatName)
          : bConcatName.localeCompare(aConcatName);
      });
    } else if (column === "order_id") {
      sortedList = dataList.sort((a, b) =>
        sortOrder === 1
          ? a.sales_history.order_id - b.sales_history.order_id
          : b.sales_history.order_id - a.sales_history.order_id
      );
    } else if (column === "date") {
      sortedList = dataList.sort((a, b) =>
        sortOrder === 1
          ? new Date(a.return_date).getTime() -
            new Date(b.return_date).getTime()
          : new Date(b.return_date).getTime() -
            new Date(a.return_date).getTime()
      );
    } else if (column === "category") {
      sortedList = dataList.sort((a, b) => {
        const aCategory = a.inventory.products.categories.category_name;
        const bCategory = b.inventory.products.categories.category_name;
        return sortOrder === 1
          ? aCategory.localeCompare(bCategory)
          : bCategory.localeCompare(aCategory);
      });
    } else if (column === "quantity") {
      sortedList = dataList.sort((a, b) =>
        sortOrder === 1 ? a.quantity - b.quantity : b.quantity - a.quantity
      );
    } else {
      sortedList = dataList.sort((a, b) =>
        sortOrder === 1 ? a.return_id - b.return_id : b.return_id - a.return_id
      );
    }

    setSortOrder((prevOrder) => (prevOrder === -1 ? 1 : -1));
    setDataList([...sortedList]);
    setSortColumn(column);
  };

  const discardHandle = async () => {
    setDeleteLoading(true);
    const { error } = await delete_content_service({
      table: "returns",
      keyByDelete: "return_id",
      id: dataDetails?.return_id!,
    });
    if (!error) {
      setDataList((elem) =>
        elem.filter((data: any) => data.return_id !== dataDetails?.return_id!)
      );
      setAllData((elem) =>
        elem.filter((data: any) => data.return_id !== dataDetails?.return_id!)
      );
      setDataDetails(null);
      toast.success("Return has been discarded");
    } else if (error) {
      console.log(error.message);
      toast.error(error.message);
    }
    setDeleteLoading(false);
  };

  const mergeHandle = async () => {
    try {
      const res_data = await update_content_service({
        table: "returns",
        language: "",
        post_data: { merge: true, return_id: dataDetails?.return_id! },
        matchKey: "return_id",
      });
      if (res_data?.length) {
        setDataList((elem) =>
          elem.filter((data: any) => data.return_id !== dataDetails?.return_id!)
        );
        setAllData((elem) =>
          elem.filter((data: any) => data.return_id !== dataDetails?.return_id!)
        );
        setDataDetails(null);
        toast.success("Merged successfully");
      }
    } catch (error: any) {
      if (error && error?.message) {
        toast.error(error?.message);
      } else {
        toast.error("Something went wrong!");
      }
    }
  };

  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k20");
  }, []);

  const { t } = useTranslation(translationConstant.POSRETURN);
  return (
    <main className="w-full h-full font-[500] bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="flex justify-between items-center px-4 py-4 space-x-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Returns
          </h1>
          <h1 className="mt-1 mb-2 text-gray-600 dark:text-gray-400">
            POS / Returns
          </h1>
        </div>
      </div>

      <div className="w-full min-h-[80.5dvh] h-[100%] py-1 px-4 grid grid-cols-3 gap-2">
        <div className="bg-gray-100 dark:bg-[#080e16] h-[100%] col-span-2 rounded-md">
          <div className="px-4 py-4">
            <input
              onChange={onChangeHandle}
              type="text"
              placeholder={t("POS-Returnk2")}
              className="px-4 py-3 w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            />
          </div>

          <div className="px-4 pb-4">
            <div className="bg-white dark:bg-gray-800 rounded-md shadow-sm flex flex-col h-[500px] rounded-b-lg">
              <div className="flex-1 overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <TableRow className="font-medium border-b border-gray-300 dark:border-gray-600">
                      <TableHead className="p-4 w-10">
                        <input
                          type="checkbox"
                          className="rounded bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500"
                        />
                      </TableHead>
                      <TableHead className="text-left text-gray-600 dark:text-gray-300">
                        {t("POS-Returnk3")}
                        <button
                          onClick={() => sortHandle("return_id")}
                          className="active:opacity-50 ml-1"
                        >
                          <PiCaretUpDownBold
                            className={`inline ${
                              sortColumn === "return_id"
                                ? "text-blue-500 dark:text-blue-400"
                                : "text-gray-500"
                            } hover:text-gray-700 dark:hover:text-gray-300 active:text-gray-400`}
                          />
                        </button>
                      </TableHead>
                      <TableHead className="text-left text-gray-600 dark:text-gray-300">
                        {t("POS-Returnk4")}
                        <button
                          onClick={() => sortHandle("order_id")}
                          className="active:opacity-50 ml-1"
                        >
                          <PiCaretUpDownBold
                            className={`inline ${
                              sortColumn === "order_id"
                                ? "text-blue-500 dark:text-blue-400"
                                : "text-gray-500"
                            } hover:text-gray-700 dark:hover:text-gray-300 active:text-gray-400`}
                          />
                        </button>
                      </TableHead>
                      <TableHead className="text-left text-gray-600 dark:text-gray-300">
                        {t("POS-Returnk5")}
                        <button
                          onClick={() => sortHandle("quantity")}
                          className="active:opacity-50 ml-1"
                        >
                          <PiCaretUpDownBold
                            className={`inline ${
                              sortColumn === "order_id"
                                ? "text-blue-500 dark:text-blue-400"
                                : "text-gray-500"
                            } hover:text-gray-700 dark:hover:text-gray-300 active:text-gray-400`}
                          />
                        </button>
                      </TableHead>
                      <TableHead className="text-left text-gray-600 dark:text-gray-300">
                        {t("POS-Returnk6")}
                        <button
                          onClick={() => sortHandle("date")}
                          className="active:opacity-50 ml-1"
                        >
                          <PiCaretUpDownBold
                            className={`inline ${
                              sortColumn === "date"
                                ? "text-blue-500 dark:text-blue-400"
                                : "text-gray-500"
                            } hover:text-gray-700 dark:hover:text-gray-300 active:text-gray-400`}
                          />
                        </button>
                      </TableHead>
                      <TableHead className="text-left text-gray-600 dark:text-gray-300">
                        {t("POS-Returnk7")}
                        <button
                          onClick={() => sortHandle("category")}
                          className="active:opacity-50 ml-1"
                        >
                          <PiCaretUpDownBold
                            className={`inline ${
                              sortColumn === "category"
                                ? "text-blue-500 dark:text-blue-400"
                                : "text-gray-500"
                            } hover:text-gray-700 dark:hover:text-gray-300 active:text-gray-400`}
                          />
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="bg-gray-50 dark:bg-gray-800"
                        >
                          <div className="flex h-full flex-1 flex-col justify-center items-center">
                            <Spinner size="xl" color="gray" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : dataList.length > 0 ? (
                      dataList.map((elem) => {
                        const {
                          return_id,
                          quantity,
                          sales_history: { order_id },
                          inventory: {
                            products: {
                              product_name,
                              categories: { category_name },
                            },
                          },
                        } = elem;
                        return (
                          <TableRow
                            key={return_id}
                            onClick={() => detailsViewHandle(elem)}
                            className="cursor-pointer border-b border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 bg-white dark:bg-gray-800"
                          >
                            <TableCell className="p-4">
                              <input
                                type="checkbox"
                                className="rounded border-2 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600"
                                checked={selectedRows.includes(return_id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleCheckboxChange(
                                    return_id,
                                    e.target.checked
                                  );
                                }}
                              />
                            </TableCell>
                            <TableCell className="p-4 text-gray-800 dark:text-gray-200">
                              {return_id}
                            </TableCell>
                            <TableCell className="p-4 text-gray-800 dark:text-gray-200">
                              {order_id}
                            </TableCell>
                            <TableCell className="p-4 text-gray-800 dark:text-gray-200">
                              {quantity}
                            </TableCell>
                            <TableCell className="p-4 text-gray-800 dark:text-gray-200">
                              {product_name}
                            </TableCell>
                            <TableCell className="p-4 text-gray-800 dark:text-gray-200">
                              {category_name}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="bg-gray-50 dark:bg-gray-800"
                        >
                          <div className="flex h-full flex-1 py-1 text-base flex-col justify-center items-center text-gray-500 dark:text-gray-400">
                            <h1>{t("POS-Returnk8")}</h1>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 flex justify-between items-center border-t border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedRows.length} of {dataList.length} row(s) selected.{" "}
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-base bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                    Previous
                  </button>
                  <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-[#080e16] h-full rounded-lg overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-300 dark:border-gray-600">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {t("POS-Returnk9")}
            </h1>
          </div>

          {dataDetails && (
            <div className="p-3 overflow-auto">
              <div className="grid grid-cols-2 gap-3">
                {detailsArray(dataDetails).map((detail, index) => (
                  <dl
                    className={`${
                      detail.col_span_02 ? "col-span-2" : ""
                    } bg-white dark:bg-gray-700 rounded-lg p-4`}
                    key={index}
                  >
                    <dt className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {detail.label}{" "}
                    </dt>
                    <dd className="text-base font-medium text-gray-800 dark:text-gray-200">
                      {detail.value}
                    </dd>
                  </dl>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  onClick={mergeHandle}
                  className="w-full px-4 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Merge
                </button>
                <button
                  onClick={discardHandle}
                  disabled={deleteLoading}
                  className="w-full px-4 py-3 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600"
                >
                  {deleteLoading ? "Processing..." : "Discard"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Returns;
