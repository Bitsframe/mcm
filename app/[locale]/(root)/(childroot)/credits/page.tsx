"use client"
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
        const creditsData: CreditData[] = await fetch_content_service({
          table: "credit_audit",
          selectParam: ", patientData:allpatients(*)",
          matchCase: [{ key: "patientData.locationid", value: selectedLocation.id }],
          filterOptions: [{ operator: "not", column: "patientData", value: null }],
        })
        setCredits(creditsData)
        const total = creditsData.reduce((sum: number, credit: CreditData) => sum + credit.balance, 0)
        setTotalAmount(total)

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
      <main className="w-full min-h-screen flex flex-col items-start pt-4 px-2 sm:pt-6 sm:px-4 md:pt-8 md:px-6 space-y-3 sm:space-y-4 md:space-y-6">
        <div className="w-full flex justify-center py-4 sm:py-6">
          <CircularProgress size={32} className="sm:size-40" />
        </div>

        <section className="w-full shadow-sm border border-opacity-50 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 p-3 sm:p-4">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            <h2 className="text-base sm:text-lg md:text-xl font-semibold">Location Credit Limits</h2>
          </div>
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6">
              <div className="bg-[#F1F4F9] dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-lg shadow-sm">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Credit Limit</span>
                </p>
                <div className="h-6 sm:h-8 w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-2"></div>
              </div>
              <div className="bg-[#F1F4F9] dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-lg shadow-sm">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <BadgeDollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Current Balance</span>
                </p>
                <div className="h-6 sm:h-8 w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-2"></div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full shadow-sm border border-opacity-50 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 p-3 sm:p-4">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            <h2 className="text-base sm:text-lg md:text-xl font-semibold">{t("Credits_k1")}</h2>
          </div>
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 md:gap-6">
              <div className="bg-[#F1F4F9] dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-lg shadow-sm">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <BadgeDollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{t("Credits_k2")}</span>
                </p>
                <div className="h-6 sm:h-8 w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-2"></div>
              </div>
              <div className="bg-[#F1F4F9] dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-lg shadow-sm">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{t("Credits_k3")}</span>
                </p>
                <div className="h-6 sm:h-8 w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-2"></div>
              </div>
              <div className="bg-[#F1F4F9] dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-lg shadow-sm">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{t("Credits_k4")}</span>
                </p>
                <div className="h-6 sm:h-8 w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-2"></div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full shadow-sm border border-opacity-50 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 p-3 sm:p-4">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            <h2 className="text-base sm:text-lg md:text-xl font-semibold">{t("Credits_k5")}</h2>
          </div>
          <div className="p-0 sm:p-3 md:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead className="font-medium text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">{t("Credits_k6")}</TableHead>
                    <TableHead className="font-medium text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">{t("Credits_k7")}</TableHead>
                    <TableHead className="font-medium text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">{t("Credits_k8")}</TableHead>
                    <TableHead className="font-medium text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">{t("Credits_k9")}</TableHead>
                    <TableHead className="font-medium text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">{t("Credits_k10")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, index) => (
                    <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell className="text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">
                        <div className="h-4 w-12 sm:w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">
                        <div className="h-4 w-24 sm:w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">
                        <div className="space-y-1 sm:space-y-2">
                          <div className="h-4 w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                          <div className="h-4 w-28 sm:w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">
                        <div className="h-4 w-16 sm:w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">
                        <div className="h-4 w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="w-full flex flex-col items-start p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4 md:space-y-6">
      <section className="w-full shadow-sm dark:bg-[#0e1725] dark:border-[#172945] border border-opacity-50 rounded-lg p-3 sm:p-4 transition-all hover:shadow-md">
        <div className="flex items-center gap-2 p-3 sm:p-4">
          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
          <h2 className="text-sm sm:text-base md:text-lg font-semibold">{t("Credits_k11")}</h2>
        </div>
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6">
            <div className="bg-gray-50 dark:bg-[#080e16] p-3 sm:p-4 md:p-6 rounded-lg shadow-sm hover:shadow transition-all">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                {t("Credits_k12")}
              </p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">
                {locationData ? formatCurrency(locationData.credit_limit) : "$0.00"}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-[#080e16] p-3 sm:p-4 md:p-6 rounded-lg shadow-sm hover:shadow transition-all">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <BadgeDollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                {t("Credits_k13")}
              </p>
              <p className={`text-lg sm:text-xl md:text-2xl font-bold mt-1 sm:mt-2 ${
                locationData?.balance && locationData.balance < 0 
                  ? "text-red-600 dark:text-red-400" 
                  : "text-gray-900 dark:text-white"
              }`}>
                {locationData ? formatCurrency(locationData.balance) : "$0.00"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full shadow-sm dark:bg-[#0e1725] dark:border-[#172945] border border-opacity-50 rounded-lg p-3 sm:p-4 transition-all hover:shadow-md">
        <div className="flex items-center gap-2 p-3 sm:p-4">
          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
          <h2 className="text-sm sm:text-base md:text-lg font-semibold">{t("Credits_k15")}</h2>
        </div>
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 md:gap-6">
            <div className="bg-gray-50 dark:bg-[#080e16] p-3 sm:p-4 md:p-6 rounded-lg shadow-sm hover:shadow transition-all">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <BadgeDollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                {t("Credits_k16")}
              </p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-[#080e16] p-3 sm:p-4 md:p-6 rounded-lg shadow-sm hover:shadow transition-all">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                {t("Credits_k3")}
              </p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">
                {credits.length}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-[#080e16] p-3 sm:p-4 md:p-6 rounded-lg shadow-sm hover:shadow transition-all">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                {t("Credits_k17")}
              </p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">
                {formatCurrency(totalAmount / (credits.length || 1))}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full dark:bg-[#0e1725] dark:border-[#172945] shadow-sm border border-opacity-50 rounded-lg p-3 sm:p-4 transition-all hover:shadow-md">
        <div className="flex items-center gap-2 p-3 sm:p-4">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
          <h2 className="text-sm sm:text-base md:text-lg font-semibold">{t("Credits_k5")}</h2>
        </div>
        <div className="p-0 sm:p-3 md:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-[#0e1725] border-t border-x rounded-lg border-gray-200 dark:border-[#172945]">
                  <TableHead className="font-medium text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">{t("Credits_k6")}</TableHead>
                  <TableHead className="font-medium text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">{t("Credits_k7")}</TableHead>
                  <TableHead className="font-medium text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">{t("Credits_k8")}</TableHead>
                  <TableHead className="font-medium text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">{t("Credits_k9")}</TableHead>
                  <TableHead className="font-medium text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">{t("Credits_k10")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 sm:py-8 md:py-10">
                      <div className="flex flex-col items-center justify-center space-y-1 sm:space-y-2">
                        <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-gray-400" />
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">No credits found</p>
                        <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                          There are no credit records available at the moment.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  credits.map((credit) => (
                    <TableRow key={credit.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <TableCell className="font-medium text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">
                        {credit.id}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">
                        <div className="line-clamp-1">
                          {credit.patientData?.firstname} {credit.patientData?.lastname}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">
                        <div className="space-y-1">
                          <p className="font-medium truncate max-w-[100px] sm:max-w-none">
                            {formatPhoneNumber(credit.patientData?.phone)}
                          </p>
                          <p className="text-gray-500 truncate max-w-[100px] sm:max-w-none">
                            {credit.patientData?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell
                        className={`text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2 font-medium ${
                          credit.balance < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {formatCurrency(credit.balance)}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2 text-gray-600 dark:text-gray-300">
                        {moment(credit.created_at).format("MMM DD, YYYY")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Credits