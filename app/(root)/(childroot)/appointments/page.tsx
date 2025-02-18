'use client'

import { useContext, useEffect, useState, useCallback, memo } from "react";
import { GoDotFill } from "react-icons/go";
import { delete_appointment_service, fetchAppointmentsByLocation } from '@/utils/supabase/data_services/data_services'
import { Spinner } from "flowbite-react";
import { useLocationClinica } from '@/hooks/useLocationClinica'
import Moment from 'moment';
import { toast } from "react-toastify";
import moment from "moment";
import { DatePicker } from "antd";
import { Appointment_Edit_Modal } from "@/components/Appointment/Appointment_Edit/Appointment_Edit_Modal";
import { Add_Appointment_Modal } from "@/components/Appointment/Add_Appointment_Modal";
import { formatPhoneNumber } from "@/utils/getCountryName";
import { LocationContext } from "@/context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PiCaretUpDownBold } from "react-icons/pi";

const render_detail_keys: RenderDetailFields[] = [
  { label: 'First Name', key: 'first_name', can_sort: true },
  { label: 'Last Name', key: 'last_name', can_sort: true },
  { label: 'Email Address', key: 'email_address', can_sort: true },
  { label: 'D.O.B', key: 'dob', can_sort: true },
  { label: 'Sex', key: 'sex', can_sort: true },
  { label: 'Service', key: 'service', can_sort: true },
  { label: 'Location', key: 'location', can_sort: true },
  { label: 'Phone', key: 'phone' },
  { label: 'Address', key: 'address', can_sort: true },
  { label: 'Date slot', key: 'date_and_time', type: 'date_slot', can_sort: true },
  { label: 'Time slot', key: 'date_and_time', type: 'time_slot', can_sort: true },
  { label: 'Created at', key: 'created_at', date_format: true },
];

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

const AppointmentDetails = memo(({ 
  appointment_details,
  onDelete,
  find_locations,
  update_reflect_on_close_modal 
}: {
  appointment_details: Appointment;
  onDelete: (id: number) => void;
  find_locations: (id: number) => LocationInterface;
  update_reflect_on_close_modal: (new_date_time: string) => void;
}) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-end space-x-5 text-black">
      <div className="flex items-center space-x-1 text-base">
        <GoDotFill />
        <p>{appointment_details.new_patient ? 'New Patient' : '-'}</p>
      </div>
      <div className="flex items-center space-x-1 text-sm">
        <GoDotFill />
        <p>{appointment_details.in_office_patient ? 'In-Office' : '-'}</p>
      </div>
    </div>
    <div className="font-semibold space-y-4 flex-1 text-black">
      {render_detail_keys.map((elem, index) => (
        <h1 key={index}>
          {elem.label}:{' '}
          <span className="font-normal">
            {elem.date_format
              ? Moment(appointment_details['created_at']).format('LLL')
              : elem.type === 'date_slot' && appointment_details?.date_and_time
              ? appointment_details?.date_and_time?.split('|')?.[1]?.split(' - ')[0]
              : elem.type === 'time_slot' && appointment_details?.date_and_time
              ? appointment_details?.date_and_time?.split('|')?.[1]?.split(' - ')[1]
              : elem.key === 'location'
              ? (appointment_details?.location?.address ?? '-')
              : elem.key === 'phone'
              ? (formatPhoneNumber(appointment_details?.phone) ?? '-')
              : typeof appointment_details[elem.key as keyof typeof appointment_details] === 'object'
              ? '-'
              : String(appointment_details[elem.key as keyof typeof appointment_details] ?? '-')}
          </span>
        </h1>
      ))}
    </div>
    <div className="w-full flex mt-3 gap-3">
      <button
        onClick={() => onDelete(appointment_details.id)}
        className="border-red-700 flex-1 text-red-700 border-2 active:opacity-60 rounded-md px-4 py-1 hover:bg-text_primary_color_hover"
      >
        Delete
      </button>
      <Appointment_Edit_Modal
        default_data_time={appointment_details.date_and_time}
        update_available_data={update_reflect_on_close_modal}
        appointment_details={appointment_details}
        location_data={find_locations(appointment_details.location_id)}
      />
    </div>
  </div>
));

