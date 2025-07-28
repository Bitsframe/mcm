import { Input_Component_Appointment } from "@/components/Appointment/Add_Appointment_Modal/Input_Component";
import { useLocationClinica } from "@/hooks/useLocationClinica";
import { Label, Modal, Radio, Select } from "flowbite-react";
import React, { useContext, useEffect, useState } from "react";
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
import { LocationContext } from "@/context";
import PhoneNumberInput from "@/components/PhoneNumberInput";

interface RadioButtonOptionsInterface {
  label: string;
  value: string;
  disabled?: boolean;
}

const RadioButton = ({ value, name, label, checked, onChange, disabled }: any) => {
  const { t } = useTranslation(translationConstant.APPOINMENTS);
  return (
    <div className="flex items-center justify-start gap-3">
      <input
        id={`${name}-${value}`}
        type="radio"
        value={value}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`w-[25px] h-[25px] !border-solid !border-[2px] !border-gray-300 dark:!border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />{" "}
      <label
        htmlFor={`${name}-${value}`}
        className="text-[14px] text-customGray dark:text-gray-300 font-poppins"
      >
        {t(label)}
      </label>
    </div>
  );
};

const RadioButtons = ({
  name,
  options,
  label,
  selectedValue,
  onChange,
  required = false,
  className,
}: {
  name: string;
  options: RadioButtonOptionsInterface[];
  label?: string;
  selectedValue: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}) => (
  <div className="flex flex-col md:flex-row items-start justify-start gap-2 pt-3">
    <label className="text-[16px] text-customGray dark:text-gray-300 font-poppins font-bold">
      {label}
    </label>
    <div className="flex flex-wrap gap-4">
      {options.map(({ label, value, disabled }, index) => (
        <RadioButton
          key={index}
          value={value}
          name={name}
          label={label}
          checked={selectedValue === value}
          onChange={() => onChange(value)}
          disabled={disabled}
        />
      ))}
    </div>
  </div>
);

const in_office_patient_options: RadioButtonOptionsInterface[] = [
  {
    label: "Appoinments_k18",
    value: "true",
  },
  {
    label: "Appoinments_k19",
    value: "false",
    disabled: true
  },
];
const patient_type_options: RadioButtonOptionsInterface[] = [
  {
    label: "Appoinments_k21",
    value: "true",
  },
  {
    label: "Appoinments_k14",
    value: "false",
  },
];
const gender_options: RadioButtonOptionsInterface[] = [
  {
    label: "Appoinments_k35",
    value: "Male",
  },
  {
    label: "Appoinments_k36",
    value: "Female",
  },
  {
    label: "Appoinments_k37",
    value: "Other",
  },
];

export const Add_Appointment_Modal = ({
  newAddedRow,
}: {
  newAddedRow: (e: any) => void;
}) => {
  const { locations } = useLocationClinica();
  const { selectedLocation } = useContext(LocationContext);

  const [formData, setFormData] = useState<any>({ phone: '' });
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<string[] | null | undefined>([]);
  const [loading, setLoading] = useState(false);

  const close_handle = () => {
    setOpen(false);
    if (selectedLocation) {
      setFormData({
        location_id: selectedLocation.id,
      });
    }
  };
  const open_handle = () => {
    setOpen(true);
  };
  // Email validation helper function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const select_change_handle = (key: string, val: string | number) => {
    // Validate date of birth to prevent future dates
    if (key === "dob" && typeof val === "string") {
      const selectedDate = new Date(val);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to end of today
      
      if (selectedDate > today) {
        toast.error(t("Appoinments_k63"));
        return;
      }
    }

    // Validate email format (only show error on blur or form submission, not while typing)
    if (key === "email_address" && typeof val === "string") {
      // Allow typing but don't show error immediately
      // Error will be shown only during form submission
    }
    
    setFormData((pre: any) => {
      return { ...pre, [key]: val };
    });
  };
  const selectDateTimeSlotHandle = (date: Date | "", time?: string | "") => {
    if (formData.location_id) {
      let dbSlot = "";
      if (date && time) {
        const formated_date = moment(date).format("DD-MM-YYYY");
        const createSlotForDB = `${formData.location_id}|${formated_date} - ${time}`;
        console.log({ createSlotForDB });
        dbSlot = createSlotForDB;
      }

      setFormData((pre: any) => {
        return { ...pre, date_and_time: dbSlot };
      });
      console.log(dbSlot);
    }
  };
  const submitHandle = async () => {
    setLoading(true);
    const {
      location_id,
      first_name,
      last_name,
      email_address,
      street_address,
      in_office_patient,
      new_patient,
      dob,
      sex,
      phone,
      date_and_time,
      service,
      state,
      zipcode,
    } = formData;
    let appointmentDetails: any = {
      location_id,
      first_name,
      last_name,
      email_address,
      in_office_patient: in_office_patient === "true" || false,
      new_patient: new_patient === "true" || false,
      dob: dob,
      sex: sex,
      phone: phone,
      service: service,
      date_and_time,
    };

    const requiredFields = [
      "location_id",
      "in_office_patient",
      "new_patient",
      "first_name",
      "last_name",
      "email_address",
      "phone",
      "sex",
      "state",
      "zipcode",
      "street_address",
      "service",
      "date_and_time",
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.warning(`Please fill in the ${field}`);
        setLoading(false);
        return;
      }
    }

    // Additional email validation before submission
    if (!isValidEmail(email_address)) {
      toast.error(t("Appoinments_k64"));
      setLoading(false);
      return;
    }

    const postData = {
      ...appointmentDetails,
      address: `${formData.street_address}, ${formData.state}, ${formData.zipcode}`,
      date_and_time,
    };
    const { data, error } = await supabase
      .from("Appoinments")
      .insert([postData])
      .select();

    newAddedRow(data?.[0]);

    if (error) {
      if (
        error?.message ===
        'duplicate key value violates unique constraint "Appoinments_date_and_time_key"'
      ) {
        toast.error(
          `Sorry, Appointment time slot is not available, Please select any other time slot`
        );
      } else {
        toast.error(`Error submitting appointment: ${error?.message}`);
      }
    } else {
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

      const emailType = EmailBodyTempEnum.APPOINTMENT_CONFIRMATION;

      const { email_address, first_name, last_name, service, date_and_time } =
        appointmentDetails;
      const data: any = {
        email: email_address,
        name: `${first_name} ${last_name}`,
        location: selectedLocation,
        service: service,
        date: date_and_time && date_and_time.includes("|")
          ? date_and_time.split("|")[1]?.split(" - ")?.[0] || "-"
          : "-",
        time: date_and_time && date_and_time.includes("|")
          ? date_and_time.split("|")[1]?.split(" - ")?.[1] || "-"
          : "-",
      };
      await sendEmail({ lang: "en", emailType, data });
      console.log(data, "Appointment Submitted");
      close_handle();
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchServices = async () => {
      let { data, error } = await supabase.from("services").select("title");

      if (data) {
        const serviceData = data.map((item) => item.title);
        setServices(serviceData);
      }
    };

    fetchServices();
    if (selectedLocation) {
      setFormData({
        location_id: selectedLocation.id,
      });
    }
  }, []);

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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium text-gray-800 dark:text-gray-300">
                  {t("Appoinments_k13")}
                </Label>
                <Input_Component_Appointment
                  type="email"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium text-gray-800 dark:text-gray-300">
                  {t("Appoinments_k11")}
                </Label>
                <Input_Component_Appointment
                  required
                  onChange={(e: string) =>
                    select_change_handle("email_address", e)
                  }
                  type="email"
                  value={formData.email_address}
                  placeholder={t("Appoinments_k69")}
                  bg_color="dark:bg-[#122136] bg-[#f1f4f9]"
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                  title="Please enter a valid email address (e.g., user@example.com)"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-gray-800 dark:text-gray-300">
                  {t("Appoinments_k10")}
                </Label>
                {/* <Input_Component_Appointment
                  required
                  onChange={(e: string) => select_change_handle("phone", e)}
                  value={formData.phone}
                  placeholder="Phone Number"
                  bg_color="dark:bg-[#122136] bg-[#f1f4f9]"
                /> */}
                <PhoneNumberInput
                  required={true}
                  value={formData.phone || ''}
                  onChange={(e: string) => select_change_handle("phone", e)}
                  breakpoint={false}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date of Birth */}
              <div className="space-y-2">
                <Label className="font-medium text-gray-800 dark:text-gray-300">
                  {t("Appoinments_k9")}
                </Label>
                <Input_Component_Appointment
                  type="date"
                  onChange={(e: string) => select_change_handle("dob", e)}
                  value={formData.dob}
                  placeholder="Enter mm/dd/yyyy"
                  bg_color="dark:bg-[#122136] bg-[#f1f4f9]"
                  //@ts-ignore
                  max={new Date().toISOString().split('T')[0]} // Prevents future dates
                />
              </div>

              {/* Gender */}
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

            <div className="h-[1px] bg-gray-200 dark:bg-gray-700 w-full my-4"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium text-gray-800 dark:text-gray-300">
                  {t("Appoinments_k6")}
                </Label>
                <select
                  value={formData.state}
                  onChange={(e) =>
                    select_change_handle("state", e.target.value)
                  }
                  className="w-full h-[46px] text-[16px] text-black dark:text-white bg-[#f1f4f9] dark:bg-[#122136] border-none outline-none rounded-lg px-3 py-2"
                  style={{
                    backgroundColor:
                      document.documentElement.classList.contains("dark")
                        ? "#122136"
                        : "#f1f4f9",
                    border: "none",
                    outline: "none",
                  }}
                >
                  <option
                    disabled
                    value=""
                    className="bg-white dark:bg-[#122136] text-black dark:text-white"
                  >
                    Alaska - AK
                  </option>
                  {usStates?.map(({ value, name }, index: any) => (
                    <option
                      key={index}
                      value={name}
                      className="bg-white dark:bg-[#122136] text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >{`${name} - ${value}`}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-gray-800 dark:text-gray-300">
                  {t("Appoinments_k5")}
                </Label>
                <Input_Component_Appointment
                  max={5}
                  onChange={(e: string) => select_change_handle("zipcode", e)}
                  value={formData.zipcode}
                  placeholder={t("Appoinments_k71")}
                  bg_color="dark:bg-[#122136] bg-[#f1f4f9]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-gray-800 dark:text-gray-300">
                {t("Appoinments_k4")}
              </Label>
              <Input_Component_Appointment
                onChange={(e: string) =>
                  select_change_handle("street_address", e)
                }
                value={formData.street_address}
                placeholder={t("Appoinments_k70")}
                bg_color="dark:bg-[#122136] bg-[#f1f4f9]"
              />
            </div>

            <div className="h-[1px] bg-gray-200 dark:bg-gray-700 w-full my-4"></div>

            <div className="space-y-2">
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
