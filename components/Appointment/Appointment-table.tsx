import { Spinner } from "flowbite-react";
import { memo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PiCaretUpDownBold } from "react-icons/pi";

interface AppointmentsTableProps {
    appointments: Appointment[];
    appointLoading: boolean;
    onSelect: (appointment: Appointment) => void;
    sortHandle: (column: string) => void;
    sortColumn: string;
  }
  
  const AppointmentsTable: React.FC<AppointmentsTableProps> = ({ appointments, appointLoading, onSelect, sortHandle, sortColumn }) => {
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
                  { label: 'Name', sort: 'name' },
                  { label: 'Gender', sort: 'gender' },
                  { label: 'Service', sort: 'service' },
                  { label: 'Date', sort: 'slot' }
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
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  };
  
  const MemoizedTableRow = memo(({ appointment, isSelected, onSelect }: {
    appointment: Appointment;
    isSelected: boolean;
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
      <TableCell className="text-black text-base">{appointment.date_and_time}</TableCell>
    </TableRow>
  ));


  export default AppointmentsTable;