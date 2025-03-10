import { FC } from "react";
import { ReturnProductSection } from "./ReturnProductSection";
import { tableHeader } from "./utils";


interface PreDefinedReasonListInterface {
    created_at: string;
    id: number;
    reason: string;

}

interface TableListRenderInterface {
    dataList: any;
    order_id: any;
    isAnyReturned: boolean;
    hasReturnedHandle: (val: boolean) => void
    preDefinedReasonList: PreDefinedReasonListInterface[];

}

export const TableRowRender: FC<TableListRenderInterface> = ({ dataList, order_id, isAnyReturned, hasReturnedHandle, preDefinedReasonList }) => {




    return <div className={` flex items-center flex-1 text-base py-5 border-b-2 border-b-[#E4E4E7]`}>
        {tableHeader.map(({ id, render_value, align, flex }, ind) => {
            const content = render_value ? render_value(dataList[id], dataList) : dataList[id];
            return (
                <h1 key={ind} className={`${flex ? flex : 'flex-[4]'} ${align || 'text-center'}`}>
                    {id === 'actions' ? <ReturnProductSection preDefinedReasonList={preDefinedReasonList} isAnyReturned={isAnyReturned} setOtherReturned={hasReturnedHandle} data={dataList} order_id={order_id} /> : content}
                </h1>
            );
        })}
    </div>
}