"use client";

import { CircularProgress } from "@mui/material";
import React from "react";
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
}

interface DataListInterface {
  [key: string]: any;
}

const TableComponent: React.FC<Props> = ({
  tableHeader,
  loading,
  dataList,
  openModal,
  tableBodyHeight = "h-[26dvh]",
  tableHeight = "h-[82dvh]",
  searchHandle,
  searchInputplaceholder,
  RightSideComponent,
  pdf
}) => {
  const { t } = useTranslation([
    translationConstant.STOCKPANEL,
    translationConstant.POSHISTORY,
  ]);

  const [selectedRows, setSelectedRows] = React.useState<number[]>([]);
  const isAllSelected = dataList.length > 0 && selectedRows.length === dataList.length;

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
      setSelectedRows(prev => prev.filter(i => i !== index));
    } else {
      setSelectedRows(prev => [...prev, index]);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] w-full overflow-hidden text-black dark:text-white">
      <div className="py-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 px-3 w-80 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#334155]">
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

      <div className="w-full border border-gray-200 dark:border-gray-700 rounded-md h-[600px] flex flex-col">
        <div className="flex-1 overflow-auto">
          <Table className="w-full rounded-lg">
            <TableHeader className="sticky top-0 z-10 bg-white dark:bg-[#1E293B]">
              <TableRow className="border-b border-gray-200 dark:border-gray-700 rounded-lg">
                <TableHead className="w-12 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </TableHead>
                {tableHeader.map(({ label, align, flex }, index) => (
                  <TableHead
                    key={index}
                    className={`py-3 text-sm text-gray-500 dark:text-gray-300 font-medium ${flex || "flex-1"} ${align || "text-left"}`}
                  >
                    {t(label, {
                      ns: translationConstant.STOCKPANEL,
                      defaultValue: t(label, { ns: translationConstant.POSHISTORY }),
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
                dataList.map((elem, index) => (
                  <TableRow
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-[#334155] border-b border-gray-200 dark:border-gray-700"
                  >
                    <TableCell className="w-12 py-3">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedRows.includes(index)}
                        onChange={() => handleSelectRow(index)}
                      />
                    </TableCell>
                    {tableHeader.map(({ id, render_value, align, flex }, ind) => {
                      const content = render_value
                        ? render_value(elem[id], elem, openModal)
                        : elem[id];
                      return (
                        <TableCell
                          key={ind}
                          className={`py-3 text-sm ${flex || "flex-1"} ${align || "text-left"}`}
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
        </div>
      </div>

      <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-300">
        <div>
          {selectedRows.length} of {dataList.length} row(s) selected.
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#334155] rounded">
            Previous
          </button>
          <button className="px-3 py-1 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#334155] rounded">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableComponent;
