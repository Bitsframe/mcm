import { Spinner } from "flowbite-react";
import { memo, useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PiCaretUpDownBold } from "react-icons/pi";
import { ApproveAppointment } from "@/utils/supabase/data_services/data_services";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

interface AppointmentsTableProps {
    appointments: Appointment[];
    appointLoading: boolean;
    onSelect: (appointment: Appointment) => void;
    sortHandle: (column: string) => void;
    sortColumn: string;
    isUnapproved?: boolean;
  }
  
  const AppointmentsTable: React.FC<AppointmentsTableProps> = ({ appointments, appointLoading, onSelect, sortHandle, sortColumn,isUnapproved }) => {

    const {t} = useTranslation(translationConstant.APPOINMENTS);

    return (
      <div className="w-full bg-gray-200 h-full overflow-scroll px-3 py-3 rounded-lg space-y-5">
        {appointLoading ? (
          <div className="flex h-full flex-col justify-center items-center">
            <Spinner size="xl" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex h-full flex-col justify-center items-center">
            <h1>No Appointments Available</h1>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  { label: t("Appoinments_k26"), sort: 'name' },
                  { label: t("Appoinments_k27"), sort: 'gender' },
                  { label: t("Appoinments_k28"), sort: 'service' },
                  { label: t("Appoinments_k1"), sort: 'slot' },
                  { label: t("Appoinments_k2"), sort: 'time'}
                ].map(({ label, sort }) => (
                
                  <TableHead key={sort} className="text-lg">
                    {label}
                    <button
                      onClick={() => sortHandle(sort)}
                      className="ml-1 text-gray-400 hover:text-gray-600 active:opacity-70"
                    >
                      <PiCaretUpDownBold
                        className={`inline ${sortColumn === sort ? "text-green-600" : ""}`}
                      />
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map(appointment => (
                <MemoizedTableRow
                  key={appointment.id}
                  appointment={appointment}
                  isSelected={false}
                  onSelect={onSelect}
                  isUnapproved={isUnapproved}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  };
  const MemoizedTableRow = memo(({ appointment, isSelected, onSelect, isUnapproved }: {
    appointment: Appointment;
    isSelected: boolean;
    isUnapproved?: boolean;
    onSelect: (appointment: Appointment) => void;
  }) => (
    <TableRow
      onClick={() => onSelect(appointment)}
      className={`cursor-pointer ${isSelected ? "bg-gray-200" : ""}`}
    >
      <TableCell className="text-black text-base">
        {appointment.first_name} {appointment.last_name}
      </TableCell>
      <TableCell className="text-black text-base">{appointment.sex}</TableCell>
      <TableCell className="text-black text-base">{appointment.service}</TableCell>
      <TableCell className="text-black text-base">{appointment.date_and_time.split('|')[1].split(' - ')[0]}</TableCell>
      <TableCell className="text-black text-base">{appointment.date_and_time.split(' - ')[1]}</TableCell>
      {isUnapproved && (
        <TableCell className="text-black text-base">
          <button
            className="bg-green-500 text-white px-2 py-1 rounded-lg"
            onClick={(event) => {
              event.stopPropagation(); 
              console.log("Approve button clicked");
              ApproveAppointment(appointment.id);
              toast.success(<div className="flex justify-between">
                          <p>Appointment has been approved successfully.</p>
                          <button
                            onClick={() => toast.dismiss()} 
                            className="absolute top-0 right-0 p-1 rounded hover:bg-gray-100"
                          >
                            <span className="text-sm">&#x2715;</span>
                          </button>
                        </div>,);
            }}
          >
            Approve
          </button>
        </TableCell>
      )}
    </TableRow>
  ));
  
  MemoizedTableRow.displayName = "MemoizedTableRow";

  
  export default AppointmentsTable;