"use client";

import type React from "react";
import {
  type FC,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { Label, Spinner } from "flowbite-react";
import moment from "moment";
import { fetch_content_service } from "@/utils/supabase/data_services/data_services";
import { PiCaretUpDownBold } from "react-icons/pi";
import { formatPhoneNumber } from "@/utils/getCountryName";
import { LocationContext } from "@/context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "../ui/input";
import { getServices } from "@/actions/send-email/action";
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import {
  Eye,
  SquarePen,
  Trash2,
  Search,
  MoreHorizontal,
  CirclePlus,
  MapPin,
  X,
} from "lucide-react";
import axios from "axios";

import { toast } from "sonner";
import { Sheet, SheetContent } from "../ui/sheet";
import { TabContext } from "@/context";
import { Checkbox } from "../ui/checkbox";

interface EditPatientModalProps {
  patientDetails: Patient;
  serviceList: { title: string }[];
  callAfterUpdate: (data: any) => void;
}

interface Patient {
  id: number;
  onsite: boolean;
  firstname: string;
  locationid: number;
  lastname: string;
  phone: string;
  email: string;
  treatmenttype: string;
  gender: string;
  created_at: string;
  lastvisit: string;
}

interface Props {
  renderType: "all" | "onsite" | "offsite";
}

const QUERIES = {
  all: null,
  onsite: { key: "onsite", value: true },
  offsite: { key: "onsite", value: false },
} as const;

const PatientTableComponent: FC<Props> = ({ renderType = "all" }) => {
  const { selectedLocation } = useContext(LocationContext);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<number[]>([]);

  const [patientData, setPatientData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    treatmenttype: "",
    gender: "",
    onsite: true,
    locationId: 0,
  });

  const [sortConfig, setSortConfig] = useState({
    key: "",
    direction: -1,
  });
  const [serviceList, setServiceList] = useState<{ title: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setActiveTitle, setParentTitle } = useContext(TabContext);

  useEffect(() => {
    const keys: { [key: string]: string } = {
      all: "Sidebar_k4",
      onsite: "Sidebar_k5",
      offsite: "Sidebar_k6",
    };
    setActiveTitle(keys[renderType]);
    setParentTitle("Patients");
  }, [renderType]);

  const fetchServiceList = async () => {
    try {
      const services = await getServices();
      setServiceList(services);
    } catch (error) {
      console.error("Failed to fetch services:", error);
    }
  };

  const fetchPatients = useCallback(
    async (locationId: number) => {
      setLoading(true);
      try {
        const fetchedData = await fetch_content_service({
          table: "allpatients",
          language: "",
          matchCase: [
            QUERIES[renderType] as any,
            { key: "locationid", value: locationId },
          ],
        });
        setPatients(fetchedData);
      } catch (error) {
        console.error("Error fetching patients:", error);
      } finally {
        setLoading(false);
      }
    },
    [renderType]
  );

  useEffect(() => {
    if (selectedLocation?.id) {
      fetchPatients(selectedLocation.id);
      fetchServiceList();
    }
  }, [selectedLocation?.id, fetchPatients]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSort = useCallback((column: string) => {
    setSortConfig((prevConfig) => ({
      key: column,
      direction: prevConfig.key === column ? -prevConfig.direction : -1,
    }));
  }, []);

  const filteredAndSortedPatients = useMemo(() => {
    let result = [...patients];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((patient) =>
        `${patient.firstname} ${patient.lastname}`
          .toLowerCase()
          .includes(searchLower)
      );
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        if (sortConfig.key === "name") {
          const aName = `${a.firstname} ${a.lastname}`;
          const bName = `${b.firstname} ${b.lastname}`;
          return sortConfig.direction * aName.localeCompare(bName);
        }
        if (sortConfig.key === "id") {
          return sortConfig.direction * (a.id - b.id);
        }
        if (sortConfig.key === "date") {
          return (
            sortConfig.direction *
            (new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime())
          );
        }
        return 0;
      });
    }

    return result;
  }, [patients, searchTerm, sortConfig]);

  const formatDate = useCallback((date: string) => {
    return moment(date, "YYYY-MM-DD h:mm s").format("MMM DD, YYYY");
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/user", {
        firstname: patientData.firstname,
        lastname: patientData.lastname,
        email: patientData.email,
        phone: patientData.phone,
        gender: patientData.gender,
        treatmenttype: patientData.treatmenttype,
        locationid: selectedLocation?.id || 17,
        lastvisit: new Date(),
        onsite: patientData.onsite,
      });

      fetchPatients(selectedLocation.id);
      setIsModalOpen(false);

      if (response) {
        toast.success("New patient added successfully");
      }
    } catch (error) {
      toast.error("Failed to add patient. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateOnEdit = (data: any) => {
    setPatients((pre: any) => {
      return pre.map((elem: any) => {
        if (data.id === elem.id) {
          return { ...data };
        } else {
          return elem;
        }
      });
    });
    setSelectedPatient((pre: any) => ({ ...pre, ...data }));
  };

  useEffect(() => {
    fetchServiceList();
  }, []);

  const { t } = useTranslation(translationConstant.PATIENTS);

  const isFormValid = useMemo(() => {
    return (
      patientData.firstname &&
      patientData.lastname &&
      patientData.email &&
      patientData.phone &&
      patientData.treatmenttype &&
      patientData.gender &&
      patientData.onsite !== undefined
    );
  }, [patientData]);

  const [editPatientData, setEditPatientData] = useState<Patient | null>(null);

  useEffect(() => {
    if (selectedPatient) {
      setEditPatientData(selectedPatient);
    }
  }, [selectedPatient]);

  const togglePatientSelection = (patientId: number) => {
    setSelectedPatients((prev) => {
      if (prev.includes(patientId)) {
        return prev.filter((id) => id !== patientId);
      } else {
        return [...prev, patientId];
      }
    });
  };

  return (
    <main className="w-full dark:bg-gray-900">
      <div className="px-6 pt-5">
        <h1 className="text-2xl font-bold dark:text-white">
          {renderType === "all"
            ? t("Patients_k1")
            : renderType === "onsite"
            ? "Onsite Patients"
            : "Offsite Patients"}
        </h1>
        <h1 className="mt-1 text-gray-500 dark:text-gray-400">
          {renderType === "all"
            ? "Patients  /  All"
            : renderType === "onsite"
            ? "Patients  /  Onsite"
            : "Patients  /  Offsite"}
        </h1>
      </div>

      <div className="flex items-center justify-between px-6 py-4">
        <div className="relative w-72 border rounded-lg dark:border-gray-700">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            onChange={handleSearch}
            value={searchTerm}
            type="text"
            placeholder={t("Patients_k3")}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          <CirclePlus className="h-4 w-4" />
          Add a Patient
        </Button>
      </div>

      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 overflow-y-auto dark:bg-gray-900">
          <div className="p-6">
            <AlertDialogHeader className="space-y-2 pb-2">
              <div className="flex justify-between items-center">
                <AlertDialogTitle className="text-2xl font-semibold dark:text-white">
                  Add New Patient
                </AlertDialogTitle>
                <AlertDialogCancel className="h-8 w-8 p-0 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-100 absolute right-6 top-6 z-10 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                  <X className="h-5 w-5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100" />
                </AlertDialogCancel>
              </div>
              <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
                Enter the patient's information below. Click save when you're
                done.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {selectedLocation?.title && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-gray-50 rounded-md dark:bg-gray-800">
                <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current Location</p>
                  <p className="font-medium dark:text-white">{selectedLocation?.title}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstname"
                      className="text-sm text-gray-500 dark:text-gray-400"
                    >
                      First Name
                    </Label>
                    <Input
                      id="firstname"
                      placeholder="Enter firstname"
                      onChange={(e) =>
                        setPatientData({
                          ...patientData,
                          firstname: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastname" className="text-sm text-gray-500 dark:text-gray-400">
                      Last Name
                    </Label>
                    <Input
                      id="lastname"
                      placeholder="Enter lastname"
                      onChange={(e) =>
                        setPatientData({
                          ...patientData,
                          lastname: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm text-gray-500 dark:text-gray-400">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter phone"
                      onChange={(e) =>
                        setPatientData({
                          ...patientData,
                          phone: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-gray-500 dark:text-gray-400">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter Email"
                      onChange={(e) =>
                        setPatientData({
                          ...patientData,
                          email: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="treatmenttype"
                    className="text-sm text-gray-500 dark:text-gray-400"
                  >
                    Treatment Type
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setPatientData({ ...patientData, treatmenttype: value })
                    }
                  >
                    <SelectTrigger className="w-full bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                      <SelectValue placeholder="Select treatment type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      {serviceList.map((service: { title: string }) => (
                        <SelectItem 
                          key={service.title} 
                          value={service.title}
                          className="dark:hover:bg-gray-700 dark:text-white"
                        >
                          {service.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-500 dark:text-gray-400">Gender</Label>
                    <RadioGroup
                      className="flex gap-3"
                      onValueChange={(value) =>
                        setPatientData({ ...patientData, gender: value })
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male" className="dark:text-gray-300">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female" className="dark:text-gray-300">Female</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other" className="dark:text-gray-300">Other</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-500 dark:text-gray-400">Location</Label>
                    <RadioGroup
                      defaultValue="true"
                      className="flex gap-3"
                      onValueChange={(value) =>
                        setPatientData({
                          ...patientData,
                          onsite: value === "true",
                        })
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="onsite" />
                        <Label htmlFor="onsite" className="dark:text-gray-300">On site</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="offsite" />
                        <Label htmlFor="offsite" className="dark:text-gray-300">Off site</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <AlertDialogCancel asChild>
                  <Button
                    variant="outline"
                    className="border-gray-200 text-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !isFormValid}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </Button>
                </AlertDialogAction>
              </div>
            </form>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-full px-6 dark:bg-[#0E1725]">
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden dark:bg-[#0E1725] dark:border-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-[#0E1725]">
                <TableHead className="w-[50px] py-3 dark:border-gray-800">
                  <Checkbox
                    checked={
                      selectedPatients.length ===
                        filteredAndSortedPatients.length &&
                      filteredAndSortedPatients.length > 0
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPatients(
                          filteredAndSortedPatients.map((p) => p.id)
                        );
                      } else {
                        setSelectedPatients([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="py-3 font-medium w-72 text-gray-700 dark:text-gray-300">
                  {t("Patients_k4")}
                  <button
                    onClick={() => handleSort("id")}
                    className="ml-1 text-gray-400 hover:text-gray-600 active:opacity-70 dark:text-gray-500 dark:hover:text-gray-400"
                  >
                    <PiCaretUpDownBold
                      className={`inline ${
                        sortConfig.key === "id" ? "text-blue-600 dark:text-blue-400" : ""
                      }`}
                    />
                  </button>
                </TableHead>
                <TableHead className="py-3 w-72 text-center font-medium text-gray-700 dark:text-gray-300">
                  {t("Patients_k5")}
                  <button
                    onClick={() => handleSort("name")}
                    className="ml-1 text-gray-400 hover:text-gray-600 active:opacity-70 dark:text-gray-500 dark:hover:text-gray-400"
                  >
                    <PiCaretUpDownBold
                      className={`inline ${
                        sortConfig.key === "name" ? "text-blue-600 dark:text-blue-400" : ""
                      }`}
                    />
                  </button>
                </TableHead>
                <TableHead className="py-3 w-72 text-center font-medium text-gray-700 dark:text-gray-300">
                  {t("Patients_k6")}
                  <button
                    onClick={() => handleSort("date")}
                    className="ml-1 text-gray-400 hover:text-gray-600 active:opacity-70 dark:text-gray-500 dark:hover:text-gray-400"
                  >
                    <PiCaretUpDownBold
                      className={`inline ${
                        sortConfig.key === "date" ? "text-blue-600 dark:text-blue-400" : ""
                      }`}
                    />
                  </button>
                </TableHead>
                <TableHead className=" text-right py-3 w-72 font-medium text-gray-700 dark:text-gray-300">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
          </Table>

          <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
            <Table>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 dark:border-gray-800">
                      <div className="flex justify-center items-center h-full">
                        <Spinner size="xl" className="dark:text-white" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAndSortedPatients.length > 0 ? (
                  filteredAndSortedPatients.map((patient) => (
                    <TableRow
                      key={patient.id}
                      className="hover:bg-gray-50 border-b border-gray-200 dark:hover:bg-gray-800 dark:border-gray-800"
                    >
                      <TableCell className="w-[50px] dark:border-gray-800">
                        <Checkbox
                          checked={selectedPatients.includes(patient.id)}
                          onCheckedChange={() =>
                            togglePatientSelection(patient.id)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium w-72 text-gray-900 dark:text-white">
                        {patient.id}
                      </TableCell>
                      <TableCell className="font-medium w-72 text-center text-gray-900 dark:text-white">
                        {patient.firstname} {patient.lastname}
                      </TableCell>
                      <TableCell className="text-gray-700 w-72 text-center dark:text-gray-300">
                        {formatDate(patient.created_at)}
                      </TableCell>
                      <TableCell className="w-72 dark:border-gray-800">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedPatient(patient)}
                            className="h-8 w-8 text-gray-500 dark:text-gray-400"
                          >
                            <Eye className="h-4 w-4" color="gray" />
                            <span className="sr-only">View</span>
                          </Button>
                          <EditPatientModal
                            callAfterUpdate={updateOnEdit}
                            patientDetails={patient}
                            serviceList={serviceList}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 dark:text-gray-400"
                          >
                            <Trash2 className="h-4 w-4" color="red" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 dark:border-gray-800">
                      <div className="flex flex-col justify-center items-center h-full text-gray-500 dark:text-gray-400">
                        <p className="text-lg font-medium">No patients found</p>
                        <p className="text-sm">
                          Try adjusting your search or add a new patient
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-5 dark:text-gray-400">
          {selectedPatients.length} of {patients.length} row(s) selected.
        </div>
      </div>

      <Sheet
        open={!!selectedPatient}
        onOpenChange={(open) => !open && setSelectedPatient(null)}
      >
        <SheetContent className="dark:bg-gray-900">
          <div className="flex flex-col h-full">
            <div className="flex justify-between text-2xl font-bold items-center pb-4 border-b mt-10 dark:border-gray-700">
              <h3 className="text-xl font-semibold dark:text-white">Patient Detail</h3>
            </div>

            {selectedPatient && (
              <ScrollArea className="flex-1 pr-4 -mr-4">
                <PatientDetails
                  patient={selectedPatient}
                  renderType={renderType}
                  formatDate={formatDate}
                  serviceList={serviceList}
                />
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
};

const PatientDetails: FC<{
  patient: Patient;
  serviceList: { title: string }[];
  renderType: Props["renderType"];
  formatDate: (date: string) => string;
}> = ({ patient, renderType, formatDate }) => {
  const { t } = useTranslation(translationConstant.PATIENTS);

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("Patients_k4")}</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{patient.id}</h2>
        </div>
        {renderType === "all" && (
          <div>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                patient.onsite
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
              }`}
            >
              {patient.onsite ? "On-site" : "Off-site"} Patient
            </span>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("Patients_k5")}</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {patient.firstname} {patient.lastname}
        </h2>
      </div>

      <div className="h-px w-full bg-gray-200 dark:bg-gray-700" />

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("Patients_k9")}</p>
          <p className="text-base font-medium dark:text-gray-300">
            {formatPhoneNumber(patient.phone)}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("Patients_k10")}</p>
          <p className="text-base font-medium dark:text-gray-300">{patient.email}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("Patients_k11")}</p>
          <p className="text-base font-medium dark:text-gray-300">{patient.treatmenttype}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("Patients_k12")}</p>
          <p className="text-base font-medium capitalize dark:text-gray-300">{patient.gender}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("Patients_k13")}</p>
            <p className="text-base font-medium dark:text-gray-300">
              {formatDate(patient.created_at)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("Patients_k14")}</p>
            <p className="text-base font-medium dark:text-gray-300">
              {formatDate(patient.lastvisit)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditPatientModal: React.FC<EditPatientModalProps> = ({
  patientDetails,
  serviceList,
  callAfterUpdate,
}) => {
  const [patientData, setPatientData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    treatmenttype: "",
  });

  const [loading, setLoading] = useState(false);
  const { selectedLocation } = useContext(LocationContext);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (patientDetails) {
      setPatientData({
        firstname: patientDetails.firstname || "",
        lastname: patientDetails.lastname || "",
        phone: patientDetails.phone || "",
        email: patientDetails.email || "",
        treatmenttype: patientDetails.treatmenttype || "",
      });
    }
  }, [patientDetails]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setPatientData({ ...patientData, [e.target.name]: e.target.value });
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await axios.put("/api/user", {
        id: patientDetails?.id,
        firstname: patientData?.firstname,
        lastname: patientData?.lastname,
        email: patientData?.email,
        phone: patientData?.phone,
        treatmenttype: patientData?.treatmenttype,
      });

      if (data?.data?.success === true) {
        callAfterUpdate(data?.data?.data?.[0]);
        toast.success("Patient details updated successfully");
      }
    } catch (error: any) {
      toast.error("Failed to update patient details");
      console.log("Error updating patient details:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const { t } = useTranslation(translationConstant.PATIENTS);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 dark:text-gray-400"
        >
          <SquarePen className="h-4 w-4" color="#0066ff" />
          <span className="sr-only">Edit</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[500px] dark:bg-gray-900">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl dark:text-white">
            {t("Patients_k15")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
            {t("Patients_k16")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 mt-3">
          {errorMessage && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium dark:text-gray-300">{t("Patients_k17")}</Label>
              <Input
                type="text"
                name="firstname"
                value={patientData.firstname}
                onChange={handleChange}
                className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium dark:text-gray-300">{t("Patients_k18")}</Label>
              <Input
                type="text"
                name="lastname"
                value={patientData.lastname}
                onChange={handleChange}
                className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium dark:text-gray-300">{t("Patients_k19")}</Label>
              <Input
                type="text"
                name="phone"
                value={patientData.phone}
                onChange={handleChange}
                className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium dark:text-gray-300">{t("Patients_k20")}</Label>
              <Input
                type="email"
                name="email"
                value={patientData.email}
                onChange={handleChange}
                className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium dark:text-gray-300">{t("Patients_k11")}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                  {patientData.treatmenttype || "Select Treatment"}
                  <MoreHorizontal className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full min-w-[200px] dark:bg-gray-800 dark:border-gray-700">
                <DropdownMenuLabel className="dark:text-gray-300">{t("Patients_k11")}</DropdownMenuLabel>
                <DropdownMenuSeparator className="dark:bg-gray-700" />
                <ScrollArea className="h-72 w-full">
                  {serviceList.map((service) => (
                    <DropdownMenuItem
                      key={service.title}
                      onSelect={() =>
                        setPatientData((prev) => ({
                          ...prev,
                          treatmenttype: service.title,
                        }))
                      }
                      className="dark:hover:bg-gray-700 dark:text-white"
                    >
                      {service.title}
                    </DropdownMenuItem>
                  ))}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <AlertDialogFooter className="mt-6 flex justify-end gap-2">
          <AlertDialogCancel className="border-gray-300 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
            {t("Patients_k21")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSaveChanges}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PatientTableComponent;