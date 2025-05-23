'use client'

import React, { FC, useCallback, useMemo, useState } from 'react'
import { Custom_Modal } from '../../Modal_Components/Custom_Modal'
import ScheduleDateTime from './ScheduleDateTime'
import moment from 'moment'
import { update_appointment_service } from '@/utils/supabase/data_services/data_services'
import { toast } from "sonner"
import { sendEmail } from '@/utils/emailService'
import { EmailBodyTempEnum } from '@/utils/emailService/templateDetails'
import { useTranslation } from 'react-i18next'
import { translationConstant } from '@/utils/translationConstants'

interface AppointmentEditModalProps {
  locationData: LocationInterface;
  appointmentDetails: Appointment;
  updateAvailableData: (dataAndTime: string) => void;
  defaultDateTime: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AppointmentEditModal: FC<AppointmentEditModalProps> = ({
  locationData,
  appointmentDetails,
  updateAvailableData,
  defaultDateTime,
  isOpen,
  onClose,
}) => {
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [isDateSelected, setIsDateSelected] = useState(false);
  const [isTimeSelected, setIsTimeSelected] = useState(false);
  const [selectedVal, setSelectedVal] = useState('');

  const handleCreateContent = useCallback(async () => {
    if (!selectedVal) return;

    setLoadingUpdate(true);
    try {
      const { error } = await update_appointment_service(appointmentDetails.id, selectedVal);
      
      if (!error) {
        const [dateStr, timeStr] = selectedVal.split('|')[1].split(' - ');
        const [oldDateStr, oldTimeStr] = appointmentDetails.date_and_time
          ? appointmentDetails.date_and_time.split('|')[1].split(' - ')
          : ['-', '-'];

        const emailData = {
          email: appointmentDetails.email_address,
          name: `${appointmentDetails.first_name} ${appointmentDetails.last_name}`,
          location: {
            title: appointmentDetails.location?.title || '',
            address: appointmentDetails.location?.address || '',
            phone: appointmentDetails.location?.phone || ''
          },
          service: appointmentDetails.service,
          date: dateStr,
          time: timeStr,
          oldDate: oldDateStr,
          oldTime: oldTimeStr
        };

        await sendEmail({
          lang: 'en',
          emailType: EmailBodyTempEnum.UPDATE_TO_YOUR_APPOINTMENT_DETAILS,
          data: emailData
        });

        toast.success(<div className="flex justify-between">
                    <p>Appointment details updated successfully.</p>
                    <button
                      onClick={() => toast.dismiss()} 
                      className="absolute top-0 right-0 p-1 rounded hover:bg-gray-100"
                    >
                      <span className="text-sm">&#x2715;</span>
                    </button>
                  </div>);
        updateAvailableData(selectedVal);
        onClose();
      }
    } catch (error) {
      toast.error('Failed to update appointment');
    } finally {
      setLoadingUpdate(false);
    }
  }, [appointmentDetails, selectedVal, updateAvailableData, onClose]);

  const handleSelectDateTimeSlot = useCallback((date: Date | '', time?: string) => {
    if (date && time) {
      const formattedDate = moment(date).format('DD-MM-YYYY');
      const createSlotForDB = `${appointmentDetails.location_id}|${formattedDate} - ${time}`;
      setSelectedVal(createSlotForDB);
      setIsDateSelected(true);
      setIsTimeSelected(true);
    } else {
      setSelectedVal('');
      setIsDateSelected(!!date);
      setIsTimeSelected(!!time);
    }
  }, [appointmentDetails.location_id]);

  const { t } = useTranslation(translationConstant.APPOINMENTS)
  
  const isUpdateDisabled = !isDateSelected || !isTimeSelected;

  return (
    <Custom_Modal
      disabled={isUpdateDisabled}
      create_new_handle={handleCreateContent}
      is_open={isOpen}
      close_handle={onClose}
      Title="Update Appointment Time Slot"
      buttonLabel="Update"
      loading={loadingUpdate}
    >
      <div className="grid grid-cols-1 gap-4">
        <ScheduleDateTime
          default_data_time={defaultDateTime}
          selectDateTimeSlotHandle={handleSelectDateTimeSlot}
          data={locationData}
        />
      </div>
    </Custom_Modal>
  );
};