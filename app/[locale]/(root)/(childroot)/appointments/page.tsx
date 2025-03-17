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
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AppointmentEditModal } from "@/components/Appointment/Appointment_Edit/Appointment_Edit_Modal";
import { TabContext } from "@/context";


const Appointments = () => {
  const { locations } = useLocationClinica();
  const [approvedAppointments, setApprovedAppointments] = useState<Appointment[]>([]);
  const [unapprovedAppointments, setUnapprovedAppointments] = useState<Appointment[]>([]);
  const [filteredApproved, setFilteredApproved] = useState<Appointment[]>([]);
  const [filteredUnapproved, setFilteredUnapproved] = useState<Appointment[]>([]);
  const [appointLoading, setAppointLoading] = useState(true);
  const [appointmentDetails, setAppointmentDetails] = useState<Appointment | null>(null);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [activeTab, setActiveTab] = useState("approval");
  const [isSheetopen, setisSheetopen] = useState(false)

  const { setActiveTitle } = useContext(TabContext); 

  useEffect(() => {
    setActiveTitle("Sidebar_k7");
  }, []);

  

  const { selectedLocation } = useContext(LocationContext);

  const fetchDataHandler = useCallback(async (locationId: number) => {
    setAppointLoading(true);
    // setAppointmentDetails(null);
    setisSheetopen(false)
    try {

      const [approvedData, unapprovedData] = await Promise.all([
        fetchApprovedAppointmentsByLocation(locationId),
        fetchUnapprovedAppointmentsByLocation(locationId)
      ]);


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
    setisSheetopen(true)
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

  const {t} = useTranslation(translationConstant.APPOINMENTS)

  return (
    <main className="mt-20 w-full h-full text-gray-600 font-medium text-lg space-y-5">
      <div className="flex justify-between items-center gap-3">
        <Add_Appointment_Modal newAddedRow={newAddedRow} />
        <div className="w-1/4">
          <DatePicker onChange={filterHandle} className="bg-gray-300 py-2 w-full" placeholder="Filter by date" />
        </div>
      </div>
      <Tabs  className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex justify-between space-x-5">
          <div>
          <TabsTrigger value="approval">{t("Appoinments_k24")}</TabsTrigger>
          <TabsTrigger value="request">{t("Appoinments_k25")}</TabsTrigger>
          </div>
          <div className="w-24">
          {appointmentDetails?
       <AppointmentEditModal
          defaultDateTime={appointmentDetails?.date_and_time}
          appointmentDetails={appointmentDetails}
          locationData={findLocations(appointmentDetails?.location_id)}
          updateAvailableData={ newAddedRow}
        />:
        null 
       }
       </div>
        </TabsList>
        <TabsContent value={activeTab} className="flex flex-row h-[68vh] space-x-5">
       
          <AppointmentsTable
          isUnapproved={activeTab == 'request'}
            appointments={activeTab == 'approval' ? filteredApproved : filteredUnapproved}
            appointLoading={appointLoading}
            onSelect={selectForDetailsHandle}
            sortHandle={sortHandle}
            sortColumn={sortColumn}
          />
          <AppointmentDetailsPanel
            isSheetopen = {isSheetopen}
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
  isSheetopen,
  appointmentDetails,
  onDelete,
  findLocations,
  updateReflectOnCloseModal
}: {
  isSheetopen : boolean
  appointmentDetails: Appointment | null;
  onDelete: (id: number) => void;
  findLocations: (id: number) => any;
  updateReflectOnCloseModal: () => void;
}) => {
  const {t} = useTranslation(translationConstant.APPOINMENTS);

  
  
  return (
    <Sheet 
      open={!!appointmentDetails && isSheetopen } 
      onOpenChange={(open) => {
        if (!open) {
          updateReflectOnCloseModal();
        }
      }}
    >
      <SheetContent className="p-0 pt-8"> {/* Top padding for cross icon */}
        <SheetTitle className="sr-only">
          {appointmentDetails ? `${appointmentDetails.first_name} ${appointmentDetails.last_name}'s Appointment Details` : 'Appointment Details'}
        </SheetTitle>
        <div className="pt-8 p-4"> {/* Content padding */}
          {appointmentDetails ? (
            <AppointmentDetails
              onDelete={onDelete}
              appointment_details={appointmentDetails}
              find_locations={findLocations}
              update_reflect_on_close_modal={updateReflectOnCloseModal}
            />
          ) : (
            <div className="flex h-full justify-center items-center">
              <h1 className="text-lg">Select an appointment to view details</h1>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default memo(Appointments);