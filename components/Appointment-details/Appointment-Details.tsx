import { formatPhoneNumber } from "@/utils/getCountryName";
import moment from "moment";
import { memo } from "react";
import { GoDotFill } from "react-icons/go";
import { AppointmentEditModal } from "../Appointment/Appointment_Edit/Appointment_Edit_Modal";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

import { renderFormattedDate } from "@/helper/common_functions";


const render_detail_keys: RenderDetailFields[] = [
  { label: 'Appoinments_k13', key: 'first_name', can_sort: true },
  { label: 'Appoinments_k12', key: 'last_name', can_sort: true },
  { label: 'Appoinments_k11', key: 'email_address', can_sort: true },
  { label: 'Appoinments_k9', key: 'dob', can_sort: true },
  { label: 'Appoinments_k8', key: 'sex', can_sort: true },
  { label: 'Appoinments_k28', key: 'service', can_sort: true },
  { label: 'Appoinments_k16', key: 'location', can_sort: true },
  { label: 'Appoinments_k10', key: 'phone' },
  { label: 'Appoinments_k32', key: 'address', can_sort: true },
  { label: 'Appoinments_k29', key: 'date_and_time', type: 'date_slot', can_sort: true },
  { label: 'Appoinments_k31', key: 'date_and_time', type: 'time_slot', can_sort: true },
  { label: 'Appoinments_k30', key: 'created_at', date_format: true },
];




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
  }) => {

    const {t} = useTranslation(translationConstant.APPOINMENTS)

    return(
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
            {t(elem.label)}:{' '}
            <span className="font-normal">
              {elem.date_format
                ? moment(appointment_details['created_at']).format('LLL')
                : elem.type === 'date_slot' && appointment_details?.date_and_time
                ? renderFormattedDate(appointment_details?.date_and_time?.split('|')?.[1]?.split(' - ')[0])
                : elem.type === 'time_slot' && appointment_details?.date_and_time
                ? appointment_details?.date_and_time?.split('|')?.[1]?.split(' - ')[1]
                : elem.key === 'location'
                ? (appointment_details?.location?.address ?? '-')
                : elem.key === 'phone'
                ? (formatPhoneNumber(appointment_details?.phone) ?? '-')
                : elem.key === 'dob' ?  renderFormattedDate(appointment_details[elem.key as keyof typeof appointment_details], 'YYYY-MM-DD' ) : typeof appointment_details[elem.key as keyof typeof appointment_details] === 'object'
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
          {t("Appoinments_k33")}
        </button>
        <AppointmentEditModal
          defaultDateTime={appointment_details.date_and_time}
          appointmentDetails={appointment_details}
          locationData={find_locations(appointment_details.location_id)}
          updateAvailableData={ update_reflect_on_close_modal}
        />
      </div>
    </div>
    )
  });

  AppointmentDetails.displayName = 'AppointmentDetails';
  
  export default AppointmentDetails;