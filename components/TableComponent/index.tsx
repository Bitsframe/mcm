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

const TableComponent: React.FC<Props & { searchInputs?: any }> = ({
  itemPerPage,
  tableHeader,
  loading,
  dataList,
  openModal,
  tableBodyHeight = "",
  tableHeight = "h-[82dvh]",
  searchInputs,
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
  {/* No global search bar for this table */}
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
              {/* Search Inputs Row */}
              {searchInputs && (
                <TableRow>
                  <TableCell className="p-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-full border-2 border-black rounded px-1 py-1 text-xs bg-gray-100 focus:outline-none"
                      placeholder="Search Order ID"
                      value={searchInputs.orderIdSearch}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        searchInputs.setOrderIdSearch(val);
                      }}
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <input
                      type="text"
                      className="w-full border-2 border-black rounded px-1 py-1 text-xs bg-gray-100 focus:outline-none"
                      placeholder="Search Patient Name"
                      value={searchInputs.patientNameSearch}
                      onChange={e => searchInputs.setPatientNameSearch(e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <input
                      type="date"
                      className="w-full border-2 border-black rounded px-1 py-1 text-xs bg-gray-100 focus:outline-none"
                      value={searchInputs.dobSearch}
                      onChange={e => searchInputs.setDobSearch(e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <div className="flex items-center">
                      <span className="px-1 text-xs select-none">+1</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-full border-2 border-black rounded px-1 py-1 text-xs bg-gray-100 focus:outline-none"
                        placeholder="Phone Number"
                        value={searchInputs.phoneSearch}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          searchInputs.setPhoneSearch(val);
                        }}
                        style={{ marginLeft: '-2px' }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="p-1">
                    {(() => {
                      const emailValue = searchInputs.emailSearch;
                      // Always validate if not empty
                      let isValid = true;
                      if (emailValue) {
                        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
                      }
                      return (
                        <input
                          type="text"
                          className={`w-full border-2 rounded px-1 py-1 text-xs bg-gray-100 focus:outline-none ${!emailValue || isValid ? 'border-black' : 'border-red-500'}`}
                          placeholder="Search Email"
                          value={emailValue}
                          onChange={e => searchInputs.setEmailSearch(e.target.value)}
                        />
                      );
                    })()}
                  </TableCell>
                  {/* Details column header cell for alignment */}
                  {openModal && <TableCell className="p-1"></TableCell>}
                </TableRow>
              )}
              <TableRow className="border-b border-gray-400 dark:border-gray-700 rounded-lg min-w-0">
                {/* Order ID */}
                <TableHead className="py-3 text-sm text-gray-500 dark:text-gray-300 font-medium text-center min-w-0">Order ID</TableHead>
                {/* Patient Name */}
                <TableHead className="py-3 text-sm text-gray-500 dark:text-gray-300 font-medium text-center min-w-0">Patient Name</TableHead>
                {/* DOB */}
                <TableHead className="py-3 text-sm text-gray-500 dark:text-gray-300 font-medium text-center min-w-0">Date of Birth</TableHead>
                {/* Phone Number */}
                <TableHead className="py-3 text-sm text-gray-500 dark:text-gray-300 font-medium text-center min-w-0">Phone Number</TableHead>
                {/* Email */}
                <TableHead className="py-3 text-sm text-gray-500 dark:text-gray-300 font-medium text-center min-w-0">Email</TableHead>
                {/* Details column header cell for alignment */}
                {openModal && <TableHead className="py-3 text-sm min-w-0"></TableHead>}
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
                    {/* Order ID */}
                    <TableCell className="py-3 text-sm text-center min-w-0">{elem.order_id}</TableCell>
                    {/* Patient Name */}
                    <TableCell className="py-3 text-sm text-center min-w-0">{`${elem?.pos?.firstname || ''} ${elem?.pos?.lastname || ''}`}</TableCell>
                    {/* DOB */}
                    <TableCell className="py-3 text-sm text-center min-w-0">{elem?.pos?.dob || "-"}</TableCell>
                    {/* Phone Number */}
                    <TableCell className="py-3 text-sm text-center min-w-0">{elem?.pos?.phone || ''}</TableCell>
                    {/* Email */}
                    <TableCell className="py-3 text-sm text-center min-w-0">{elem?.pos?.email || ''}</TableCell>
                    {/* Details Button */}
                    {openModal && (
                      <TableCell className="py-3 text-center min-w-0">
                        <button
                          onClick={() => openModal(elem)}
                          className="px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-150 text-xs"
                          title="View Details"
                        >
                          Details
                        </button>
                      </TableCell>
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
