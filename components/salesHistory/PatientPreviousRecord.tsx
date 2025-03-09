import { CircularProgress } from '@mui/material';
import React, { useState } from 'react';
import axios from 'axios';
import { TableRowRender } from './RenderRow';

interface PatientRecord {
  id: number;
  description: string;
}

interface PatientPreviousRecordInterface {
  patientId: number;
  currentOrderId: number;
}

const PatientPreviousRecord: React.FC<PatientPreviousRecordInterface> = ({ patientId, currentOrderId }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [historyData, setHistoryData] = useState<DataListInterface[] | null>(null);

  console.log({ historyData })

  const fetchHistory = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.post('/api/previous-order-history',
        { patientId, currentOrderId },
      );
      setHistoryData(response.data.data);
    } catch (error) {
      console.error('Error fetching patient history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='text-center py-3'>
      {loading ? (
        <CircularProgress />
      ) : historyData ? (
        <PatientHistory data={historyData} orderId={currentOrderId} />
      ) : (
        <button onClick={fetchHistory} className='text-gray-600 underline text-sm'>
          View Previous History
        </button>
      )}
    </div>
  );
};

interface PatientHistoryProps {
  data: DataListInterface[];
  orderId: number
}

const PatientHistory: React.FC<PatientHistoryProps> = ({ data, orderId }) => (
  <div className='py-2 rounded-md'>
    <h3 className='text-lg font-semibold mb-2'>Previous Orders History</h3>
    <div className='mb-4'>
      {
        data?.map((elem: DataListInterface, index: number) => (

          <TableRowRender preDefinedReasonList={[]} hasReturnedHandle={() => { }} isAnyReturned={true} key={index} dataList={elem} order_id={orderId} />
        ))
      }
    </div>
  </div>
);

export default PatientPreviousRecord;
