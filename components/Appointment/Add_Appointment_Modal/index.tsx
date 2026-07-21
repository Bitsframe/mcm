import { Input_Component_Appointment } from "@/components/Appointment/Add_Appointment_Modal/Input_Component";
import { useLocationClinica } from "@/hooks/useLocationClinica";
import { Label, Modal, Radio } from "flowbite-react";
import React, { useContext, useEffect, useState, useCallback, useRef } from "react";
import ScheduleDateTime from "./ScheduleDateTime";
import { supabase } from "@/services/supabase";
import moment from "moment";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import enAppoinments from "@/locales/en/Appoinments.json";
import { CirclePlus, Loader2, MapPin } from "lucide-react";
import { EmailBodyTempEnum } from "@/utils/emailService/templateDetails";
import { sendEmail } from "@/utils/emailService";
import { LocationContext, AuthContext } from "@/context";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import ComingBackTable from "@/components/Appointment/ComingBackTable";
import { DobWheelField } from "@/components/Appointment/Add_Appointment_Modal/DobWheelField";
import { normalizeDobParts } from "@/components/Appointment/Add_Appointment_Modal/dobUtils";


interface RadioButtonOptionsInterface {
  label: string;
  value: string;
  disabled?: boolean;
}

const RadioButtons = ({
  name,
  options,
  selectedValue,
  onChange,
  className,
  required,
}: {
  name: string;
  options: RadioButtonOptionsInterface[];
  selectedValue?: string;
  onChange: (val: string) => void;
  className?: string;
  required?: boolean;
}) => {
  return (
    <div className={className}>
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`inline-flex items-center mr-6 ${opt.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {/* hidden native input used as peer for styling */}
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={selectedValue === opt.value}
            onChange={() => !opt.disabled && onChange(opt.value)}
            required={required}
            className="peer sr-only"
            disabled={opt.disabled}
          />

          {/* styled radio: outer circle + inner white dot when selected */}
          <span className="inline-flex items-center justify-center mr-2">
            <span
              style={{
                width: 18,
                height: 18,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 9999,
                border: `2px solid ${selectedValue === opt.value ? '#0066ff' : '#cbd5e1'}`,
                backgroundColor: selectedValue === opt.value ? '#0066ff' : '#ffffff',
                transition: 'background-color 120ms ease, border-color 120ms ease',
              }}
            >
              {selectedValue === opt.value && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 9999,
                    backgroundColor: '#ffffff',
                  }}
                />
              )}
            </span>
          </span>

          <span className="select-none text-base">{opt.label}</span>
        </label>
      ))}
    </div>
  );
};

const get_in_office_patient_options = (t: (k: string) => string): RadioButtonOptionsInterface[] => [
  { label: t("Appoinments_k18"), value: "true" },
  { label: t("Appoinments_k19"), value: "false", disabled: true },
];

const get_patient_type_options = (t: (k: string) => string): RadioButtonOptionsInterface[] => [
  { label: t("Appoinments_k21"), value: "true" },
  { label: t("Appoinments_k14"), value: "false" },
];

const get_gender_options = (t: (k: string) => string): RadioButtonOptionsInterface[] => [
  { label: t("Appoinments_k35"), value: "Male" },
  { label: t("Appoinments_k36"), value: "Female" },
  { label: t("Appoinments_k37"), value: "Other" },
];

/** Grouped block with title for scannable form layout */
function FormSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-gray-200/90 bg-white/70 p-4 shadow-sm ring-1 ring-black/5 dark:border-gray-700 dark:bg-[#0c1626] dark:ring-white/5 sm:p-5 ${className}`}
    >
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
        {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

const nativeSelectClassName =
  "w-full min-h-[46px] rounded-lg border border-gray-200 bg-[#f1f4f9] px-3 py-2 text-base text-black outline-none transition-shadow focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20 dark:border-gray-600 dark:bg-[#122136] dark:text-white dark:focus:border-[#0066ff]";

type AddressUiSuggestion = {
  fullAddress: string;
  streetLine?: string;
  secondary?: string;
  city?: string;
  state?: string;
  zipcode?: string;
};

export const Add_Appointment_Modal = ({
  newAddedRow,
}: {
  newAddedRow: (e: any) => void;
}) => {
  const { locations } = useLocationClinica();
  const { selectedLocation } = useContext(LocationContext);
  const { userProfile } = useContext(AuthContext);

  const [formData, setFormData] = useState<any>({ phone: '' });
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<string[] | null | undefined>([]);
  const [comingBackData, setComingBackData] = useState<any[]>([]);
  const [comingBackLoading, setComingBackLoading] = useState(false);
  const [selectedComingBackPatient, setSelectedComingBackPatient] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressUiSuggestion[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressSuggestionsLoading, setAddressSuggestionsLoading] = useState(false);
  const lastSelectedAddressRef = useRef("");
  const addressSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dobParts, setDobParts] = useState({ y: "", m: "", d: "" });

  const close_handle = () => {
    if (addressSearchTimerRef.current) clearTimeout(addressSearchTimerRef.current);
    setOpen(false);
    setEmailError("");
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
    setAddressSuggestionsLoading(false);
    lastSelectedAddressRef.current = "";
    setDobParts({ y: "", m: "", d: "" });
    if (selectedLocation) {
      setFormData({
        location_id: selectedLocation.id,
      });
    }
  };
  const open_handle = () => {
    // When opening the modal, set sensible defaults: 'Yes' for in-office and 'New' for patient
    setFormData((pre: any) => {
      const base = { ...(pre || {}) };
      if (selectedLocation && (selectedLocation as any).id) {
        base.location_id = (selectedLocation as any).id;
      }
      // mark new patients as approved by default when opening the modal
      // also reset personal/scheduling fields so previous selected coming-back patient
      // does not persist when opening the modal again
      return {
        ...base,
        in_office_patient: "true",
        new_patient: "true",
        isApproved: true,
        first_name: "",
        last_name: "",
        email_address: "",
        phone: "",
        dob: "",
        sex: "",
        service: "",
        date_and_time: "",
        patient_address: "",
      };
    });
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
    setAddressSuggestionsLoading(false);
    lastSelectedAddressRef.current = "";
    setDobParts({ y: "", m: "", d: "" });

    // clear any previously selected coming-back patient so modal always opens fresh
    setSelectedComingBackPatient(null);
    // clear any stale coming-back results; they'll be refetched if user selects "Coming Back"
    setComingBackData([]);

    setOpen(true);
  };
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const select_change_handle = (key: string, val: string | number) => {
    // dob removed from UI — no validation here

    if (key === "email_address" && typeof val === "string") {
      // Email validation - only validate if email is not empty
      if (val && val.trim() !== "" && !isValidEmail(val)) {
        setEmailError("Please enter a valid email format");
      } else {
        setEmailError("");
      }
    }
    
    setFormData((pre: any) => {
      return { ...pre, [key]: val };
    });
    // If selecting 'Coming back' (existing patient), fetch existing appointments
    if (key === "new_patient" && val === "false") {
      (async () => {
        try {
          if (!selectedLocation || !selectedLocation.id) {
            console.warn('[Add_Appointment_Modal] selectedLocation is not set, cannot fetch coming back patients by location');
            setComingBackData([]);
            return;
          }

          setComingBackLoading(true);
          const response = await fetch(
            `/api/appointments/coming-back-patients?locationId=${selectedLocation.id}`
          );
          const result = await response.json();

          if (!response.ok) {
            console.error('Error fetching returning patients:', result?.error);
            setComingBackData([]);
            return;
          }

          setComingBackData(result.data ?? []);
        } catch (err) {
          console.error('Failed to fetch returning patients from allpatients', err);
          setComingBackData([]);
        } finally {
          setComingBackLoading(false);
        }
      })();

   
      // Update isApproved to true for "Coming Back" patients
      setFormData((pre: any) => {
        return { ...pre, isApproved: true };
      });
    } else if (key === "new_patient" && val === "true") {
      // clear coming back data and any selected patient when switching back to New
      setComingBackData([]);
      setSelectedComingBackPatient(null);

      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      lastSelectedAddressRef.current = "";
      setDobParts({ y: "", m: "", d: "" });

      // Reset all form fields to defaults for a fresh 'New' patient entry.
      setFormData((pre: any) => ({
        // preserve location if available, otherwise keep previous
        location_id: selectedLocation?.id ?? pre?.location_id,
        in_office_patient: "true",
        new_patient: "true",
        // mark new patients approved by default
        isApproved: true,
        first_name: "",
        last_name: "",
        email_address: "",
        phone: "",
        dob: "",
        sex: "",
        service: "",
        date_and_time: "",
        patient_address: "",
      }));
    }
  };

  const handleDobWheelCommit = (next: ReturnType<typeof normalizeDobParts>) => {
    setDobParts({ y: next.y, m: next.m, d: next.d });
    setFormData((pre: any) => ({ ...pre, dob: next.full }));
  };

  const scheduleAddressSearch = useCallback((searchTerm: string) => {
    if (addressSearchTimerRef.current) clearTimeout(addressSearchTimerRef.current);
    addressSearchTimerRef.current = setTimeout(() => {
      void (async () => {
        if (searchTerm.length < 3) {
          setAddressSuggestions([]);
          setShowAddressSuggestions(false);
          return;
        }
        setAddressSuggestionsLoading(true);
        try {
          const response = await fetch(
            `/api/address/suggestions?search=${encodeURIComponent(searchTerm)}`
          );
          const data = await response.json();
          if (data.success && Array.isArray(data.suggestions)) {
            setAddressSuggestions(data.suggestions);
            setShowAddressSuggestions(data.suggestions.length > 0);
          } else {
            setAddressSuggestions([]);
            setShowAddressSuggestions(false);
          }
        } catch {
          setAddressSuggestions([]);
          setShowAddressSuggestions(false);
        } finally {
          setAddressSuggestionsLoading(false);
        }
      })();
    }, 300);
  }, []);

  const handlePatientAddressChange = useCallback(
    (val: string) => {
      setFormData((pre: any) => ({ ...pre, patient_address: val }));
      if (val === lastSelectedAddressRef.current) return;
      lastSelectedAddressRef.current = "";
      scheduleAddressSearch(val);
    },
    [scheduleAddressSearch]
  );

  const handlePatientAddressSelect = useCallback((suggestion: AddressUiSuggestion) => {
    lastSelectedAddressRef.current = suggestion.fullAddress;
    setFormData((pre: any) => ({ ...pre, patient_address: suggestion.fullAddress }));
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
  }, []);

  useEffect(() => {
    return () => {
      if (addressSearchTimerRef.current) {
        clearTimeout(addressSearchTimerRef.current);
      }
    };
  }, []);

  const selectDateTimeSlotHandle = useCallback(
    (date: Date | "", time?: string | "") => {
      // Use functional state update to avoid reading stale closure values
      setFormData((pre: any) => {
        // If no date provided, clear the db slot
        if (!date) {
          return { ...pre, date_and_time: "" };
        }

        const locationId = pre?.location_id;
        if (!locationId) return pre;

        let dbSlot = "";
        if (date && time) {
          const formated_date = moment(date).format("DD-MM-YYYY");
          const createSlotForDB = `${locationId}|${formated_date} - ${time}`;
          dbSlot = createSlotForDB;
        }

        return { ...pre, date_and_time: dbSlot };
      });
    },
    []
  );
  const submitHandle = async () => {
    setLoading(true);
    const {
      location_id: locationIdRaw,
      first_name,
      last_name,
      email_address,
      in_office_patient,
      new_patient,
      sex,
      phone,
      dob,
      date_and_time,
      service,
    } = formData;
    const location_id =
      locationIdRaw ?? (selectedLocation as any)?.id ?? undefined;

    let appointmentDetails: any = {
      location_id,
      first_name,
      last_name,
      email_address,
      in_office_patient: in_office_patient === "true" || false,
      new_patient: new_patient === "true" || false,
      sex: sex,
      phone: phone,
      dob: dob,
      service: service,
      date_and_time: date_and_time,
    };



    // Build required fields depending on whether this is a new patient
    const baseRequired = [
      "location_id",
      "in_office_patient",
      "new_patient",
      "first_name",
      "last_name",
      "phone",
    ];

    const isNew = new_patient === "true" || new_patient === true;
    const requireScheduling = isNew || selectedComingBackPatient;
    const requiredFields = isNew
      ? baseRequired.concat(["dob", "sex", "service", "date_and_time"])
      : baseRequired;

    if (requireScheduling) {
      if (!requiredFields.includes("service")) requiredFields.push("service");
      if (!requiredFields.includes("date_and_time")) requiredFields.push("date_and_time");
    }

    if (selectedComingBackPatient && !String(dob ?? "").trim()) {
      toast.warning(t("Appoinments_k95", { defaultValue: "Please enter date of birth for this patient" }));
      setLoading(false);
      return;
    }

    for (const field of requiredFields) {
      const val =
        field === "location_id" ? location_id : formData[field];
      if (val === "" || val === undefined || val === null) {
        toast.warning(`Please fill in the ${field}`);
        setLoading(false);
        return;
      }
    }

    // Only validate email format if email is provided
    if (email_address && email_address.trim() !== "" && !isValidEmail(email_address)) {
      toast.error(t("Appoinments_k64"));
      setLoading(false);
      return;
    }

    let addressLine = "";
    if (isNew && !selectedComingBackPatient) {
      const addr = String(formData.patient_address || "").trim();

      if (!addr) {
        toast.warning(t("Appoinments_k70"));
        setLoading(false);
        return;
      }

      addressLine = addr;
    } else if (selectedComingBackPatient) {
      // For coming-back patients, use the address field if provided
      addressLine = String(formData.patient_address || "").trim();
    }

    appointmentDetails.address = addressLine;

    const postData = {
      ...appointmentDetails,
      date_and_time,
    };
    // If user selected "New" (isNew === true), set fixed DB values as requested:
    // - isApproved should be true
    // - new_patient should be false (store fixed value)
    if (isNew && !selectedComingBackPatient) {
      postData.isApproved = true;
      postData.new_patient = false;
    }
    // If a coming-back patient is selected, INSERT a new appointment row (do not update existing)
    if (selectedComingBackPatient && selectedComingBackPatient.id) {
      try {
        // For coming back patients, we already have their data from allpatients table
        // We just need to create the appointment with their patient_id
        
        // Call the backend API route which will securely call the edge function
        const response = await fetch('/api/appointments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            location_id,
            first_name,
            last_name,
            email_address,
            phone,
            sex,
            service,
            date_and_time,
            dob: dob || null, // Send null if DOB is empty
            address: addressLine || "",
            patient_id: selectedComingBackPatient.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API error:', errorData);
          console.error('Request payload:', {
            location_id,
            first_name,
            last_name,
            email_address,
            phone,
            sex,
            service,
            date_and_time,
            dob: dob || null,
            patient_id: selectedComingBackPatient.id,
          });
          throw new Error(errorData.error || 'Failed to create appointment');
        }

        const result = await response.json();

        if (result.success) {
          newAddedRow(result.appointment);

          toast.success(
            <div className="flex justify-between">
              <p>Appointment scheduled successfully.</p>
              <button
                onClick={() => toast.dismiss()}
                className="absolute top-0 right-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="text-sm">✕</span>
              </button>
            </div>
          );

          // Send confirmation email only if email is provided
          if (email_address && email_address.trim() !== "") {
            try {
              const appointmentDate = date_and_time && date_and_time.includes('|')
                ? date_and_time.split('|')[1]?.split(' - ')?.[0] || '-'
                : '-';
              const appointmentTime = date_and_time && date_and_time.includes('|')
                ? date_and_time.split('|')[1]?.split(' - ')?.[1] || '-'
                : '-';

              await fetch('/api/sendappointemntemail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: email_address,
                  subject: 'Appointment Confirmation',
                  appointmentDate,
                  appointmentTime,
                }),
              });
            } catch (e) {
              console.error('Error triggering appointment email (coming back):', e);
            }
          }

          close_handle();
        }
      } catch (error: any) {
        console.error('Error inserting appointment for coming back patient:', error);
        if (error.message.includes('duplicate key') || error.message.includes('time slot')) {
          toast.error('Sorry, Appointment time slot is not available. Please select another time slot.');
        } else {
          toast.error(`Error submitting appointment: ${error.message}`);
        }
      }

      setLoading(false);
      return;
    }

    // Insert new appointment for new patients or when no existing patient selected
    try {
      // Call the backend API route which will securely call the edge function
      const response = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location_id,
          first_name,
          last_name,
          email_address,
          phone,
          sex,
          service,
          date_and_time,
          dob: dob || null, // Send null if DOB is empty
          address: addressLine || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        console.error('Request payload:', {
          location_id,
          first_name,
          last_name,
          email_address,
          phone,
          sex,
          service,
          date_and_time,
          dob: dob || null,
          address: addressLine || "",
        });
        throw new Error(errorData.error || 'Failed to create appointment');
      }

      const result = await response.json();
      
      if (result.success) {
        newAddedRow(result.appointment);

        if (result.appointment?.id && addressLine) {
          try {
            await fetch("/api/appointments/set-address", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                appointmentId: result.appointment.id,
                address: addressLine,
              }),
            });
          } catch (e) {
            console.warn("set-address (new patient)", e);
          }
        }

        toast.success(
          <div className="flex justify-between">
            <p>Appointment scheduled successfully.</p>
            <button
              onClick={() => toast.dismiss()}
              className="absolute top-0 right-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="text-sm">&#x2715;</span>
            </button>
          </div>
        );

        // Send confirmation email only if email is provided
        if (email_address && email_address.trim() !== "") {
          try {
            const appointmentDate = date_and_time && date_and_time.includes('|')
              ? date_and_time.split('|')[1]?.split(' - ')?.[0] || '-'
              : '-';
            const appointmentTime = date_and_time && date_and_time.includes('|')
              ? date_and_time.split('|')[1]?.split(' - ')?.[1] || '-'
              : '-';

            await fetch('/api/sendappointemntemail', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: email_address,
                subject: 'Appointment Confirmation',
                appointmentDate,
                appointmentTime,
              }),
            });
          } catch (e) {
            console.error('Error triggering appointment email:', e);
          }
        }

        close_handle();
      }
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      if (error.message.includes('duplicate key') || error.message.includes('time slot')) {
        toast.error('Sorry, Appointment time slot is not available. Please select another time slot.');
      } else {
        toast.error(`Error submitting appointment: ${error.message}`);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from("services")
          .select("title");

        if (error) {
          console.error("Error fetching services:", error);
          setServices([]); // Ensure services state is reset on error
          return;
        }

        if (data) {
          const serviceData = data.map((item) => item.title);
          setServices(serviceData); // Populate services state
        }
      } catch (err) {
        console.error("Failed to fetch services:", err);
        setServices([]); // Reset services state on failure
      }
    };

    fetchServices();

    if (selectedLocation?.id != null) {
      setFormData((pre: any) => ({
        ...(pre || {}),
        location_id: selectedLocation.id,
      }));
    }
  }, [selectedLocation]);

  const { t } = useTranslation(translationConstant.APPOINMENTS);

  return (
    <div>
      <button
        onClick={open_handle}
        className="text-base flex items-center gap-3 bg-[#0066ff] px-5 py-2 rounded-md text-white hover:bg-[#0052cc] transition-colors"
      >
        <CirclePlus color="white" />
        {t("Appoinments_k15")}
      </button>
      <Modal
        show={open}
        onClose={close_handle}
        size="4xl"
        dismissible
      >
        <Modal.Header className="border-b border-gray-200 dark:bg-[#0e1725] dark:border-gray-700">
          <div className="pr-8">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t("Appoinments_k15")}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {t("Appoinments_k50")}
            </p>
          </div>
        </Modal.Header>

        <Modal.Body className="bg-white dark:bg-[#0e1725] text-black dark:text-white">
          <div className="mx-auto max-w-3xl space-y-6 px-1 py-1 sm:px-0 max-h-[min(72vh,720px)] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
            <div className="flex items-start gap-3 rounded-xl border border-blue-100/90 bg-gradient-to-br from-blue-50/90 to-slate-50/50 px-4 py-3 dark:border-blue-900/50 dark:from-blue-950/40 dark:to-[#0c1626]">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm dark:bg-[#122136] dark:text-blue-400">
                <MapPin className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-900/70 dark:text-blue-200/80">
                  {t("Appoinments_k51")}
                </p>
                <p className="truncate text-lg font-semibold leading-snug text-gray-900 dark:text-white">
                  {selectedLocation?.title}
                </p>
              </div>
            </div>

            <FormSection title={t("Appoinments_k80")}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {t("Appoinments_k17")}
                  </Label>
                  <RadioButtons
                    name="in_office_patient"
                    options={get_in_office_patient_options(t)}
                    selectedValue={formData.in_office_patient}
                    onChange={(e) => select_change_handle("in_office_patient", e)}
                    className="flex flex-wrap gap-x-4 gap-y-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {t("Appoinments_k20")}
                  </Label>
                  <RadioButtons
                    name="new_patient"
                    options={get_patient_type_options(t)}
                    selectedValue={formData.new_patient}
                    onChange={(e) => select_change_handle("new_patient", e)}
                    className="flex flex-wrap gap-x-4 gap-y-2"
                  />
                </div>
              </div>
            </FormSection>

            {formData.new_patient !== "false" && (
              <FormSection title={t("Appoinments_k78")}>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t("Appoinments_k13")}
                    </Label>
                    <Input_Component_Appointment
                      required
                      onChange={(e: string) =>
                        select_change_handle("first_name", e)
                      }
                      value={formData.first_name}
                      placeholder={t("Appoinments_k67")}
                      bg_color="dark:bg-[#122136] bg-[#f1f4f9]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t("Appoinments_k12")}
                    </Label>
                    <Input_Component_Appointment
                      required
                      onChange={(e: string) => select_change_handle("last_name", e)}
                      value={formData.last_name}
                      placeholder={t("Appoinments_k68")}
                      bg_color="dark:bg-[#122136] bg-[#f1f4f9]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t("Appoinments_k11")}
                    </Label>
                    <Input_Component_Appointment
                      onChange={(e: string) =>
                        select_change_handle("email_address", e)
                      }
                      type="email"
                      value={formData.email_address}
                      placeholder={t("Appoinments_k69")}
                      bg_color="dark:bg-[#122136] bg-[#f1f4f9]"
                      pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                      title="Please enter a valid email address (e.g., user@example.com)"
                      hasError={!!emailError}
                    />
                    {emailError && (
                      <p className="mt-1 text-sm text-red-500">{emailError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t("Appoinments_k10")}
                    </Label>
                    <PhoneNumberInput
                      required={true}
                      value={formData.phone || ''}
                      onChange={(e: string) => select_change_handle("phone", e)}
                      breakpoint={false}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:items-end">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t("Appoinments_k9")}
                    </Label>
                    <DobWheelField
                      dobParts={dobParts}
                      formDob={formData.dob || ""}
                      onCommit={handleDobWheelCommit}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t("Appoinments_k8")}
                    </Label>
                    <div className="min-h-[46px] flex items-center">
                      <RadioButtons
                        name="sex"
                        options={get_gender_options(t)}
                        selectedValue={formData.sex}
                        required
                        onChange={(e) => select_change_handle("sex", e)}
                        className="flex flex-wrap gap-x-4 gap-y-2"
                      />
                    </div>
                  </div>
                </div>
              </FormSection>
            )}

            {formData.new_patient !== "false" && (
              <FormSection title={t("Appoinments_k32")}>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {t("Appoinments_k4")}
                  </Label>
                  <div className="relative w-full">
                    <Input_Component_Appointment
                      required
                      id="appointment-patient-address"
                      onChange={handlePatientAddressChange}
                      value={formData.patient_address || ""}
                      placeholder={t("Appoinments_k70")}
                      bg_color="dark:bg-[#122136] bg-[#f1f4f9]"
                      onFocus={() => {
                        if (addressSuggestions.length > 0) {
                          setShowAddressSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowAddressSuggestions(false), 200);
                      }}
                    />
                    {addressSuggestionsLoading && (
                      <div className="pointer-events-none absolute right-3 top-[10px]">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      </div>
                    )}
                    {showAddressSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                        {addressSuggestions.map((suggestion, index) => (
                          <div
                            key={`${suggestion.fullAddress}-${index}`}
                            className="cursor-pointer border-b border-gray-100 px-4 py-2 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-700 last:border-b-0"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handlePatientAddressSelect(suggestion)}
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {suggestion.streetLine}
                              {suggestion.secondary ? ` ${suggestion.secondary}` : ""}
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
              </FormSection>
            )}

            {comingBackLoading && formData.new_patient === "false" && (
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/90 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-[#071226] dark:text-gray-300">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t("Appoinments_k96", { defaultValue: "Loading patients…" })}
              </div>
            )}

            {comingBackData && comingBackData.length > 0 && !selectedComingBackPatient && formData.new_patient === "false" && (
              <FormSection title={t("Appoinments_k14")}>
                <ComingBackTable
                  data={comingBackData}
                  onSelect={(patient) => {
                    setSelectedComingBackPatient(patient);
                    if (patient) {
                      const nextDob = patient.dob || "";
                      if (nextDob && /^\d{4}-\d{2}-\d{2}$/.test(nextDob)) {
                        const [y, m, d] = nextDob.split("-");
                        const n = normalizeDobParts(y, m, d);
                        setDobParts({ y: n.y, m: n.m, d: n.d });
                      } else {
                        setDobParts({ y: "", m: "", d: "" });
                      }
                      setFormData((pre: any) => ({
                        ...pre,
                        location_id:
                          pre?.location_id ?? (selectedLocation as any)?.id,
                        first_name: patient.first_name,
                        last_name: patient.last_name,
                        email_address: patient.email_address,
                        phone: patient.phone,
                        dob: nextDob,
                        date_and_time: "",
                        sex: patient.sex,
                        new_patient: "false",
                      }));
                    }
                  }}
                />
              </FormSection>
            )}

            {comingBackData && comingBackData.length > 0 && !selectedComingBackPatient && formData.new_patient === "false" && (
              <FormSection title={t("Appoinments_k79")} className="!pb-9 sm:!pb-10">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {t("Appoinments_k3")}
                  </Label>
                  <select
                    required
                    value={formData.service}
                    onChange={(e) =>
                      select_change_handle("service", e.target.value)
                    }
                    className={nativeSelectClassName}
                  >
                    <option value="" className="bg-white dark:bg-[#122136] text-black dark:text-white">
                      {t("Appoinments_k28")}
                    </option>
                    {services?.map((service: string, index: any) => (
                      <option
                        key={index}
                        value={service}
                        className="bg-white dark:bg-[#122136] text-black dark:text-white"
                      >
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  {locations.length > 0 && (
                    <ScheduleDateTime
                      data={locations[0]}
                      selectDateTimeSlotHandle={selectDateTimeSlotHandle}
                    />
                  )}
                </div>
              </FormSection>
            )}

            {comingBackData && comingBackData.length === 0 && !comingBackLoading && !selectedComingBackPatient && formData.new_patient === "false" && (
              <div className="rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100">
                <p className="text-sm font-medium">{t("Appoinments_k92")}</p>
              </div>
            )}

            {selectedComingBackPatient && (
              <div className="rounded-xl border border-gray-200 bg-gray-50/90 p-4 dark:border-gray-700 dark:bg-[#071226]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5 text-sm">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t("Appoinments_k93")}</h3>
                    <p><span className="text-gray-500 dark:text-gray-400">{t("Appoinments_k89", { defaultValue: (enAppoinments as any)["Appoinments_k89"] ?? "Name" })}</span> — {selectedComingBackPatient.first_name} {selectedComingBackPatient.last_name}</p>
                    <p><span className="text-gray-500 dark:text-gray-400">{t("Appoinments_k90", { defaultValue: (enAppoinments as any)["Appoinments_k90"] ?? "Phone" })}</span> — {selectedComingBackPatient.phone || "—"}</p>
                    <p><span className="text-gray-500 dark:text-gray-400">{t("Appoinments_k8")}</span> — {selectedComingBackPatient.sex || "—"}</p>
                    {!selectedComingBackPatient.dob && (
                      <div className="pt-2 space-y-2">
                        <p className="text-amber-700 dark:text-amber-300">
                          {t("Appoinments_k97", { defaultValue: "Date of birth is missing on file. Please add it before scheduling." })}
                        </p>
                        <DobWheelField
                          dobParts={dobParts}
                          formDob={formData.dob || ""}
                          onCommit={handleDobWheelCommit}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedComingBackPatient(null);
                      setDobParts({ y: "", m: "", d: "" });
                      setFormData((pre: any) => ({ ...pre, new_patient: "false", dob: "" }));
                    }}
                    className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-[#122136] dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    {t("Appoinments_k94")}
                  </button>
                </div>
              </div>
            )}

            {(formData.new_patient !== "false" || selectedComingBackPatient) && (
              <FormSection title={t("Appoinments_k79")} className="!pb-9 sm:!pb-10">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {t("Appoinments_k3")}
                  </Label>
                  <select
                    required
                    value={formData.service}
                    onChange={(e) =>
                      select_change_handle("service", e.target.value)
                    }
                    className={nativeSelectClassName}
                  >
                    <option value="" className="bg-white dark:bg-[#122136] text-black dark:text-white">
                      {t("Appoinments_k28")}
                    </option>
                    {services?.map((service: string, index: any) => (
                      <option
                        key={index}
                        value={service}
                        className="bg-white dark:bg-[#122136] text-black dark:text-white"
                      >
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  {locations.length > 0 && (
                    <ScheduleDateTime
                      data={locations[0]}
                      selectDateTimeSlotHandle={selectDateTimeSlotHandle}
                    />
                  )}
                </div>
              </FormSection>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer className="border-t border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-[#0e1725]">
          <div className="mx-auto flex w-full max-w-3xl flex-col-reverse gap-2 px-1 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={close_handle}
              className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-[#122136] dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {t("Appoinments_k58")}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={submitHandle}
              className={`min-h-[44px] min-w-[160px] rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors ${
                loading ? "cursor-not-allowed bg-[#0066ff]/70" : "bg-[#0066ff] hover:bg-[#0052cc]"
              }`}
            >
              {loading ? "Submitting..." : t("Appoinments_k57")}
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
