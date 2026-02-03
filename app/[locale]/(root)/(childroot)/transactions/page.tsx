"use client"

import { useContext, useEffect, useState } from "react"
import { fetch_content_service } from "@/utils/supabase/data_services/data_services"
import { LocationContext } from "@/context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
// import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "react-i18next"
import { translationConstant } from "@/utils/translationConstants"
import { Plus, Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Phone, Mail, User, DollarSign } from "lucide-react"

const TransactionsPage = () => {
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [patientCreditBalances, setPatientCreditBalances] = useState<{[key: number]: number}>({})
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchBy, setSearchBy] = useState("All")
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [patientsPerPage] = useState(6)
  const { selectedLocation } = useContext(LocationContext)

  useEffect(() => {
    const fetchPatients = async () => {
      setLoadingPatients(true)
      try {
        const data = await fetch_content_service({
          table: "allpatients",
          matchCase: {
            key: "locationid",
            value: selectedLocation.id,
          },
        })
        setPatients(data || [])
        
         if (data && data.length > 0) {
           const balances: {[key: number]: number} = {}
           
           const batchSize = 10
           for (let i = 0; i < data.length; i += batchSize) {
             const batch = data.slice(i, i + batchSize)
             
             const batchPromises = batch.map(async (patient) => {
               try {
                 const creditData = await fetch_content_service({
                   table: "credit_audit",
                   matchCase: { key: "patient_id", value: patient.id },
                 })
                 return {
                   patientId: patient.id,
                   balance: creditData && creditData.length > 0 ? creditData[0].balance : 0
                 }
               } catch (err) {
                 return {
                   patientId: patient.id,
                   balance: 0
                 }
               }
             })
             
             const batchResults = await Promise.all(batchPromises)
             
             // Add results to balances object
             batchResults.forEach(result => {
               balances[result.patientId] = result.balance
             })
           }
           
           setPatientCreditBalances(balances)
         }
      } catch (err) {
        setPatients([])
      } finally {
        setLoadingPatients(false)
      }
    }
    fetchPatients()
  }, [selectedLocation])

  const fetchPatientTransactions = async (patientId: number) => {
    setLoading(true)
    try {
      const data = await fetch_content_service({
        table: "transaction_history",
        selectParam: "*",
        matchCase: { key: "patient_id", value: patientId },
      })
      setTransactions(data || [])
    } catch (err) {
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const handlePatientClick = (patient: any) => {
    setSelectedPatient(patient)
    fetchPatientTransactions(patient.id)
    setIsSheetOpen(true)
  }

  const filteredPatients = patients.filter((patient) => {
    const searchLower = searchTerm.toLowerCase()
    switch (searchBy) {
      case "Name":
        return `${patient.firstname} ${patient.lastname}`.toLowerCase().includes(searchLower)
      case "Email":
        return patient.email?.toLowerCase().includes(searchLower)
      case "Phone":
        return patient.phone?.toLowerCase().includes(searchLower)
      case "Treatment Type":
        return patient.treatmenttype?.toLowerCase().includes(searchLower)
      default:
        return (
          `${patient.firstname} ${patient.lastname}`.toLowerCase().includes(searchLower) ||
          patient.email?.toLowerCase().includes(searchLower) ||
          patient.phone?.toLowerCase().includes(searchLower) ||
          patient.treatmenttype?.toLowerCase().includes(searchLower)
        )
    }
  })

  const indexOfLastPatient = currentPage * patientsPerPage
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient)
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, searchBy])

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const { t } = useTranslation(translationConstant.TRANSACTION)

  const generateTransactionId = (index: number) => `TXN${String(index + 1).padStart(3, "0")}`

  const getTransactionStatus = (transaction: any) => {
    const statuses = ["Completed", "Pending", "Partial"]
    return statuses[Math.floor(Math.random() * statuses.length)]
  }

  const getPaymentMethod = (transaction: any) => {
    const methods = ["Credit Card", "Cash", "Insurance", "Bank Transfer"]
    return methods[Math.floor(Math.random() * methods.length)]
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default"
      case "pending":
        return "secondary"
      case "partial":
        return "outline"
      default:
        return "default"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "partial":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

    return (
    <div className="p-6 max-w-7xl mx-auto dark:bg-[#0e1725] dark:text-white">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t("Transaction_k1")}</h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">Patients / Transactions</div>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("Transaction_k14")}</span>
                                           <Select value={searchBy} onValueChange={setSearchBy}>
              <SelectTrigger className="w-32 bg-[#F1F4F9] dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                <SelectValue className="text-gray-900 dark:text-white" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <SelectItem value="All" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">{t("Transaction_k15")}</SelectItem>
                <SelectItem value="Name" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">{t("Transaction_k9")}</SelectItem>
                <SelectItem value="Email" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">{t("Transaction_k10")}</SelectItem>
                <SelectItem value="Phone" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">{t("Transaction_k11")}</SelectItem>
                <SelectItem value="Treatment Type" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">{t("Transaction_k5")}</SelectItem>
              </SelectContent>
            </Select>
          <span className="text-gray-400">=</span>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#F1F4F9] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
      </div>

      {loadingPatients ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500 dark:text-gray-300">Loading patients...</div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="bg-white dark:bg-[#0e1725] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-[#0e1725] dark:border-gray-700">
                    <TableHead className="font-semibold w-[200px] text-gray-500 dark:text-gray-400">{t("Transaction_k9")}</TableHead>
                    <TableHead className="font-semibold w-[180px] text-gray-500 dark:text-gray-400">{t("Transaction_k10")}</TableHead>
                    <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">{t("Transaction_k11")}</TableHead>
                    <TableHead className="font-semibold w-[150px] text-gray-500 dark:text-gray-400">{t("Transaction_k5")}</TableHead>
                    <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">{t("Transaction_k12")}</TableHead>
                    <TableHead className="font-semibold w-[160px] text-gray-500 dark:text-gray-400">{t("Transaction_k13")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="dark:bg-[#0e1725]">
                  {currentPatients.length > 0 ? (
                    currentPatients.map((patient) => {
                      const balance = patientCreditBalances[patient.id] || 0
                      return (
                        <TableRow 
                          key={patient.id} 
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-[#0e1725] cursor-pointer"
                          onClick={() => handlePatientClick(patient)}
                        >
                          <TableCell className="font-medium dark:text-white">
                            {(() => {
                              const fullName = `${patient.firstname} ${patient.lastname}`.trim()
                              const nameParts = fullName.split(' ')
                              return nameParts.length > 2 ? `${nameParts[0]} ${nameParts[1]}...` : fullName
                            })()}
                          </TableCell>
                          <TableCell className="dark:text-white">
                            {(() => {
                              const email = patient.email || "-"
                              if (email === "-") return email
                              const atIndex = email.indexOf('@')
                              return atIndex > 0 ? email.substring(0, atIndex) + "..." : email
                            })()}
                          </TableCell>
                          <TableCell className="dark:text-white">
                            {patient.phone || "-"}
                          </TableCell>
                          <TableCell className="dark:text-white">{patient.treatmenttype || "-"}</TableCell>
                          <TableCell>
                            <span
                              className={`font-semibold ${
                                balance < 0
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-green-600 dark:text-green-400"
                              }`}
                            >
                              ${Math.abs(balance).toFixed(2)}
                            </span>
                          </TableCell>
                                                     <TableCell>
                             <Button 
                               variant="outline" 
                               size="sm"
                               className="bg-blue-600 text-white dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 border-blue-600 dark:border-blue-700"
                               onClick={(e) => {
                                 e.stopPropagation()
                                 handlePatientClick(patient)
                               }}
                             >
                               <Eye className="w-4 h-4 mr-1 text-white" />
                               <span className="text-white">{t("Transaction_k21")}</span>
                             </Button>
                           </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400 dark:text-gray-300">
                        No patients found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {currentPatients.length > 0 ? (
              currentPatients.map((patient) => {
                const balance = patientCreditBalances[patient.id] || 0
                return (
                  <Card 
                    key={patient.id} 
                    className="border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-[#0e1725]"
                    onClick={() => handlePatientClick(patient)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base font-semibold dark:text-white">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {patient.firstname} {patient.lastname}
                          </div>
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 gap-3 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500 dark:text-gray-400">Email:</span>
                          <span className="dark:text-white">{patient.email || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                          <span className="dark:text-white">{patient.phone || "-"}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Treatment Type:</span>
                          <span className="ml-2 dark:text-white">{patient.treatmenttype || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500 dark:text-gray-400">Current Balance:</span>
                          <span
                            className={`font-semibold ${
                              balance < 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            ${Math.abs(balance).toFixed(2)}
                          </span>
                        </div>
                      </div>
                                                                      <div className="flex justify-end">
                           <Button 
                             variant="outline" 
                             size="sm"
                             className="bg-blue-600 text-white dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 border-blue-600 dark:border-blue-700"
                             onClick={(e) => {
                               e.stopPropagation()
                               handlePatientClick(patient)
                             }}
                           >
                             <Eye className="w-4 h-4 mr-1 text-white" />
                             <span className="text-white">View Transactions</span>
                           </Button>
                         </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-400 dark:text-gray-300">No patients found</div>
            )}
          </div>

          {/* Pagination */}
          {filteredPatients.length > 0 && (
            <div className="mt-3 flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {indexOfFirstPatient + 1} to {Math.min(indexOfLastPatient, filteredPatients.length)} of {filteredPatients.length} patients
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Transaction Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto dark:bg-[#0e1725] dark:border-gray-700">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold dark:text-white">
              {selectedPatient ? `${selectedPatient.firstname} ${selectedPatient.lastname} - Transactions` : "Transaction Details"}
            </SheetTitle>
          </SheetHeader>
          
          {selectedPatient && (
            <div className="mt-6">
              {/* Transactions List */}
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-300">Loading transactions...</div>
                  </div>
                ) : transactions.length > 0 ? (
                  transactions.map((tx: any, index: number) => {
                    const status = getTransactionStatus(tx)
                    const paymentMethod = getPaymentMethod(tx)
                    return (
                      <div key={tx.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Transaction ID:</span>
                            <span className="font-semibold dark:text-white">{generateTransactionId(index)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600 dark:text-gray-400">{t("Transaction_k3")}:</span>
                            <span className="dark:text-white">{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "-"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600 dark:text-gray-400">{t("Transaction_k4")}:</span>
                            <span className="font-semibold dark:text-white">${tx.amount?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600 dark:text-gray-400">{t("Transaction_k6")}:</span>
                            <span className="dark:text-white">${tx.balance?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Treatment Type:</span>
                            <span className="dark:text-white">{tx.type}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              {status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Payment Method:</span>
                            <span className="dark:text-white">{paymentMethod}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Actions:</span>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-300">
                    {t("Transaction_k8")}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default TransactionsPage
