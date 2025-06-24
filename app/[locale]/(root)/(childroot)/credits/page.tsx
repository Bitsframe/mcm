"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTranslation } from "react-i18next"
import { translationConstant } from "@/utils/translationConstants"
import { useContext, useEffect, useState } from "react"
import { fetch_content_service } from "@/utils/supabase/data_services/data_services"
import { CircularProgress } from "@mui/material"
import { formatPhoneNumber } from "@/utils/getCountryName"
import moment from "moment"
import { LocationContext } from "@/context"
import { BadgeDollarSign, CreditCard, Users, Building2 } from "lucide-react"

interface CreditData {
  id: number
  created_at: string
  patient_id: number
  balance: number
  patientData: {
    firstname: string
    lastname: string
    phone: string
    email: string
  }
}

interface LocationData {
  id: number
  title: string
  credit_limit: number
  balance: number
}

const Credits = () => {
  const { t } = useTranslation(translationConstant.CREDITS)
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState<CreditData[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const { selectedLocation } = useContext(LocationContext)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch credits data
        const creditsData: CreditData[] = await fetch_content_service({
          table: "credit_audit",
          selectParam: ", patientData:allpatients(*)",
          matchCase: [{ key: "patientData.locationid", value: selectedLocation.id }],
          filterOptions: [{ operator: "not", column: "patientData", value: null }],
        })
        setCredits(creditsData)
        const total = creditsData.reduce((sum: number, credit: CreditData) => sum + credit.balance, 0)
        setTotalAmount(total)

        // Fetch location data for credit limit and balance
        const locationResponse = await fetch_content_service({
          table: "Locations",
          matchCase: { key: "id", value: selectedLocation.id },
          selectParam: "id, title, credit_limit, balance"
        })
        
        if (locationResponse && locationResponse.length > 0) {
          setLocationData(locationResponse[0])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (selectedLocation?.id) {
      fetchData()
    }
  }, [selectedLocation?.id])

  const formatCurrency = (amount: number) => {
    return amount < 0 ? `-$${Math.abs(amount).toFixed(2)}` : `$${amount.toFixed(2)}`
  }

  if (loading) {
    return (
      <main className="w-full min-h-screen flex-col flex justify-start items-start pt-20 p-4 md:p-6 lg:p-8 space-y-6">
        <div className="w-full max-w-5xl flex items-center justify-center mb-4">
          <CircularProgress size={40} />
        </div>

        {/* Location Credit Limit Card - Loading State */}
        <Card className="w-full shadow-sm border-opacity-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-500" />
              <span>Location Credit Limits</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Credit Limit</span>
                </p>
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-2"></div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <BadgeDollarSign className="h-4 w-4" />
                  <span>Current Balance</span>
                </p>
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-2"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Credits Card - Loading State */}
        <Card className="w-full shadow-sm border-opacity-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-500" />
              <span>{t("Credits_k1")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <BadgeDollarSign className="h-4 w-4" />
                  <span>{t("Credits_k2")}</span>
                </p>
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-2"></div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{t("Credits_k3")}</span>
                </p>
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-2"></div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>{t("Credits_k4")}</span>
                </p>
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-2"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual Credits Table - Loading State */}
        <Card className="w-full shadow-sm border-opacity-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              <span>{t("Credits_k5")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 lg:p-8">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead className="font-medium">{t("Credits_k6")}</TableHead>
                    <TableHead className="font-medium">{t("Credits_k7")}</TableHead>
                    <TableHead className="font-medium">{t("Credits_k8")}</TableHead>
                    <TableHead className="font-medium">{t("Credits_k9")}</TableHead>
                    <TableHead className="font-medium">{t("Credits_k10")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, index) => (
                    <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell>
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="w-full flex-col flex justify-start items-start md:p-2 lg:p-4 space-y-6">
      {/* Location Credit Limit Card */}
      <Card className="w-full shadow-sm dark:bg-[#0e1725] dark:border-[#172945] border-opacity-50 transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-500" />
            Location Credit Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-[#080e16] p-6 rounded-lg shadow-sm hover:shadow transition-all">
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Credit Limit
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {locationData ? formatCurrency(locationData.credit_limit) : "$0.00"}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-[#080e16] p-6 rounded-lg shadow-sm hover:shadow transition-all">
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <BadgeDollarSign className="h-4 w-4" />
                Current Balance
              </p>
              <p className={`text-2xl font-bold mt-2 ${
                locationData?.balance && locationData.balance < 0 
                  ? "text-red-600 dark:text-red-400" 
                  : "text-gray-900 dark:text-white"
              }`}>
                {locationData ? formatCurrency(locationData.balance) : "$0.00"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Credits Card */}
      <Card className="w-full shadow-sm dark:bg-[#0e1725] dark:border-[#172945] border-opacity-50 transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gray-500" />
            Patients Credits Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-[#080e16] p-6 rounded-lg shadow-sm hover:shadow transition-all">
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <BadgeDollarSign className="h-4 w-4" />
                Total Patients Credit
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-[#080e16] p-6 rounded-lg shadow-sm hover:shadow transition-all">
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Patients
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{credits.length}</p>
            </div>
            <div className="bg-gray-50 dark:bg-[#080e16] p-6 rounded-lg shadow-sm hover:shadow transition-all">
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Average Credit
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {formatCurrency(totalAmount / (credits.length || 1))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Credits Table */}
      <Card className="w-full dark:bg-[#0e1725] dark:border-[#172945] shadow-sm border-opacity-50 transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            Individual Credits
          </CardTitle>
        </CardHeader>
        <CardContent className="py-0 sm:py-6 lg:py-8">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-[#0e1725] border-t border-x rounded-lg border-gray-200 dark:border-[#172945]">
                  <TableHead className="font-medium">Credit ID</TableHead>
                  <TableHead className="font-medium">Patient Name</TableHead>
                  <TableHead className="font-medium">Contact</TableHead>
                  <TableHead className="font-medium">Balance</TableHead>
                  <TableHead className="font-medium">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <CreditCard className="h-10 w-10 text-gray-400" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No credits found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          There are no credit records available at the moment.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  credits.map((credit) => (
                    <TableRow key={credit.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <TableCell className="font-medium">{credit.id}</TableCell>
                      <TableCell>
                        {credit.patientData?.firstname} {credit.patientData?.lastname}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{formatPhoneNumber(credit.patientData?.phone)}</p>
                          <p className="text-xs text-gray-500">{credit.patientData?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell
                        className={credit.balance < 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}
                      >
                        {formatCurrency(credit.balance)}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        {moment(credit.created_at).format("MMM DD, YYYY")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export default Credits
