'use client'
import React, { useEffect, useState, useCallback, useMemo, useContext } from 'react';
import { fetch_content_service } from '@/utils/supabase/data_services/data_services';
import InventoryCards from './InventoryCards';
import TableComponent from '@/components/TableComponent';
import { LocationContext } from '@/context';

interface DataListInterface {
  [key: string]: any; // This allows dynamic property access
}

const tableHeader = [
  { id: 'product_id', label: 'Product ID' },
  {
    id: 'category',
    label: 'Category',
    render_value: (val: string, elem?: any) => elem?.categories?.category_name || '-',
  },
  {
    id: 'name',
    label: 'Name',
    render_value: (val: any, elem?: any) => elem?.product_name || '-',
    align: 'text-center',
  },
  {
    id: 'price',
    label: 'Price',
    render_value: (val: any, elem?: any) => elem?.price,
    align: 'text-center',
  },
  {
    id: 'quantity_in_stock',
    label: 'Quantity Available',
    render_value: (val: any, elem?: any) => elem?.quantity_available,
    align: 'text-center',
  },
];

const StockPanel = () => {
  const [dataList, setDataList] = useState<DataListInterface[]>([]);
  const [allData, setAllData] = useState<DataListInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [getDataArchiveType, setGetDataArchiveType] = useState(false);

  const { selectedLocation, setSelectedLocation } = useContext(LocationContext);


  const fetch_handle = async (archived: boolean, location_id: number) => {
    setLoading(true);
    const fetched_data = await fetch_content_service({
      table: 'inventory',
      language: '',
      selectParam: ',products(category_id, categories(category_name),  product_name,archived)',
      filterOptions: [{ operator: 'not', column: 'products', value: null }],
      matchCase: [
        {
          key: 'location_id',
          value: location_id
        },
        {
          key: 'archived',
          value: archived
        },
        {
          key: 'products.archived',
          value: false
        },

      ],
    });

    const formattedData = fetched_data.map(({ quantity, inventory_id, price, products: { product_name, category_id, categories } }: any) => {
      return {
        product_id: inventory_id,
        category_id,
        product_name: product_name,
        price,
        quantity_available: quantity,
        categories: { category_name: categories?.category_name }
      }
    })
    setDataList(formattedData);
    setAllData(formattedData);
    setLoading(false);
  };

  const onChangeHandle = (e: any) => {
    const val = e.target.value;
    if (val === '') {
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

  const RightSideComponent = useMemo(
    () => (
      <div className='text-sm text-gray-500 space-x-4 flex items-center'>
        <button
          onClick={handleActiveClick}
          className={`${!getDataArchiveType ? 'bg-primary_color text-white' : 'bg-gray-400 text-white'} px-3 py-2 rounded-md`}
        >
          Active
        </button>
        <button
          onClick={handleArchiveClick}
          className={`${getDataArchiveType ? 'bg-primary_color text-white' : 'bg-gray-400 text-white'} px-3 py-2 rounded-md`}
        >
          Archive
        </button>

      </div>
    ),
    [getDataArchiveType, handleActiveClick, handleArchiveClick]
  );

  return (
    <main className="w-full h-full font-[500] text-[20px]">
      <div className='w-full min-h-[81dvh] h-[100%] overflow-auto py-2 px-2'>
        <InventoryCards archived={getDataArchiveType} />
        <TableComponent
          tableHeight='h-[71.5dvh]'
          tableBodyHeight='h-[12dvh]'
          tableHeader={tableHeader}
          loading={loading}
          dataList={dataList}
          searchInputplaceholder="Search by product id"
          searchHandle={onChangeHandle}
          RightSideComponent={() => RightSideComponent}
        />
      </div>
    </main>
  );
};

export default StockPanel;
