import { LocationContext } from "@/context";
import { fetch_content_service } from "@/utils/supabase/data_services/data_services";
import React, { useContext, useEffect, useState } from "react";

const InventoryCards = ({ archived }: { archived: boolean }) => {
  const [procucts_count, setProcucts_count] = useState(0);
  const [stock_value, setStock_value] = useState(0);
  const [categories_count, setCategories_count] = useState(0);

  const { selectedLocation, setSelectedLocation } = useContext(LocationContext);

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

  return (
    <div className="py-3 space-x-20 my-5 flex flex-1 items-center">
      <div className="px-5 py-3 rounded-lg bg-[#EFEFEF] flex-1">
        <h1 className="text-5xl">{procucts_count}</h1>
        <h4 className="text-base">Products</h4>
      </div>
      <div className="px-5 py-3 rounded-lg bg-[#EFEFEF] flex-1">
        <h1 className="text-5xl">{categories_count}</h1>
        <h4 className="text-base">Total Categories</h4>
      </div>
      <div className="px-5 py-3 rounded-lg bg-[#EFEFEF] flex-1">
        <h1 className="text-5xl">{usdFormatter.format(stock_value)}</h1>
        <h4 className="text-base">Stock Value</h4>
      </div>
      <div className="px-5 py-3 rounded-lg bg-[#EFEFEF] flex-1">
        <h1 className="text-5xl">20%</h1>
        <h4 className="text-base">low stock alerts</h4>
      </div>
    </div>
  );
};

export default InventoryCards;
