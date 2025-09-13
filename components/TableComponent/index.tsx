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
  itemPerPage?: number;
}

interface DataListInterface {
  [key: string]: any;
}

const TableComponent: React.FC<Props> = ({
  itemPerPage,
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

  const ITEMS_PER_PAGE = itemPerPage || 5;
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPages = Math.ceil(dataList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, dataList.length);
  const currentData = dataList.slice(startIndex, endIndex);

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

  const renderCardContent = (elem: any) => {
    return tableHeader.map(({ id, render_value, label }, index) => {
      if (id === "last_updated") return null; 
      const content = render_value
        ? render_value(elem[id], elem, openModal)
        : elem[id];

      return (
        <div key={index} className="flex justify-between py-1">
          <span className="text-gray-500 dark:text-gray-400 font-medium">
            {t(label, {
              ns: translationConstant.STOCKPANEL,
              defaultValue: t(label, {
                ns: translationConstant.POSHISTORY,
              }),
            })}
            :
          </span>
          <span className="text-gray-700 dark:text-gray-200">{content}</span>
        </div>
      );
    });
  };

  return (
    <div className="bg-white dark:bg-[#0e1725] w-full text-black dark:text-white">
      <div className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 dark:border-gray-700 gap-2 sm:gap-0 sticky top-0 z-20 bg-white dark:bg-[#0e1725]">
        <div className="flex items-center space-x-2 px-3 w-full sm:w-80 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0e1725] relative z-10 min-w-0">
          <CiSearch size={18} color="gray" />
          <input
            onChange={searchHandle}
            type="text"
            //@ts-ignore
            placeholder={t(searchInputplaceholder)}
            className="w-full px-1 focus:outline-none placeholder-gray-400 dark:placeholder-gray-400 bg-transparent text-sm text-black dark:text-white min-w-0"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between min-w-0">
          {pdf ? <ExportAsPDF /> : null}
          {RightSideComponent ? <RightSideComponent /> : null}
        </div>
      </div>

      <div
        className={`w-full border border-gray-200 dark:border-gray-700 rounded-md ${tableHeight} flex flex-col min-w-0 overflow-x-auto`}
      >
        {/* Mobile Cards View */}
        <div className="block md:hidden p-4 space-y-3 min-w-0">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center py-4">
              <CircularProgress />
            </div>
          ) : (
            <>
              {currentData.map((elem, index) => (
                <div
                  key={startIndex + index}
                  className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 shadow-sm bg-white dark:bg-[#0e1725] min-w-0 text-xs"
                >
                  {renderCardContent(elem)}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-[11px]">
                    {tableHeader.map(({ id, render_value }) => {
                      if (id !== "last_updated") return null;
                      const content = render_value
                        ? render_value(elem[id], elem, openModal)
                        : elem[id];
                      return (
                        <div key={id} className="flex justify-center">
                          {content}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {/* {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 px-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )} */}
            </>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block flex-1 overflow-x-auto overflow-y-auto min-w-0">
          <Table className="w-full min-w-[600px] rounded-lg border-collapse text-xs sm:text-sm">
            <TableHeader className="bg-white dark:bg-[#0E1725] sticky top-0 z-10 min-w-0">
              <TableRow className="border-b border-gray-400 dark:border-gray-700 rounded-lg min-w-0">
                {tableHeader.map(({ label, align, flex }, index) => (
                  <TableHead
                    key={index}
                    className={`py-3 text-sm text-gray-500 dark:text-gray-300 font-medium ${
                      flex || "flex-1"
                    } ${align || "text-left"} min-w-0`}
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
                    className="hover:bg-gray-50 dark:hover:bg-[#334155] border-b border-gray-200 dark:border-gray-700 min-w-0"
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
                            } min-w-0`}
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
      <div className="flex flex-row justify-between items-center gap-2 py-3 border-t border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-500 dark:text-gray-300 bg-white dark:bg-[#0e1725] min-w-0">
        <div>
          {dataList.length === 0
            ? `${t("SP_k16")} 0 ${t("SP_k17")} 0 ${t("SP_k18")} 0`
            : `${t("SP_k16")} ${startIndex + 1}  ${t("SP_k17")} ${endIndex} ${t("SP_k18")} ${
                dataList.length
              }`}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors duration-150 ${
              currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {t("SP_k15")}
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
            {t("SP_k14")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableComponent;
