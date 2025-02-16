'use client'

import { useContext, useEffect, useState } from "react";
import { GoDotFill } from "react-icons/go";
import { delete_appointment_service, fetchAppointmentsByLocation, fetchLocations } from '@/utils/supabase/data_services/data_services'
import { Select, Spinner } from "flowbite-react";
import { useLocationClinica } from '@/hooks/useLocationClinica'
import Moment from 'moment';
import { toast } from "react-toastify";
import moment from "moment";
import { DatePicker } from "antd";
import { Appointment_Edit_Modal } from "@/components/Appointment/Appointment_Edit/Appointment_Edit_Modal";
import { Add_Appointment_Modal } from "@/components/Appointment/Add_Appointment_Modal";
import { formatPhoneNumber } from "@/utils/getCountryName";
import { LocationContext } from "@/context";

export interface Location {
  id: number;
  title: string;
  address: string;
}

interface RenderDetailKey {
  label: string
  key: keyof Appointment | 'location'
}

export interface Appointment {
  id: number;
  email_address: string;
  date_and_time: string;
  address: string;
  location_id: number;
  first_name: string;
  dob: string;
  last_name: string;
  service: string;
  sex: string;
  phone: string;
  created_at: string;
  location?: Location;
  in_office_patient: boolean;
  new_patient: boolean;
}

export interface LocationInterface {
  id: number;
  created_at: string;
  phone: string;
  direction: string;
  email: string;
  address: string;
  mon_timing: string;
  tuesday_timing: string;
  wednesday_timing: string;
  thursday_timing: string;
  friday_timing: string;
  saturday_timing: string;
  sunday_timing: string;
  title: string;
  Group: string;
}

interface RenderDetailFields {
  label: string
  key: string,
  type?: string,
  date_format?: boolean,
  can_sort?: boolean
}

const render_detail_keys: RenderDetailFields[] = [
  {
    label: 'First Name',
    key: 'first_name',
    can_sort: true

  },
  {
    label: 'Last Name',
    key: 'last_name',
    can_sort: true

  },
  {
    label: 'Email Address',
    key: 'email_address',
    can_sort: true

  },
  {
    label: 'D.O.B',
    key: 'dob',
    can_sort: true

  },
  {
    label: 'Sex',
    key: 'sex',
    can_sort: true

  },
  {
    label: 'Service',
    key: 'service',
    can_sort: true

  },
  {
    label: 'Location',
    key: 'location',
    can_sort: true

  },
  {
    label: 'Phone',
    key: 'phone',

  },
  {
    label: 'Address',
    key: 'address',
    can_sort: true

  },
  {
    label: 'Date slot',
    key: 'date_and_time',
    type: 'date_slot',
    can_sort: true


  },
  {
    label: 'Time slot',
    key: 'date_and_time',
    type: 'time_slot',
    can_sort: true


  },
  {
    label: 'Created at',
    key: 'created_at',
    date_format: true
  },
]


const List_Item = ({ data, click_handle, is_selected }: { data: any, click_handle: Function, is_selected: Boolean | null }) => {
  const { id, first_name, last_name, service, sex } = data

  const formattedDateTime = () => {

    const str = (data.date_and_time).split('|')[1].split(' - ')

    const date = str[0]
    const time = str[1]

    return `${date} ${time}`
  }


  return <div onClick={() => click_handle(data)} className={`${is_selected ? 'bg-text_primary_color' : 'bg-[#D9D9D9]'}   px-3 py-3 rounded-lg flex justify-between cursor-pointer pointer-events-auto`}>
    <div>
      <h1 className={`${is_selected ? 'text-white' : 'text-text_primary_color'}  font-bold text-xl`}>
        {`${data.first_name || '-'} ${data.last_name || '-'}`}
      </h1>
      <p className="text-primary_color text-lg">{service || '-'}</p>
    </div>
    <div className="text-end">
      <h3 className={`${is_selected ? 'text-white' : 'text-text_primary_color'} font-normal text-lg`}>
        {sex || '-'}
      </h3>
      <h3 className={`${is_selected ? 'text-white' : 'text-text_primary_color'} font-normal text-sm`}>
        {data.date_and_time ? `Appointment: ${moment(formattedDateTime(), 'DD-MM-YYYY h:mm A').format('DD/MM/YYYY - hh:mm A')}` : '---'}
      </h3>
    </div>
  </div>
}



