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
import { fetch_content_service, fetchLocations } from "@/utils/supabase/data_services/data_services";
import { PiCaretUpDownBold } from "react-icons/pi";
import { formatPhoneNumber } from "@/utils/getCountryName";
import { formatCount } from "@/helper/common_functions";
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
import enPatients from "@/locales/en/Patients.json";
import {
  Eye,
  SquarePen,
  Search,
  MoreHorizontal,
  CirclePlus,
  MapPin,
  X,
  Phone,
  Mail,
  Calendar,
  User,
  FileText,
  Trash2,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Sheet, SheetContent } from "../ui/sheet";
import { TabContext } from "@/context";
import { Card, CardContent } from "../ui/card";
import PhoneNumberInput from "../PhoneNumberInput";

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
  gender: string;
  created_at: string;
  lastvisit: string;
  note: string;
  deleted_at?: string | null;
  address?: string;
  dob?: string;
}

interface Props {
  renderType: "all" | "onsite" | "offsite";
}

const QUERIES = {
  all: null,
  onsite: { key: "onsite", value: true },
  offsite: { key: "onsite", value: false },
} as const;

// Main patient table component
const PatientTableComponent: FC<Props> = ({ renderType = "all" }) => {
  const { selectedLocation } = useContext(LocationContext);
  const selectedLocationId = (selectedLocation as any)?.id ?? null;
  const [locations, setLocations] = useState<any[]>([]);
  const [locationFilter, setLocationFilter] = useState<number | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [searchType, setSearchType] = useState<
    "all" | "name" | "email" | "phone" | "id"
  >("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<number[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [isMobile, setIsMobile] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const { t } = useTranslation(translationConstant.PATIENTS);

  const [patientData, setPatientData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    gender: "",
    onsite: true,
    locationId: 0,
    note: "",
    streetAddress: "",
    dateOfBirth: "",
  });

  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setPatientData({
      ...patientData,
      email: email,
    });
    
    if (email && !isValidEmail(email)) {
      setEmailError("Please enter a valid email format");
    } else {
      setEmailError("");
    }
  };

  const isValidPhone = (phone: string) => {
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    // US phone numbers should be 10 digits (without country code) or 11 digits (with country code 1)
    return digitsOnly.length === 10 || (digitsOnly.length === 11 && digitsOnly.startsWith('1'));
  };

  const formatPhoneInput = (value: string) => {
    // Remove all non-digit characters except + at the beginning
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // If it starts with +1, keep it, otherwise remove any + not at the beginning
    if (cleaned.startsWith('+1')) {
      cleaned = '+1' + cleaned.slice(2).replace(/\+/g, '');
    } else if (cleaned.startsWith('+')) {
      cleaned = cleaned.slice(1);
    }
    
    // Limit to 12 characters (+1 + 10 digits)
    if (cleaned.startsWith('+1')) {
      cleaned = cleaned.slice(0, 12);
    } else {
      cleaned = cleaned.slice(0, 10);
    }
    
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedPhone = formatPhoneInput(rawValue);
    
    setPatientData({
      ...patientData,
      phone: formattedPhone,
    });
    
    if (formattedPhone && !isValidPhone(formattedPhone)) {
      setPhoneError("Please enter a valid US phone number (10-11 digits)");
    } else {
      setPhoneError("");
    }
  };

  // Simple debounce function
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Debounced address search function
  const searchAddresses = debounce(async (searchTerm: string) => {
    if (searchTerm.length < 4) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    setAddressLoading(true);
    try {
      const response = await fetch(`/api/address/suggestions?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (data.success && data.suggestions) {
        setAddressSuggestions(data.suggestions);
        setShowAddressSuggestions(true);
      } else {
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    } finally {
      setAddressLoading(false);
    }
  }, 300);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setPatientData({
      ...patientData,
      streetAddress: address,
    });
    
    // Trigger address search
    searchAddresses(address);
  };

  const handleAddressSelect = (suggestion: any) => {
    setPatientData({
      ...patientData,
      streetAddress: suggestion.fullAddress,
    });
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
  };

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
  }, [renderType, setActiveTitle, setParentTitle]);

  const fetchServiceList = async () => {
    try {
      const services = await getServices();
      setServiceList(services);
    } catch (error) {
      console.error("Failed to fetch services:", error);
    }
  };

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      // Build matchCase: always include renderType (onsite/offsite) if present.
      const baseMatch = QUERIES[renderType] as any;

      // For the "all" tab we load every patient once and filter by location in the UI
      // so per-location counts stay accurate in the header badge.
      let matchCase: any = null;
      const chosenLocationId =
        renderType === "all"
          ? null
          : locationFilter ?? selectedLocationId ?? null;
      if (chosenLocationId) {
        if (baseMatch) {
          matchCase = [baseMatch, { key: "locationid", value: chosenLocationId }];
        } else {
          matchCase = { key: "locationid", value: chosenLocationId };
        }
      } else {
        matchCase = baseMatch || null;
      }

      const fetchedData = await fetch_content_service({
        table: "allpatients",
        language: "",
        selectParam: ",note",
        matchCase,
        filterOptions: [{ column: "deleted_at", operator: "is", value: null }],
        fetchAll: true,
        skipLocationFilter: true,
      });
      setPatients(fetchedData || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  }, [renderType, selectedLocationId, locationFilter]);

  useEffect(() => {
    // Fetch patients (either all locations or a specific selected location) and refresh services list.
    fetchPatients();
    fetchServiceList();
  }, [fetchPatients]);

  // Load all locations for the location filter dropdown
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const locs = await fetchLocations();
        if (mounted) setLocations(locs || []);
      } catch (err) {
        console.error("Failed to load locations", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSort = useCallback((column: string) => {
    setSortConfig((prevConfig) => ({
      key: column,
      direction: prevConfig.key === column ? -prevConfig.direction : -1,
    }));
  }, []);

  const patientsByLocation = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const patient of patients) {
      const locId = Number(patient.locationid);
      if (!Number.isNaN(locId)) {
        counts[locId] = (counts[locId] || 0) + 1;
      }
    }
    return counts;
  }, [patients]);

  const effectiveLocationId = useMemo(() => {
    if (locationFilter != null) return locationFilter;
    if (renderType !== "all" && selectedLocationId != null) {
      return Number(selectedLocationId);
    }
    return null;
  }, [locationFilter, renderType, selectedLocationId]);

  const filteredAndSortedPatients = useMemo(() => {
    let result = [...patients];

    if (effectiveLocationId != null) {
      result = result.filter(
        (patient) => Number(patient.locationid) === effectiveLocationId
      );
    }

    if (searchTerm) {
      const searchLower = searchTerm.trim().toLowerCase();

      const safe = (val: any) => (val ?? "").toString().toLowerCase();

      result = result.filter((patient) => {
        const first = safe(patient.firstname);
        const last = safe(patient.lastname);
        const fullName = `${first} ${last}`.trim();

        // Support multi-token name searches (e.g. "Doe John") by requiring
        // that each token exists somewhere in the full name.
        const nameTokens = searchLower.split(/\s+/).filter(Boolean);

        switch (searchType) {
          case "name":
            return nameTokens.every((token) => fullName.includes(token));
          case "email":
            return safe(patient.email).includes(searchLower);
          case "phone":
            return safe(patient.phone).includes(searchLower);
          case "id":
            // Allow both string and number search for id
            return safe(patient.id).includes(searchLower);
          case "all":
          default:
            return (
              nameTokens.every((token) => fullName.includes(token)) ||
              safe(patient.email).includes(searchLower) ||
              safe(patient.phone).includes(searchLower) ||
              safe(patient.id).includes(searchLower)
            );
        }
      });
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
  }, [patients, effectiveLocationId, searchTerm, sortConfig, searchType]);

  const activeLocationLabel = useMemo(() => {
    if (effectiveLocationId == null) return t("Patients_k69");
    const loc = locations.find((l) => Number(l.id) === effectiveLocationId);
    return loc?.title || loc?.name || `Location ${effectiveLocationId}`;
  }, [effectiveLocationId, locations, t]);

  const sidebarLocationLabel = useMemo(() => {
    if (!selectedLocationId) return null;
    const loc = locations.find((l) => Number(l.id) === Number(selectedLocationId));
    return loc?.title || loc?.name || (selectedLocation as any)?.title || null;
  }, [selectedLocationId, locations, selectedLocation]);

  const sidebarLocationCount = useMemo(() => {
    if (!selectedLocationId) return 0;
    return patientsByLocation[Number(selectedLocationId)] || 0;
  }, [selectedLocationId, patientsByLocation]);

  const filteredPatientCount = filteredAndSortedPatients.length;
  const loadedPatientCount = patients.length;
  const locationScopedCount =
    effectiveLocationId != null
      ? patientsByLocation[effectiveLocationId] ?? filteredPatientCount
      : loadedPatientCount;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const currentItemsPerPage = isMobile ? 3 : itemsPerPage;
  const totalPages = Math.ceil(
    filteredAndSortedPatients.length / currentItemsPerPage
  );
  const startIndex = (currentPage - 1) * currentItemsPerPage;
  const endIndex = startIndex + currentItemsPerPage;
  const currentPatients = filteredAndSortedPatients.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, locationFilter]);

  const formatDate = useCallback((date: string) => {
    if (!date) return "-";

    const parsedDate = moment(date);
    if (!parsedDate.isValid()) return "-";

    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(parsedDate.toDate());
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error("Complete todos los campos obligatorios.");
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
        locationid: selectedLocation?.id || 17,
        lastvisit: new Date(),
        onsite: patientData.onsite,
        note: patientData.note,
        streetAddress: patientData.streetAddress,
        dateOfBirth: patientData.dateOfBirth,
      });

      fetchPatients();
      setIsModalOpen(false);

      if (response) {
        toast.success("New patient added successfully");
      }
    } catch (error) {
      toast.error("No se pudo agregar el paciente. Inténtelo de nuevo.");
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

  const isFormValid = useMemo(() => {
    return (
      patientData.firstname &&
      patientData.lastname &&
      patientData.email &&
      patientData.phone &&
      patientData.gender &&
      patientData.onsite !== undefined &&
      patientData.streetAddress &&
      patientData.dateOfBirth &&
      !emailError &&
      !phoneError
    );
  }, [patientData, emailError, phoneError]);

  const togglePatientSelection = (patientId: number) => {
    setSelectedPatients((prev) => {
      if (prev.includes(patientId)) {
        return prev.filter((id) => id !== patientId);
      } else {
        return [...prev, patientId];
      }
    });
  };

  const PatientCard: FC<{ patient: Patient }> = ({ patient }) => (
    <Card className="w-full mb-3 hover:shadow-md transition-shadow dark:bg-[#0E1725] dark:border-gray-800">
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                {patient.firstname} {patient.lastname}
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ID: {patient.id}
            </p>
          </div>
          {renderType === "all" && (
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                patient.onsite
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
              }`}
            >
              {patient.onsite ? "Paciente en sitio" : "Paciente fuera de sitio"}
            </span>
          )}
        </div>

        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-2 text-xs">
            <Phone className="h-3 w-3 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">
              {formatPhoneNumber(patient.phone)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Mail className="h-3 w-3 text-gray-500 dark:text-gray-400" />
            <span className="relative inline-block group">
              <span
                className="text-gray-700 dark:text-gray-300 truncate"
                title={patient.email || undefined}
                aria-label={patient.email || undefined}
              >
                {patient.email}
              </span>
              <span className="pointer-events-none absolute left-0 bottom-full mb-1 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 rounded bg-gray-900 text-white text-xs px-2 py-1">
                {patient.email}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="h-3 w-3 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">
              {formatDate(patient.created_at)}
            </span>
          </div>
          {patient.note && (
            <div className="flex items-start gap-2 text-xs">
              <FileText className="h-3 w-3 text-gray-500 dark:text-gray-400 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300 line-clamp-1">
                {patient.note}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPatient(patient);
              setIsEditing(false);
            }}
            className="h-8 w-8 flex items-center justify-center p-0 text-gray-500 dark:text-gray-400"
          >
            <Eye className="h-5 w-5" color="gray" />
            <span className="sr-only">Ver</span>
          </Button>
          <EditPatientModal
            callAfterUpdate={updateOnEdit}
            patientDetails={patient}
            serviceList={serviceList}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={deleteLoading === patient.id}
                className="h-8 w-8 flex items-center justify-center p-0 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {deleteLoading === patient.id ? (
                  <Spinner size="sm" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
                <span className="sr-only">Delete</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-[425px] dark:bg-gray-900">
              <AlertDialogHeader>
                <AlertDialogTitle className="dark:text-white">
                  Delete Patient
                </AlertDialogTitle>
                <AlertDialogDescription className="dark:text-gray-400">
                  Are you sure you want to delete {patient.firstname}{" "}
                  {patient.lastname}? This action cannot be undone and will only
                  work if the patient has no sales history, orders, or
                  appointments.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeletePatient(patient.id)}
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );

  const handleDeletePatient = async (patientId: number) => {
    setDeleteLoading(patientId);
    try {
      const response = await axios.post("/api/user/delete", {
        patientId: patientId,
      });

      if (response.data.success) {
        toast.success("Patient deleted successfully");
        // Remove patient from local state
        setPatients((prev) =>
          prev.filter((patient) => patient.id !== patientId)
        );
      } else {
        toast.error(response.data.message || "Failed to delete patient");
      }
    } catch (error: any) {
      console.error("Error deleting patient:", error);
      toast.error(error.response?.data?.message || "Failed to delete patient");
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <main className="w-full dark:bg-[#0E1725]">
      <div className="px-6 pt-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">
            {renderType === "all"
              ? t("Patients_k1")
              : renderType === "onsite"
              ? t("Patients_k31")
              : t("Patients_k32")}
          </h1>
          <h1 className="mt-1 text-gray-500 dark:text-gray-400">
            {renderType === "all"
              ? t("Patients_k22")
              : renderType === "onsite"
              ? t("Patients_k33")
              : t("Patients_k34")}
          </h1>
        </div>
        <p className="shrink-0 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
          {loading
            ? t("Patients_k105")
            : effectiveLocationId != null
            ? searchTerm && filteredPatientCount !== locationScopedCount
              ? t("Patients_k104", {
                  filtered: formatCount(filteredPatientCount),
                  total: formatCount(locationScopedCount),
                  location: activeLocationLabel,
                })
              : t("Patients_k107", {
                  total: formatCount(locationScopedCount),
                  location: activeLocationLabel,
                })
            : searchTerm && filteredPatientCount !== loadedPatientCount
            ? t("Patients_k104", {
                filtered: formatCount(filteredPatientCount),
                total: formatCount(loadedPatientCount),
                location: activeLocationLabel,
              })
            : sidebarLocationLabel && sidebarLocationCount > 0
            ? t("Patients_k106", {
                total: formatCount(loadedPatientCount),
                location: sidebarLocationLabel,
                locationCount: formatCount(sidebarLocationCount),
              })
            : t("Patients_k103", {
                total: formatCount(loadedPatientCount),
                location: activeLocationLabel,
              })}
        </p>
      </div>

      <div className="flex flex-row items-center justify-between px-6 py-4 gap-3">
        <div className="flex items-center gap-2 w-full sm:w-[700px]">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {t("Patients_k55")}
          </span>
          <Select
            value={searchType}
            onValueChange={(value: "all" | "name" | "email" | "phone" | "id") =>
              setSearchType(value)
            }
          >
            <SelectTrigger className="w-[100px] bg-[#F1F4F9] dark:bg-[#122136] border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white [&>span]:text-gray-900 dark:[&>span]:text-white focus:ring-blue-500 dark:focus:ring-blue-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#122136] border border-gray-200 dark:border-gray-700">
              <SelectItem
                value="all"
                className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t("Patients_k65")}
              </SelectItem>
              <SelectItem
                value="name"
                className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t("Patients_k66")}
              </SelectItem>
              <SelectItem
                value="email"
                className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t("Patients_k67")}
              </SelectItem>
              <SelectItem
                value="phone"
                className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t("Patients_k68")}
              </SelectItem>
              <SelectItem
                value="id"
                className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ID
              </SelectItem>
            </SelectContent>
          </Select>
          {/* Location filter dropdown */}
          <div className="ml-2">
            <Select
              value={locationFilter ? String(locationFilter) : "ALL"}
              onValueChange={(v: string) =>
                setLocationFilter(v === "ALL" ? null : Number(v))
              }
            >
              <SelectTrigger className="w-48 bg-[#F1F4F9] dark:bg-[#122136] border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white [&>span]:text-gray-900 dark:[&>span]:text-white focus:ring-blue-500 dark:focus:ring-blue-400">
                <SelectValue placeholder={t("Patients_k69")} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#122136] border border-gray-200 dark:border-gray-700">
                <SelectItem value="ALL">{t("Patients_k69")}</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={String(loc.id)}>
                    {loc.title || loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
            =
          </span>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              onChange={handleSearch}
              value={searchTerm}
              type="text"
              placeholder={t("Patients_k56")}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#f1f4f9] dark:bg-[#1f2937] dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 dark:bg-blue-700 dark:hover:bg-blue-800 whitespace-nowrap shrink-0"
        >
          <CirclePlus className="h-4 w-4" />
          {t("Patients_k2")}
        </Button>
      </div>

      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent className="sm:max-w-[600px] max-h-[95vh] p-0 overflow-y-auto rounded-lg dark:bg-gray-900 w-[95vw] mx-auto">
          <div className="p-6">
            <AlertDialogHeader className="space-y-2 pb-2">
              <div className="flex justify-between items-center">
                <AlertDialogTitle className="text-2xl font-semibold dark:text-white">
                  {renderType === 'onsite' 
                    ? t("Patients_k38") +  t("Patients_k57")
                    : renderType === 'offsite'
                    ? t("Patients_k38") +  t("Patients_k58")
                    : t("Patients_k38")
                  }
                </AlertDialogTitle>
                <AlertDialogCancel className="h-8 w-8 p-0 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-100 absolute right-6 top-6 z-10 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                  <X className="h-5 w-5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100" />
                </AlertDialogCancel>
              </div>
              <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
                {t("Patients_k35")}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {selectedLocation?.title && (
              <div className="mt-4 flex items-center gap-2 p-3 rounded-md">
                <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("Patients_k36")}
                  </p>
                  <p className="font-medium dark:text-white">
                    {selectedLocation?.title}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstname"
                      className="text-sm text-gray-500 dark:text-gray-400"
                    >
                      {t("Patients_k17")}
                    </Label>
                    <Input
                      id="firstname"
                      placeholder={t("Patients_k45")}
                      onChange={(e) =>
                        setPatientData({
                          ...patientData,
                          firstname: e.target.value,
                        })
                      }
                      className="w-full bg-[#F1F4F9] dark:bg-[#122136] dark:border-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="lastname"
                      className="text-sm text-gray-500 dark:text-gray-400"
                    >
                      {t("Patients_k18")}
                    </Label>
                    <Input
                      id="lastname"
                      placeholder={t("Patients_k46")}
                      onChange={(e) =>
                        setPatientData({
                          ...patientData,
                          lastname: e.target.value,
                        })
                      }
                      className="w-full bg-[#F1F4F9] dark:bg-[#122136] dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-sm text-gray-500 dark:text-gray-400"
                    >
                      {t("Patients_k19")}
                    </Label>
                    {/* <Input
                      id="phone"
                      type="tel"
                      placeholder={t("Patients_k48")}
                      onChange={(e) =>
                        setPatientData({
                          ...patientData,
                          phone: e.target.value,
                        })
                      }
                      className="w-full bg-[#F1F4F9] dark:bg-[#122136] dark:border-gray-700 dark:text-white"
                    /> */}
                    <PhoneNumberInput
                      value={patientData.phone}
                      onChange={(value: string) => {
                        const formattedPhone = formatPhoneInput(value);
                        setPatientData({
                          ...patientData,
                          phone: formattedPhone,
                        });
                        
                        if (formattedPhone && !isValidPhone(formattedPhone)) {
                          setPhoneError("Please enter a valid US phone number (10-11 digits)");
                        } else {
                          setPhoneError("");
                        }
                      }}
                      breakpoint={false}
                    />
                    {phoneError && (
                      <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm text-gray-500 dark:text-gray-400"
                    >
                      {t("Patients_k20")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("Patients_k47")}
                      onChange={handleEmailChange}
                      className={`w-full bg-[#F1F4F9] dark:bg-[#122136] dark:border-gray-700 dark:text-white ${
                        emailError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      }`}
                    />
                    {emailError && (
                      <p className="text-red-500 text-sm mt-1">{emailError}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="streetAddress"
                    className="text-sm text-gray-500 dark:text-gray-400"
                  >
                    {t("Patients_k59")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="streetAddress"
                      placeholder={t("Patients_k61")}
                      value={patientData.streetAddress}
                      onChange={handleAddressChange}
                      onFocus={() => {
                        if (addressSuggestions.length > 0) {
                          setShowAddressSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding suggestions to allow for selection
                        setTimeout(() => setShowAddressSuggestions(false), 200);
                      }}
                      className="w-full bg-[#F1F4F9] dark:bg-[#122136] dark:border-gray-700 dark:text-white"
                    />
                    {addressLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Spinner size="sm" />
                      </div>
                    )}
                    {showAddressSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {addressSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                            onClick={() => handleAddressSelect(suggestion)}
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {suggestion.streetLine}
                              {suggestion.secondary && ` ${suggestion.secondary}`}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {suggestion.city}, {suggestion.state} {suggestion.zipcode}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="dateOfBirth"
                      className="text-sm text-gray-500 dark:text-gray-400"
                    >
                      {t("Patients_k60")}
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      onChange={(e) =>
                        setPatientData({
                          ...patientData,
                          dateOfBirth: e.target.value,
                        })
                      }
                      className="w-full bg-[#F1F4F9] dark:bg-[#122136] dark:border-gray-700 dark:text-white"
                    />
                  </div>
                  <div></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-500 dark:text-gray-400">
                      {t("Patients_k12")}
                    </Label>
                    <RadioGroup
                      className="flex gap-3"
                      onValueChange={(value) =>
                        setPatientData({ ...patientData, gender: value })
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male" className="dark:text-gray-300">
                          {t("Patients_k40")}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female" className="dark:text-gray-300">
                          {t("Patients_k41")}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other" className="dark:text-gray-300">
                          {t("Patients_k42")}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-500 dark:text-gray-400">
                      {t("Patients_k36")}
                    </Label>
                    <RadioGroup
                      defaultValue={renderType === "all" ? "true" : renderType === "onsite" ? "true" : "false"}
                      className="flex gap-3"
                      onValueChange={(value) =>
                        setPatientData({
                          ...patientData,
                          onsite: value === "true",
                        })
                      }
                    >
                      {renderType === "all" && (
                        <>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="onsite" />
                            <Label htmlFor="onsite" className="dark:text-gray-300">
                              {t("Patients_k43")}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id="offsite" />
                            <Label htmlFor="offsite" className="dark:text-gray-300">
                              {t("Patients_k44")}
                            </Label>
                          </div>
                        </>
                      )}
                      {renderType === "onsite" && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="onsite" />
                          <Label htmlFor="onsite" className="dark:text-gray-300">
                            {t("Patients_k43")}
                          </Label>
                        </div>
                      )}
                      {renderType === "offsite" && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="offsite" />
                          <Label htmlFor="offsite" className="dark:text-gray-300">
                            {t("Patients_k44")}
                          </Label>
                        </div>
                      )}
                    </RadioGroup>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="note"
                    className="text-sm text-gray-500 dark:text-gray-400"
                  >
                    {t("Patients_k24")}
                  </Label>
                  <Input
                    id="note"
                    placeholder={t("Patients_k49")}
                    onChange={(e) =>
                      setPatientData({
                        ...patientData,
                        note: e.target.value,
                      })
                    }
                    className="w-full bg-[#F1F4F9] dark:bg-[#122136] dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 items-center">
                <AlertDialogCancel asChild>
                  <Button
                    variant="outline"
                    className="border-gray-200 mt-0 text-gray-700 dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800"
                  >
                    {t("Patients_k21")}
                  </Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !isFormValid}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    {isSubmitting ? "Guardando..." : t("Patients_k39")}
                  </Button>
                </AlertDialogAction>
              </div>
            </form>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-full px-6 dark:bg-[#0E1725]">
        {/* Desktop Table View - Hidden on small screens */}
        <div className="hidden md:block bg-white rounded-lg border shadow-sm overflow-hidden dark:bg-[#0E1725] dark:border-gray-800">
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-[#0E1725]">
                  <TableHead className="w-[30px] py-3 dark:border-gray-800 min-w-[30px]"></TableHead>
                  <TableHead className="py-3 font-medium w-32 pl-0 text-gray-700 dark:text-gray-300">
                    {t("Patients_k4")}
                    <button
                      onClick={() => handleSort("id")}
                      className="ml-1 text-gray-400 hover:text-gray-600 active:opacity-70 dark:text-gray-500 dark:hover:text-gray-400"
                    >
                      <PiCaretUpDownBold
                        className={`inline ${
                          sortConfig.key === "id"
                            ? "text-blue-600 dark:text-blue-400"
                            : ""
                        }`}
                      />
                    </button>
                  </TableHead>
                  <TableHead className="py-3 w-32 text-center font-medium text-gray-700 dark:text-gray-300">
                    {t("Patients_k5")}
                    <button
                      onClick={() => handleSort("name")}
                      className="ml-1 text-gray-400 hover:text-gray-600 active:opacity-70 dark:text-gray-500 dark:hover:text-gray-400"
                    >
                      <PiCaretUpDownBold
                        className={`inline ${
                          sortConfig.key === "name"
                            ? "text-blue-600 dark:text-blue-400"
                            : ""
                        }`}
                      />
                    </button>
                  </TableHead>
                  <TableHead className="py-3 w-32 pl-6 text-center font-medium text-gray-700 dark:text-gray-300">
                    {t("Patients_k19")}
                  </TableHead>
                  <TableHead className="py-3 w-32 text-center font-medium text-gray-700 dark:text-gray-300">
                    {t("Patients_k20")}
                  </TableHead>
                  <TableHead className="py-3 w-32 text-center font-medium text-gray-700 dark:text-gray-300">
                    {t("Patients_k6")}
                    <button
                      onClick={() => handleSort("date")}
                      className="ml-1 text-gray-400 hover:text-gray-600 active:opacity-70 dark:text-gray-500 dark:hover:text-gray-400"
                    >
                      <PiCaretUpDownBold
                        className={`inline ${
                          sortConfig.key === "date"
                            ? "text-blue-600 dark:text-blue-400"
                            : ""
                        }`}
                      />
                    </button>
                  </TableHead>
                  <TableHead className="py-3 w-32 text-center font-medium text-gray-700 dark:text-gray-300">
                    {t("Patients_k24")}
                  </TableHead>
                  <TableHead className=" text-right py-3 w-32 font-medium text-gray-700 dark:text-gray-300">
                    {t("Patients_k23")}
                  </TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>

          <div className="max-h-[calc(100vh-420px)] md:min-h-[341px] overflow-y-auto">
            <Table className="table-fixed w-full">
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-40 dark:border-gray-800"
                    >
                      <div className="flex justify-center items-center h-full">
                        <Spinner size="xl" className="dark:text-white" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : currentPatients.length > 0 ? (
                  currentPatients.map((patient) => (
                    <TableRow
                      key={patient.id}
                      className="hover:bg-gray-50 border-b border-gray-200 dark:hover:bg-gray-800 dark:border-gray-800"
                    >
                      <TableCell className="w-[30px] dark:border-gray-800"></TableCell>
                      <TableCell className="font-medium w-32 text-gray-900 dark:text-white">
                        {patient.id}
                      </TableCell>
                      <TableCell className="font-medium w-32 text-center text-gray-900 dark:text-white">
                        {patient.firstname} {patient.lastname}
                      </TableCell>
                      <TableCell className="text-gray-700 w-32 text-center dark:text-gray-300">
                        {formatPhoneNumber(patient.phone)}
                      </TableCell>
                      <TableCell className="text-gray-700 w-32 text-center dark:text-gray-300">
                        <div className="relative inline-block group">
                          <div
                            className="break-words whitespace-normal"
                            title={patient.email || undefined}
                            aria-label={patient.email || undefined}
                          >
                            {patient.email ? 
                              patient.email.split('@')[0] + '@' + (patient.email.includes('@') ? '...' : '')
                              : "-"
                            }
                          </div>
                          <div className="pointer-events-none absolute left-1/2 transform -translate-x-1/2 bottom-full mb-1 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 rounded bg-gray-900 text-white text-xs px-2 py-1 max-w-[240px] overflow-hidden text-ellipsis">
                            {patient.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700 w-32 text-center dark:text-gray-300">
                        {formatDate(patient.created_at)}
                      </TableCell>
                      <TableCell className="text-gray-700 w-32 text-center dark:text-gray-300">
                        {patient.note ? 
                          patient.note.split(' ').slice(0, 1).join(' ') + (patient.note.split(' ').length > 1 ? '...' : '')
                          : "-"
                        }
                      </TableCell>
                      <TableCell className="w-32 dark:border-gray-800">
                        <div className="flex justify-end gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setIsEditing(false);
                            }}
                            className="h-10 w-10 sm:h-8 sm:w-8 text-gray-500 dark:text-gray-400"
                          >
                            <Eye className="h-4 w-4" color="gray" />
                            <span className="sr-only">Ver</span>
                          </Button>
                          <EditPatientModal
                            callAfterUpdate={updateOnEdit}
                            patientDetails={patient}
                            serviceList={serviceList}
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={deleteLoading === patient.id}
                                className="h-10 w-10 sm:h-8 sm:w-8 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                {deleteLoading === patient.id ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <Trash2 className="h-4 w-4" color="red" />
                                )}
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="sm:max-w-[425px] dark:bg-gray-900">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="dark:text-white">
                                  {t("Patients_k53")}
                                </AlertDialogTitle>
                                <AlertDialogDescription className="dark:text-gray-400">
                                  {t("Patients_k50")} {patient.firstname}{" "}
                                  {patient.lastname}
                                  {t("Patients_k51")}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800">
                                  {t("Patients_k21")}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeletePatient(patient.id)
                                  }
                                  className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                                >
                                  {t("Patients_k52")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-40 dark:border-gray-800"
                    >
                      <div className="flex flex-col justify-center items-center h-full text-gray-500 dark:text-gray-400">
                        <p className="text-lg font-medium">{t("Patients_k70", { defaultValue: (enPatients as any)["Patients_k70"] ?? "No patients available" })}</p>
                        <p className="text-sm">
                          {t("Patients_k71", { defaultValue: (enPatients as any)["Patients_k71"] ?? "Try adjusting the search or add a new patient" })}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination controls moved outside the table */}
        {!loading && filteredAndSortedPatients.length > 0 && (
          <div className="hidden md:flex flex-row items-center justify-between mt-2 bg-white dark:bg-[#0E1725]">
            <div className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap">
              <p className="text-gray-700 dark:text-gray-300">
                {t("Patients_k27")} {formatCount(startIndex + 1)} {t("Patients_k28")}{" "}
                {formatCount(Math.min(endIndex, filteredAndSortedPatients.length))}{" "}
                {t("Patients_k29")} {formatCount(filteredAndSortedPatients.length)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="dark:border-gray-600 dark:bg-[#0E1725] dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t("Patients_k25")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="dark:border-gray-600 dark:bg-[#0E1725] dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t("Patients_k26")}
              </Button>
            </div>
          </div>
        )}

        <div className="md:hidden">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner size="xl" className="dark:text-white" />
            </div>
          ) : currentPatients.length > 0 ? (
            <div className="space-y-4">
              {currentPatients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-40 text-gray-500 dark:text-gray-400">
              <p className="text-lg font-medium">{t("Patients_k70", { defaultValue: (enPatients as any)["Patients_k70"] ?? "No patients available" })}</p>
              <p className="text-sm text-center">
                {t("Patients_k71", { defaultValue: (enPatients as any)["Patients_k71"] ?? "Try adjusting the search or add a new patient" })}
              </p>
            </div>
          )}

          {!loading && filteredAndSortedPatients.length > 0 && (
            <div className="md:hidden flex sm:flex-row items-center justify-between py-3 gap-3 mt-4">
              <div className="text-sm text-center">
                <p className="text-gray-700 dark:text-gray-300">
                  Showing {formatCount(startIndex + 1)} to{" "}
                  {formatCount(Math.min(endIndex, filteredAndSortedPatients.length))} of{" "}
                  {formatCount(filteredAndSortedPatients.length)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="dark:border-gray-600 dark:bg-[#0E1725] dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="dark:border-gray-600 dark:bg-[#0E1725] dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Sheet
        open={!!selectedPatient}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPatient(null);
            setIsEditing(false);
          }
        }}
      >
        <SheetContent className="dark:bg-gray-900 m-0 sm:m-3 rounded-xl">
          <div className="flex flex-col h-full">
            <div className="flex justify-between text-2xl font-bold items-center pb-4 border-b mt-10 dark:border-gray-700">
              <h3 className="text-xl font-semibold dark:text-white">
                {t("Patients_k7")}
              </h3>
            </div>

            {selectedPatient && (
              <ScrollArea className="flex-1 pr-4 -mr-4">
                {isEditing ? (
                  <EditPatientForm
                    patient={selectedPatient}
                    editPatientData={selectedPatient}
                    setEditPatientData={(data) => {
                      updateOnEdit(data);
                      setIsEditing(false);
                    }}
                    serviceList={serviceList}
                    onSave={() => setIsEditing(false)}
                    onCancel={() => setIsEditing(false)}
                    renderType={renderType}
                  />
                ) : (
                  <PatientDetails
                    patient={selectedPatient}
                    renderType={renderType}
                    formatDate={formatDate}
                    serviceList={serviceList}
                    locations={locations}
                  />
                )}
              </ScrollArea>
            )}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium w-20 px-3 py-1 rounded-lg"
              >
                {t("Patients_k8")}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
};

interface EditPatientFormProps {
  patient: Patient;
  editPatientData: Patient;
  setEditPatientData: (data: Patient) => void;
  serviceList: { title: string }[];
  onSave: () => void;
  onCancel: () => void;
  renderType: Props["renderType"];
}

const EditPatientForm: FC<EditPatientFormProps> = ({
  patient,
  editPatientData,
  setEditPatientData,
  serviceList,
  onSave,
  onCancel,
  renderType,
}) => {
  const { t } = useTranslation(translationConstant.PATIENTS);
  const [formData, setFormData] = useState<Patient>(editPatientData);
  const [emailError, setEmailError] = useState("");

  // Strip +1 prefix from phone number when loading data
  useEffect(() => {
    let displayPhone = editPatientData.phone || "";
    if (displayPhone.startsWith("+1")) {
      displayPhone = displayPhone.slice(2);
    }
    
    setFormData({
      ...editPatientData,
      phone: displayPhone,
    });
  }, [editPatientData]);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({
      ...formData,
      email: email,
    });
    
    if (email && !isValidEmail(email)) {
      setEmailError("Please enter a valid email format");
    } else {
      setEmailError("");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Remove all non-digit characters
    let cleaned = rawValue.replace(/\D/g, '');
    
    // If it starts with 1, remove it (country code)
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = cleaned.slice(1);
    }
    
    // Limit to 10 digits
    cleaned = cleaned.slice(0, 10);
    
    setFormData({
      ...formData,
      phone: cleaned,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSave = async () => {
    try {
      // Prepare phone number with +1 prefix
      const phoneWithCountryCode = formData.phone ? `+1${formData.phone}` : "";
      
      const response = await axios.put("/api/user", {
        id: patient.id,
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        phone: phoneWithCountryCode,
        gender: formData.gender,
        onsite: formData.onsite,
        note: formData.note,
        streetAddress: formData.address,
        dateOfBirth: formData.dob,
      });

      if (response.data.success) {
        setEditPatientData(formData);
        toast.success("Paciente actualizado correctamente");
        onSave();
      }
    } catch (error) {
      toast.error("No se pudo actualizar el paciente");
      console.error("Error updating patient:", error);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <div className="space-y-2">
          <Label className="text-sm text-gray-500 dark:text-gray-400">
            {t("Patients_k17")}
          </Label>
          <Input
            name="firstname"
            value={formData.firstname}
            onChange={handleChange}
            className="w-full bg-[#F1F4F9] dark:bg-[#122136] dark:text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-gray-500 dark:text-gray-400">
            {t("Patients_k18")}
          </Label>
          <Input
            name="lastname"
            value={formData.lastname}
            onChange={handleChange}
            className="w-full bg-[#F1F4F9] dark:bg-[#122136] dark:text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="space-y-2">
          <Label className="text-sm text-gray-500 dark:text-gray-400">
            {t("Patients_k19")}
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 z-10">
              +1
            </span>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              className="w-full pl-10 bg-[#F1F4F9] dark:bg-[#122136] dark:text-white"
              placeholder="Enter 10-digit phone number"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-gray-500 dark:text-gray-400">
            {t("Patients_k20")}
          </Label>
          <Input
            name="email"
            value={formData.email}
            onChange={handleEmailChange}
            className={`w-full bg-[#F1F4F9] dark:bg-[#122136] dark:text-white ${
              emailError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
            }`}
          />
          {emailError && (
            <p className="text-red-500 text-sm mt-1">{emailError}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-gray-500 dark:text-gray-400">
          {t("Patients_k24")}
        </Label>
          <Input
            name="note"
            value={formData.note || ""}
            onChange={handleChange}
            className="w-full bg-[#F1F4F9] dark:bg-[#122136] dark:text-white"
            placeholder={t("Patients_k49", { defaultValue: (enPatients as any)["Patients_k49"] ?? "Enter any note about the patient" })}
          />
      </div>

      <div className="grid grid-1 gap-4">
        <div className="space-y-2">
          <Label className="text-sm text-gray-500 dark:text-gray-400">
            {t("Patients_k12")}
          </Label>
          <RadioGroup
            value={formData.gender}
            onValueChange={(value) =>
              setFormData({ ...formData, gender: value })
            }
            className="flex gap-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="edit-male" />
              <Label htmlFor="edit-male" className="dark:text-gray-300">
                {t("Patients_k40")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="edit-female" />
              <Label htmlFor="edit-female" className="dark:text-gray-300">
                {t("Patients_k41")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="edit-other" />
              <Label htmlFor="edit-other" className="dark:text-gray-300">
                {t("Patients_k42")}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-gray-500 dark:text-gray-400">
            {t("Patients_k36")}
          </Label>
          <RadioGroup
            value={formData.onsite ? "true" : "false"}
            onValueChange={(value) =>
              setFormData({ ...formData, onsite: value === "true" })
            }
            className="flex gap-3"
          >
            {renderType === "all" && (
              <>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="edit-onsite" />
                  <Label htmlFor="edit-onsite" className="dark:text-gray-300">
                    {t("Patients_k43")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="edit-offsite" />
                  <Label htmlFor="edit-offsite" className="dark:text-gray-300">
                    {t("Patients_k44")}
                  </Label>
                </div>
              </>
            )}
            {renderType === "onsite" && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="edit-onsite" />
                <Label htmlFor="edit-onsite" className="dark:text-gray-300">
                  {t("Patients_k43")}
                </Label>
              </div>
            )}
            {renderType === "offsite" && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="edit-offsite" />
                <Label htmlFor="edit-offsite" className="dark:text-gray-300">
                  {t("Patients_k44")}
                </Label>
              </div>
            )}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-gray-500 dark:text-gray-400">
            {t("Patients_k59")}
          </Label>
          <Input
            name="address"
            value={formData.address || ""}
            onChange={handleChange}
            placeholder={t("Patients_k61")}
            className="w-full bg-[#F1F4F9] dark:bg-[#122136] dark:text-white"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-gray-500 dark:text-gray-400">
            {t("Patients_k60")}
          </Label>
          <Input
            name="dob"
            type="date"
            value={formData.dob || ""}
            onChange={handleChange}
            className="w-full bg-[#F1F4F9] dark:bg-[#122136] dark:text-white"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-gray-200 dark:bg-[#111827] text-gray-700 dark:border-gray-600 dark:text-gray-300"
        >
          {t("Patients_k21")}
        </Button>
        <Button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          {t("Patients_k30")}
        </Button>
      </div>
    </div>
  );
};

const PatientDetails: FC<{
  patient: Patient;
  serviceList: { title: string }[];
  renderType: Props["renderType"];
  formatDate: (date: string) => string;
  locations?: any[];
}> = ({ patient, renderType, formatDate, locations = [] }) => {
  const { t } = useTranslation(translationConstant.PATIENTS);

  const patientLocation = (locations || []).find(
    (l: any) => l.id === (patient as any).locationid || l.id === (patient as any).location_id
  );

  return (
    <div className="space-y-2 py-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("Patients_k4")}
          </p>
          <h2 className="text-base text-gray-900 dark:text-white">
            {patient.id}
          </h2>
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
              {patient.onsite
                ? t("Patients_k100", { defaultValue: (enPatients as any)["Patients_k100"] ?? "On-site Patient" })
                : t("Patients_k101", { defaultValue: (enPatients as any)["Patients_k101"] ?? "Off-site Patient" })}
            </span>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("Patients_k5")}
        </p>
        <h2 className="text-base text-gray-900 dark:text-white">
          {patient.firstname} {patient.lastname}
        </h2>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("Patients_k9")}
          </p>
          <p className="text-base font-medium dark:text-gray-300">
            {formatPhoneNumber(patient.phone)}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("Patients_k10")}
          </p>
          <p className="text-base font-medium dark:text-gray-300">
            <span className="relative inline-block group">
              <span title={patient.email || undefined} aria-label={patient.email || undefined}>{patient.email}</span>
              <span className="pointer-events-none absolute left-0 bottom-full mb-1 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 rounded bg-gray-900 text-white text-xs px-2 py-1">
                {patient.email}
              </span>
            </span>
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("Patients_k36")}</p>
          <p className="text-base font-medium dark:text-gray-300">
            {patientLocation ? (patientLocation.title || patientLocation.name) : "Desconocido"}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("Patients_k24")}
          </p>
          <p className="text-base font-medium dark:text-gray-300">
            {patient.note || t("Patients_k99", { defaultValue: (enPatients as any)["Patients_k99"] ?? "No note available" })}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("Patients_k59")}
          </p>
          <p className="text-base font-medium dark:text-gray-300">
            {patient.address || t("Patients_k62")}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("Patients_k60")}
          </p>
          <p className="text-base font-medium dark:text-gray-300">
            {patient.dob ? new Intl.DateTimeFormat("es-ES").format(new Date(patient.dob)) : t("Patients_k63")}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("Patients_k12")}
          </p>
          <p className="text-base font-medium capitalize dark:text-gray-300">
            {patient.gender}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("Patients_k13")}
            </p>
            <p className="text-base font-medium dark:text-gray-300">
              {formatDate(patient.created_at)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("Patients_k14")}
            </p>
            <p className="text-base font-medium dark:text-gray-300">
              {formatDate(patient.lastvisit)}
            </p>
          </div>
        </div>

        {/* <dl>
          <dd className="font-semibold text-lg">{patient?.note || "-"}</dd>
          <dt className="text-sm text-[#707070]">{t("Note")}</dt>
        </dl> */}
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
    note: "",
    streetaddress: "",
    dateofbirth: "",
    gender: "",
  });

  const [loading, setLoading] = useState(false);
  const { selectedLocation } = useContext(LocationContext);
  const [errorMessage, setErrorMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string) => {
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    // US phone numbers should be 10 digits (without country code) or 11 digits (with country code 1)
    return digitsOnly.length === 10 || (digitsOnly.length === 11 && digitsOnly.startsWith('1'));
  };

  const formatPhoneInput = (value: string) => {
    // Remove all non-digit characters except + at the beginning
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // If it starts with +1, keep it, otherwise remove any + not at the beginning
    if (cleaned.startsWith('+1')) {
      cleaned = '+1' + cleaned.slice(2).replace(/\+/g, '');
    } else if (cleaned.startsWith('+')) {
      cleaned = cleaned.slice(1);
    }
    
    // Limit to 12 characters (+1 + 10 digits)
    if (cleaned.startsWith('+1')) {
      cleaned = cleaned.slice(0, 12);
    } else {
      cleaned = cleaned.slice(0, 10);
    }
    
    return cleaned;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setPatientData({
      ...patientData,
      email: email,
    });
    
    if (email && !isValidEmail(email)) {
      setEmailError("Please enter a valid email format");
    } else {
      setEmailError("");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Remove all non-digit characters
    let cleaned = rawValue.replace(/\D/g, '');
    
    // If it starts with 1, remove it (country code)
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = cleaned.slice(1);
    }
    
    // Limit to 10 digits
    cleaned = cleaned.slice(0, 10);
    
    setPatientData({
      ...patientData,
      phone: cleaned,
    });
    
    if (cleaned && cleaned.length !== 10) {
      setPhoneError("Please enter a valid 10-digit US phone number");
    } else {
      setPhoneError("");
    }
  };

  // Simple debounce function for EditPatientModal
  const debounceModal = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Debounced address search function for EditPatientModal
  const searchAddressesModal = debounceModal(async (searchTerm: string) => {
    if (searchTerm.length < 4) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    setAddressLoading(true);
    try {
      const response = await fetch(`/api/address/suggestions?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (data.success && data.suggestions) {
        setAddressSuggestions(data.suggestions);
        setShowAddressSuggestions(true);
      } else {
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    } finally {
      setAddressLoading(false);
    }
  }, 300);

  const handleAddressChangeModal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setPatientData({
      ...patientData,
      streetaddress: address,
    });
    
    // Trigger address search
    searchAddressesModal(address);
  };

  const handleAddressSelectModal = (suggestion: any) => {
    setPatientData({
      ...patientData,
      streetaddress: suggestion.fullAddress,
    });
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
  };

  useEffect(() => {
    if (patientDetails) {
      // Strip +1 prefix from phone number for display
      let displayPhone = patientDetails.phone || "";
      if (displayPhone.startsWith("+1")) {
        displayPhone = displayPhone.slice(2);
      }
      
      setPatientData({
        firstname: patientDetails.firstname || "",
        lastname: patientDetails.lastname || "",
        phone: displayPhone,
        email: patientDetails.email || "",
        note: patientDetails.note || "",
        streetaddress: patientDetails.address || "",
        dateofbirth: patientDetails.dob || "",
        gender: patientDetails.gender || "",
      });
    }
  }, [patientDetails]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    e.preventDefault();
    setPatientData({ ...patientData, [e.target.name]: e.target.value });
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      // Prepare phone number with +1 prefix
      const phoneWithCountryCode = patientData?.phone ? `+1${patientData.phone}` : "";
      
      const data = await axios.put("/api/user", {
        id: patientDetails?.id,
        firstname: patientData?.firstname,
        lastname: patientData?.lastname,
        email: patientData?.email,
        phone: phoneWithCountryCode,
        note: patientData?.note,
        streetAddress: patientData?.streetaddress,
        dateOfBirth: patientData?.dateofbirth,
        gender: patientData?.gender,
      });

      if (data?.data?.success === true) {
        callAfterUpdate(data?.data?.data?.[0]);
        toast.success("Detalles del paciente actualizados correctamente");
      }
    } catch (error: any) {
      toast.error("No se pudieron actualizar los detalles del paciente");
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
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[95vw] sm:max-w-[500px] dark:bg-gray-900 mx-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl dark:text-white">
            {t("Patients_k15")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
            {t("Patients_k16")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {errorMessage && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}

          <div className="space-y-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium dark:text-gray-300">
                {t("Patients_k17")}
              </Label>
              <Input
                type="text"
                name="firstname"
                value={patientData.firstname}
                onChange={handleChange}
                className="w-full bg-[#F1F4F9] dark:bg-[#122136] dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium dark:text-gray-300">
                {t("Patients_k18")}
              </Label>
              <Input
                type="text"
                name="lastname"
                value={patientData.lastname}
                onChange={handleChange}
                className="w-full bg-[#F1F4F9] dark:bg-[#122136] dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium dark:text-gray-300">
                {t("Patients_k12")}
              </Label>
              <select
                name="gender"
                value={patientData.gender}
                onChange={handleChange}
                className="w-full p-2 bg-[#F1F4F9] dark:bg-[#122136] dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t("Patients_k102", { defaultValue: (enPatients as any)["Patients_k102"] ?? "Select gender" })}</option>
                <option value="Male">{t("Patients_k40")}</option>
                <option value="Female">{t("Patients_k41")}</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <div className="space-y-2">
              <Label className="text-sm font-medium dark:text-gray-300">
                {t("Patients_k19")}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 z-10">
                  +1
                </span>
                <Input
                  type="text"
                  name="phone"
                  value={patientData.phone}
                  onChange={handlePhoneChange}
                  className={`w-full pl-10 bg-[#F1F4F9] dark:bg-[#122136] dark:text-white ${
                    phoneError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                  }`}
                  placeholder="Enter 10-digit phone number"
                />
              </div>
              {phoneError && (
                <p className="text-red-500 text-sm mt-1">{phoneError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium dark:text-gray-300">
                {t("Patients_k20")}
              </Label>
              <Input
                type="email"
                name="email"
                value={patientData.email}
                onChange={handleEmailChange}
                className={`w-full bg-[#F1F4F9] dark:bg-[#122136] dark:text-white ${
                  emailError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                }`}
              />
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium dark:text-gray-300">
              {t("Patients_k24")}
            </Label>
            <Input
              type="text"
              name="note"
              value={patientData.note}
              onChange={handleChange}
              className="w-full bg-[#F1F4F9] dark:bg-[#122136] dark:text-white"
              placeholder={t("Patients_k49", { defaultValue: (enPatients as any)["Patients_k49"] ?? "Enter any note about the patient" })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium dark:text-gray-300">
              {t("Patients_k59")}
            </Label>
            <div className="relative">
              <Input
                type="text"
                name="streetaddress"
                value={patientData.streetaddress}
                onChange={handleAddressChangeModal}
                onFocus={() => {
                  if (addressSuggestions.length > 0) {
                    setShowAddressSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Delay hiding suggestions to allow for selection
                  setTimeout(() => setShowAddressSuggestions(false), 200);
                }}
                className="w-full bg-[#F1F4F9] dark:bg-[#122136] dark:text-white"
                placeholder={t("Patients_k61")}
              />
              {addressLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Spinner size="sm" />
                </div>
              )}
              {showAddressSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {addressSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      onClick={() => handleAddressSelectModal(suggestion)}
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {suggestion.streetLine}
                        {suggestion.secondary && ` ${suggestion.secondary}`}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {suggestion.city}, {suggestion.state} {suggestion.zipcode}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium dark:text-gray-300">
              {t("Patients_k60")}
            </Label>
            <Input
              type="date"
              name="dateofbirth"
              value={patientData.dateofbirth}
              onChange={handleChange}
              className="w-full bg-[#F1F4F9] dark:bg-[#122136] dark:text-white"
            />
          </div>
        </div>

        <AlertDialogFooter className="mt-6 flex justify-end gap-2">
          <AlertDialogCancel className="bg-red-500 hover:bg-red-600 text-white border-red-500 dark:border-red-500 dark:text-white dark:bg-red-500 dark:hover:bg-red-600">
            {t("Patients_k21")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSaveChanges}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
            disabled={loading}
          >
            {loading ? t("Patients_k64") : t("Patients_k30")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PatientTableComponent;
