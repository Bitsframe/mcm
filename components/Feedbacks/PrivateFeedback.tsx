"use client";
import React, {
  FC,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useContext,
} from "react";
import { Spinner } from "flowbite-react";
import moment from "moment";
import { fetch_content_service } from "@/utils/supabase/data_services/data_services";
import { PiCaretUpDownBold } from "react-icons/pi";
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
import { TabContext } from "@/context";

interface DataListInterface {
  feedback_id: number;
  order_id: number;
  pos: {
    firstname: string;
    lastname: string;
  };
  feedback_text: string;
  rating: number;
  created_at: string;
}

const detailsArray = (dataDetails: DataListInterface) => [
  { label: "Order ID", value: dataDetails?.order_id },
  {
    label: "Patient Name",
    value: `${dataDetails?.pos.firstname} ${dataDetails?.pos.lastname}`,
  },
  {
    label: "Feedback Date",
    value: moment(dataDetails?.created_at).format("MMM DD, YYYY"),
  },
  { label: "Rating", value: `${dataDetails?.rating}/5` },
  { label: "Feedback", value: dataDetails?.feedback_text },
];

const PrivateFeedbackComponent: FC = () => {
  const [dataList, setDataList] = useState<DataListInterface[]>([]);
  const [allData, setAllData] = useState<DataListInterface[]>([]);
  const [dataDetails, setDataDetails] = useState<DataListInterface | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState(-1);
  const [sortColumn, setSortColumn] = useState("");

  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k9");
  }, []);

  const onChangeHandle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.toLowerCase();
      setDataList(
        val === ""
          ? [...allData]
          : allData.filter(({ pos: { firstname, lastname } }) =>
              `${firstname} ${lastname}`.toLowerCase().includes(val)
            )
      );
    },
    [allData]
  );

  const fetch_handle = useCallback(async () => {
    setLoading(true);
    const fetched_data: any = await fetch_content_service({
      table: "feedback",
      selectParam: ", pos(firstname,lastname)",
    });
    setDataList(fetched_data);
    setAllData(fetched_data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch_handle();
  }, [fetch_handle]);

  const sortHandle = useCallback(
    (column: "name" | "order_id" | "date" | "rating") => {
      const sortedList = [...dataList].sort((a, b) => {
        if (column === "name") {
          const aName = `${a.pos.firstname} ${a.pos.lastname}`;
          const bName = `${b.pos.firstname} ${b.pos.lastname}`;
          return sortOrder === 1
            ? aName.localeCompare(bName)
            : bName.localeCompare(aName);
        }
        if (column === "date") {
          return sortOrder === 1
            ? new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime();
        }
        return sortOrder === 1 ? a[column] - b[column] : b[column] - a[column];
      });
      setDataList(sortedList);
      setSortOrder((order) => (order === -1 ? 1 : -1));
      setSortColumn(column);
    },
    [dataList, sortOrder]
  );

  const sortIcon = useCallback(
    (column: string) => (
      <PiCaretUpDownBold
        className={`inline ${
          sortColumn === column
            ? "text-blue-500 dark:text-blue-400"
            : "text-gray-500 dark:text-gray-400"
        } hover:text-gray-700 dark:hover:text-gray-300`}
      />
    ),
    [sortColumn]
  );

  const details = useMemo(
    () =>
      dataDetails && (
        <div className="overflow-auto px-4 py-4 grid grid-cols-2 gap-4">
          {detailsArray(dataDetails).map((detail, index) => (
            <div
              key={index}
              className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <dt className="text-sm text-[#707070] dark:text-gray-400">
                {detail.label}
              </dt>
              <dd className="text-[17px] text-gray-800 dark:text-gray-200 font-medium">
                {detail.value}
              </dd>
            </div>
          ))}
        </div>
      ),
    [dataDetails]
  );
  

  const { t } = useTranslation(translationConstant.PRIVATEFEEDBACK);

  return (
    <main className="w-full h-full font-[500] text-[20px] p-3 bg-white dark:bg-gray-900">
      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          Private Feedback
        </h1>
        <h1 className="mt-1 mb-2 text-gray-500 text-base dark:text-gray-400">
          Reputation / Private Feedback
        </h1>
      </div>

      <div className="w-full max-h-[69dvh] h-full py-2 grid grid-cols-3 gap-2">
        <div className="bg-[#F1F4F7] dark:bg-[#080e16] h-full col-span-2 rounded-md py-2">
          <div className="space-y-6 px-3 pb-4 flex justify-between">
            <input
              onChange={onChangeHandle}
              type="text"
              placeholder={t("Privatefeedback_k1")}
              className="px-2 py-3 w-72 text-sm rounded-md focus:outline-none mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
            />
          </div>

          <div className="px-3 pt-5">
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                <TableRow className="font-medium border-b border-gray-300 dark:border-gray-600">
                  <TableHead className="text-left text-gray-600 dark:text-gray-300">
                    {t("Privatefeedback_k1")}
                    <button
                      onClick={() => sortHandle("name")}
                      className="ml-1 active:opacity-50"
                    >
                      {sortIcon("name")}
                    </button>
                  </TableHead>
                  <TableHead className="text-center text-gray-600 dark:text-gray-300">
                    {t("Privatefeedback_k2")}
                    <button
                      onClick={() => sortHandle("order_id")}
                      className="ml-1 active:opacity-50"
                    >
                      {sortIcon("order_id")}
                    </button>
                  </TableHead>
                  <TableHead className="text-center text-gray-600 dark:text-gray-300">
                    {t("Privatefeedback_k3")}
                    <button
                      onClick={() => sortHandle("date")}
                      className="ml-1 active:opacity-50"
                    >
                      {sortIcon("date")}
                    </button>
                  </TableHead>
                  <TableHead className="text-end text-gray-600 dark:text-gray-300">
                    {t("Privatefeedback_k4")}
                    <button
                      onClick={() => sortHandle("rating")}
                      className="ml-1 active:opacity-50"
                    >
                      {sortIcon("rating")}
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="overflow-y-scroll max-h-80">
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="bg-white dark:bg-gray-900"
                    >
                      <div className="flex h-full flex-1 flex-col justify-center items-center">
                        <Spinner size="xl" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : dataList.length > 0 ? (
                  dataList.map((elem) => {
                    const {
                      order_id,
                      pos: { firstname, lastname },
                      rating,
                      created_at,
                      feedback_id,
                    } = elem;
                    return (
                      <TableRow
                        key={feedback_id}
                        onClick={() => setDataDetails(elem)}
                        className="cursor-pointer rounded-md px-3 py-2 text-base hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-inherit"
                      >
                        <TableCell className="text-start text-gray-800 dark:text-gray-200">
                          {firstname} {lastname}
                        </TableCell>
                        <TableCell className="text-center text-gray-800 dark:text-gray-200">
                          {order_id}
                        </TableCell>
                        <TableCell className="text-center text-gray-800 dark:text-gray-200">
                          {moment(created_at).format("MMM DD, YYYY")}
                        </TableCell>
                        <TableCell className="text-end pr-4 text-gray-800 dark:text-gray-200">
                          {rating}/5
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="bg-white dark:bg-gray-900"
                    >
                      <div className="flex h-full flex-1 py-2 text-base justify-center items-center text-gray-500 dark:text-gray-400">
                        <h1>{t("Privatefeedback_k5")}</h1>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="bg-[#F1f4f7] dark:bg-[#080e16] rounded-md overflow-hidden flex flex-col">
          <div className="px-4 py-4 border-b-[1px] border-gray-300 dark:border-gray-700">
            <h1 className="text-2xl font-bold w-full text-gray-800 dark:text-gray-200">
              {t("Privatefeedback_k6")}
            </h1>
          </div>

          {dataDetails ? (
            details
          ) : (
            <div className="h-full flex items-center justify-center text-xl font-semibold text-gray-500 dark:text-gray-400">
              <h1>{t("Privatefeedback_k7")}</h1>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default PrivateFeedbackComponent;
