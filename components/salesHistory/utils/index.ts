import { currencyFormatHandle } from "@/helper/common_functions";
// import moment from "moment-timezone";

export const tableHeader = [
    // {
    //     id: 'date_sold',
    //     label: 'date sold',
    //     align: 'text-center',
    //     flex: 'flex-1',
    //     render_value: (val: string, elem: any) =>   moment(val).utcOffset(-6).format("DD-MM-YYYY"),

    // },
    {
        id: 'category',
        label: 'POS-Historyk23',
        align: 'text-center',
        flex: 'flex-1',
        render_value: (val: string, elem: any) => elem?.inventory?.products?.categories?.category_name,

    },
    {
        id: 'product_name',
        label: 'POS-Historyk24',
        render_value: (val: string, elem: any) => elem?.inventory?.products?.product_name,

    },
    {
        id: 'quantity_sold',
        label: 'POS-Historyk25',
        flex: 'flex-1',
    },
    {
        id: 'total_price',
        label: 'POS-Historyk26',
        render_value: (val: any, elem?: any) => currencyFormatHandle(val)
    },
    {
        id: 'actions',
        label: 'POS-Historyk27',
        align: 'text-center',
        flex: 'flex-1',
    },
];



export const calcTotalAmount = (list: any) => {
    const totalVal = list?.sales_history?.reduce((a: number, b: { total_price: number }) => a + b.total_price, 0);
    return currencyFormatHandle(totalVal)
}