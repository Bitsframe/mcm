"use client"

import type React from "react"

import { Spinner } from "flowbite-react"
import { memo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PiCaretUpDownBold } from "react-icons/pi"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, SquarePen, Trash2 } from "lucide-react"
import { ApproveAppointment } from "@/utils/supabase/data_services/data_services"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { translationConstant } from "@/utils/translationConstants"
import { renderFormattedDate } from "@/helper/common_functions"

interface Appointment {
  id: string
  first_name: string
  last_name: string
  sex: string
  service: string
  date_and_time: string
}

interface AppointmentsTableProps {
  appointments: any
  appointLoading: boolean
  onSelect: any
  sortHandle: (column: string) => void
  sortColumn: string
  isUnapproved?: boolean
  onEdit?:any
  onDelete?: (id: string) => void;
}

const AppointmentsTable: React.FC<AppointmentsTableProps> = ({
  appointments,
  appointLoading,
  onSelect,
  sortHandle,
  sortColumn,
  isUnapproved,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation(translationConstant.APPOINMENTS)

  return (
    <div className="w-full bg-white rounded-lg shadow overflow-hidden">
  {appointLoading ? (
    <div className="flex h-40 flex-col justify-center items-center">
      <Spinner size="xl" />
    </div>
  ) : appointments.length === 0 ? (
    <div className="flex h-40 flex-col justify-center items-center">
      <h1 className="text-gray-500 font-medium">No Appointments Available</h1>
    </div>
  ) : (
    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-12">
              <Checkbox />
            </TableHead>
            {[ 
              { label: t("Appoinments_k26"), sort: "name" },
              { label: t("Appoinments_k27"), sort: "gender" },
              { label: t("Appoinments_k28"), sort: "service" },
              { label: t("Appoinments_k2"), sort: "slot" },
              { label: t("Appoinments_k1"), sort: "time" },
            ].map(({ label, sort }) => (
              <TableHead key={sort} className="font-medium">
                {label}
                <button
                  onClick={() => sortHandle(sort)}
                  className="ml-1 text-gray-400 hover:text-gray-600 active:opacity-70"
                >
                  <PiCaretUpDownBold className={`inline ${sortColumn === sort ? "text-green-600" : ""}`} />
                </button>
              </TableHead>
            ))}
            <TableHead className="font-medium">Status</TableHead>
            <TableHead className="font-medium text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appointment: Appointment) => (
            <MemoizedTableRow
              key={appointment.id}
              appointment={appointment}
              isSelected={false}
              onSelect={onSelect}
              isUnapproved={isUnapproved}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </TableBody>
      </Table>

    </div>
   
  )}
</div>
  )
}

const MemoizedTableRow = memo(
  ({
    appointment,
    isSelected,
    onSelect,
    isUnapproved,
    onDelete,
    onEdit
  }: {
    appointment: Appointment
    isSelected: boolean
    isUnapproved?: boolean
    onSelect: (appointment: Appointment) => void
    onDelete?: (id: string) => void;
    onEdit?: (appointment: Appointment) => void
  }) => {
    const handleApprove = (event: React.MouseEvent) => {
      event.stopPropagation()
      console.log("Approve button clicked")
      // @ts-ignore
      ApproveAppointment(appointment.id)
      toast.success(
        <div className="flex justify-between">
          <p>Appointment has been approved successfully.</p>
          <button onClick={() => toast.dismiss()} className="absolute top-0 right-0 p-1 rounded hover:bg-gray-100">
            <span className="text-sm">&#x2715;</span>
          </button>
        </div>,
      )
    }

    const date = renderFormattedDate(appointment.date_and_time?.split("|")[1]?.split(" - ")[0])
    const time = appointment.date_and_time?.split(" - ")?.[1]

    return (
      <TableRow onClick={() => onSelect(appointment)} className={`hover:bg-gray-50 ${isSelected ? "bg-gray-100" : ""}`}>
        <TableCell className="w-12">
          <Checkbox />
        </TableCell>
        <TableCell className="font-medium">
          {appointment.first_name} {appointment.last_name}
        </TableCell>
        <TableCell className="p-4">{appointment.sex}</TableCell>
        <TableCell>{appointment.service}</TableCell>
        <TableCell>{date}</TableCell>
        <TableCell>{time}</TableCell>
        <TableCell>
          {isUnapproved ? (
            <button className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs" onClick={handleApprove}>
              Approve
            </button>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Approved ✓
            </span>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end space-x-2">
            <button className="text-gray-500 hover:text-gray-700">
              <Eye color="black" className="h-4 w-4" />
            </button>
            <button 
  className="text-gray-500 hover:text-blue-600"
  onClick={(e) => {
    e.stopPropagation() // Prevent row selection
    onEdit?.(appointment) // Trigger edit
  }}
>
  <SquarePen color="#0066ff" className="h-4 w-4" />
</button>
            <button 
        className="text-gray-500 hover:text-red-600"
        onClick={(e) => {
          e.stopPropagation(); // Prevent row selection
          onDelete?.(appointment.id); // Trigger onDelete
        }}
      >
        <Trash2 color="red" className="h-4 w-4" />
      </button>
          </div>
        </TableCell>
      </TableRow>
    )
  },
)

MemoizedTableRow.displayName = "MemoizedTableRow"

export default AppointmentsTable

