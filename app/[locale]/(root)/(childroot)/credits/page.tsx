'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { useContext, useEffect, useState } from "react";
import { fetch_content_service } from "@/utils/supabase/data_services/data_services";
import { CircularProgress } from "@mui/material";
import { formatPhoneNumber } from "@/utils/getCountryName";
import moment from "moment";
import { useLocationClinica } from "@/hooks/useLocationClinica";
import { LocationContext } from "@/context";

interface CreditData {
  id: number;
  created_at: string;
  patient_id: number;
  balance: number;
  patientData: {
    firstname: string;
    lastname: string;
    phone: string;
    email: string;
  };
}

const Credits = () => {
  const { t } = useTranslation(translationConstant.POSHISTORY);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<CreditData[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const { selectedLocation } = useContext(LocationContext);

  console.log( selectedLocation )

  useEffect(() => {
    const fetchCredits = async () => {
      setLoading(true)
      try {
        const data: CreditData[] = await fetch_content_service({
          table: "credit_audit",
          selectParam:', patientData:allpatients(*)',
          matchCase: [{ key: "patientData.locationid", value: selectedLocation.id }],
          filterOptions: [{ operator: 'not', column: 'patientData', value: null }]
        });
        setCredits(data);
        const total = data.reduce((sum: number, credit: CreditData) => sum + credit.balance, 0);
        setTotalAmount(total);
      } catch (error) {
        console.error("Error fetching credits:", error);
      } finally {
        setLoading(false);
      }
    };

    if(selectedLocation?.id){

      console.log(selectedLocation)
      fetchCredits();
    }
  }, [selectedLocation?.id]);

  if (loading) {
    return (
      <main className="w-full h-full flex-col flex justify-start items-center mt-[80px] p-6 space-y-6">
        {/* Total Credits Card */}
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle>Total Credits Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Credits</p>
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Patients</p>
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Average Credit</p>
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual Credits Table */}
        <Card className="w-full md:max-w-4xl">
          <CardHeader>
            <CardTitle>Individual Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Credit ID</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div></TableCell>
                    <TableCell><div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div></TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      </div>
                    </TableCell>
                    <TableCell><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div></TableCell>
                    <TableCell><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="w-full h-full flex-col flex justify-start items-center mt-[80px] p-6 space-y-6">
      {/* Total Credits Card */}
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Total Credits Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Credits</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalAmount < 0 ? `-$${Math.abs(totalAmount).toFixed(2)}` : `$${totalAmount.toFixed(2)}`}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{credits.length}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Average Credit</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalAmount / (credits.length || 1) < 0 ? `-$${Math.abs(totalAmount / (credits.length || 1)).toFixed(2)}` : `$${(totalAmount / (credits.length || 1)).toFixed(2)}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Credits Table */}
      <Card className="w-full md:max-w-4xl">
        <CardHeader>
          <CardTitle>Individual Credits</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Credit ID</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="text-gray-500 dark:text-gray-400">No credits found</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">There are no credit records available at the moment.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                credits.map((credit) => (
                  <TableRow key={credit.id}>
                    <TableCell>{credit.id}</TableCell>
                    <TableCell>
                      {credit.patientData?.firstname} {credit.patientData?.lastname}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">{formatPhoneNumber(credit.patientData?.phone)}</p>
                        <p className="text-sm text-gray-500">{credit.patientData?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {credit.balance < 0 ? `-$${Math.abs(credit.balance).toFixed(2)}` : `$${credit.balance.toFixed(2)}`}
                    </TableCell>
                    <TableCell>{moment(credit.created_at).format("MMM DD, YYYY")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
};

export default Credits;