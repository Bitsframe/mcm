import { FC } from "react";
import { ReturnProductSection } from "./ReturnProductSection";
import { tableHeader } from "./utils";
import {
  TableRow,
  TableCell,
} from "@/components/ui/table";

interface PreDefinedReasonListInterface {
  created_at: string;
  id: number;
  reason: string;
}

interface TableListRenderInterface {
  dataList: any;
  order_id: any;
  isAnyReturned: boolean;
  hasReturnedHandle: (val: boolean) => void;
  preDefinedReasonList: PreDefinedReasonListInterface[];
}

export const TableRowRender: FC<TableListRenderInterface> = ({
  dataList,
  order_id,
  isAnyReturned,
  hasReturnedHandle,
  preDefinedReasonList,
}) => {
  return (
    <TableRow className="flex items-center flex-1 text-base border-b-2 border-b-[#E4E4E7] hover:bg-inherit">
      {tableHeader.map(({ id, render_value, align, flex }, ind) => {
        const content = render_value 
          ? render_value(dataList[id], dataList) 
          : dataList[id];
        
        return (
          <TableCell 
            key={ind} 
            className={`
              ${flex ? flex : 'flex-[4]'} 
              ${align || 'text-center'}
              py-2 px-4
            `}
          >
            {id === 'actions' ? (
              <ReturnProductSection 
                preDefinedReasonList={preDefinedReasonList}
                isAnyReturned={isAnyReturned}
                setOtherReturned={hasReturnedHandle}
                data={dataList}
                order_id={order_id}
              />
            ) : content}
          </TableCell>
        );
      })}
    </TableRow>
  );
};