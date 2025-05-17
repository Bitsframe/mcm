"use client";

import React from "react";
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
  onApprove?: any;
}

const ITEMS_PER_PAGE = 4;

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
  const { t } = useTranslation(translationConstant.APPOINMENTS);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [appointments, isUnapproved]);

  const totalPages = Math.ceil(appointments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentAppointments = appointments.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

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
          <div className="relative overflow-hidden flex flex-col h-64">
            <div className="border-2 border-gray-200 dark:border-gray-700">
              <Table className="border-collapse w-full">
                <TableHeader className="bg-gray-50 dark:bg-[#0E1725] sticky top-0 z-10">
                  <TableRow className="dark:border-gray-700">
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

                <TableBody>
                  {currentAppointments.map((appointment: Appointment) => (
                    <MemoizedTableRow
                      key={appointment.id}
                      appointment={appointment}
                      onSelect={onSelect}
                      isUnapproved={isUnapproved}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      onApprove={onApprove}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="p-2 text-sm text-gray-500 dark:text-gray-400 justify-between flex items-center gap-4">
            <span>
              {appointments.length === 0
                ? "Showing 0 to 0 of 0 results"
                : `Showing ${startIndex + 1} to ${Math.min(
                    endIndex,
                    appointments.length
                  )} of ${appointments.length} results`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`border rounded px-3 py-1 text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 dark:focus:ring-gray-700 ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800"
                }`}
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`border rounded px-3 py-1 text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 dark:focus:ring-gray-700 ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface MemoizedTableRowProps {
  appointment: Appointment;
  onSelect: (appointment: Appointment) => void;
  isUnapproved?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (appointment: Appointment) => void;
  onApprove?: (appointment: Appointment) => void;
}

const MemoizedTableRow = memo(
  ({
    appointment,
    onSelect,
    isUnapproved,
    onDelete,
    onEdit,
    onApprove,
  }: MemoizedTableRowProps) => {
    const handleApprove = async (event: React.MouseEvent) => {
      event.stopPropagation();
      try {
        // @ts-ignore
        await ApproveAppointment(appointment.id);
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
        onApprove?.(appointment);
      } catch (error) {
        toast.error("Failed to approve appointment");
      }
    };

    const date = renderFormattedDate(
      appointment.date_and_time?.split("|")[1]?.split(" - ")[0]
    );
    const time = appointment.date_and_time?.split(" - ")?.[1];

    return (
      <TableRow
        onClick={() => onSelect(appointment)}
        className="hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700"
      >
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
