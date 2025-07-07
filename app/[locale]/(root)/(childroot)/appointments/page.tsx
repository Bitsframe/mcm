"use client"

import { useContext, useEffect, useState, useCallback, memo, useRef } from "react"
import {
  delete_appointment_service,
  fetchApprovedAppointmentsByLocation,
  fetchUnapprovedAppointmentsByLocation,
} from "@/utils/supabase/data_services/data_services"
import { toast } from "react-toastify"
import moment from "moment"
import { DatePicker, ConfigProvider, theme } from "antd"
import { Add_Appointment_Modal } from "@/components/Appointment/Add_Appointment_Modal"
import { LocationContext } from "@/context"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AppointmentDetails from "@/components/Appointment-details/Appointment-Details"
import { useLocationClinica } from "@/hooks/useLocationClinica"
import AppointmentsTable from "@/components/Appointment/Appointment-table"
import { useTranslation } from "react-i18next"
import { translationConstant } from "@/utils/translationConstants"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { AppointmentEditModal } from "@/components/Appointment/Appointment_Edit/Appointment_Edit_Modal"
import { TabContext } from "@/context"
import { Calendar, CheckCircle, UserPlus, Hourglass, CalendarPlus, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const Appointments = () => {
  const { locations } = useLocationClinica()
  const [approvedAppointments, setApprovedAppointments] = useState<Appointment[]>([])
  const [unapprovedAppointments, setUnapprovedAppointments] = useState<Appointment[]>([])
  const [filteredApproved, setFilteredApproved] = useState<Appointment[]>([])
  const [filteredUnapproved, setFilteredUnapproved] = useState<Appointment[]>([])
  const [appointLoading, setAppointLoading] = useState(true)
  const [appointmentDetails, setAppointmentDetails] = useState<Appointment | null>(null)
  const [sortColumn, setSortColumn] = useState<string>("")
  const [activeTab, setActiveTab] = useState("approved")
  const [isSheetopen, setisSheetopen] = useState(false)
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null)
  const [selectedAppointments, setSelectedAppointments] = useState<number[]>([])

  const originalApprovedRef = useRef<Appointment[]>([])
  const originalUnapprovedRef = useRef<Appointment[]>([])

  const { setActiveTitle } = useContext(TabContext)

  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'))
    
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setActiveTitle("Sidebar_k7")
  }, [])

  const { selectedLocation } = useContext(LocationContext)

  const fetchDataHandler = useCallback(async (locationId: number) => {
    setAppointLoading(true)
    setisSheetopen(false)
    try {
      const [approvedData, unapprovedData] = await Promise.all([
        fetchApprovedAppointmentsByLocation(locationId),
        fetchUnapprovedAppointmentsByLocation(locationId),
      ])

      setApprovedAppointments(approvedData as any)
      setFilteredApproved(approvedData as any)
      setUnapprovedAppointments(unapprovedData as any)
      setFilteredUnapproved(unapprovedData as any)

      originalApprovedRef.current = approvedData as any
      originalUnapprovedRef.current = unapprovedData as any
    } catch (error) {
      toast.error("Failed to fetch appointments.")
    } finally {
      setAppointLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedLocation) {
      fetchDataHandler(Number(selectedLocation.id))
    }
  }, [selectedLocation, fetchDataHandler])

  const findLocations = useCallback(
    (locationId: number) => {
      const location = locations.find((location: any) => location.id === locationId)
      return (location as unknown as LocationInterface) || null
    },
    [locations],
  )

  const selectForDetailsHandle = useCallback((appoint: Appointment) => {
    setAppointmentDetails(appoint)
    setisSheetopen(true)
  }, [])

  const handleEditAppointment = useCallback((appointment: Appointment) => {
    setEditAppointment(appointment)
    setisSheetopen(false)
  }, [])

  const deleteAppointmentsHandle = useCallback(async (delId: number) => {
    const { error } = await delete_appointment_service(Number(delId))
    if (!error) {
      const updateState = (prev: Appointment[]) => prev.filter((appoint) => appoint.id !== delId)
      setApprovedAppointments(updateState)
      setFilteredApproved(updateState)
      setUnapprovedAppointments(updateState)
      setFilteredUnapproved(updateState)

      // Update original refs as well
      originalApprovedRef.current = updateState(originalApprovedRef.current)
      originalUnapprovedRef.current = updateState(originalUnapprovedRef.current)

      toast.success("Deleted successfully")
      setAppointmentDetails(null)
    } else {
      toast.error(error.message)
    }
  }, [])

  const filterHandle = useCallback(
    (e: moment.Moment | null) => {
      if (e) {
        const dateToMoment = moment(e.toString()).format("YYYY-MM-DD")
        const filterByDate = (appointments: Appointment[]) => {
          return appointments.filter((appoint) => {
            if (appoint.date_and_time) {
              const cleanedStr = appoint.date_and_time.replace(/^\d+\|/, "")
              const dateStr = cleanedStr.split(" - ")[0]
              const formattedDate = moment(dateStr, "DD-MM-YYYY").format("YYYY-MM-DD")
              return formattedDate === dateToMoment
            }
            return false
          })
        }

        setFilteredApproved(filterByDate(approvedAppointments))
        setFilteredUnapproved(filterByDate(unapprovedAppointments))
      } else {
        setFilteredApproved(approvedAppointments)
        setFilteredUnapproved(unapprovedAppointments)
      }
      setAppointmentDetails(null)
    },
    [approvedAppointments, unapprovedAppointments],
  )

  const sortHandle = useCallback(
    (column: string) => {
      if (sortColumn === column) {
        setFilteredApproved([...originalApprovedRef.current])
        setFilteredUnapproved([...originalUnapprovedRef.current])
        setSortColumn("")
        return
      }

      if (!sortColumn) {
        originalApprovedRef.current = [...filteredApproved]
        originalUnapprovedRef.current = [...filteredUnapproved]
      }

      setSortColumn(column)
      const sortAppointments = (appointments: Appointment[]) => {
        return [...appointments].sort((a, b) => {
          switch (column) {
            case "name":
              return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
            case "gender":
              return a.sex.localeCompare(b.sex)
            case "service":
              return a.service.localeCompare(b.service)
            case "slot":
              return a.date_and_time.localeCompare(b.date_and_time)
            case "time":
              return a.date_and_time.localeCompare(b.date_and_time)
            default:
              return 0
          }
        })
      }

      setFilteredApproved(sortAppointments(filteredApproved))
      setFilteredUnapproved(sortAppointments(filteredUnapproved))
    },
    [filteredApproved, filteredUnapproved, sortColumn],
  )

  const newAddedRow = useCallback(() => {
    if (selectedLocation) {
      fetchDataHandler(Number(selectedLocation.id))
    }
  }, [selectedLocation, fetchDataHandler])

  const handleAppointmentApproval = useCallback((approvedAppointment: Appointment) => {
    // Remove from unapproved list
    setUnapprovedAppointments((prev) => prev.filter((app) => app.id !== approvedAppointment.id))
    setFilteredUnapproved((prev) => prev.filter((app) => app.id !== approvedAppointment.id))

    // Add to approved list
    setApprovedAppointments((prev) => [...prev, approvedAppointment])
    setFilteredApproved((prev) => [...prev, approvedAppointment])

    setActiveTab("approved")
  }, [])

  const { t } = useTranslation(translationConstant.APPOINMENTS)

  return (
    <main className="w-full h-full text-gray-600 font-medium space-y-2 sm:space-y-5 dark:bg-[#0E1725] dark:text-gray-300 overflow-x-hidden">
      <h1 className="text-xl sm:text-2xl font-bold text-black px-2 sm:px-4 pt-2 sm:pt-4 dark:text-white">
        {t("Appoinments_k48")}
      </h1>

      <div className="grid grid-cols-2 gap-2 px-0 sm:px-4 mb-4 sm:grid-cols-4 sm:gap-3 sm:mb-6">
      <Card className="bg-[#F1F4F9] dark:bg-[#080E16]">
          <CardContent className="p-2 sm:p-4 flex flex-col items-center text-center sm:flex-row sm:text-left sm:gap-4">
            <div className="bg-white p-2 rounded-lg dark:bg-gray-700 mb-1 sm:mb-0">
              <Calendar className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">{t("Appoinments_k39")}</p>
              <h2 className="text-lg font-bold dark:text-white sm:text-2xl">
                {approvedAppointments.length + unapprovedAppointments.length}
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#F1F4F9] dark:bg-[#080E16]">
          <CardContent className="p-2 sm:p-4 flex flex-col items-center text-center sm:flex-row sm:text-left sm:gap-4">
            <div className="bg-white p-2 rounded-lg dark:bg-gray-700 mb-1 sm:mb-0">
              <CheckCheck className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">{t("Appoinments_k24")}</p>
              <h2 className="text-lg font-bold dark:text-white sm:text-2xl">{approvedAppointments.length}</h2>
            </div> 
          </CardContent>
        </Card>

        <Card className="bg-[#F1F4F9] dark:bg-[#080E16]">
          <CardContent className="p-2 sm:p-4 flex flex-col items-center text-center sm:flex-row sm:text-left sm:gap-4">
            <div className="bg-white p-2 rounded-lg dark:bg-gray-700 mb-1 sm:mb-0">
              <Hourglass className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">{t("Appoinments_k38")}</p>
              <h2 className="text-lg font-bold dark:text-white sm:text-2xl">{unapprovedAppointments.length}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#F1F4F9] dark:bg-[#080E16]">
          <CardContent className="p-2 sm:p-4 flex flex-col items-center text-center sm:flex-row sm:text-left sm:gap-4">
            <div className="bg-white p-2 rounded-lg dark:bg-gray-700 mb-1 sm:mb-0">
              <CalendarPlus className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">{t("Appoinments_k25")}</p>
              <h2 className="text-lg font-bold dark:text-white sm:text-2xl">{unapprovedAppointments.length}</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg px-1 xs:px-2 sm:px-4 dark:bg-[#0E1725] ">
        <div className="flex flex-col gap-4 mb-4 sm:mb-6 md:flex-row md:items-center md:gap-4 md:justify-between">
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 md:gap-4 md:items-center">
            <div className="w-full md:w-56 min-w-0">
              <ConfigProvider
                theme={{
                  algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
                  token: {
                    colorBgContainer: isDarkMode ? '#374151' : '#ffffff',
                    colorText: isDarkMode ? '#ffffff' : '#000000',
                    colorTextPlaceholder: isDarkMode ? '#9CA3AF' : '#6B7280',
                    colorBorder: isDarkMode ? '#4B5563' : '#D1D5DB',
                    colorBgElevated: isDarkMode ? '#374151' : '#ffffff',
                  },
                }}
              >
                <DatePicker
                  onChange={filterHandle}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm sm:text-base text-black placeholder-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-white"
                  placeholder="Filter by date"
                  suffixIcon={<Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
                />
              </ConfigProvider>
            </div>
            <div className="flex-shrink-0">
              <Add_Appointment_Modal newAddedRow={newAddedRow} />
            </div>
          </div>
          <div className="w-full md:w-auto md:ml-auto">
            <Tabs className="w-full" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-gray-100 p-1 rounded-lg dark:bg-[#080E16] w-full flex-nowrap">
                <TabsTrigger
                  value="approved"
                  className="data-[state=active]:bg-[#0066ff] data-[state=active]:text-white rounded-md px-2 sm:px-4 py-2 text-xs sm:text-sm flex-1 sm:flex-none dark:data-[state=active]:bg-blue-600"
                >
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{t("Appoinments_k24")}</span>
                  <span className="sm:hidden">Approved</span>
                </TabsTrigger>
                <TabsTrigger
                  value="request"
                  className="data-[state=active]:bg-[#0066ff] data-[state=active]:text-white rounded-md px-2 sm:px-4 py-2 text-xs sm:text-sm flex-1 sm:flex-none dark:data-[state=active]:bg-blue-600"
                >
                  <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{t("Appoinments_k25")}</span>
                  <span className="sm:hidden">New</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {editAppointment && (
          <AppointmentEditModal
            isOpen={!!editAppointment}
            onClose={() => setEditAppointment(null)}
            defaultDateTime={editAppointment.date_and_time}
            appointmentDetails={editAppointment}
            locationData={findLocations(editAppointment.location_id)}
            updateAvailableData={newAddedRow}
          />
        )}
      </div>

      <AppointmentsTable
        isUnapproved={activeTab === "request"}
        appointments={activeTab === "approved" ? filteredApproved : filteredUnapproved}
        appointLoading={appointLoading}
        onSelect={selectForDetailsHandle}
        onEdit={handleEditAppointment}
        sortHandle={sortHandle}
        sortColumn={sortColumn}
        //@ts-ignore
        onDelete={deleteAppointmentsHandle}
        //@ts-ignore
        selectedAppointments={selectedAppointments}
        //@ts-ignore
        setSelectedAppointments={setSelectedAppointments}
        onApprove={handleAppointmentApproval}
      />

      <AppointmentDetailsPanel
        isSheetopen={isSheetopen}
        appointmentDetails={appointmentDetails}
        onDelete={deleteAppointmentsHandle}
        findLocations={findLocations}
        updateReflectOnCloseModal={newAddedRow}
      />
    </main>
  )
}

const AppointmentDetailsPanel = ({
  isSheetopen,
  appointmentDetails,
  onDelete,
  findLocations,
  updateReflectOnCloseModal,
}: {
  isSheetopen: boolean
  appointmentDetails: Appointment | null
  onDelete: (id: number) => void
  findLocations: (id: number) => any
  updateReflectOnCloseModal: () => void
}) => {
  const { t } = useTranslation(translationConstant.APPOINMENTS)
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null)

  const handleEdit = useCallback(() => {
    if (appointmentDetails) {
      setEditAppointment(appointmentDetails)
    }
  }, [appointmentDetails])

  return (
    <>
      <Sheet
        open={!!appointmentDetails && isSheetopen}
        onOpenChange={(open) => {
          if (!open) {
            updateReflectOnCloseModal()
          }
        }}
      >
        <SheetContent className="p-0 dark:bg-gray-900 m-0 sm:m-3 rounded-xl w-[95vw] sm:max-w-md overflow-y-auto overflow-x-hidden">
          <SheetTitle className="sr-only">
            {appointmentDetails
              ? `${appointmentDetails.first_name} ${appointmentDetails.last_name}'s Appointment Details`
              : "Appointment Details"}
          </SheetTitle>
          <div className="p-2 sm:p-4">
            {appointmentDetails ? (
              <>
                <AppointmentDetails
                  onDelete={onDelete}
                  appointment_details={appointmentDetails}
                  find_locations={findLocations}
                  update_reflect_on_close_modal={updateReflectOnCloseModal}
                />

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-4 sm:mt-6">
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    className="border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full sm:w-auto"
                  >
                   {t("Appoinments_k34")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => onDelete(appointmentDetails.id)}
                    className="w-full sm:w-auto"
                  >
                    {t("Appoinments_k33")} 
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex h-full justify-center items-center dark:text-gray-300 p-4">
                <h1 className="text-base sm:text-lg text-center">Select an appointment to view details</h1>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {editAppointment && (
        <AppointmentEditModal
          isOpen={!!editAppointment}
          onClose={() => setEditAppointment(null)}
          defaultDateTime={editAppointment.date_and_time}
          appointmentDetails={editAppointment}
          locationData={findLocations(editAppointment.location_id)}
          updateAvailableData={updateReflectOnCloseModal}
        />
      )}
    </>
  )
}

export default memo(Appointments)