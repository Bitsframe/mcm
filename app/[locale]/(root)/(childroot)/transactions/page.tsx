'use client';
import React, { useContext, useEffect, useState } from "react";
import { fetch_content_service } from "@/utils/supabase/data_services/data_services";
import { Searchable_Dropdown } from "@/components/Searchable_Dropdown";
import { LocationContext } from "@/context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

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
          matchCase: {
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
  const { t } = useTranslation(translationConstant.TRANSACTION);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{t("Transaction_k1")}</h1>
      <div className="mb-4 w-full max-w-lg">
        <Searchable_Dropdown
          options_arr={patientOptions}
          value={selectedPatientId || ''}
          on_change_handle={(e: any) => setSelectedPatientId(Number(e.target.value))}
          label={t("Transaction_k7")}
          start_empty={true}
        />
      </div>

      {selectedPatient && (
        <div className="mb-4 p-3 rounded bg-gray-100 dark:bg-gray-800">
          <div className="font-semibold text-lg mb-1">
            {selectedPatient.firstname} {selectedPatient.lastname}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 flex flex-wrap gap-2">
            <span>Phone: {selectedPatient.phone}</span>
            <span>Email: {selectedPatient.email}</span>
            <span>Treatment Type: {selectedPatient.treatmenttype}</span>
            <span className={`font-semibold ${creditBalance && creditBalance < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              Current Balance: {creditBalance && creditBalance < 0 ? '-' : ''}${Math.abs(creditBalance || 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div>Loading...</div>
        </div>
      ) : (
        <>
          {/* Desktop Table View (shadcn/ui Table) */}
          <div className="hidden md:block">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Transaction_k3")}</TableHead>
                    <TableHead>{t("Transaction_k4")}</TableHead>
                    <TableHead>{t("Transaction_k6")}</TableHead>
                    <TableHead>{t("Transaction_k5")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length > 0 ? (
                    transactions.map((tx: any) => (
                      <TableRow key={tx.id}>
                        <TableCell>{tx.created_at ? new Date(tx.created_at).toLocaleString() : "-"}</TableCell>
                        <TableCell>${tx.amount?.toFixed(2)}</TableCell>
                        <TableCell>${tx.balance?.toFixed(2)}</TableCell>
                        <TableCell>{tx.type}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-gray-400">
                        {t("Transaction_k8")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {transactions.length > 0 ? (
              transactions.map((tx: any) => (
                <Card key={tx.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {tx.created_at ? new Date(tx.created_at).toLocaleString() : "-"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">{t("Transaction_k4")}:</div>
                      <div>${tx.amount?.toFixed(2)}</div>
                      
                      <div className="text-muted-foreground">{t("Transaction_k6")}:</div>
                      <div>${tx.balance?.toFixed(2)}</div>
                      
                      <div className="text-muted-foreground">{t("Transaction_k5")}:</div>
                      <div>{tx.type}</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-4 text-gray-400">{t("Transaction_k8")}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionsPage;