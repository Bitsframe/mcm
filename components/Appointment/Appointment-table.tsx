"use client"

import React from "react"
import { Spinner } from "flowbite-react"
import { memo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { PiCaretUpDownBold } from "react-icons/pi"
import { Eye, SquarePen, Trash2 } from "lucide-react"
import { ApproveAppointment } from "@/utils/supabase/data_services/data_services"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { translationConstant } from "@/utils/translationConstants"
import { renderFormattedDate } from "@/helper/common_functions"
import ApprovedAppointmentModal from "./ApprovedAppointmentModal"

interface Appointment {
  id: string
  first_name?: string | null
  last_name?: string | null
  email_address?: string | null
  sex?: string | null
  service: string
  date_and_time: string
  allpatients?: {
    firstname?: string | null
    lastname?: string | null
    gender?: string | null
    email?: string | null
  }
}

function displayPatientName(appointment: Appointment) {
  const first =
    appointment.allpatients?.firstname || appointment.first_name || ""
  const last =
    appointment.allpatients?.lastname || appointment.last_name || ""
  return `${first} ${last}`.trim() || "—"
}

function displayGender(appointment: Appointment) {
  return appointment.allpatients?.gender || appointment.sex || "—"
}

function displayEmail(appointment: Appointment) {
  const fromPatient = appointment.allpatients?.email
  if (fromPatient != null && String(fromPatient).trim() !== "")
    return String(fromPatient).trim()
  if (appointment.email_address != null && String(appointment.email_address).trim() !== "")
    return String(appointment.email_address).trim()
  return "—"
}

interface AppointmentsTableProps {
  appointments: any
  appointLoading: boolean
  onSelect: any
  sortHandle: (column: string) => void
  sortColumn: string
  isUnapproved?: boolean
  onEdit?: any
  onDelete?: (id: string) => void
  selectedAppointments: string[]
  setSelectedAppointments: React.Dispatch<React.SetStateAction<string[]>>
  onApprove?: any
}

const DESKTOP_ITEMS_PER_PAGE = 4
const MOBILE_ITEMS_PER_PAGE = 1

// Helper function to safely extract date and time from date_and_time string
const extractDateTime = (dateAndTime: string | undefined) => {
  if (!dateAndTime || !dateAndTime.includes("|")) {
    return { date: "-", time: "-" }
  }
  
  const parts = dateAndTime.split("|")
  if (parts.length < 2) {
    return { date: "-", time: "-" }
  }
  
  const dateTimeParts = parts[1].split(" - ")
  if (dateTimeParts.length < 2) {
    return { date: "-", time: "-" }
  }
  
  return {
    date: renderFormattedDate(dateTimeParts[0]),
    time: dateTimeParts[1]
  }
}

const AppointmentsTable: React.FC<AppointmentsTableProps> = ({
  appointments,
  appointLoading,
  onSelect,
  sortHandle,
  sortColumn,
  isUnapproved,
  onEdit,
  onDelete,
  selectedAppointments,
  setSelectedAppointments,
  onApprove,
}) => {
  const { t } = useTranslation(translationConstant.APPOINMENTS)
  const [desktopCurrentPage, setDesktopCurrentPage] = React.useState(1)
  const [mobileCurrentPage, setMobileCurrentPage] = React.useState(1)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null)

  React.useEffect(() => {
    setDesktopCurrentPage(1)
    setMobileCurrentPage(1)
  }, [appointments, isUnapproved])

  const desktopTotalPages = Math.ceil(appointments.length / DESKTOP_ITEMS_PER_PAGE)
  const desktopStartIndex = (desktopCurrentPage - 1) * DESKTOP_ITEMS_PER_PAGE
  const desktopEndIndex = desktopStartIndex + DESKTOP_ITEMS_PER_PAGE
  const desktopCurrentAppointments = appointments.slice(desktopStartIndex, desktopEndIndex)

  const mobileTotalPages = Math.ceil(appointments.length / MOBILE_ITEMS_PER_PAGE)
  const mobileCurrentAppointment = appointments[mobileCurrentPage - 1]

  const handleDesktopPreviousPage = () => {
    setDesktopCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleDesktopNextPage = () => {
    setDesktopCurrentPage((prev) => Math.min(prev + 1, desktopTotalPages))
  }

  const handleMobilePreviousPage = () => {
    setMobileCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleMobileNextPage = () => {
    setMobileCurrentPage((prev) => Math.min(prev + 1, mobileTotalPages))
  }

  const handleOpenModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsModalOpen(true)
  }

  const handleSaveModal = async (data: { providerName: string; notes: string }) => {
    if (!selectedAppointment) return
    
    try {
      // Approve the appointment with provider name and notes
      // @ts-ignore
      await ApproveAppointment(selectedAppointment.id, data.providerName, data.notes)
      
      toast.success(
        <div className="flex justify-between dark:text-white">
          <p>Appointment has been approved successfully.</p>
          <button
            onClick={() => toast.dismiss()}
            className="absolute top-0 right-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="text-sm">&#x2715;</span>
          </button>
        </div>,
      )
      
      onApprove?.(selectedAppointment)
    } catch (error) {
      toast.error("Failed to approve appointment")
    }
  }

  return (
    <div className="w-full overflow-hidden px-4">
      {appointLoading ? (
        <div className="flex h-40 flex-col justify-center items-center">
          <Spinner size="xl" className="dark:text-white" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex h-40 flex-col justify-center items-center">
          <h1 className="text-gray-500 font-medium dark:text-gray-300">{t("Appoinments_k87")}</h1>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:flex relative flex-col h-[260px] overflow-x-auto rounded-lg">
          <div className="border-2 border-gray-200 dark:border-gray-700 min-w-full rounded-lg">
              <Table className="border-collapse min-w-[780px] w-full text-xs sm:text-sm rounded-lg">
                <TableHeader className="bg-gray-50 dark:bg-[#0E1725] sticky top-0 z-10">
                  <TableRow className="dark:border-gray-700">
                    {[
                      { label: t("Appoinments_k26"), sort: "name" },
                      { label: t("Appoinments_k11"), sort: "email" },
                      { label: t("Appoinments_k27"), sort: "gender" },
                      { label: t("Appoinments_k28"), sort: "service" },
                      { label: t("Appoinments_k2"), sort: "slot" },
                      { label: t("Appoinments_k1"), sort: "time" },
                    ].map(({ label, sort }) => (
                      <TableHead key={sort} className="font-medium dark:border-gray-700">
                        {label}
                        <button
                          onClick={() => sortHandle(sort)}
                          className="ml-1 text-gray-400 hover:text-gray-600 active:opacity-70 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <PiCaretUpDownBold
                            className={`inline ${sortColumn === sort ? "text-green-600 dark:text-green-400" : ""}`}
                          />
                        </button>
                      </TableHead>
                    ))}
                    <TableHead className="font-medium dark:border-gray-700">{t("Appoinments_k40")}</TableHead>
                    <TableHead className="font-medium text-right dark:border-gray-700">{t("Appoinments_k41")}</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {desktopCurrentAppointments.map((appointment: Appointment) => (
                    <MemoizedTableRow
                      key={appointment.id}
                      appointment={appointment}
                      onSelect={onSelect}
                      isUnapproved={isUnapproved}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      onApprove={onApprove}
                      onOpenApprovedModal={handleOpenModal}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden p-4">
            {mobileCurrentAppointment && (
              <MemoizedAppointmentCard
                appointment={mobileCurrentAppointment}
                onSelect={onSelect}
                isUnapproved={isUnapproved}
                onDelete={onDelete}
                onEdit={onEdit}
                onApprove={onApprove}
                onOpenApprovedModal={handleOpenModal}
                t={t}
              />
            )}
          </div>

          {/* Desktop Pagination */}
          <div className="hidden md:flex py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-row justify-between items-center gap-2">
            <span>
              {appointments.length === 0
                ? "Showing 0 to 0 of 0 results"
                : `${t("Appoinments_k42")} ${desktopStartIndex + 1} ${t("Appoinments_k43")} ${Math.min(
                    desktopEndIndex,
                    appointments.length,
                  )} ${t("Appoinments_k44")} ${appointments.length}`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDesktopPreviousPage}
                disabled={desktopCurrentPage === 1}
                className={`border rounded px-3 py-1 text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 dark:focus:ring-gray-700 ${
                  desktopCurrentPage === 1
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800"
                }`}
              >
                {t("Appoinments_k46")}
              </button>
              <button
                onClick={handleDesktopNextPage}
                disabled={desktopCurrentPage === desktopTotalPages}
                className={`border rounded px-3 py-1 text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 dark:focus:ring-gray-700 ${
                  desktopCurrentPage === desktopTotalPages
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800"
                }`}
              >
                {t("Appoinments_k47")}
              </button>
            </div>
          </div>

          {/* Mobile Pagination */}
          <div className="md:hidden py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex flex-row justify-between items-center gap-2">
            <span>
              {appointments.length === 0
                ? `${t("Appoinments_k48")} 0 ${t("Appoinments_k49")} 0`
                : `${t("Appoinments_k48")} ${mobileCurrentPage} ${t("Appoinments_k49")} ${mobileTotalPages}`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMobilePreviousPage}
                disabled={mobileCurrentPage === 1}
                className={`border rounded px-3 py-1 text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 dark:focus:ring-gray-700 ${
                  mobileCurrentPage === 1
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800"
                }`}
              >
                {t("Appoinments_k46")}
              </button>
              <button
                onClick={handleMobileNextPage}
                disabled={mobileCurrentPage === mobileTotalPages}
                className={`border rounded px-3 py-1 text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 dark:focus:ring-gray-700 ${
                  mobileCurrentPage === mobileTotalPages
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800"
                }`}
              >
                {t("Appoinments_k47")}
              </button>
            </div>
          </div>
        </>
      )}

      <ApprovedAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={selectedAppointment}
        onSave={handleSaveModal}
      />
    </div>
  )
}

interface MemoizedTableRowProps {
  appointment: Appointment
  onSelect: (appointment: Appointment) => void
  isUnapproved?: boolean
  onDelete?: (id: string) => void
  onEdit?: (appointment: Appointment) => void
  onApprove?: (appointment: Appointment) => void
  onOpenApprovedModal?: (appointment: Appointment) => void
}

const MemoizedTableRow = memo(
  ({ appointment, onSelect, isUnapproved, onDelete, onEdit, onApprove, onOpenApprovedModal }: MemoizedTableRowProps) => {
    const { t } = useTranslation(translationConstant.APPOINMENTS)
    const handleApprove = async (event: React.MouseEvent) => {
      event.stopPropagation()
      // Open modal instead of directly approving
      onOpenApprovedModal?.(appointment)
    }

    const { date, time } = extractDateTime(appointment.date_and_time)

    const name = displayPatientName(appointment)
    const gender = displayGender(appointment)
    const email = displayEmail(appointment)

    return (
      <TableRow
        onClick={() => onSelect(appointment)}
        className="hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 text-xs sm:text-sm"
      >
        <TableCell className="font-medium dark:text-white px-2 py-2 sm:px-2 sm:py-3 max-w-[160px] truncate" title={name}>
          {name}
        </TableCell>
        <TableCell className="p-2 sm:px-2 sm:py-4 dark:text-gray-300 max-w-[180px] truncate" title={email !== "—" ? email : undefined}>
          {email}
        </TableCell>
        <TableCell className="p-2 sm:px-2 sm:py-4 dark:text-gray-300">{gender}</TableCell>
        <TableCell className="p-2 sm:px-2 sm:py-4 dark:text-gray-300">{appointment.service}</TableCell>
        <TableCell className="p-2 sm:px-2 sm:py-4 dark:text-gray-300">{date}</TableCell>
        <TableCell className="p-2 sm:px-2 sm:py-4 dark:text-gray-300">{time}</TableCell>
        <TableCell className="p-2 sm:px-2 sm:py-4 dark:border-gray-700">
          {isUnapproved ? (
            <button
              className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-600"
              onClick={handleApprove}
            >
              {t("Appoinments_k54")}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenApprovedModal?.(appointment)
              }}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 cursor-pointer hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
            >
              {t("Appoinments_k53")} ✓
            </button>
          )}
        </TableCell>
        <TableCell className="text-right p-2 sm:p-4 dark:border-gray-700">
          <div className="flex justify-end space-x-2">
            <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <Eye className="h-4 w-4" />
            </button>
            <button
              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(appointment)
              }}
            >
              <SquarePen className="h-4 w-4" color="#0066ff" />
            </button>
            <button
              className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(appointment.id)
              }}
            >
              <Trash2 className="h-4 w-4" color="red" />
            </button>
          </div>
        </TableCell>
      </TableRow>
    )
  },
)

interface MemoizedAppointmentCardProps {
  appointment: Appointment
  onSelect: (appointment: Appointment) => void
  isUnapproved?: boolean
  onDelete?: (id: string) => void
  onEdit?: (appointment: Appointment) => void
  onApprove?: (appointment: Appointment) => void
  onOpenApprovedModal?: (appointment: Appointment) => void
  t: any
}

const MemoizedAppointmentCard = memo(
  ({ appointment, onSelect, isUnapproved, onDelete, onEdit, onApprove, onOpenApprovedModal, t }: MemoizedAppointmentCardProps) => {
    const handleApprove = async (event: React.MouseEvent) => {
      event.stopPropagation()
      // Open modal instead of directly approving
      onOpenApprovedModal?.(appointment)
    }

    const { date, time } = extractDateTime(appointment.date_and_time)

    const name = displayPatientName(appointment)
    const gender = displayGender(appointment)
    const email = displayEmail(appointment)

    return (
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700"
        onClick={() => onSelect(appointment)}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-sm dark:text-white">
                  {name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{gender}</p>
                {email !== "—" && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 break-all">{email}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.(appointment)
                  }}
                >
                  <SquarePen className="h-4 w-4" color="#0066ff" />
                </button>
                <button
                  className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.(appointment.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" color="red" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("Appoinments_k28")}</p>
              <p className="text-sm dark:text-gray-300">{appointment.service}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("Appoinments_k2")}</p>
                <p className="text-sm dark:text-gray-300">{date}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("Appoinments_k1")}</p>
                <p className="text-sm dark:text-gray-300">{time}</p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
              {isUnapproved ? (
                <button
                  className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-600"
                  onClick={handleApprove}
                >
                  Approve
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenApprovedModal?.(appointment)
                  }}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 cursor-pointer hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                >
                  Approved ✓
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  },
)

MemoizedTableRow.displayName = "MemoizedTableRow"
MemoizedAppointmentCard.displayName = "MemoizedAppointmentCard"

export default AppointmentsTable