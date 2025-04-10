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
  [key: string]: any; // This allows dynamic property access
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

  return (
    <div className="bg-white w-full overflow-hidden">
    <div className=" py-3 flex justify-between items-center border-b">
      <div className="flex items-center space-x-2 px-3 w-80 text-sm rounded-md border border-gray-200">
        <CiSearch size={18} color="gray" />
        <input
          onChange={searchHandle}
          type="text"
          //@ts-ignore
          placeholder={t(searchInputplaceholder)}
          className="w-full px-1 focus:outline-none placeholder-gray-400 text-sm"
        />
      </div>

      {pdf ? <ExportAsPDF /> : null}
  
      {/* {RightSideComponent ? (
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">Sales History</button>
      ) : null} */}
      {RightSideComponent ? <RightSideComponent /> : null}
    </div>
  
    <div className="w-full border border-gray-200 rounded-md h-[600px] flex flex-col">
  <div className="flex-1 overflow-auto">
    <Table className="w-full rounded-lg">
      <TableHeader className="sticky top-0 bg-white z-10">
        <TableRow className="border-b border-gray-200 rounded-lg bg-white">
          <TableHead className="w-12 py-3 text-sm font-medium text-gray-500">
            <input type="checkbox" className="rounded" />
          </TableHead>
          {tableHeader.map(({ label, align, flex }, index) => (
            <TableHead
              key={index}
              className={`py-3 text-sm text-gray-500 font-medium ${flex ? flex : "flex-1"} ${align || "text-left"}`}
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
            <TableRow key={index} className="hover:bg-gray-50 border-b border-gray-200">
              <TableCell className="w-12 py-3">
                <input type="checkbox" className="rounded" />
              </TableCell>
              {tableHeader.map(({ id, render_value, align, flex }, ind) => {
                const content = render_value ? render_value(elem[id], elem, openModal) : elem[id]
                return (
                  <TableCell key={ind} className={`py-3 text-sm ${flex ? flex : "flex-1"} ${align || "text-left"}`}>
                    {content}
                  </TableCell>
                )
              })}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
</div>
  
    <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 text-sm">
      <div className="text-gray-500">0 of 5 row(s) selected.</div>
      <div className="flex space-x-2">
        <button className="px-3 py-1 text-gray-500 hover:bg-gray-100 rounded">Previous</button>
        <button className="px-3 py-1 text-gray-500 hover:bg-gray-100 rounded">Next</button>
      </div>
    </div>
  </div>
  );
};

export default TableComponent;
