"use client";

import React, { useState, useEffect, useContext } from "react";
import moment from "moment";
import { fetch_content_service } from "@/utils/supabase/data_services/data_services";
import { currencyFormatHandle } from "@/helper/common_functions";
import OrderDetailsModal from "./OrderDetailsModal"; // Import the modal
import TableComponent from "@/components/TableComponent";
import ExportAsPDF from "@/components/ExportPDF";
import { LocationContext } from "@/context";

interface DataListInterface {
  [key: string]: any; // This allows dynamic property access
}

const tableHeader = [
  // Same table headers as before
  {
    id: "order_id",
    label: "Order ID",
    align: "text-center",
    flex: "flex-1",
  },
  {
    id: "order_date",
    label: "Date",
    render_value: (val: string, elem: any) =>
      moment(val, "YYYY-MM-DD h:mm s").format("DD-MMMM-YYYY"),
  },
  {
    id: "name",
    label: "Patient Name",
    render_value: (val: any, elem?: any) =>
      `${elem?.pos?.firstname} ${elem?.pos?.lastname}`,
  },
  {
    id: "total_price",
    label: "Total Amount",
    render_value: (val: any, elem?: any) => {
      const totalVal = elem.sales_history?.reduce(
        (a: number, b: { total_price: number }) => a + b?.total_price,
        0
      );
      return currencyFormatHandle(totalVal);
    },
  },
  {
    id: "payment_type",
    label: "Payment Type",
    render_value: (val: any, elem?: any) => "Cash", // static value for now
  },
  {
    id: "last_updated",
    label: "Action",
    render_value: (val: string, elem: any, openModal: Function) => (
      <button
        onClick={() => openModal(elem)}
        className="bg-[#B8C8E1] text-base px-2 py-1 rounded-md"
      >
        Details
      </button>
    ),
    align: "text-center",
    flex: "flex-1",
  },
];

// Format the data
const formattedData = (rawData: DataListInterface[]) => {
  return rawData.map((order) => {
    const { order_id, order_date, pos, sales_history } = order;
    const patientName = `${pos.firstname} ${pos.lastname}`;

    // Assuming there's one sales history per order
    const totalAmount = sales_history?.reduce(
      (total: number, sale: { total_price: number }) =>
        total + sale.total_price,
      0
    );
    return {
      orderId: String(order_id), // Convert order_id to string for table
      date: new Date(order_date).toLocaleDateString(), // Format date
      patientName,
      totalAmount: `$${totalAmount}`, // Format total amount
      paymentType: "Cash", // Hardcoded for now, can be dynamic if available
    };
  });
};
const SalesHistory = () => {
  const [dataList, setDataList] = useState<DataListInterface[]>([]);
  const [allData, setAllData] = useState<DataListInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DataListInterface | null>(
    null
  );

  // const { locations, set_location_handle, selected_location } = useLocationClinica({ defaultSetFirst: true })
  const { selectedLocation } = useContext(LocationContext);

  const [preDefinedReasonList, setPreDefinedReasonList] = useState([]);

  const fetchReasonsList = async () => {
    try {
      const fetched_data: any = await fetch_content_service({
        table: "returnreasons",
        language: "",
      });
      setPreDefinedReasonList(fetched_data || []);
    } catch (error) {
      // toast.error()
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetch_handle = async (location_id: number) => {
    setLoading(true);
    const fetched_data = await fetch_content_service({
      table: "orders",
      language: "",
      selectParam: `,pos:pos (
        lastname,
        firstname,
        locationid
      ),
      sales_history (
        sales_history_id,
        inventory_id,
        date_sold,
        quantity_sold,
        total_price
      )
    `,
      matchCase: {
        key: "pos.locationid",
        value: location_id,
      },
    });

    const filteredData = fetched_data.filter((elem) => elem.pos !== null);
    setDataList(filteredData);
    setAllData(filteredData);
    setLoading(false);
  };

  const openModal = (orderDetails: DataListInterface) => {
    setSelectedOrder(orderDetails);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedOrder(null);
  };

  const onChangeHandle = (e: any) => {
    const val = e.target.value;
    if (val === "") {
      setDataList([...allData]);
    } else {
      const filteredData = allData.filter((elem) => elem.order_id === +val);
      setDataList([...filteredData]);
    }
  };

  useEffect(() => {
    if (selectedLocation) {
      fetch_handle(selectedLocation.id);
    }
  }, [selectedLocation]);

  useEffect(() => {
    fetchReasonsList();
  }, []);

  return (
    <main className="w-full h-full font-[500] text-[20px]">
      <div className="flex justify-between items-center px-4 py-4 space-x-2">
        <h1 className="text-xl font-bold">Sales History</h1>
        <div className="flex items-center space-x-3">
          <ExportAsPDF />
        </div>
      </div>

      <div className="w-full min-h-[82dvh] h-[100%] overflow-auto py-2 px-2">
        <TableComponent
          tableHeader={tableHeader}
          loading={loading}
          dataList={dataList}
          openModal={openModal}
          searchHandle={onChangeHandle}
        />
      </div>

      {/* Modal */}
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
