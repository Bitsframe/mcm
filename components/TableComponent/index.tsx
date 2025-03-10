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
}) => {
  const { t } = useTranslation([
    translationConstant.STOCKPANEL,
    translationConstant.POSHISTORY,
  ]);

  return (
    <div
      className={`bg-[#EFEFEF] ${tableHeight} overflow-y-auto col-span-2 rounded-md pb-24 px-3`}
    >
      <div className="px-3 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3 px-1 py-1 w-72 text-sm rounded-sm bg-white">
          <CiSearch size={22} color="gray" />
          <input
            onChange={searchHandle}
            type="text"
            // @ts-ignore
            placeholder={t(searchInputplaceholder)}
            className="px-1 focus:outline-none placeholder-gray-400 text-sm font-light"
          />
        </div>

        {RightSideComponent ? <RightSideComponent /> : null}
      </div>

      <div className="px-2 pt-5">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b-2 border-b-[#E4E4E7]">
              {tableHeader.map(({ label, align, flex }, index) => (
                <TableHead
                  key={index}
                  className={`py-3 text-base text-[#71717A] font-normal ${
                    flex ? flex : "flex-[4]"
                  } ${align || "text-center"}`}
                >
                  {t(label, {

    ns: translationConstant.STOCKPANEL,
    defaultValue: t(label, { ns: translationConstant.POSHISTORY }),
  })}

                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody className={`${tableBodyHeight} overflow-y-auto`}>
            {loading ? (
              <TableRow>
                <TableCell colSpan={tableHeader.length}>
                  <div className="h-full w-full flex items-center justify-center">
                    <CircularProgress />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              dataList.map((elem, index) => (
                <TableRow
                  key={index}
                  className="hover:bg-[#d0d0d0] border-b-2 border-b-[#E4E4E7]"
                >
                  {tableHeader.map(({ id, render_value, align, flex }, ind) => {
                    const content = render_value
                      ? render_value(elem[id], elem, openModal)
                      : elem[id];
                    return (
                      <TableCell
                        key={ind}
                        className={`py-1 text-base ${
                          flex ? flex : "flex-[4]"
                        } ${align || "text-center"}`}
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
  );
};

export default TableComponent;
