import { Input_Component_Appointment } from "@/components/Appointment/Add_Appointment_Modal/Input_Component";
import { useLocationClinica } from "@/hooks/useLocationClinica";
import { Label, Modal, Radio, Select } from "flowbite-react";
import React, { useEffect, useState } from "react";
import ScheduleDateTime from "./ScheduleDateTime";
import { supabase } from "@/services/supabase";
import { toast } from "react-toastify";
import moment from "moment";
import { usStates } from "@/us-states";
import { validateFormData } from "@/utils/validationCheck";

interface RadioButtonOptionsInterface {
  label: string;
  value: string;
}

const RadioButton = ({ value, name, label, checked, onChange }: any) => (
  <div className="flex items-center justify-start gap-3">
    <input
      id={`${name}-${value}`}
      type="radio"
      value={value}
      name={name}
      checked={checked}
      onChange={onChange}
      className="w-[25px] h-[25px] !border-solid !border-[2px] !border-gray-300"
    />{" "}
    <label
      htmlFor={`${name}-${value}`}
      className="text-[16px] text-customGray font-poppins"
    >
      {label}
    </label>
  </div>
);

const RadioButtons = ({
  name,
  options,
  label,
  selectedValue,
  onChange,
}: {
  name: string;
  options: RadioButtonOptionsInterface[];
  label: string;
  selectedValue: string;
  onChange: (value: string) => void;
}) => (
  <div className="flex flex-col md:flex-row items-start justify-start gap-4">
    <label className="text-[16px] text-customGray font-poppins font-bold">
      {label}:
    </label>
    <div className="flex flex-wrap gap-4">
      {options.map(({ label, value }, index) => (
        <RadioButton
          key={index}
          value={value}
          name={name}
          label={label}
          checked={selectedValue === value}
          onChange={() => onChange(value)}
        />
      ))}
    </div>
  </div>
);

const in_office_patient_options: RadioButtonOptionsInterface[] = [
  {
    label: "Office visit",
    value: "true",
  },
  {
    label: "Virtual visit",
    value: "false",
  },
];
const patient_type_options: RadioButtonOptionsInterface[] = [
  {
    label: "New",
    value: "true",
  },
  {
    label: "Coming back",
    value: "false",
  },
];
const gender_options: RadioButtonOptionsInterface[] = [
  {
    label: "Male",
    value: "Male",
  },
  {
    label: "Female",
    value: "Female",
  },
  {
    label: "Other",
    value: "Other",
  },
];

// const required_fields = {
//     location_id: { required: true, label: 'Location' },
//     first_name: { required: true, label: 'First Name' },
//     last_name: { required: true, label: 'Last Name' },
//     email_address: { required: true, label: 'Email Address' },
//     dob: { required: true, label: 'Date of Birth' },
//     sex: { required: true, label: 'Sex' },
//     service: { required: true, label: 'Service' },
//     in_office_patient: { required: false, label: 'Type of visit' },
//     new_patient: { required: false, label: 'Are you a new or returning patient?' },
//     address: { required: true, label: 'Address' },
//     phone: { required: true, label: 'Treatment' },
//     date_and_time: { required: true, label: 'Date and Time Slot' },
// }

