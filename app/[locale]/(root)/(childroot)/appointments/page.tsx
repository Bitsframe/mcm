'use client'

import { useContext, useEffect, useState, useCallback, memo } from "react";
import { delete_appointment_service, fetchApprovedAppointmentsByLocation, fetchUnapprovedAppointmentsByLocation } from '@/utils/supabase/data_services/data_services';
import { toast } from "react-toastify";
import moment from "moment";
import { DatePicker } from "antd";
import { Add_Appointment_Modal } from "@/components/Appointment/Add_Appointment_Modal";
import { LocationContext } from "@/context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppointmentDetails from "@/components/Appointment-details/Appointment-Details";
import { useLocationClinica } from '@/hooks/useLocationClinica';
import AppointmentsTable from "@/components/Appointment/Appointment-table";

const Appointments = () => {
  const { locations } = useLocationClinica();
  const [approvedAppointments, setApprovedAppointments] = useState<Appointment[]>([]);
  const [unapprovedAppointments, setUnapprovedAppointments] = useState<Appointment[]>([]);
  const [filteredApproved, setFilteredApproved] = useState<Appointment[]>([]);
  const [filteredUnapproved, setFilteredUnapproved] = useState<Appointment[]>([]);
  const [appointLoading, setAppointLoading] = useState(true);
  const [appointmentDetails, setAppointmentDetails] = useState<Appointment | null>(null);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [activeTab, setActiveTab] = useState("request");

  const { selectedLocation } = useContext(LocationContext);

  const fetchDataHandler = useCallback(async (locationId: number) => {
    setAppointLoading(true);
    setAppointmentDetails(null);
    try {

      const [approvedData, unapprovedData] = await Promise.all([
        fetchApprovedAppointmentsByLocation(locationId),
        fetchUnapprovedAppointmentsByLocation(locationId)
      ]);

      console.log("unapprovedData ->", unapprovedData);
      console.log("approvedData ->", approvedData);

      setApprovedAppointments(approvedData as any);
      setFilteredApproved(approvedData as any);
      setUnapprovedAppointments(unapprovedData as any);
      setFilteredUnapproved(unapprovedData as any);
    } catch (error) {
      toast.error("Failed to fetch appointments.");
    } finally {
      setAppointLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchDataHandler(Number(selectedLocation.id));
    }
  }, [selectedLocation, fetchDataHandler]);

  const findLocations = useCallback((locationId: number) => {
    return locations.find((location: any) => location.id === locationId);
  }, [locations]);

  const selectForDetailsHandle = useCallback((appoint: Appointment) => {
    setAppointmentDetails(appoint);
  }, []);

  const deleteAppointmentsHandle = useCallback(async (delId: number) => {
    const { error } = await delete_appointment_service(Number(delId));
    if (!error) {
      const updateState = (prev: Appointment[]) => prev.filter(appoint => appoint.id !== delId);
      
      setApprovedAppointments(updateState);
      setFilteredApproved(updateState);
      setUnapprovedAppointments(updateState);
      setFilteredUnapproved(updateState);
      
      toast.success('Deleted successfully');
      setAppointmentDetails(null);
    } else {
      toast.error(error.message);
    }
  }, []);

  const filterHandle = useCallback((e: moment.Moment | null) => {
    if (e) {
      const dateToMoment = moment(e.toString()).format('YYYY-MM-DD');
      const filterByDate = (appointments: Appointment[]) => {
        return appointments.filter(appoint => {
          if (appoint.date_and_time) {
            const cleanedStr = appoint.date_and_time.replace(/^\d+\|/, '');
            const dateStr = cleanedStr.split(' - ')[0];
            const formattedDate = moment(dateStr, 'DD-MM-YYYY').format('YYYY-MM-DD');
            return formattedDate === dateToMoment;
          }
          return false;
        });
      };

      setFilteredApproved(filterByDate(approvedAppointments));
      setFilteredUnapproved(filterByDate(unapprovedAppointments));
    } else {
      setFilteredApproved(approvedAppointments);
      setFilteredUnapproved(unapprovedAppointments);
    }
    setAppointmentDetails(null);
  }, [approvedAppointments, unapprovedAppointments]);

  const sortHandle = useCallback((column: string) => {
    setSortColumn(column);
    const sortAppointments = (appointments: Appointment[]) => {
      return [...appointments].sort((a, b) => {
        switch (column) {
          case 'name':
            return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
          case 'gender':
            return a.sex.localeCompare(b.sex);
          case 'service':
            return a.service.localeCompare(b.service);
          case 'slot':
            return a.date_and_time.localeCompare(b.date_and_time);
          case 'time':
            return a.date_and_time.localeCompare(b.date_and_time);
          default:
            return 0;
        }
      });
    };

    setFilteredApproved(sortAppointments(filteredApproved));
    setFilteredUnapproved(sortAppointments(filteredUnapproved));
  }, [filteredApproved, filteredUnapproved]);

  const newAddedRow = useCallback(() => {
    if (selectedLocation) {
      fetchDataHandler(Number(selectedLocation.id));
    }
  }, [selectedLocation, fetchDataHandler]);

  return (
    <main className="mt-20 w-full h-full text-gray-600 font-medium text-lg space-y-5">
      <div className="flex justify-between items-center gap-3">
        <Add_Appointment_Modal newAddedRow={newAddedRow} />
        <div className="w-1/4">
          <DatePicker onChange={filterHandle} className="bg-gray-300 py-2 w-full" placeholder="Filter by date" />
        </div>
      </div>
      <Tabs  className="w-full" onValueChange={setActiveTab}>
        <TabsList className="flex justify-center space-x-5">
          <TabsTrigger value="approval">Approval Appointment</TabsTrigger>
          <TabsTrigger value="request">Request Approval Appointment</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="flex flex-row h-[80vh] space-x-5">
          <AppointmentsTable
          isUnapproved={activeTab == 'request'}
            appointments={activeTab == 'approval' ? filteredApproved : filteredUnapproved}
            appointLoading={appointLoading}
            onSelect={selectForDetailsHandle}
            sortHandle={sortHandle}
            sortColumn={sortColumn}
          />
          <AppointmentDetailsPanel
            appointmentDetails={appointmentDetails}
            onDelete={deleteAppointmentsHandle}
            findLocations={findLocations}
            updateReflectOnCloseModal={newAddedRow}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
};

const AppointmentDetailsPanel = ({
  appointmentDetails,
  onDelete,
  findLocations,
  updateReflectOnCloseModal
}: {
  appointmentDetails: Appointment | null;
  onDelete: (id: number) => void;
  findLocations: (id: number) => any;
  updateReflectOnCloseModal: () => void;
}) => (
  <div className="w-1/4 bg-gray-200 overflow-scroll px-3 py-3 rounded-lg text-lg">
    {appointmentDetails ? (
      <AppointmentDetails
        onDelete={onDelete}
        appointment_details={appointmentDetails}
        find_locations={findLocations}
        update_reflect_on_close_modal={updateReflectOnCloseModal}
      />
    ) : (
      <div className="flex h-full flex-col justify-center items-center">
        <h1>Select an appointment to view details</h1>
      </div>
    )}
  </div>
);

export default memo(Appointments);