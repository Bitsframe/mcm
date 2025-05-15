"use client";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useContext,
} from "react";
import { fetch_content_service } from "@/utils/supabase/data_services/data_services";
import InventoryCards from "./InventoryCards";
import TableComponent from "@/components/TableComponent";
import { LocationContext, TabContext } from "@/context";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { Archive, ShieldCheck } from "lucide-react";

interface DataListInterface {
  [key: string]: any;
}

const tableHeader = [
  { id: "product_id", label: "SP_k7" },
  {
    id: "category",
    label: "SP_k6",
    render_value: (val: string, elem?: any) =>
      elem?.categories?.category_name || "-",
  },
  {
    id: "name",
    label: "SP_k5",
    render_value: (val: any, elem?: any) => elem?.product_name || "-",
    align: "text-center",
  },
  {
    id: "price",
    label: "SP_k2",
    render_value: (val: any, elem?: any) => elem?.price,
    align: "text-center",
  },
  {
    id: "quantity_in_stock",
    label: "SP_k1",
    render_value: (val: any, elem?: any) => elem?.quantity_available,
    align: "text-center",
  },
];

const StockPanel = () => {
  const [dataList, setDataList] = useState<DataListInterface[]>([]);
  const [allData, setAllData] = useState<DataListInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [getDataArchiveType, setGetDataArchiveType] = useState(false);

  const { selectedLocation } = useContext(LocationContext);
  const { setActiveTitle } = useContext(TabContext);
  const { t } = useTranslation(translationConstant.STOCKPANEL);

  const fetch_handle = async (archived: boolean, location_id: number) => {
    setLoading(true);
    const fetched_data = await fetch_content_service({
      table: "inventory",
      language: "",
      selectParam:
        ",products(category_id, categories(category_name),  product_name,archived)",
      filterOptions: [{ operator: "not", column: "products", value: null }],
      matchCase: [
        { key: "location_id", value: location_id },
        { key: "archived", value: archived },
        { key: "products.archived", value: false },
      ],
    });

    const formattedData = fetched_data.map(
      ({
        quantity,
        inventory_id,
        price,
        products: { product_name, category_id, categories },
      }: any) => {
        return {
          product_id: inventory_id,
          category_id,
          product_name: product_name,
          price,
          quantity_available: quantity,
          categories: { category_name: categories?.category_name },
        };
      }
    );

    setDataList(formattedData);
    setAllData(formattedData);
    setLoading(false);
  };

  const onChangeHandle = (e: any) => {
    const val = e.target.value;
    if (val === "") {
      setDataList([...allData]);
    } else {
      const filteredData = allData.filter((elem) =>
        elem.products.product_name.toLowerCase().includes(val.toLowerCase())
      );
      setDataList([...filteredData]);
    }
  };

  useEffect(() => {
    if (selectedLocation?.id) {
      fetch_handle(getDataArchiveType, selectedLocation.id);
    }
  }, [getDataArchiveType, selectedLocation]);

  const handleActiveClick = useCallback(() => {
    setGetDataArchiveType(false);
  }, []);

  const handleArchiveClick = useCallback(() => {
    setGetDataArchiveType(true);
  }, []);

  useEffect(() => {
    setActiveTitle("Sidebar_k12");
  }, []);

  const RightSideComponent = useMemo(
    () => (
      <div className="text-sm text-gray-500 dark:text-gray-300 flex items-center bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
        <button
          onClick={handleActiveClick}
          className={`flex items-center gap-x-1 px-4 py-2 transition-colors duration-200 ${
            !getDataArchiveType
              ? "bg-blue-600 text-white"
              : "bg-transparent text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          {t("SP_k4")}
        </button>
        <button
          onClick={handleArchiveClick}
          className={`flex items-center gap-x-1 px-4 py-2 transition-colors duration-200 ${
            getDataArchiveType
              ? "bg-blue-600 text-white"
              : "bg-transparent text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white"
          }`}
        >
          <Archive className="w-4 h-4" />
          {t("SP_k3")}
        </button>
      </div>
    ),
    [getDataArchiveType, handleActiveClick, handleArchiveClick]
  );

  return (
    <main className="w-full h-full font-[500] text-[20px] dark:text-white">
      <h1 className="text-2xl font-bold p-3">Stock Panel</h1>
      <div className="w-full min-h-[81dvh] h-full overflow-auto py-2 px-2">
        <InventoryCards archived={getDataArchiveType} />
        <TableComponent
          tableHeight="h-[45dvh]"
          tableBodyHeight="h-[35dvh]"
          tableHeader={tableHeader}
          loading={loading}
          dataList={dataList}
          searchInputplaceholder="SP_k8"
          searchHandle={onChangeHandle}
          RightSideComponent={() => RightSideComponent}
        />
      </div>
    </main>
  );
};

export default StockPanel;