const Appointments = () => {
  const { locations } = useLocationClinica();
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appoint_loading, setAppoint_loading] = useState<boolean>(true);
  const [appointment_details, setAppointment_details] = useState<Appointment | null>(null);
  const [sortOrder, setSortOrder] = useState(-1);
  const [sortColumn, setSortColumn] = useState('');

  const { selectedLocation } = useContext(LocationContext);

  const fetchDataHandler = useCallback(async (locationId: number) => {
    setAppoint_loading(true);
    setAppointment_details(null);
    const appoint_data: Appointment[] = await fetchAppointmentsByLocation(locationId);
    setAllAppointments(appoint_data);
    setAppointments(appoint_data);
    setAppoint_loading(false);
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchDataHandler(selectedLocation.id);
    }
  }, [selectedLocation, fetchDataHandler]);

  const find_locations = useCallback((location_id: number) => {
    return locations.find((location: LocationInterface) => location.id === location_id);
  }, [locations]);

  const select_for_details_handle = useCallback((appoint: Appointment) => {
    setAppointment_details(appoint);
  }, []);

  const delete_appointments_handle = useCallback(async (delId: number) => {
    const { error } = await delete_appointment_service(delId);
    if (!error) {
      setAppointments(prev => prev.filter(appoint => appoint.id !== delId));
      setAllAppointments(prev => prev.filter(appoint => appoint.id !== delId));
      toast.success('Deleted successfully');
      setAppointment_details(null);
    } else {
      console.log("error",error.message);
      toast.error(error.message);
    }
  }, []);

  const filterHandle = useCallback((e: Date | null) => {
    if (e) {
      const dateToMoment = moment(e.toString()).format('YYYY-MM-DD');
      const filteredAppointments = allAppointments.filter((appoint: Appointment) => {
        if (appoint.date_and_time) {
          const cleanedStr = appoint.date_and_time.replace(/^\d+\|/, '');
          const dateStr = cleanedStr.split(' - ')[0];
          const formattedDate = moment(dateStr, 'DD-MM-YYYY').format('YYYY-MM-DD');
          return formattedDate === dateToMoment;
        }
        return false;
      });
      setAppointments(filteredAppointments);
    } else {
      setAppointments(allAppointments);
    }
    setAppointment_details(null);
  }, [allAppointments]);

  const newAddedRow = useCallback(() => {
    if (selectedLocation) {
      fetchDataHandler(selectedLocation.id);
    }
  }, [selectedLocation, fetchDataHandler]);

  const update_reflect_on_close_modal = useCallback((new_date_time: string) => {
    const updateAppointments = (appointments: Appointment[]) =>
      appointments.map(elem =>
        elem.id === appointment_details?.id
          ? { ...elem, date_and_time: new_date_time }
          : elem
      );

    setAllAppointments(updateAppointments);
    setAppointments(updateAppointments);
    setAppointment_details(prev =>
      prev ? { ...prev, date_and_time: new_date_time } : prev
    );
  }, [appointment_details]);

  const sortHandle = useCallback((column: string) => {
    setSortOrder(prev => (prev === -1 ? 1 : -1));
    setSortColumn(column);

    setAppointments(prev => {
      const sortedList = [...prev];
      
      switch(column) {
        case 'gender':
          return sortedList.sort((a, b) => 
            sortOrder === 1 ? a.sex.localeCompare(b.sex) : b.sex.localeCompare(a.sex)
          );
        case 'name':
          return sortedList.sort((a, b) => {
            const nameA = `${a.first_name} ${a.last_name}`;
            const nameB = `${b.first_name} ${b.last_name}`;
            return sortOrder === 1 ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
          });
        case 'service':
          return sortedList.sort((a, b) =>
            sortOrder === 1 ? a.service.localeCompare(b.service) : b.service.localeCompare(a.service)
          );
        default:
          return sortedList.sort((a, b) => {
            const getDateTime = (dateTimeStr: string) => {
              const [datePart, timePart] = dateTimeStr.split('|')[1].trim().split(' - ');
              return moment(`${datePart} ${timePart}`, 'DD-MM-YYYY hh:mm A').valueOf();
            };

            if (!a.date_and_time || !b.date_and_time) return 0;
            
            const timeA = getDateTime(a.date_and_time);
            const timeB = getDateTime(b.date_and_time);
            
            return sortOrder === -1 ? timeA - timeB : timeB - timeA;
          });
      }
    });
  }, [sortOrder]);

  return (
    <main className="mt-20 w-full h-full text-[#B6B6B6] font-[500] text-[20px] space-y-5">
      <div className="flex justify-end items-end gap-3">
        <div className="flex justify-between items-center flex-1">
          <div className="flex items-center space-x-5">
            <Add_Appointment_Modal newAddedRow={newAddedRow} />
          </div>
          <div className="w-1/4">
            <DatePicker
              onChange={filterHandle}
              className="bg-[#D9D9D9] py-2 w-full"
              placeholder="Filter by date appointment"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-row h-[80vh] space-x-5">
        <div className="w-3/4 bg-[#EFEFEF] h-full overflow-scroll px-3 py-3 rounded-lg space-y-5">
          {appoint_loading ? (
            <div className="flex h-full flex-1 flex-col justify-center items-center">
              <Spinner size="xl" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex h-full flex-1 flex-col justify-center items-center">
              <h1>No Appointment is available</h1>
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
              {appointments.map((appointment) => (
                  <MemoizedTableRow
                    key={appointment.id}
                    appointment={appointment}
                    isSelected={appointment_details?.id === appointment.id}
                    onSelect={select_for_details_handle}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="w-1/4 bg-[#EFEFEF] overflow-scroll px-3 py-3 rounded-lg text-lg">
          {appointment_details ? (
            <AppointmentDetails
              appointment_details={appointment_details}
              onDelete={delete_appointments_handle}
              find_locations={find_locations}
              update_reflect_on_close_modal={update_reflect_on_close_modal}
            />
          ) : (
            <div className="flex h-full flex-1 flex-col justify-center items-center">
              <h1>Select appointment to view details</h1>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default memo(Appointments);

