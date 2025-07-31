"use client";
import type React from "react";
import {
  type FC,
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
  { label: "Privatefeedback_k2", value: dataDetails?.order_id },
  {
    label: "Privatefeedback_k1",
    value: `${dataDetails?.pos.firstname} ${dataDetails?.pos.lastname}`,
  },
  {
    label: "Privatefeedback_k3",
    value: moment(dataDetails?.created_at).format("MMM DD, YYYY"),
  },
  { label: "Privatefeedback_k4", value: `${dataDetails?.rating}/5` },
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
  const [currentPage, setCurrentPage] = useState(0);
  const cardsPerPage = 2;

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
    try {
      const fetched_data: any = await fetch_content_service({
        table: "feedback",
        selectParam: ", pos(firstname,lastname)",
      });
      setDataList(fetched_data || []);
      setAllData(fetched_data || []);
    } catch (error) {
      console.error("Error fetching feedback data:", error);
      setDataList([]);
      setAllData([]);
    } finally {
      setLoading(false);
    }
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
      const { t } = useTranslation(translationConstant.PRIVATEFEEDBACK);
      
  const details = useMemo(
    () =>
      dataDetails && (
        <div className="px-2 py-2 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          {detailsArray(dataDetails).map((detail, index) => (
            <div
              key={index}
              className="rounded-xl bg-white dark:bg-[#0E1725] p-4 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <dt className="text-sm text-[#707070] dark:text-gray-400">
                {t(detail.label)}
              </dt>
              <dd className="text-[17px] text-gray-800 dark:text-gray-200 font-medium break-words">
                {detail.value}
              </dd>
            </div>
          ))}
        </div>
      ),
    [dataDetails]
  );


  useEffect(() => {
    setCurrentPage(0);
  }, [dataList]);

  return (
    <main className="w-full h-full font-[500] text-[20px] p-3 bg-white dark:bg-[#0E1725] overflow-y-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          {t("Privatefeedback_k8")}
        </h1>
      </div>

      <div className="w-full py-2 grid grid-cols-1 md:grid-cols-5 gap-2">
        <div className="bg-[#F1F4F7] dark:bg-[#080e16] md:col-span-3 rounded-md py-2 w-full">
          <div className="space-y-6 px-3 pb-4 flex flex-col sm:flex-row sm:justify-between">
            <input
              onChange={onChangeHandle}
              type="text"
              placeholder={t("Privatefeedback_k1")}
              className="px-2 py-3 w-full sm:w-72 text-sm rounded-md focus:outline-none mt-2 bg-white dark:bg-[#0E1725] border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
            />
          </div>

          {/* Mobile View - Cards with Pagination */}
          <div className="md:hidden px-3 pt-5">
            <div className="space-y-3 mb-4">
              {loading ? (
                <div className="flex h-40 flex-1 flex-col justify-center items-center">
                  <Spinner size="xl" />
                </div>
              ) : dataList.length > 0 ? (
                dataList
                  .slice(
                    currentPage * cardsPerPage,
                    (currentPage + 1) * cardsPerPage
                  )
                  .map((elem) => {
                    const {
                      order_id,
                      pos: { firstname, lastname },
                      rating,
                      created_at,
                      feedback_id,
                    } = elem;
                    return (
                      <div
                        key={feedback_id}
                        onClick={() => setDataDetails(elem)}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-gray-800 dark:text-gray-200">
                            {firstname} {lastname}
                          </h3>
                          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded">
                            {rating}/5
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          <div className="flex justify-between">
                            <span>{t("Privatefeedback_k2")}:</span>
                            <span className="text-gray-800 dark:text-gray-200">
                              {order_id}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("Privatefeedback_k3")}:</span>
                            <span className="text-gray-800 dark:text-gray-200">
                              {moment(created_at).format("MMM DD, YYYY")}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="flex h-40 flex-1 py-2 text-base justify-center items-center text-gray-500 dark:text-gray-400">
                  <h1>{t("Privatefeedback_k9")}</h1>
                </div>
              )}
            </div>

            {/* Pagination Controls for Mobile */}
            {!loading && dataList.length > cardsPerPage && (
              <div className="flex justify-between items-center py-3">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentPage === 0}
                  className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 dark:text-gray-200"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage + 1} of{" "}
                  {Math.ceil(dataList.length / cardsPerPage)}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(
                        Math.ceil(dataList.length / cardsPerPage) - 1,
                        prev + 1
                      )
                    )
                  }
                  disabled={
                    currentPage >= Math.ceil(dataList.length / cardsPerPage) - 1
                  }
                  className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 dark:text-gray-200"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          <div className="px-3 pt-5 overflow-x-auto hidden md:block">
            <Table className="min-w-[600px] text-xs sm:text-sm">
              <TableHeader className="sticky top-0 bg-white dark:bg-[#0E1725] z-10">
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

              <TableBody className="max-h-[500px]">
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
                        <h1>{t("Privatefeedback_k9")}</h1>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="bg-[#F1f4f7] dark:bg-[#080e16] rounded-md w-full mt-2 md:mt-0 md:col-span-2">
          <div className="px-4 py-4 border-b-[1px] border-gray-300 dark:border-gray-700">
            <h1 className="text-2xl font-bold w-full text-gray-800 dark:text-gray-200">
              {t("Privatefeedback_k6")}
            </h1>
          </div>

          <div className="md:min-h-[410px] overflow-y-auto">
            {dataDetails ? (
              details
            ) : (
              <div className="h-40 md:h-80 flex items-center justify-center text-xl font-semibold text-gray-500 dark:text-gray-400">
                <h1>{t("Privatefeedback_k7")}</h1>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default PrivateFeedbackComponent;
