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
  hasReturnedHandle: (val: boolean, productName: string) => void;
  preDefinedReasonList: PreDefinedReasonListInterface[];
  discounts?: any[];
}

export const TableRowRender: FC<TableListRenderInterface> = ({
  dataList,
  order_id,
  isAnyReturned,
  hasReturnedHandle,
  preDefinedReasonList,
  discounts = [],
}) => {
  
  // Function to get discount percentage for current product
  const getProductDiscountPercentage = () => {
    const productId = dataList?.inventory?.product_id;
    const productDiscount = discounts.find((discount: any) => 
      discount.product_id === productId && discount.discount_type === 'product'
    );
    return productDiscount ? `${productDiscount.discount_amount}%` : '0%';
  };
  return (
    <TableRow className="grid grid-cols-6 gap-4 items-center text-base border-b-2 border-b-[#E4E4E7] hover:bg-inherit px-4 py-2">
      {tableHeader.map(({ id, render_value, align }, ind) => {
        let content;
        
        if (id === 'product_discount') {
          content = getProductDiscountPercentage();
        } else {
          content = render_value 
            ? render_value(dataList[id], dataList) 
            : dataList[id];
        }
        
        return (
          <TableCell 
            key={ind} 
            className={`
              ${align === "right" ? "text-right" : align === "text-center" ? "text-center" : "text-left"}
              p-0
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