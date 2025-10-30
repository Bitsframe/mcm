"use client"

import { useEffect, useState } from "react"
import { fetchLocations, getTodaySalesGroupedByLocation, fetchAllSalesAndInventory } from "@/utils/sales/totalSales"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "react-i18next"
import { translationConstant } from "@/utils/translationConstants"
import { Plus, Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Phone, Mail, User, DollarSign } from "lucide-react"

const BonusPage = () => {
  // We'll fetch locations and today's totals and show them in the table
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [patientCreditBalances, setPatientCreditBalances] = useState<{[key: number]: number}>({})
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [totalsByLocation, setTotalsByLocation] = useState<Record<string, { locationId: string | number, total: number, count: number }>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [searchBy, setSearchBy] = useState("All")
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [patientsPerPage] = useState(6)
  const [bonusTypeByPatient, setBonusTypeByPatient] = useState<Record<string, string>>({})
  const [bonusValueByPatient, setBonusValueByPatient] = useState<Record<string, string>>({})
  const [bonusLimitByPatient, setBonusLimitByPatient] = useState<Record<string, string>>({})
  const [paidByPatient, setPaidByPatient] = useState<Record<string, boolean>>({})
  const [saveMessage, setSaveMessage] = useState<string>("")
  

  // Fetch locations and today's totals and populate the table
  useEffect(() => {
    const load = async () => {
      setLoadingPatients(true)
      try {
        const locs = await fetchLocations()
        setPatients(locs || [])
        const ids = (locs || []).map((l: any) => l.id).filter(Boolean)
        const totals = await getTodaySalesGroupedByLocation({ locationIds: ids })
        setTotalsByLocation(totals || {})
      } catch (err) {
        setPatients([])
        setTotalsByLocation({})
      } finally {
        setLoadingPatients(false)
      }
    }
    load()
  }, [])

  // Debug: fetch entire sales_history and inventory tables and log counts/samples
  useEffect(() => {
    const runFetchAll = async () => {
      try {
  const { salesRows, invRows } = await fetchAllSalesAndInventory()
      } catch (err) {
        console.error('[bonus page] fetchAllSalesAndInventory error:', err)
      }
    }
    runFetchAll()
  }, [])

  // removed fetchPatientTransactions per request

  // Modal triggers removed: do not open sheet on row/card/button clicks

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

  // Compute display-only bonus amount for a patient/location
  const computeBonusAmount = (patient: any) => {
    const total = (totalsByLocation[String(patient.id)]?.total) ?? 0
    const type = (bonusTypeByPatient[patient.id] ?? 'FLAT')
    const valStr = (bonusValueByPatient[patient.id] ?? '')
    const limitStr = (bonusLimitByPatient[patient.id] ?? '')

    const value = valStr === '' ? 0 : Number(valStr)
    const limit = limitStr === '' ? null : Number(limitStr)
    let amount = 0

    if (type === 'FLAT') {
      amount = isNaN(value) ? 0 : value
    } else {
      // PERCENTAGE
      const pct = isNaN(value) ? 0 : value
      amount = total * (pct / 100)
    }

    // If a bonus limit is provided, only allow bonus when total > limit
    // and cap the bonus to at most (total - limit). If total <= limit,
    // allowed bonus is 0.
    if (limit !== null && !isNaN(limit)) {
      const allowed = total > limit ? Math.max(0, total - limit) : 0
      amount = Math.min(amount, allowed)
    }

    return amount
  }

  // Today's display string for the Date column
  const todayStr = new Date().toLocaleDateString()

  // Save current bonus settings (temporary client-side persistence)
  const handleSave = () => {
    // Build array of bonus rows keyed by patient (location) id
    const bonuses: any[] = Object.keys(totalsByLocation).map((locId) => {
      const locationId = Number(locId)
      const bonus_limit = Number(bonusLimitByPatient[locId] ?? 0) || 0
      const flat_percentage = (bonusTypeByPatient[locId] ?? 'FLAT')
      const value = Number(bonusValueByPatient[locId] ?? 0) || 0
      const bonus_amount = computeBonusAmount({ id: locId })
      const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
      const paid = !!(paidByPatient[locId] ?? false)

      return {
        bonus_limit,
        flat_percentage,
        value,
        bonus_amount: Number(bonus_amount.toFixed(2)),
        date,
        paid,
        location_id: locationId,
      }
    })

    // POST to server API to persist bonuses. If fails, still store locally as fallback.
    ;(async () => {
      try {
        const resp = await fetch('/api/bonuses/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bonuses }),
        })
        const json = await resp.json()
        if (!resp.ok) {
          console.error('save API error', json)
          // fallback: save locally
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('bonusSettings', JSON.stringify({ bonuses }))
          }
          setSaveMessage('Save failed')
          setTimeout(() => setSaveMessage(''), 3000)
          return
        }

        setSaveMessage('Saved')
        setTimeout(() => setSaveMessage(''), 2000)
      } catch (err) {
        console.error('save API exception', err)
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('bonusSettings', JSON.stringify({ bonuses }))
        }
        setSaveMessage('Save failed')
        setTimeout(() => setSaveMessage(''), 3000)
      }
    })()
  }

    return (
    <div className="p-6 max-w-7xl mx-auto dark:bg-[#0e1725] dark:text-white">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Bonus</h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">Patients / Bonus</div>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Search by</span>
                                           <Select value={searchBy} onValueChange={setSearchBy}>
              <SelectTrigger className="w-32 bg-[#F1F4F9] dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                <SelectValue className="text-gray-900 dark:text-white" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <SelectItem value="All" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">All</SelectItem>
                <SelectItem value="Name" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">Name</SelectItem>
                <SelectItem value="Email" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">Email</SelectItem>
                <SelectItem value="Phone" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">Phone</SelectItem>
                <SelectItem value="Treatment Type" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">Treatment Type</SelectItem>
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
                    <TableHead className="font-semibold w-[200px] text-gray-500 dark:text-gray-400">Name</TableHead>
                    <TableHead className="font-semibold w-[180px] text-gray-500 dark:text-gray-400">Total Sales</TableHead>
                    <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Bonus Limit</TableHead>
                    <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Flat/Percentage</TableHead>
                    <TableHead className="font-semibold w-[150px] text-gray-500 dark:text-gray-400">Value</TableHead>
                    <TableHead className="font-semibold w-[150px] text-gray-500 dark:text-gray-400">Bonus amount</TableHead>
                    <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Date</TableHead>
                    <TableHead className="font-semibold w-[160px] text-gray-500 dark:text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="dark:bg-[#0e1725]">
                  {currentPatients.length > 0 ? (
                    currentPatients.map((patient) => {
                      const balance = patientCreditBalances[patient.id] || 0
                      return (
                        <TableRow 
                          key={patient.id} 
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-[#0e1725]"
                        >
                          <TableCell className="font-medium dark:text-white">
                            {patient.title || patient.name || `Location ${patient.id}`}
                          </TableCell>
                          <TableCell className="dark:text-white">
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              ${((totalsByLocation[String(patient.id)]?.total) ?? 0).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="dark:text-white">
                            {/* Bonus limit input (numeric only) */}
                            <input
                              type="text"
                              inputMode="decimal"
                              className="w-28 bg-transparent dark:bg-[#0e1725] text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 rounded px-2 py-1"
                              value={bonusLimitByPatient[patient.id] ?? ''}
                              onChange={(e) => {
                                e.stopPropagation()
                                let v = e.target.value.replace(/[^0-9.]/g, '')
                                const parts = v.split('.')
                                if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
                                // remove leading zeros unless decimal
                                if (/^0[0-9]/.test(v)) v = v.replace(/^0+/, '')
                                setBonusLimitByPatient((s) => ({ ...s, [String(patient.id)]: v }))
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell className="dark:text-white">
                            {/* Flat/Percentage select */}
                            <select
                              className="bg-transparent dark:bg-[#0e1725] text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 rounded px-2 py-1"
                              value={bonusTypeByPatient[patient.id] ?? 'FLAT'}
                              onChange={(e) => {
                                e.stopPropagation()
                                setBonusTypeByPatient((s) => ({ ...s, [String(patient.id)]: e.target.value }))
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <option value="FLAT">FLAT</option>
                              <option value="PERCENTAGE">PERCENTAGE</option>
                            </select>
                          </TableCell>
                          <TableCell className="dark:text-white">
                            {/* Value input: shows $ prefix for FLAT, % suffix for PERCENTAGE. Only numeric input allowed. */}
                            <div className="flex items-center">
                              <span className="mr-2 text-gray-700 dark:text-gray-300">
                                { (bonusTypeByPatient[patient.id] ?? 'FLAT') === 'FLAT' ? '$' : '' }
                              </span>
                              <input
                                type="text"
                                inputMode="decimal"
                                className="w-24 bg-transparent dark:bg-[#0e1725] text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 rounded px-2 py-1"
                                value={bonusValueByPatient[patient.id] ?? ''}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  // allow only digits and one decimal point
                                  let v = e.target.value.replace(/[^0-9.]/g, '')
                                  // collapse multiple dots
                                  const parts = v.split('.')
                                  if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
                                  // remove leading zeros unless decimal
                                  if (/^0[0-9]/.test(v)) v = v.replace(/^0+/, '')
                                  // if percentage selected, clamp between 0 and 100
                                  const type = (bonusTypeByPatient[patient.id] ?? 'FLAT')
                                  if (v !== '' && type === 'PERCENTAGE') {
                                    const num = Number(v)
                                    if (!isNaN(num)) {
                                      const clamped = Math.max(0, Math.min(100, num))
                                      v = String(clamped)
                                    }
                                  }
                                  setBonusValueByPatient((s) => ({ ...s, [String(patient.id)]: v }))
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                placeholder="0.00"
                              />
                              <span className="ml-2 text-gray-700 dark:text-gray-300">
                                { (bonusTypeByPatient[patient.id] ?? 'FLAT') === 'PERCENTAGE' ? '%' : '' }
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="dark:text-white">
                            <span className="font-semibold text-blue-600 dark:text-blue-400">${computeBonusAmount(patient).toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-gray-500 dark:text-gray-300">{todayStr}</span>
                          </TableCell>
                                                     <TableCell>
                             <Button 
                               variant="outline" 
                               size="sm"
                               className={(paidByPatient[patient.id] ?? false)
                                 ? "bg-blue-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600"
                                 : "bg-blue-600 text-white dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 border-blue-600 dark:border-blue-700"}
                               onClick={(e) => {
                                     e.stopPropagation()
                                     setPaidByPatient((s) => ({ ...s, [String(patient.id)]: !(s?.[String(patient.id)] ?? false) }))
                                   }}
                                 aria-pressed={paidByPatient[patient.id] ?? false}
                               >
                 <Eye className={`w-4 h-4 mr-1 ${(paidByPatient[patient.id] ?? false) ? 'text-gray-700' : 'text-white'}`} />
                 <span className="text-white">{(paidByPatient[patient.id] ?? false) ? 'Paid' : 'Pay'}</span>
                             </Button>
                           </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-400 dark:text-gray-300">
                        No patients found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Save button (saves current bonus settings locally) */}
          <div className="mb-4 flex justify-start mt-6">
            <Button
              size="sm"
              className="w-36 px-4 py-2 bg-green-600 hover:bg-green-700 text-white border-green-600"
              onClick={(e) => {
                e.stopPropagation()
                handleSave()
              }}
            >
              Save
            </Button>
            {saveMessage && <span className="ml-4 text-sm text-green-600 dark:text-green-400">{saveMessage}</span>}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
                  {currentPatients.length > 0 ? (
                    currentPatients.map((patient) => {
                const total = (totalsByLocation[String(patient.id)]?.total) ?? 0
                return (
                  <Card 
                    key={patient.id} 
                    className="border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-[#0e1725]"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base font-semibold dark:text-white">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {patient.title || patient.name || `Location ${patient.id}`}
                          </div>
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 gap-3 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500 dark:text-gray-400">Total Sales:</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">${total.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Flat/Percentage:</span>
                          <span className="ml-2 dark:text-white">-</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Value:</span>
                          <span className="ml-2 dark:text-white">-</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Bonus amount:</span>
                          <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">${computeBonusAmount(patient).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Date:</span>
                          <span className="ml-2 dark:text-white">{todayStr}</span>
                        </div>
                      </div>
                                                                      <div className="flex justify-end">
                           <Button
                             variant="outline"
                             size="sm"
                             className={(paidByPatient[patient.id] ?? false)
                               ? "bg-blue-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600"
                               : "bg-blue-600 text-white dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 border-blue-600 dark:border-blue-700"}
                             onClick={(e) => {
                               e.stopPropagation()
                               setPaidByPatient((s) => ({ ...s, [String(patient.id)]: !(s?.[String(patient.id)] ?? false) }))
                             }}
                             aria-pressed={paidByPatient[patient.id] ?? false}
                           >
                             <Eye className={`w-4 h-4 mr-1 ${(paidByPatient[patient.id] ?? false) ? 'text-gray-700' : 'text-white'}`} />
                             <span className="text-white">{(paidByPatient[patient.id] ?? false) ? 'Paid' : 'Pay'}</span>
                           </Button>
                         </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-400 dark:text-gray-300">No locations found</div>
            )}
          </div>

          {/* Pagination */}
          {filteredPatients.length > 0 && (
            <div className="mt-3 flex justify-end items-center">
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

export default BonusPage