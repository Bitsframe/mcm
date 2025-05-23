import { LocationContext } from "@/context";
import { fetch_content_service } from "@/utils/supabase/data_services/data_services";
import { translationConstant } from "@/utils/translationConstants";
import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { Group198, Group193, Vector } from "@/assets/images";

const InventoryCards = ({ archived }: { archived: boolean }) => {
  const [procucts_count, setProcucts_count] = useState(0);
  const [stock_value, setStock_value] = useState(0);
  const [categories_count, setCategories_count] = useState(0);

  const { selectedLocation } = useContext(LocationContext);

  const fetch_products = async (location_id: number, archived: boolean) => {
    const fetched_data = await fetch_content_service({
      table: "inventory",
      language: "",
      matchCase: [
        {
          key: "location_id",
          value: location_id,
        },
        {
          key: "archived",
          value: archived,
        },
        {
          key: "products.archived",
          value: false,
        },
      ],
      selectParam: ",products(archived)",
      filterOptions: [{ operator: "not", column: "products", value: null }],
    });
    if (fetched_data) {
      const calc_val = fetched_data.reduce(
        (a: number, b: any) => a + b.price * b.quantity,
        0
      );
      setStock_value(calc_val);
      setProcucts_count(fetched_data.length);
    }
  };

  const fetch_categories = async () => {
    const fetched_data = await fetch_content_service({
      table: "categories",
      language: "",
    });
    if (fetched_data && fetched_data.length > 0) {
      setCategories_count(fetched_data.length);
    }
  };

  useEffect(() => {
    fetch_categories();
  }, []);

  useEffect(() => {
    if (selectedLocation?.id) {
      fetch_products(selectedLocation.id, archived);
    }
  }, [selectedLocation, archived]);

  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  });

  const { t } = useTranslation(translationConstant.STOCKPANEL);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-3">
      {/* Products Count Card */}
      <div className="p-4 rounded-lg bg-[#f1f4f9] dark:bg-[#080e16] shadow-sm h-40">
        <h1 className="text-3xl text-center font-bold">{procucts_count}</h1>
        <p className="text-gray-500 text-center dark:text-gray-300 mb-2 text-sm">
          {t("SP_k12")}
        </p>
        <div className="h-[50px] relative ml-14 text-center">
          <Image
            src={Group193.src}
            alt="Products chart"
            objectFit="contain"
            width={150}
            height={150}
          />
        </div>
      </div>

      {/* Categories Count Card */}
      <div className="p-4 rounded-lg bg-[#f1f4f9] dark:bg-[#080e16] shadow-sm h-40">
        <h1 className="text-3xl text-center font-bold">{categories_count}</h1>
        <p className="text-gray-500 text-center dark:text-gray-300 mb-2 text-sm">
          {t("SP_k11")}
        </p>
        <div className="h-[50px] relative ml-8">
          <Image
            src={Group198.src}
            alt="Categories chart"
            objectFit="contain"
            width={220}
            height={220}
          />
        </div>
      </div>

      {/* Stock Value Card */}
      <div className="p-4 rounded-lg bg-[#f1f4f9] dark:bg-[#080e16] shadow-sm h-40">
        <h1 className="text-3xl text-center font-bold">
          {usdFormatter.format(stock_value)}
        </h1>
        <p className="text-gray-500 text-center dark:text-gray-300 mb-2 text-sm">
          {t("SP_k10")}
        </p>
        <div className="h-[50px] relative ml-8">
          <Image
            src={Vector.src}
            alt="Stock value chart"
            objectFit="contain"
            width={220}
            height={220}
          />
        </div>
      </div>

      {/* Percentage Card */}
      <div className="p-4 rounded-lg bg-[#f1f4f9] dark:bg-[#080e16] shadow-sm h-40">
        <h1 className="text-3xl text-center font-bold">20%</h1>
        <p className="text-gray-500 dark:text-gray-300 text-center mb-2 text-sm">
          {t("SP_k9")}
        </p>
        <div className="mt-6 flex items-center justify-center">
          <div className="w-2/3 h-4 bg-gray-200 dark:bg-gray-700 rounded-md">
            <div
              className="h-full bg-amber-500 rounded-md"
              style={{ width: "20%" }}
            ></div>
          </div>
          <div className="ml-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-500"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryCards;
