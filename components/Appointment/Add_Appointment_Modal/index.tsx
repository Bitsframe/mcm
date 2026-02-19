import { Input_Component_Appointment } from "@/components/Appointment/Add_Appointment_Modal/Input_Component";
import { useLocationClinica } from "@/hooks/useLocationClinica";
import { Label, Modal, Radio, Select } from "flowbite-react";
import React, { useContext, useEffect, useState, useCallback } from "react";
import ScheduleDateTime from "./ScheduleDateTime";
import { supabase } from "@/services/supabase";
import moment from "moment";
import { toast } from "sonner";
import { usStates } from "@/us-states";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { CirclePlus } from "lucide-react";
import { EmailBodyTempEnum } from "@/utils/emailService/templateDetails";
import { sendEmail } from "@/utils/emailService";
import { LocationContext, AuthContext } from "@/context";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import ComingBackTable from "@/components/Appointment/ComingBackTable";


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

          <span className="select-none text-lg">{opt.label}</span>
        </label>
      ))}
    </div>
  );
};

const in_office_patient_options: RadioButtonOptionsInterface[] = [
  { label: "Office visit", value: "true" },
  { label: "Virtual visit", value: "false", disabled: true },
];

const patient_type_options: RadioButtonOptionsInterface[] = [
  { label: "New", value: "true" },
  { label: "Coming Back", value: "false" },
];

