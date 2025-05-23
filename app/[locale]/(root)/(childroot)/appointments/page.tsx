"use client";

import { useContext, useEffect, useState, useCallback, memo, useRef } from "react";
import {
  delete_appointment_service,
  fetchApprovedAppointmentsByLocation,
  fetchUnapprovedAppointmentsByLocation,
} from "@/utils/supabase/data_services/data_services";
import { toast } from "react-toastify";
import moment from "moment";
import { DatePicker } from "antd";
import { Add_Appointment_Modal } from "@/components/Appointment/Add_Appointment_Modal";
import { LocationContext } from "@/context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppointmentDetails from "@/components/Appointment-details/Appointment-Details";
import { useLocationClinica } from "@/hooks/useLocationClinica";
import AppointmentsTable from "@/components/Appointment/Appointment-table";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AppointmentEditModal } from "@/components/Appointment/Appointment_Edit/Appointment_Edit_Modal";
import { TabContext } from "@/context";
import {
  Calendar,
  CheckCircle,
  Clock,
  CirclePlus,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";


const Appointments = () => {
  const { locations } = useLocationClinica();
  const [approvedAppointments, setApprovedAppointments] = useState<
    Appointment[]
  >([]);
  const [unapprovedAppointments, setUnapprovedAppointments] = useState<
    Appointment[]
  >([]);
  const [filteredApproved, setFilteredApproved] = useState<Appointment[]>([]);
  const [filteredUnapproved, setFilteredUnapproved] = useState<Appointment[]>(
    []
  );
  const [appointLoading, setAppointLoading] = useState(true);
  const [appointmentDetails, setAppointmentDetails] =
    useState<Appointment | null>(null);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [activeTab, setActiveTab] = useState("approved");
  const [isSheetopen, setisSheetopen] = useState(false);
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(
    null
  );
  const [selectedAppointments, setSelectedAppointments] = useState<number[]>(
    []
  );

  // Add these refs to store original unsorted data
  const originalApprovedRef = useRef<Appointment[]>([]);
  const originalUnapprovedRef = useRef<Appointment[]>([]);

  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k7");
  }, []);

  const { selectedLocation } = useContext(LocationContext);

  const fetchDataHandler = useCallback(async (locationId: number) => {
    setAppointLoading(true);
    setisSheetopen(false);
    try {
      const [approvedData, unapprovedData] = await Promise.all([
        fetchApprovedAppointmentsByLocation(locationId),
        fetchUnapprovedAppointmentsByLocation(locationId),
      ]);

      setApprovedAppointments(approvedData as any);
      setFilteredApproved(approvedData as any);
      setUnapprovedAppointments(unapprovedData as any);
      setFilteredUnapproved(unapprovedData as any);
      
      // Store original unsorted data
      originalApprovedRef.current = approvedData as any;
      originalUnapprovedRef.current = unapprovedData as any;
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

  const findLocations = useCallback(
    (locationId: number) => {
      const location = locations.find((location: any) => location.id === locationId);
      return location as unknown as LocationInterface || null;
    },
    [locations]
  );

  const selectForDetailsHandle = useCallback((appoint: Appointment) => {
    setAppointmentDetails(appoint);
    setisSheetopen(true);
  }, []);

  const handleEditAppointment = useCallback((appointment: Appointment) => {
    setEditAppointment(appointment);
    setisSheetopen(false);
  }, []);

  const deleteAppointmentsHandle = useCallback(async (delId: number) => {
    const { error } = await delete_appointment_service(Number(delId));
    if (!error) {
      const updateState = (prev: Appointment[]) =>
        prev.filter((appoint) => appoint.id !== delId);
      setApprovedAppointments(updateState);
      setFilteredApproved(updateState);
      setUnapprovedAppointments(updateState);
      setFilteredUnapproved(updateState);

      // Update original refs as well
      originalApprovedRef.current = updateState(originalApprovedRef.current);
      originalUnapprovedRef.current = updateState(originalUnapprovedRef.current);

      toast.success("Deleted successfully");
      setAppointmentDetails(null);
    } else {
      toast.error(error.message);
    }
  }, []);

  const filterHandle = useCallback(
    (e: moment.Moment | null) => {
      if (e) {
        const dateToMoment = moment(e.toString()).format("YYYY-MM-DD");
        const filterByDate = (appointments: Appointment[]) => {
          return appointments.filter((appoint) => {
            if (appoint.date_and_time) {
              const cleanedStr = appoint.date_and_time.replace(/^\d+\|/, "");
              const dateStr = cleanedStr.split(" - ")[0];
              const formattedDate = moment(dateStr, "DD-MM-YYYY").format(
                "YYYY-MM-DD"
              );
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
    },
    [approvedAppointments, unapprovedAppointments]
  );

  const sortHandle = useCallback(
    (column: string) => {
      // If clicking the same column that's already sorted, return to original order
      if (sortColumn === column) {
        setFilteredApproved([...originalApprovedRef.current]);
        setFilteredUnapproved([...originalUnapprovedRef.current]);
        setSortColumn("");
        return;
      }

      // Store original data if this is the first sort
      if (!sortColumn) {
        originalApprovedRef.current = [...filteredApproved];
        originalUnapprovedRef.current = [...filteredUnapproved];
      }

      setSortColumn(column);
      const sortAppointments = (appointments: Appointment[]) => {
        return [...appointments].sort((a, b) => {
          switch (column) {
            case "name":
              return `${a.first_name} ${a.last_name}`.localeCompare(
                `${b.first_name} ${b.last_name}`
              );
            case "gender":
              return a.sex.localeCompare(b.sex);
            case "service":
              return a.service.localeCompare(b.service);
            case "slot":
              return a.date_and_time.localeCompare(b.date_and_time);
            case "time":
              return a.date_and_time.localeCompare(b.date_and_time);
            default:
              return 0;
          }
        });
      };

      setFilteredApproved(sortAppointments(filteredApproved));
      setFilteredUnapproved(sortAppointments(filteredUnapproved));
    },
    [filteredApproved, filteredUnapproved, sortColumn]
  );

  const newAddedRow = useCallback(() => {
    if (selectedLocation) {
      fetchDataHandler(Number(selectedLocation.id));
    }
  }, [selectedLocation, fetchDataHandler]);

  const { t } = useTranslation(translationConstant.APPOINMENTS);

  return (
    <main className="w-full h-full text-gray-600 font-medium space-y-5 dark:bg-gray-900 dark:text-gray-300">
      <h1 className="text-2xl font-bold text-black px-4 pt-4 dark:text-white">
        Appointments
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-4 mb-6">
        <Card className="bg-[#F1F4F9] dark:bg-[#080E16]">
          <CardContent className="p-4 flex items-center gap-4 ">
            <div className="bg-white p-3 rounded-lg dark:bg-gray-700">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Appointments
              </p>
              <h2 className="text-2xl font-bold dark:text-white">
                {approvedAppointments.length + unapprovedAppointments.length}
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#F1F4F9] dark:bg-[#080E16]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-white p-3 rounded-lg dark:bg-gray-700">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Approved Appointments
              </p>
              <h2 className="text-2xl font-bold dark:text-white">
                {approvedAppointments.length}
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#F1F4F9] dark:bg-[#080E16]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-white p-3 rounded-lg dark:bg-gray-700">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Pending Appointments
              </p>
              <h2 className="text-2xl font-bold dark:text-white">
                {unapprovedAppointments.length}
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#F1F4F9] dark:bg-[#080E16]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-white p-3 rounded-lg dark:bg-gray-700">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                New Appointments
              </p>
              <h2 className="text-2xl font-bold dark:text-white">
                {unapprovedAppointments.length}
              </h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg p-4 dark:bg-[#0E1725]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 ">
          <Tabs
            className="w-full"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="bg-gray-100 p-1 rounded-lg dark:bg-[#080E16]">
              <TabsTrigger
                value="approved"
                className="data-[state=active]:bg-[#0066ff] data-[state=active]:text-white rounded-md px-4 py-2 dark:data-[state=active]:bg-blue-600"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approved Appointments
              </TabsTrigger>
              <TabsTrigger
                value="request"
                className="data-[state=active]:bg-[#0066ff] data-[state=active]:text-white rounded-md px-4 py-2 dark:data-[state=active]:bg-blue-600"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                New Appointments
              </TabsTrigger>
            </TabsList>
          </Tabs>

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

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="w-full md:w-64">
            <DatePicker
              onChange={filterHandle}
              className="w-full border border-gray-300 rounded-lg p-2 
             text-black placeholder-gray-400
             dark:border-gray-600 dark:bg-gray-700 
             dark:text-white dark:placeholder-white"
              placeholder="Filter by date"
              suffixIcon={
                <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              }
            />
          </div>

          <div className="flex items-center ">
            <Add_Appointment_Modal newAddedRow={newAddedRow} />
          </div>
        </div>

        <AppointmentsTable
          isUnapproved={activeTab === "request"}
          appointments={
            activeTab === "approved" ? filteredApproved : filteredUnapproved
          }
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
        />
      </div>

      <AppointmentDetailsPanel
        isSheetopen={isSheetopen}
        appointmentDetails={appointmentDetails}
        onDelete={deleteAppointmentsHandle}
        findLocations={findLocations}
        updateReflectOnCloseModal={newAddedRow}
      />
    </main>
  );
};

const AppointmentDetailsPanel = ({
  isSheetopen,
  appointmentDetails,
  onDelete,
  findLocations,
  updateReflectOnCloseModal,
}: {
  isSheetopen: boolean;
  appointmentDetails: Appointment | null;
  onDelete: (id: number) => void;
  findLocations: (id: number) => any;
  updateReflectOnCloseModal: () => void;
}) => {
  const { t } = useTranslation(translationConstant.APPOINMENTS);

  return (
    <Sheet
      open={!!appointmentDetails && isSheetopen}
      onOpenChange={(open) => {
        if (!open) {
          updateReflectOnCloseModal();
        }
      }}
  
    >
      <SheetContent className="p-0 dark:bg-gray-900 m-3 rounded-xl">
        <SheetTitle className="sr-only">
          {appointmentDetails
            ? `${appointmentDetails.first_name} ${appointmentDetails.last_name}'s Appointment Details`
            : "Appointment Details"}
        </SheetTitle>
        <div className="p-4">
          {appointmentDetails ? (
            <AppointmentDetails
              onDelete={onDelete}
              appointment_details={appointmentDetails}
              find_locations={findLocations}
              update_reflect_on_close_modal={updateReflectOnCloseModal}
            />
          ) : (
            <div className="flex h-full justify-center items-center dark:text-gray-300">
              <h1 className="text-lg">Select an appointment to view details</h1>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default memo(Appointments);