export const Add_Appointment_Modal = ({
  newAddedRow,
}: {
  newAddedRow: (e: any) => void;
}) => {
  const { locations } = useLocationClinica();
  const [formData, setFormData] = useState<any>({});
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<string[] | null | undefined>([]);
  const [loading, setLoading] = useState(false);

  const close_handle = () => {
    setOpen(false);
    setFormData({});
  };
  const open_handle = () => {
    setOpen(true);
  };
  const select_change_handle = (key: string, val: string | number) => {
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
    } else {
      // toast.warning(`Select location first`);
    }
  };
  const submitHandle = async () => {
    setLoading(true);
    const {
      location_id,
      first_name,
      last_name,
      email_address,
      address,
      in_office_patient,
      new_patient,
      dob,
      sex,
      phone,
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
      dob: dob,
      sex: sex,
      phone: phone,
      service: service,
      date_and_time,
    };

    const requiredFields = [
      "location_id",
      "first_name",
      "last_name",
      "email_address",
      "dob",
      "sex",
      "phone",
      "state",
      "zipcode",
      "street_address",
      "service",
      "date_and_time",
    ];

    const validateData = validateFormData(
      { ...formData, email: email_address },
      true
    );

    if (!validateData) {
      setLoading(false);
      return;
    }

    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.warning(`Please fill in the ${field}`);
        setLoading(false);
        return;
      }
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
      toast.success("Appointment Submitted");
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
  }, []);
  console.log(formData);
  return (
    <div>
      <button
        onClick={open_handle}
        className="text-lg bg-gray-300 px-5 py-2 rounded-md font-bold text-black"
      >
        Add an Appointment
      </button>

      <Modal show={open} onClose={close_handle}>
        <Modal.Header>
          <div className="flex items-center justify-between">
            <h1 className="font-bold">Add an Appointment</h1>
            {/* <IoCloseOutline size={25} /> */}
          </div>
        </Modal.Header>

        <Modal.Body>
          <div className="space-y-5">
            <div className="space-y-8">
              <div className="flex flex-1 items-center gap-4">
                <Label htmlFor="locations" className="font-bold">
                  Locations
                </Label>
                <div className="flex-1">
                  <Select
                    onChange={(e) =>
                      select_change_handle("location_id", e.target.value)
                    }
                    id="locations"
                    required
                  >
                    <option selected value="">
                      All locations
                    </option>
                    {locations.map((location: any, index: any) => (
                      <option key={index} value={location.id}>
                        {location.address}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex flex-1 items-center gap-4">
                <RadioButtons
                  name="in_office_patient"
                  label="Type of visit"
                  options={in_office_patient_options}
                  selectedValue={formData.in_office_patient}
                  onChange={(e) => select_change_handle("in_office_patient", e)}
                />
              </div>
              <div className="flex flex-1 items-center gap-4">
                <RadioButtons
                  name="new_patient"
                  label="Are you a new or returning patient?"
                  options={patient_type_options}
                  selectedValue={formData.new_patient}
                  onChange={(e) => select_change_handle("new_patient", e)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="w-full">
                  <Input_Component_Appointment
                    onChange={(e: string) =>
                      select_change_handle("first_name", e)
                    }
                    placeholder="@peduarte"
                    label="First Name"
                  />
                </div>
                <div className="w-full">
                  <Input_Component_Appointment
                    onChange={(e: string) =>
                      select_change_handle("last_name", e)
                    }
                    placeholder="@peduarte"
                    label="Last Name"
                  />
                </div>
              </div>

              <div className="w-full">
                <Input_Component_Appointment
                  onChange={(e: string) =>
                    select_change_handle("email_address", e)
                  }
                  placeholder="Enter you current email address"
                  label="Email"
                />
              </div>
              <div className="w-full">
                <Input_Component_Appointment
                  onChange={(e: string) => select_change_handle("phone", e)}
                  placeholder="Enter you phone number"
                  label="Phone number"
                />
              </div>
              <div className="w-full">
                <Input_Component_Appointment
                  type="date"
                  onChange={(e: string) => select_change_handle("dob", e)}
                  placeholder="Your date of birth"
                  label="Your date of birth"
                />
              </div>
              <div className="flex flex-1 items-center gap-4">
                <RadioButtons
                  name="sex"
                  label="Sex"
                  options={gender_options}
                  selectedValue={formData.sex}
                  onChange={(e) => select_change_handle("sex", e)}
                />
              </div>

              <div className="w-full grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="locations" className="font-bold">
                    State
                  </Label>
                  <Select
                    style={{ paddingBottom: "13px", paddingTop: "13px" }}
                    className="flex-1"
                    sizing="md"
                    onChange={(e) =>
                      select_change_handle("state", e.target.value)
                    }
                    id="state"
                    required
                  >
                    <option selected disabled value="">
                      State
                    </option>
                    {usStates?.map(({ value, name }, index: any) => (
                      <option
                        key={index}
                        value={name}
                      >{`${name} - ${value}`}</option>
                    ))}
                  </Select>
                </div>
                <div className="">
                  <Input_Component_Appointment
                    max={5}
                    label="Zipcode"
                    onChange={(e: string) => select_change_handle("zipcode", e)}
                    placeholder="Enter zipcode"
                  />
                </div>
                <div className="col-span-2">
                  <Input_Component_Appointment
                    label="Street Address"
                    onChange={(e: string) =>
                      select_change_handle("street_address", e)
                    }
                    placeholder="Enter your address with zipcode"
                  />
                </div>
              </div>

              <div className="flex flex-1 items-center gap-4">
                <Label htmlFor="locations" className="font-bold">
                  Treatment
                </Label>
                <div className="flex-1">
                  <Select
                    onChange={(e) =>
                      select_change_handle("service", e.target.value)
                    }
                    id="services"
                    required
                  >
                    <option selected value="">
                      Select Treatment type
                    </option>
                    {services?.map((service: string, index: any) => (
                      <option key={index} value={service}>
                        {service}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {locations.length > 0 && (
                <div>
                  <ScheduleDateTime
                    data={locations[0]}
                    selectDateTimeSlotHandle={selectDateTimeSlotHandle}
                  />
                </div>
              )}
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <div className="flex w-full justify-end">
            <button
              disabled={loading}
              onClick={submitHandle}
              className={`bg-[#0F172A] ${
                loading && "opacity-70"
              } w-40 py-3 rounded-lg text-white`}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
