'use client';

import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import moment from 'moment';
import { fetch_content_service } from '@/utils/supabase/data_services/data_services';
import { currencyFormatHandle } from '@/helper/common_functions';
import OrderDetailsModal from '../../../../../../components/salesHistory/OrderDetailsModal';
import TableComponent from '@/components/TableComponent';
import ExportAsPDF from '@/components/ExportPDF';
import { LocationContext } from '@/context';
import { useTranslation } from 'react-i18next';
import { translationConstant } from '@/utils/translationConstants';
import { TabContext } from "@/context";


interface DataListInterface {
  [key: string]: any; 
}

const tableHeader = [
  {
    id: 'order_id',
    label: 'POS-Historyk4',
    align: 'text-center',
    flex: 'flex-1',
  },
  {
    id: 'order_date',
    label: 'POS-Historyk5',
    render_value: (val: string) => moment(val, 'YYYY-MM-DD HH:mm:ss').subtract(6, 'hours').format('DD-MMMM-YYYY'),

  },
  {
    id: 'name',
    label: 'POS-Historyk6',
    render_value: (val: any, elem?: any) => `${elem?.pos?.firstname} ${elem?.pos?.lastname}`,
  },
  {
    id: 'total_price',
    label: 'POS-Historyk7',
    render_value: (val: any, elem?: any) => {
      const totalVal = elem.sales_history?.reduce((a: number, b: { total_price: number }) => a + b?.total_price, 0);
      return currencyFormatHandle(totalVal);
    },
  },
  {
    id: 'payment_type',
    label: 'POS-Historyk8',
    render_value: (_val: string, elem: any,) => elem?.sales_history?.[0]?.paymentcash ? "Cash" : "Debit",  
  },
  {
    id: 'last_updated',
    label: 'POS-Historyk9',
    render_value: (_val: string, elem: any, openModal: Function) => (
      <button onClick={() => openModal(elem)} className='bg-blue-900 text-base text-blue-300 border-2 border-blue-600 px-2 py-1 rounded-md hover:bg-blue-800'>
        Details
      </button>
    ),
    align: 'text-center',
    flex: 'flex-1',
  },
];

const SalesHistory = () => {
  const [dataList, setDataList] = useState<DataListInterface[]>([]);
  const [allData, setAllData] = useState<DataListInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DataListInterface | null>(null);
  const { selectedLocation } = useContext(LocationContext);
  const [preDefinedReasonList, setPreDefinedReasonList] = useState([]);

  const fetchReasonsList = useCallback(async () => {
    try {
      
      const fetched_data = await fetch_content_service({
        table: 'returnreasons',
        language: '',
      });
      // @ts-ignore
      setPreDefinedReasonList(fetched_data || []);
    } catch (error) {
      console.error('Error fetching return reasons', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetch_handle = useCallback(async (location_id: number) => {
    setLoading(true);
    try {
      const fetched_data = await fetch_content_service({
        table: 'orders',
        language: '',
        selectParam: `,pos:pos (
          lastname,
          firstname,
          locationid,
          patientid
        ),
        sales_history (
          sales_history_id,
          inventory_id,
          date_sold,
          quantity_sold,
          total_price,
          paymentcash
        )`,
        matchCase: {
          key: 'pos.locationid',
          value: location_id,
        },
      });
      const filteredData = fetched_data.filter((elem) => elem.pos !== null);
      setDataList(filteredData);
      setAllData(filteredData);
    } catch (error) {
      console.error('Error fetching sales history', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetch_handle(selectedLocation.id);
    }
  }, [selectedLocation, fetch_handle]);

  useEffect(() => {
    fetchReasonsList();
  }, [fetchReasonsList]);

  const openModal = useCallback((orderDetails: DataListInterface) => {
    setSelectedOrder(orderDetails);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedOrder(null);
  }, []);

  const onChangeHandle = useCallback((e: any) => {
    const val = e.target.value;
    if (val === '') {
      setDataList([...allData]);
    } else {
      const filteredData = allData.filter((elem) => elem.order_id === +val);
      setDataList(filteredData);
    }
  }, [allData]);

  const {t} = useTranslation(translationConstant.POSHISTORY)

  const { setActiveTitle } = useContext(TabContext); 

  useEffect(() => {
    setActiveTitle("Sidebar_k21");
  }, []);

  return (
    <main className="w-full h-full font-[500] bg-gray-900 text-gray-200">
      <div className='flex justify-between items-center px-4 pt-4 space-x-2'>
        <div>
          <h1 className="text-2xl font-bold text-gray-200">History</h1>
          <h1 className="mt-1 mb-2 text-gray-400">POS / History</h1>
        </div>
        <div className='flex items-center space-x-3'>
          <ExportAsPDF />
        </div>
      </div>

      <div className='w-full min-h-[82dvh] h-[100%] overflow-auto px-4'>
        <TableComponent
          tableHeader={tableHeader}
          loading={loading}
          dataList={dataList}
          openModal={openModal}
          searchHandle={onChangeHandle}
          searchInputplaceholder={t("POS-Historyk3")}
        />
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          preDefinedReasonList={preDefinedReasonList}
          isOpen={modalOpen}
          onClose={closeModal}
          orderDetails={selectedOrder}
        />
      )}
    </main>
  );
};

export default SalesHistory;