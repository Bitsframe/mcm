"use client";

import { CircularProgress } from "@mui/material";
import React, { useEffect } from "react";
import { CiSearch } from "react-icons/ci";
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
import ExportAsPDF from "../ExportPDF";

interface TableHeaderInterface {
  label: string;
  align?: string;
  flex?: string;
  id: string;
  render_value: (
    val: string,
    elem: any,
    openModal?: (orderDetails: DataListInterface) => void
  ) => React.ReactNode;
}

interface Props {
  tableHeader: TableHeaderInterface[] | any[];
  loading?: boolean;
  dataList: any[];
  openModal?: (orderDetails: DataListInterface) => void;
  tableBodyHeight?: string;
  tableHeight?: string;
  searchHandle?: (e: any) => void;
  searchInputplaceholder?: string;
  RightSideComponent?: () => React.ReactNode;
  pdf?: () => React.ReactNode;
  resetPaginationTrigger?: any;
}

interface DataListInterface {
  [key: string]: any;
}

const TableComponent: React.FC<Props> = ({
  tableHeader,
  loading,
  dataList,
  openModal,
  tableBodyHeight = "",
  tableHeight = "h-[82dvh]",
  searchHandle,
  searchInputplaceholder,
  RightSideComponent,
  pdf,
  resetPaginationTrigger,
}) => {
  const { t } = useTranslation([
    translationConstant.STOCKPANEL,
    translationConstant.POSHISTORY,
  ]);

  const [selectedRows, setSelectedRows] = React.useState<number[]>([]);
  const isAllSelected =
    dataList.length > 0 && selectedRows.length === dataList.length;

  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPages = Math.ceil(dataList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, dataList.length);
  const currentData = dataList.slice(startIndex, endIndex);

  // Reset pagination when dataList or resetPaginationTrigger changes
  useEffect(() => {
    setCurrentPage(1);
  }, [dataList, resetPaginationTrigger]);

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRows([]);
    } else {
      const allIndexes = dataList.map((_, index) => index);
      setSelectedRows(allIndexes);
    }
  };

  const handleSelectRow = (index: number) => {
    if (selectedRows.includes(index)) {
      setSelectedRows((prev) => prev.filter((i) => i !== index));
    } else {
      setSelectedRows((prev) => [...prev, index]);
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="bg-white dark:bg-[#0e1725] w-full overflow-hidden text-black dark:text-white">
      <div className="pb-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 px-3 w-80 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#334155] relative z-10">
          <CiSearch size={18} color="gray" />
          <input
            onChange={searchHandle}
            type="text"
            //@ts-ignore
            placeholder={t(searchInputplaceholder)}
            className="w-full px-1 focus:outline-none placeholder-gray-400 dark:placeholder-gray-400 bg-transparent text-sm text-black dark:text-white"
          />
        </div>

        {pdf ? <ExportAsPDF /> : null}
        {RightSideComponent ? <RightSideComponent /> : null}
      </div>

      <div
        className={`w-full border border-gray-200 dark:border-gray-700 rounded-md ${tableHeight} flex flex-col`}
      >
        <div className="flex-1 overflow-auto">
          <Table className="w-full rounded-lg border-collapse">
            <TableHeader className="bg-white dark:bg-[#1E293B] sticky top-0 z-10">
              <TableRow className="border-b border-gray-400 dark:border-gray-700 rounded-lg">
                {tableHeader.map(({ label, align, flex }, index) => (
                  <TableHead
                    key={index}
                    className={`py-3 text-sm text-gray-500 dark:text-gray-300 font-medium ${
                      flex || "flex-1"
                    } ${align || "text-left"}`}
                  >
                    {t(label, {
                      ns: translationConstant.STOCKPANEL,
                      defaultValue: t(label, {
                        ns: translationConstant.POSHISTORY,
                      }),
                    })}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={tableHeader.length + 1}>
                    <div className="h-full w-full flex items-center justify-center py-4">
                      <CircularProgress />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((elem, index) => (
                  <TableRow
                    key={startIndex + index}
                    className="hover:bg-gray-50 dark:hover:bg-[#334155] border-b border-gray-200 dark:border-gray-700"
                  >
                    {tableHeader.map(
                      ({ id, render_value, align, flex }, ind) => {
                        const content = render_value
                          ? render_value(elem[id], elem, openModal)
                          : elem[id];
                        return (
                          <TableCell
                            key={ind}
                            className={`py-3 text-sm ${flex || "flex-1"} ${
                              align || "text-left"
                            }`}
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

        <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-300 bg-white dark:bg-[#0e1725]">
          <div>
            {dataList.length === 0
              ? "Showing 0 to 0 of 0 results"
              : `Showing ${startIndex + 1} to ${endIndex} of ${
                  dataList.length
                } results`}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors duration-150 ${
                currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || dataList.length === 0}
              className={`px-3 py-1 rounded text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors duration-150 ${
                currentPage === totalPages || dataList.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableComponent;
