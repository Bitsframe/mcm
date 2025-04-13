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
  return_date: string; // ISO Date string format
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
    // @ts-ignore
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
    // const filteredData = fetched_data.filter((elem: any) => elem.saleshistory.orders.pos !== null)
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
        // throw new Error(error.message);
      } else {
        toast.error("Something went wrong!");
      }
    }
  };

  // const select_location_handle = (val: React.ChangeEvent<HTMLSelectElement>) => {
  //     const value = val.target.value

  //     set_location_handle(value)
  // }

  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k20");
  }, []);

  const { t } = useTranslation(translationConstant.POSRETURN);
  return (
    <main className="w-full  h-full font-[500]">
      <div className="flex justify-between items-center px-4 py-4 space-x-2">
        <div>
          <h1 className="text-2xl font-bold">Returns</h1>
          <h1 className="mt-1 mb-2 text-gray-500">POS / Returns</h1>
        </div>

        {/* <div >
                    <Select onChange={select_location_handle} defaultValue={selected_location} style={{ backgroundColor: '#D9D9D9' }} id="locations" required>
                        {locations.map((location: any, index: any) => <option key={index} value={location.id}>{location.title}</option>)}
                    </Select>

                </div> */}
      </div>

      <div className="w-full min-h-[80.5dvh] h-[100%] py-1 px-4 grid grid-cols-3 gap-2">
        <div className="bg-[#F1F4F9] h-[100%] col-span-2 rounded-md">
          <div className="px-4 py-4">
            <input
              onChange={onChangeHandle}
              type="text"
              placeholder={t("POS-Returnk2")}
              className="px-4 py-3 w-full text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>

          <div className="px-4 pb-4">
            <div className="bg-white rounded-md shadow-sm flex flex-col h-[500px] rounded-b-lg">
              <div className="flex-1 overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow className="font-medium border-b">
                      <TableHead className="p-4 w-10">
                        <input type="checkbox" className="rounded" />
                      </TableHead>
                      <TableHead className="text-left text-gray-600">
                        {t("POS-Returnk3")}
                        <button
                          onClick={() => sortHandle("return_id")}
                          className="active:opacity-50 ml-1"
                        >
                          <PiCaretUpDownBold
                            className={`inline ${
                              sortColumn === "return_id"
                                ? "text-green-600"
                                : "text-gray-400/50"
                            } hover:text-gray-600 active:text-gray-500`}
                          />
                        </button>
                      </TableHead>
                      <TableHead className="text-left text-gray-600">
                        {t("POS-Returnk4")}
                        <button
                          onClick={() => sortHandle("order_id")}
                          className="active:opacity-50 ml-1"
                        >
                          <PiCaretUpDownBold
                            className={`inline ${
                              sortColumn === "order_id"
                                ? "text-green-600"
                                : "text-gray-400/50"
                            } hover:text-gray-600 active:text-gray-500`}
                          />
                        </button>
                      </TableHead>
                      <TableHead className="text-left text-gray-600">
                        {t("POS-Returnk5")}
                        <button
                          onClick={() => sortHandle("quantity")}
                          className="active:opacity-50 ml-1"
                        >
                          <PiCaretUpDownBold
                            className={`inline ${
                              sortColumn === "order_id"
                                ? "text-green-600"
                                : "text-gray-400/50"
                            } hover:text-gray-600 active:text-gray-500`}
                          />
                        </button>
                      </TableHead>
                      <TableHead className="text-left text-gray-600">
                        {t("POS-Returnk6")}
                        <button
                          onClick={() => sortHandle("date")}
                          className="active:opacity-50 ml-1"
                        >
                          <PiCaretUpDownBold
                            className={`inline ${
                              sortColumn === "date"
                                ? "text-green-600"
                                : "text-gray-400/50"
                            } hover:text-gray-600 active:text-gray-500`}
                          />
                        </button>
                      </TableHead>
                      <TableHead className="text-left text-gray-600">
                        {t("POS-Returnk7")}
                        <button
                          onClick={() => sortHandle("category")}
                          className="active:opacity-50 ml-1"
                        >
                          <PiCaretUpDownBold
                            className={`inline ${
                              sortColumn === "category"
                                ? "text-green-600"
                                : "text-gray-400/50"
                            } hover:text-gray-600 active:text-gray-500`}
                          />
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="flex h-full flex-1 flex-col justify-center items-center">
                            <Spinner size="xl" />
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
                            className="cursor-pointer border-b hover:bg-gray-50"
                          >
                            <TableCell className="p-4">
                              <input
                                type="checkbox"
                                className="rounded"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                            <TableCell className="p-4">{return_id}</TableCell>
                            <TableCell className="p-4">{order_id}</TableCell>
                            <TableCell className="p-4">{quantity}</TableCell>
                            <TableCell className="p-4">
                              {product_name}
                            </TableCell>
                            <TableCell className="p-4">
                              {category_name}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="flex h-full flex-1 py-1 text-base flex-col justify-center items-center">
                            <h1>{t("POS-Returnk8")}</h1>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 flex justify-between items-center border-t">
                <div className="text-sm text-gray-600">
                  0 of {dataList.length} row(s) selected.
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 border rounded-md text-base bg-white hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="px-4 py-2 border rounded-md bg-white text-base hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#F1F4F9] h-full rounded-lg overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100">
            <h1 className="text-xl font-semibold text-gray-800">
              {t("POS-Returnk9")}
            </h1>
          </div>

          {dataDetails && (
            <div className="p-3 overflow-auto">
              <div className="grid grid-cols-2  gap-3">
                {detailsArray(dataDetails).map((detail, index) => (
                  <dl
                    className={`${
                      detail.col_span_02 ? "col-span-2" : ""
                    } bg-white rounded-lg p-4`}
                    key={index}
                  >
                    <dt className="text-sm text-gray-500 mb-1">
                      {detail.label}{" "}
                    </dt>
                    <dd className="text-base font-medium text-gray-900">
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
                  className="w-full px-4 py-3 text-gray-700 bg-white rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Discard
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
