'use client';
import React, { useContext, useEffect, useState } from "react";
import { fetch_content_service } from "@/utils/supabase/data_services/data_services";
import { Searchable_Dropdown } from "@/components/Searchable_Dropdown";
import { LocationContext } from "@/context";

const TransactionsPage = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const { selectedLocation } = useContext(LocationContext);

  // Fetch all patients for dropdown
  useEffect(() => {
    const fetchPatients = async () => {
      setLoadingPatients(true);
      try {
        const data = await fetch_content_service({
          table: "allpatients",
          matchCase:{
            key: "locationid",
            value: selectedLocation.id,
          }
        });
        setPatients(data || []);
      } catch (err) {
        setPatients([]);
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, [selectedLocation]);

  // Fetch selected patient details and credit balance
  useEffect(() => {
    if (!selectedPatientId) {
      setSelectedPatient(null);
      setCreditBalance(null);
      setTransactions([]);
      return;
    }
    
    const fetchPatientDetails = async () => {
      const patient = patients.find((p) => p.id === selectedPatientId);
      setSelectedPatient(patient || null);
      
      // Fetch credit balance for the selected patient
      try {
        const creditData = await fetch_content_service({
          table: "credit_audit",
          matchCase: { key: "patient_id", value: selectedPatientId }
        });
        
        if (creditData && creditData.length > 0) {
          setCreditBalance(creditData[0].balance);
        } else {
          setCreditBalance(0);
        }
      } catch (err) {
        setCreditBalance(0);
      }
    };
    
    fetchPatientDetails();
  }, [selectedPatientId, patients]);

  // Fetch transactions for selected patient
  useEffect(() => {
    if (!selectedPatientId) {
      setTransactions([]);
      return;
    }
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const data = await fetch_content_service({
          table: "transaction_history",
          selectParam: "*",
          matchCase: { key: "patient_id", value: selectedPatientId },
        //   orderBy: { column: "created_at", ascending: false },
        });
        setTransactions(data || []);
      } catch (err) {
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [selectedPatientId]);

  // Dropdown options
  const patientOptions = patients.map((p) => ({
    value: p.id,
    label: `${p.firstname} ${p.lastname} - (${p.email})`,
  }));

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Transactions</h1>
      <div className="mb-4 max-w-lg">
        <Searchable_Dropdown
          options_arr={patientOptions}
          value={selectedPatientId || ''}
          on_change_handle={(e: any) => setSelectedPatientId(Number(e.target.value))}
          label="Select Patient"
          start_empty={true}
        />
      </div>
      {selectedPatient && (
        <div className="mb-4 p-3 rounded bg-gray-100 dark:bg-gray-800">
          <div className="font-semibold text-lg mb-1">
            {selectedPatient.firstname} {selectedPatient.lastname}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <span className="mr-4">Phone: {selectedPatient.phone}</span>
            <span className="mr-4">Email: {selectedPatient.email}</span>
            <span className="mr-4">Treatment Type: {selectedPatient.treatmenttype}</span>
            <span className={`font-semibold ${creditBalance && creditBalance < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              Current Balance: {creditBalance && creditBalance < 0 ? '-' : ''}${Math.abs(creditBalance || 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 border rounded">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Amount</th>
                <th className="px-4 py-2 border">Balance</th>
                <th className="px-4 py-2 border">Treatment Type</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx: any) => (
                <tr key={tx.id}>
                  <td className="px-4 py-2 border">{tx.created_at ? new Date(tx.created_at).toLocaleString() : "-"}</td>
                  <td className="px-4 py-2 border">${tx.amount?.toFixed(2)}</td>
                  <td className="px-4 py-2 border">${tx.balance?.toFixed(2)}</td>
                  <td className="px-4 py-2 border">{tx.type}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-400">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage; 