const Appoinments = () => {

  const { locations } = useLocationClinica()
  const [allAppointments, setAllAppointments] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [appoint_loading, setAppoint_loading] = useState<boolean>(true)
  const [appointment_details, setAppointment_details] = useState<Appointment | null>(null)
  const [sortOrder, setSortOrder] = useState(-1)


  const { selectedLocation } = useContext(LocationContext);



  const fetchDataHandler = async (locationId: number) => {
    setAppoint_loading(true)
    setAppointment_details(null)
    const appoint_data: any = await fetchAppointmentsByLocation(locationId)
    setAllAppointments(appoint_data)
    setAppointments(appoint_data)
    setAppoint_loading(false)
    // console.log(data)
  }


  useEffect(() => {
    if (selectedLocation) {
      fetchDataHandler(selectedLocation.id)
    }

  }, [selectedLocation])

  const find_locations = (location_id: number) => {
    const find_location = locations.find((location: LocationInterface) => location.id === location_id)
    return find_location
  }

  const select_for_details_handle = (appoint: any) => {
    setAppointment_details(appoint)
  }




  const delete_appointments_handle = async (delId: number) => {
    const { error } = await delete_appointment_service(delId)
    if (!error) {
      setAppointments(appointments.filter((appoint: any) => appoint.id !== delId))
      setAllAppointments(appointments.filter((appoint: any) => appoint.id !== delId))
      toast.success('Deleled successfully');
      setAppointment_details(null)
    }
    else if (error) {
      console.log(error.message)
      toast.error(error.message);
    }
  }

  const filterHandle = (e: Date | null) => {

    if (e) {
      const dateToStr = e.toString()
      const dateToMoment = moment(dateToStr).format('YYYY-MM-DD')


      const filteredAppointments = allAppointments.filter((appoint: any) => {

        if (appoint.date_and_time) {
          const str = appoint.date_and_time.split('|')[1].split(' - ')[0]
          const formattedDate = moment(str, 'DD-MM-YYYY').format('YYYY-MM-DD')
          return formattedDate === dateToMoment

        }




      })
      setAppointments(filteredAppointments)
    }
    else {
      setAppointments(allAppointments)
    }

    setAppointment_details(null)


  }



  const newAddedRow = (row: any) => {
    setAppoint_loading(true)

      ; (async function getLocations() {
        const appoint_data: any = await fetchAppointmentsByLocation(selectedLocation.id)
        setAllAppointments(appoint_data)
        setAppointments(appoint_data)
        setAppoint_loading(false)
        // console.log(data)
      })()
  }




  const update_reflect_on_close_modal = (new_date_time: string) => {

    setAllAppointments((all_available) => {
      return all_available.map((elem) => {
        if (elem.id === appointment_details?.id) {
          return { ...elem, date_and_time: new_date_time }
        }
        return elem
      })
    })
    setAppointments((all_available) => {
      return all_available.map((elem) => {
        if (elem.id === appointment_details?.id) {
          return { ...elem, date_and_time: new_date_time }
        }
        return elem
      })
    })

    setAppointment_details((pre_details) => {

      if (pre_details) {
        return { ...pre_details, date_and_time: new_date_time }
      }
      else return pre_details
    })

  }

  const format_date_time = (date_string: string, time_string: string): string => {
    const dateTimeString = `${date_string} ${time_string}`;
    return moment(dateTimeString, 'DD-MM-YYYY hh:mm A').format('YYYY-MM-DD HH:mm:ss');
  };

  const sortHandle = (column: string) => {
    console.log(column);
    let sortedList: any[] = [];

    if (column === 'gender') {
      sortedList = sortOrder === 1
        ? appointments.sort((a, b) => a.sex.localeCompare(b.sex))
        : appointments.sort((a, b) => b.sex.localeCompare(a.sex));
    } else {
      sortedList = appointments.sort((a, b) => {
        let a_formatted_date = '';
        let b_formatted_date = '';

        if (a.date_and_time) {
          // Extract the date and time part from "12|12-08-2024 - 12:00 PM"
          const [datePart, timePart] = a.date_and_time.split('|')[1].trim().split(' - ');
          a_formatted_date = format_date_time(datePart, timePart);
        }

        if (b.date_and_time) {
          const [datePart, timePart] = b.date_and_time.split('|')[1].trim().split(' - ');
          b_formatted_date = format_date_time(datePart, timePart);
        }

        if (sortOrder === -1) {
          return new Date(a_formatted_date).getTime() - new Date(b_formatted_date).getTime();
        }
        else {
          return new Date(b_formatted_date).getTime() - new Date(a_formatted_date).getTime();
        }
      });
    }

    setSortOrder((order) => (order === -1 ? 1 : -1));
    setAppointments([...sortedList]);
  };

  return (
    <main className=" mt-20 w-full h-full text-[#B6B6B6] font-[500] text-[20px] space-y-5">




      <div className="flex justify-end items-end ps-3 gap-3 ">

        <div className="flex justify-between pe-2 items-center flex-1">

          <div className="flex  items-center space-x-5">
            <Add_Appointment_Modal newAddedRow={newAddedRow} />

            <div >
              <h1 className="text-sm">Sort by</h1>
              <div className="flex text-sm items-center space-x-3">
                <button onClick={() => sortHandle('gender')} className="bg-text_primary_color px-2 py-1 rounded-md text-white active:opacity-60">
                  Gender
                </button>
                <button onClick={() => sortHandle('slot')} className="bg-text_primary_color px-2 py-1 rounded-md text-white active:opacity-60">
                  Appointment slot
                </button>
              </div>
            </div>
          </div>
          <div className="w-1/4 ">
            <div >
              <DatePicker onChange={filterHandle} className="bg-[#D9D9D9] py-2 w-full" placeholder="Filter by date appointment" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row  h-[80vh] space-x-5 ">
        <div className="w-3/4 bg-[#EFEFEF] h-full overflow-scroll px-3 py-3 rounded-lg space-y-5">
          {appoint_loading ? <div className="flex h-full flex-1 flex-col justify-center items-center">
            <Spinner size='xl' />
          </div> : appointments.length === 0 ? <div className="flex h-full flex-1 flex-col justify-center items-center">
            <h1>No Appointment is available</h1>
          </div> : appointments.map((appointment: Appointment, index: any) => <List_Item is_selected={appointment_details && appointment_details.id === appointment.id} click_handle={select_for_details_handle} key={index} data={appointment} />)}
        </div>
        <div className="w-1/4 bg-[#EFEFEF] overflow-scroll px-3 py-3 rounded-lg text-lg ">
          {appointment_details ?
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-end space-x-5 text-black">
                <div className="flex items-center space-x-1 text-base">
                  <GoDotFill />
                  <p>
                    {appointment_details.new_patient ? 'New Patient' : '-'}
                  </p>
                </div>
                <div className="flex items-center space-x-1 text-sm">
                  <GoDotFill />
                  <p>
                    {appointment_details.in_office_patient ? 'In-Office' : '-'}
                  </p>
                </div>
              </div>
              <div className=" font-semibold space-y-4 flex-1 text-black">
                {render_detail_keys.map((elem, index: any) => {
                  const key: string = elem.key
                  return <h1 key={index}>{elem.label}: <span className="font-normal">{elem.date_format ? Moment(appointment_details['created_at']).format('LLL') : elem.type === 'date_slot' && appointment_details?.date_and_time ? appointment_details?.date_and_time?.split('|')?.[1]?.split(' - ')[0] : elem.type === 'time_slot' && appointment_details?.date_and_time ? appointment_details?.date_and_time?.split('|')?.[1]?.split(' - ')[1] : elem.key === 'location' ? appointment_details?.location?.address : key === 'phone' ? formatPhoneNumber(appointment_details?.phone) : appointment_details ? appointment_details[key as keyof typeof Appoinments] : '-'}</span></h1>
                })}
              </div>
              <div className="w-full flex mt-3 gap-3">
                <button onClick={() => delete_appointments_handle(appointment_details.id)} className="border-red-700 flex-1 text-red-700 border-2 active:opacity-60 rounded-md px-4 py-1 hover:bg-text_primary_color_hover">Delete</button>
                <Appointment_Edit_Modal default_data_time={appointment_details.date_and_time} update_available_data={update_reflect_on_close_modal} appointment_details={appointment_details} location_data={find_locations(appointment_details.location_id)!} />
              </div >
            </div>
            : <div className="flex h-full flex-1 flex-col justify-center items-center">
              <h1>Select appointment to view details</h1>
            </div>}
        </div>
      </div>
    </main>
  );
};

export default Appoinments;
