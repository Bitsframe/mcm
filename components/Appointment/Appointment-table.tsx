"use client";

import type React from "react";
import { Spinner } from "flowbite-react";
import { memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PiCaretUpDownBold } from "react-icons/pi";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, SquarePen, Trash2 } from "lucide-react";
import { ApproveAppointment } from "@/utils/supabase/data_services/data_services";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { renderFormattedDate } from "@/helper/common_functions";

interface Appointment {
  id: string;
  first_name: string;
  last_name: string;
  sex: string;
  service: string;
  date_and_time: string;
}

interface AppointmentsTableProps {
  appointments: any;
  appointLoading: boolean;
  onSelect: any;
  sortHandle: (column: string) => void;
  sortColumn: string;
  isUnapproved?: boolean;
  onEdit?: any;
  onDelete?: (id: string) => void;
  selectedAppointments: string[];
  setSelectedAppointments: React.Dispatch<React.SetStateAction<string[]>>;
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
}) => {
  const { t } = useTranslation(translationConstant.APPOINMENTS);

  const handleSelect = (id: string, isSelected: boolean) => {
    setSelectedAppointments((prev) =>
      isSelected ? [...prev, id] : prev.filter((appId) => appId !== id)
    );
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedAppointments(appointments.map((app: Appointment) => app.id));
    } else {
      setSelectedAppointments([]);
    }
  };

  const allSelected =
    selectedAppointments.length === appointments.length &&
    appointments.length > 0;
  const someSelected = selectedAppointments.length > 0 && !allSelected;

  return (
    <div className="w-full bg-white rounded-lg shadow overflow-hidden dark:bg-gray-900">
      {appointLoading ? (
        <div className="flex h-40 flex-col justify-center items-center">
          <Spinner size="xl" className="dark:text-white" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex h-40 flex-col justify-center items-center">
          <h1 className="text-gray-500 font-medium dark:text-gray-300">
            No Appointments Available
          </h1>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden flex flex-col h-[calc(100vh-470px)]">
            <div className="overflow-auto">
              <Table className="border-collapse w-full">
                <TableHeader className="bg-gray-50 dark:bg-[#0E1725] sticky top-0 z-10">
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="w-12 dark:border-gray-700 sticky left-0 bg-gray-50 dark:bg-[#0E1725] z-20">
                    </TableHead>
                    {[
                      { label: t("Appoinments_k26"), sort: "name" },
                      { label: t("Appoinments_k27"), sort: "gender" },
                      { label: t("Appoinments_k28"), sort: "service" },
                      { label: t("Appoinments_k2"), sort: "slot" },
                      { label: t("Appoinments_k1"), sort: "time" },
                    ].map(({ label, sort }) => (
                      <TableHead
                        key={sort}
                        className="font-medium dark:border-gray-700"
                      >
                        {label}
                        <button
                          onClick={() => sortHandle(sort)}
                          className="ml-1 text-gray-400 hover:text-gray-600 active:opacity-70 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <PiCaretUpDownBold
                            className={`inline ${
                              sortColumn === sort
                                ? "text-green-600 dark:text-green-400"
                                : ""
                            }`}
                          />
                        </button>
                      </TableHead>
                    ))}
                    <TableHead className="font-medium dark:border-gray-700">
                      Status
                    </TableHead>
                    <TableHead className="font-medium text-right dark:border-gray-700">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="overflow-y-auto">
                  {appointments.map((appointment: Appointment) => (
                    <MemoizedTableRow
                      key={appointment.id}
                      appointment={appointment}
                      isSelected={selectedAppointments.includes(appointment.id)}
                      onSelect={onSelect}
                      onCheckboxChange={(checked) =>
                        handleSelect(appointment.id, checked)
                      }
                      isUnapproved={isUnapproved}
                      onDelete={onDelete}
                      onEdit={onEdit}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
            {selectedAppointments.length > 0
              ? `${selectedAppointments.length} of ${appointments.length} row(s) selected`
              : `0 of ${appointments.length} row(s) in total`}
          </div>
        </>
      )}
    </div>
  );
};

interface MemoizedTableRowProps {
  appointment: Appointment;
  isSelected: boolean;
  onSelect: (appointment: Appointment) => void;
  onCheckboxChange: (checked: boolean) => void;
  isUnapproved?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (appointment: Appointment) => void;
}

const MemoizedTableRow = memo(
  ({
    appointment,
    isSelected,
    onSelect,
    onCheckboxChange,
    isUnapproved,
    onDelete,
    onEdit,
  }: MemoizedTableRowProps) => {
    const handleApprove = (event: React.MouseEvent) => {
      event.stopPropagation();
      // @ts-ignore
      ApproveAppointment(appointment.id);
      toast.success(
        <div className="flex justify-between dark:text-white">
          <p>Appointment has been approved successfully.</p>
          <button
            onClick={() => toast.dismiss()}
            className="absolute top-0 right-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="text-sm">&#x2715;</span>
          </button>
        </div>
      );
    };

    const date = renderFormattedDate(
      appointment.date_and_time?.split("|")[1]?.split(" - ")[0]
    );
    const time = appointment.date_and_time?.split(" - ")?.[1];

    return (
      <TableRow
        onClick={() => onSelect(appointment)}
        className={`hover:bg-gray-50 ${
          isSelected ? "bg-gray-100" : ""
        } dark:hover:bg-gray-800 dark:border-gray-700 ${
          isSelected ? "dark:bg-gray-700" : ""
        }`}
      >
        <TableCell
          className="w-12 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* <Checkbox
            checked={isSelected}
            onCheckedChange={onCheckboxChange}
            className="dark:border-gray-600"
          /> */}
        </TableCell>
        <TableCell className="font-medium dark:text-white">
          {appointment.first_name} {appointment.last_name}
        </TableCell>
        <TableCell className="p-4 dark:text-gray-300">
          {appointment.sex}
        </TableCell>
        <TableCell className="dark:text-gray-300">
          {appointment.service}
        </TableCell>
        <TableCell className="dark:text-gray-300">{date}</TableCell>
        <TableCell className="dark:text-gray-300">{time}</TableCell>
        <TableCell className="dark:border-gray-700">
          {isUnapproved ? (
            <button
              className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-600"
              onClick={handleApprove}
            >
              Approve
            </button>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Approved ✓
            </span>
          )}
        </TableCell>
        <TableCell className="text-right dark:border-gray-700">
          <div className="flex justify-end space-x-2">
            <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <Eye className="h-4 w-4" />
            </button>
            <button
              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(appointment);
              }}
            >
              <SquarePen className="h-4 w-4" color="#0066ff" />
            </button>
            <button
              className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(appointment.id);
              }}
            >
              <Trash2 className="h-4 w-4" color="red" />
            </button>
          </div>
        </TableCell>
      </TableRow>
    );
  }
);

MemoizedTableRow.displayName = "MemoizedTableRow";

export default AppointmentsTable;