const gender_options: RadioButtonOptionsInterface[] = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];


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
  const [selectedComingBackPatient, setSelectedComingBackPatient] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const close_handle = () => {
    setOpen(false);
    setEmailError("");
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
      };
    });

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
          // For 'Coming Back' select existing patients from the `allpatients` table
          // filtered by the selected location id. Only fetch the fields we need.
          if (!selectedLocation || !selectedLocation.id) {
            console.warn('[Add_Appointment_Modal] selectedLocation is not set, cannot fetch coming back patients by location');
            setComingBackData([]);
            return;
          }

          const { data, error } = await supabase
            .from('allpatients')
            .select('id, firstname, lastname, email, phone, gender, dob')
            .eq('locationid', selectedLocation.id);
            

          // raw response available in `data`/`error`
          if (error) {
            console.error('Error fetching returning patients from allpatients:', error);
            setComingBackData([]);
            return;
          }

          // Use the fetched allpatients rows directly
          setComingBackData(data || []);
        } catch (err) {
          console.error('Failed to fetch returning patients from allpatients', err);
          setComingBackData([]);
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
      }));
    }
  };
  
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
      location_id,
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

    for (const field of requiredFields) {
      if (!formData[field]) {
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
        
        // Call the edge function with the coming back patient's data
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        const response = await fetch(`${supabaseUrl}/functions/v1/create-appointment-mcm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
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
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Edge function error:', errorData);
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
      // Call the edge function to handle patient creation and appointment insertion
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/create-appointment-mcm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Edge function error:', errorData);
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

    if (selectedLocation) {
      setFormData({
        location_id: selectedLocation.id,
      });
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
      <Modal show={open} onClose={close_handle}>
        <Modal.Header className="border-b border-gray-200 dark:bg-[#0e1725] dark:border-gray-700">
          <div>
            <h1 className="font-bold text-xl text-black dark:text-white">
              {t("Appoinments_k15")}
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-300">
              {t("Appoinments_k50")}
            </p>
          </div>
        </Modal.Header>

        <Modal.Body className="bg-white dark:bg-[#0e1725] text-black dark:text-white">
          <div className="space-y-4">
            <div className="space-y-2">
              <p>{t("Appoinments_k51")} </p>
              <h1 className="font-bold text-xl">{selectedLocation?.title}</h1>
              {/* <Label className="font-medium text-gray-800 dark:text-gray-300">
                Locations
              </Label>x
              <Select
                value={formData.location_id}
                onChange={(e) =>
                  select_change_handle("location_id", e.target.value)
                }
                className="bg-gray-100 dark:bg-gray-700 text-black dark:text-white"
              >
                <option value="" className="bg-white dark:bg-[#080e16]">
                  All locations
                </option>
                {locations.map((location: any, index: any) => (
                  <option
                    key={index}
                    value={location.id}
                    className="bg-white dark:bg-[#080e16]"
                  >
                    {location.address}
                  </option>
                ))}
              </Select> */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 order-1 md:order-none">
                <Label className="font-medium text-gray-800 dark:text-gray-300">
                  {t("Appoinments_k17")}
                </Label>
                <RadioButtons
                  name="in_office_patient"
                  options={in_office_patient_options}
                  selectedValue={formData.in_office_patient}
                  onChange={(e) => select_change_handle("in_office_patient", e)}
                  className="flex gap-2"
                />
              </div>

              <div className="space-y-2 order-2 md:order-none">
                <Label className="font-medium text-gray-800 dark:text-gray-300">
                  {t("Appoinments_k20")}
                </Label>
                <RadioButtons
                  name="new_patient"
                  options={patient_type_options}
                  selectedValue={formData.new_patient}
                  onChange={(e) => select_change_handle("new_patient", e)}
                  className="flex gap-2"
                />
              </div>
            </div>

            <div className="h-[1px] bg-gray-200 dark:bg-gray-700 w-full my-4"></div>

            {formData.new_patient !== "false" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium text-gray-800 dark:text-gray-300">
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
                  <Label className="font-medium text-gray-800 dark:text-gray-300">
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
            )}

            {formData.new_patient !== "false" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium text-gray-800 dark:text-gray-300">
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
                      <p className="text-red-500 text-sm mt-1">{emailError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-gray-800 dark:text-gray-300">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium text-gray-800 dark:text-gray-300">
                      {t("Appoinments_k9")}
                    </Label>
                    <input
                      type="date"
                      required
                      value={formData.dob || ''}
                      onChange={(e) => select_change_handle("dob", e.target.value)}
                      className="w-full h-[46px] text-[16px] text-black dark:text-white bg-[#f1f4f9] dark:bg-[#122136] border-none outline-none rounded-lg px-3 py-2"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-gray-800 dark:text-gray-300">
                      {t("Appoinments_k8")}
                    </Label>
                    <RadioButtons
                      name="sex"
                      options={gender_options}
                      selectedValue={formData.sex}
                      required
                      onChange={(e) => select_change_handle("sex", e)}
                      className="flex gap-2 flex-wrap sm:flex-nowrap"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="h-[1px] bg-gray-200 dark:bg-gray-700 w-full my-4"></div>

            {/* state/zipcode/street_address removed from UI per request */}

            <div className="h-[1px] bg-gray-200 dark:bg-gray-700 w-full my-4"></div>

            {/* service select moved below selected patient summary */}

            {comingBackData && comingBackData.length > 0 && !selectedComingBackPatient && formData.new_patient === "false" && (
              <div className="mt-4">
                <Label className="font-medium text-gray-800 dark:text-gray-300">Coming back patients</Label>
                <ComingBackTable
                  data={comingBackData.map((p: any) => ({
                    id: p.id ?? p.patientid ?? p.patient_id,
                    first_name: p.firstname ?? p.first_name ?? p.firstName ?? '',
                    last_name: p.lastname ?? p.last_name ?? p.lastName ?? '',
                    email_address: p.email ?? p.email_address ?? p.emailAddress ?? '',
                    phone: p.phone ?? p.mobile ?? p.phone_number ?? '',
                    date_and_time: p.date_and_time ?? '',
                    sex: p.sex ?? p.gender ?? '',
                    dob: p.dob ?? '',
                  }))}
                  onSelect={(patient) => {
                    setSelectedComingBackPatient(patient);
                    if (patient) {
                      setFormData((pre: any) => ({
                        ...pre,
                        first_name: patient.first_name,
                        last_name: patient.last_name,
                        email_address: patient.email_address,
                        phone: patient.phone,
                        dob: patient.dob || "",
                        // intentionally NOT setting date_and_time from selected patient
                        date_and_time: "",
                        sex: patient.sex,
                        new_patient: "false",
                      }));
                    }
                  }}
                />
              </div>
            )}

            {/* When showing the ComingBackTable (returning patients), also show service & scheduling fields below it */}
            {comingBackData && comingBackData.length > 0 && !selectedComingBackPatient && formData.new_patient === "false" && (
              <>
                <div className="mt-4 space-y-2">
                  <Label className="font-medium text-gray-800 dark:text-gray-300">
                    {t("Appoinments_k3")}
                  </Label>
                  <select
                    required
                    value={formData.service}
                    onChange={(e) =>
                      select_change_handle("service", e.target.value)
                    }
                    className="w-full h-[46px] text-[16px] text-black dark:text-white bg-[#f1f4f9] dark:bg-[#122136] border-none outline-none rounded-lg px-3 py-2"
                    style={{
                      backgroundColor: document.documentElement.classList.contains(
                        "dark"
                      )
                        ? "#122136"
                        : "#f1f4f9",
                      border: "none",
                      outline: "none",
                    }}
                  >
                    <option value="" className="bg-white dark:bg-[#122136] text-black dark:text-white">
                      {t("Appoinments_k28")}
                    </option>
                    {services?.map((service: string, index: any) => (
                      <option
                        key={index}
                        value={service}
                        className="bg-white dark:bg-[#122136] text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div className="space-y-2">
                    {locations.length > 0 && (
                      <ScheduleDateTime
                        data={locations[0]}
                        selectDateTimeSlotHandle={selectDateTimeSlotHandle}
                      />
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Show a friendly message when comingBackData was fetched but contains no rows
                Only show this when 'Coming Back' is selected (new_patient === "false"). */}
            {comingBackData && comingBackData.length === 0 && !selectedComingBackPatient && formData.new_patient === "false" && (
              <div className="mt-4 p-4 rounded bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200">
                <p className="font-medium">No returning patient</p>
                
              </div>
            )}

            {selectedComingBackPatient && (
              <div className="mt-4 p-4 border rounded bg-gray-50 dark:bg-[#071226]">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">Selected patient</h3>
                    <p className="mt-2"><strong>Name:</strong> {selectedComingBackPatient.first_name} {selectedComingBackPatient.last_name}</p>
                    <p className="mt-1"><strong>Phone:</strong> {selectedComingBackPatient.phone || '-'}</p>
                      <p className="mt-1"><strong>Sex:</strong> {selectedComingBackPatient.sex || '-'}</p>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        // clear selection and show table again
                        setSelectedComingBackPatient(null);
                        setFormData((pre: any) => ({ ...pre, new_patient: "false" }));
                      }}
                      className="px-3 py-1 bg-white border rounded text-sm"
                    >Change</button>
                  </div>
                </div>
              </div>
            )}

            {/* Service select should appear after patient details / selected patient */}
            {(formData.new_patient !== "false" || selectedComingBackPatient) && (
              <div className="mt-4 space-y-2">
                <Label className="font-medium text-gray-800 dark:text-gray-300">
                  {t("Appoinments_k3")}
                </Label>
                <select
                  required
                  value={formData.service}
                  onChange={(e) =>
                    select_change_handle("service", e.target.value)
                  }
                  className="w-full h-[46px] text-[16px] text-black dark:text-white bg-[#f1f4f9] dark:bg-[#122136] border-none outline-none rounded-lg px-3 py-2"
                  style={{
                    backgroundColor: document.documentElement.classList.contains(
                      "dark"
                    )
                      ? "#122136"
                      : "#f1f4f9",
                    border: "none",
                    outline: "none",
                  }}
                >
                  <option value="" className="bg-white dark:bg-[#122136] text-black dark:text-white">
                    {t("Appoinments_k28")}
                  </option>
                  {services?.map((service: string, index: any) => (
                    <option
                      key={index}
                      value={service}
                      className="bg-white dark:bg-[#122136] text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {service}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(formData.new_patient !== "false" || selectedComingBackPatient) && (
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  {locations.length > 0 && (
                    <ScheduleDateTime
                      data={locations[0]}
                      selectDateTimeSlotHandle={selectDateTimeSlotHandle}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0e1725]">
          <div className="flex flex-col sm:flex-row w-full justify-end gap-2 sm:gap-3">
            <button
              onClick={close_handle}
              className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-md text-black dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {t("Appoinments_k58")}
            </button>
            <button
              disabled={loading}
              onClick={submitHandle}
              className={`bg-[#0066ff] ${
                loading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#0052cc]"
              } px-4 py-2 rounded-md text-white transition-colors`}
            >
              {loading ? "Submitting..." : t("Appoinments_k57")}
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
