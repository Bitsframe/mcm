'use client'
import { Input_Component } from '@/components/Input_Component';
import { Select_Dropdown } from '@/components/Select_Dropdown';
import React, { useEffect, useState } from 'react'
import { Quantity_Field } from '@/components/Quantity_Field';
import { RxReload } from "react-icons/rx";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import { IoCloseOutline } from "react-icons/io5";
import { Select } from 'flowbite-react';
import { PiCaretCircleRightFill } from "react-icons/pi";
import { CiFilter } from "react-icons/ci";
import { Edit_Modal } from './EditModal';
import { Action_Button } from '@/components/Action_Button';
import { delete_content_service, fetch_content_service, update_content_service } from '@/utils/supabase/data_services/data_services';
import moment from 'moment';
import { Custom_Modal } from '@/components/Modal_Components/Custom_Modal';
import { useRouter } from 'next/navigation';
import { useLocationClinica } from '@/hooks/useLocationClinica';
import { supabase } from '@/services/supabase';
import { toast } from 'react-toastify';

interface PatientDetailsInterface {
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  treatmenttype: string;
  gender: string;
  locationid: string;
  created_at: string;
}

const fields = [
  {
    id: 'id',
    label: 'Id',
    type: 'number',
    autoGenerated: true,
    editable: false,
    table_column: false,
    details_section: false,
    details_order: 0

  },
  {
    id: 'firstname',
    label: 'First Name',
    type: 'text',
    editable: true,
    table_column: true,
    details_section: true,
    details_order: 1,
    col_span_01_modal: true
  },
  {
    id: 'lastname',
    label: 'Last Name',
    type: 'text',
    editable: true,
    table_column: true,
    details_section: true,
    details_order: 2,
    col_span_01_modal: true
  },
  {
    id: 'email',
    label: 'Email',
    type: 'text',
    editable: true,
    table_column: true,
    details_section: true,
    details_order: 3
  },
  {
    id: 'phone',
    label: 'Phone',
    type: 'text',
    editable: true,
    table_column: false,
    details_section: true,
    details_order: 4
  },
  {
    id: 'treatmenttype',
    label: 'Treatment Type',
    type: 'text',
    editable: true,
    table_column: true,
    details_section: true,
    details_order: 6,
    col_span_01_modal: true
  },
  {
    id: 'gender',
    label: 'Gender',
    type: 'text',
    editable: true,
    table_column: true,
    details_section: true,
    details_order: 5,
    col_span_01: true
  },
  {
    id: 'locationid',
    label: 'Location',
    type: 'number',
    editable: true,
    table_column: false,
    // details_section: true,
    // render_value: (val: string) => moment(val, 'YYYY-MM-DD h:mm:s').utc().format('MM/DD/YYYY'),
    details_order: 7,
    col_span_01: false
  },
]




const modal_titles: any = {
  create: {
    modalLabel: 'Create New',
    button: {
      label: 'Create',
      color: 'info'
    }
  },
  edit: {
    modalLabel: 'Edit',
    button: {
      label: 'Update',
      color: 'info'
    }
  },
  delete: {
    modalLabel: 'Delete Confirmation',
    button: {
      label: 'Delete',
      color: 'failure'
    }
  },
}

const Promo_Input = () => {
  return (
    <div className='w-52 flex rounded-md  items-center bg-white p-2 px-2'>
      <input type="text" placeholder="Enter Promo Code" className='w-full px-1 py-1 text-sm border-2 focus:outline-none focus:border-blue-500' />
      <IoCloseOutline />
    </div>)
}

const Payment_Method_Select = () => {

  return (
    <div className='w-52'>
      <Select className='w-full h-auto' style={{ backgroundColor: 'white' }} id="section" required={true}>
        <option>
          Cash
        </option>
        <option>
          Debit Card
        </option>
      </Select>
    </div>)
}


const Patients = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const { locations } = useLocationClinica()
  const [dataList, setDataList] = useState<PatientDetailsInterface[]>([])
  const [allData, setAllData] = useState<PatientDetailsInterface[]>([])
  const [detailsView, setDetailsView] = useState<PatientDetailsInterface | null>(null)
  const [actionData, setActionData] = useState<any>({})
  const [editDetails, setEditDetails] = useState<PatientDetailsInterface | {}>({})
  const [loading, setLoading] = useState(true)
  const [activeModalMode, setActiveModalMode] = useState<'edit' | 'delete' | 'create' | ''>('')
  const [modalLoading, setModalLoading] = useState(false)
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [services, setServices] = useState<string[] | null | undefined>([]);
  const [canModalSubmit, setCanModalSubmit] = useState(false)
  const [canAddPatient, setCanAddPatient] = useState(false)


  const category_change_handle = () => {

  }


  const router = useRouter()


  const fetch_handle = async () => {
    setLoading(true)
    // @ts-ignore
    const fetched_data: any = await fetch_content_service({ table: 'pos' });
    setDataList(fetched_data)
    setAllData(fetched_data)
    setLoading(false)


  }

  useEffect(() => {
    fetch_handle()
  }, [])

  useEffect(() => {
    const fetchServices = async () => {
      let { data, error } = await supabase.from('services').select("title");

      if (data) {
        const serviceData = data.map((item) => item.title);
        setServices(serviceData);
      }
    };

    fetchServices();
  }, []);




  const openModalHandle = () => {
    setIsOpenModal(true)
  }
  const closeModalHandle = () => {
    setIsOpenModal(false)
    setActionData({})
    setActiveModalMode('')
    setCanModalSubmit(false)
  }



  const addNewHandle = () => {
    openModalHandle()
    setActiveModalMode('create')

  }
  const editHandle = (data: any) => {
    openModalHandle()
    setActionData(data)
    setActiveModalMode('edit')

  }

  const deleteHandle = (data: any) => {
    openModalHandle()
    setActionData(data)
    setActiveModalMode('delete')
    setCanModalSubmit(true)

  }


  const selectHandle = (data: any) => {
    localStorage.setItem('@pos-patient', JSON.stringify(data))
    router.push('/pos/sales')

  }


  const modalInputChangeHandle = (e: any, id: string) => {
    setActionData((pre: any) => ({ ...pre, [id]: e }))
    setCanModalSubmit(true)


  }
  const addPatientFieldsChange = (e: any, id: string) => {
    setActionData((pre: any) => ({ ...pre, [id]: e }))


    // setCanAddPatient(true)


  }


  const onChangeHandle = (e: any) => {
    const val = e.target.value
    if (val === '') {
      setDataList([...allData])

    }
    else {

      const filteredData = allData.filter(({ firstname, lastname }) => {
        const concatName = `${firstname} ${lastname}`
        return concatName.toLocaleLowerCase().includes(val.toLocaleLowerCase())
      })
      setDataList([...filteredData])
    }
  }



  const deleteDataHandle = async () => {
    setModalLoading(true)
    const selectedId = actionData?.id
    const { data: res_data, error } = await delete_content_service({ table: 'pos', id: selectedId });
    if (!error) {
      setDataList((elem) => elem.filter((data: any) => data.id !== selectedId))
      setAllData((elem) => elem.filter((data: any) => data.id !== selectedId))
      setDetailsView(null)
      toast.success('Deleled successfully');
      closeModalHandle()

    }
    else if (error) {
      console.log(error.message)
      toast.error(error.message);
    }

    setModalLoading(false)
  }

  const editDataHandle = async () => {
    setModalLoading(true)
    try {
      const data = await update_content_service({ table: 'pos', language: '', post_data: actionData });
      if (data?.length) {
        toast.success('Updated successfully');
        closeModalHandle()

        const newData = data[0]
        // @ts-ignore
        const newDataSetDataList = allData.map((elem) => newData.id === elem.id ? newData : elem)
        // @ts-ignore
        const newDataSetAllData = dataList.map((elem) => newData.id === elem.id ? newData : elem)
        // @ts-ignore
        setAllData([...newDataSetAllData])
        // @ts-ignore
        setDataList([...newDataSetDataList])

        // @ts-ignore
        setDetailsView(newData)
      }


    } catch (error: any) {

      if (error && error?.message) {
        toast.error(error?.message);
        // throw new Error(error.message);
      } else {
        toast.error('Something went wrong!');
      }
    }
    setModalLoading(false)
  }



  const modalSubmitHandle = async () => {

    switch (activeModalMode) {
      case 'create':
        // createNewDataHandle()
        break;
      case 'edit':
        editDataHandle()
        break;
      case 'delete':
        deleteDataHandle()
        break

    }
    // if(activeModalMode === ){
    // }
    // else if(activeModalMode === 'edit'){

    // }
    // else if()

  }



  return (
    <main className="w-full  font-[500] text-[20px]">


      <div className='w-full h-[75.5dvh] py-2 px-2 grid grid-cols-3 gap-2'>
        <div className='bg-[#B8C8E1] h-[100%]  col-span-2 rounded-md py-2   ' >

          <div className='space-y-6 px-3 pb-4 flex justify-between'>
            <div>
              <h1 className='text-xl font-bold'>
                search
              </h1>
              <input onChange={onChangeHandle} type="text" placeholder="" className=' px-1 py-2 w-72 text-sm rounded-md focus:outline-none bg-white' />
            </div>



            {/* <div>
              <CiFilter size={30} />
            </div> */}



          </div>
          <div className='h-[1px] w-full bg-black' />

          <div className='h-[70dvh] !overflow-auto space-y-4 px-3 py-4'>


            {dataList.map((elem, ind) => {
              const { firstname, lastname, created_at, phone } = elem
              return <div key={ind} className='space-y-6 px-3'>


                <div className='bg-[#D9D9D9] rounded-md px-4 py-3'>
                  <div>
                    <p className='text-xl'>
                      {`${firstname} ${lastname}`}
                    </p>

                  </div>

                  <div className='flex items-start'>
                    <p className='text-lg flex-1 text-gray-600'>
                      {phone}
                    </p>
                    <div className='text-right space-y-2'>
                      <div className='space-x-3'>
                        <Action_Button onClick={() => editHandle(elem)} label='Edit' bg_color='bg-[#13787E]' />
                        <Action_Button onClick={() => deleteHandle(elem)} label='Delete' bg_color='bg-[#FF6363]' />
                        <Action_Button onClick={() => selectHandle(elem)} label='Select' bg_color='bg-[#00720B]' />

                      </div>
                      <p className='text-sm text-gray-600'>{moment(created_at, 'YYYY-MM-DD h:mm s').format('h:mm A')}</p>
                    </div>
                  </div>
                </div>


              </div>
            })}




          </div>

        </div>

        <div className='bg-[#B8C8E1] h-[100%] rounded-md overflow-hidden flex flex-col' >

          <div className='px-4 py-4 bg-[#11252C80]  border-b-[1px] border-b-[#817B7B] flex items-center'>
            <h1 className='text-xl font-normal text-white text-center w-full'>
              Add new Patient
            </h1>
          </div>


          <div className='overflow-auto h-[100%] px-4 py-4'>


            {/* <div className='space-x-3'>
              <button className='bg-[#202B40] py-2 px-3 text-white text-sm rounded-lg'>
                New Patient
              </button>
              <button className='bg-white py-2 px-3 text-[#202B40] text-sm rounded-lg'>
                Returning patient
              </button>
            </div> */}


            <div className='w-2/3 space-y-4'>
              <Input_Component onChange={(e: string) => addPatientFieldsChange(e, 'first_name')} label='First Name' />
              <Input_Component onChange={(e: string) => addPatientFieldsChange(e, 'last_name')} label='Last Name' />
              <Input_Component onChange={(e: string) => addPatientFieldsChange(e, 'email')} label='Email Address' />
              <Input_Component onChange={(e: string) => addPatientFieldsChange(e, 'phone')} label='Phone Number' />


              <Select_Dropdown bg_color='#fff' start_empty={true} options_arr={services?.map((service) => ({ value: service, label: service }))} required={true} on_change_handle={category_change_handle} label='Treatment Type' />
              <Select_Dropdown
                bg_color='#fff'
                value={0} label='Locations' start_empty={true} options_arr={locations.map(({ id, title }:any) => ({ value: id, label: title }))}
                // on_change_handle={select_location_handle}
                required={true} />

            </div>




          </div>


          <div>
            <button onClick={addNewHandle} className='bg-[#11252C] py-3 w-full text-center text-white'>
              Add Patient
            </button>
          </div>



        </div>

      </div>




      <Custom_Modal disabled={!canModalSubmit} submit_button_color={modal_titles[activeModalMode]?.button?.color} loading={modalLoading} buttonLabel={modal_titles[activeModalMode]?.button?.label} is_open={isOpenModal} Title={activeModalMode && modal_titles[activeModalMode]?.modalLabel} close_handle={closeModalHandle} open_handle={openModalHandle} create_new_handle={modalSubmitHandle} >

        {activeModalMode === 'delete' ? <div>
          <h1>
            Are you sure you want to delete this POS?
          </h1>


        </div> : <div className='grid grid-cols-2 gap-4'>
          {
            fields.filter(({ editable }:any) => editable).sort((a, b) => a.details_order - b.details_order).map(({ id, label, type, col_span_01, col_span_01_modal }:any) => {
              return <div key={id} className={col_span_01 || col_span_01_modal ? 'col-span-1' : 'col-span-2'}>
                {id === 'locationid' ? <Select_Dropdown
                  bg_color='#fff'
                  value={actionData ? actionData[id] : 0} label='Locations' start_empty={true} options_arr={locations.map(({ id, title }:any) => ({ value: id, label: title }))}
                  // @ts-ignore
                  on_change_handle={(e: string) => modalInputChangeHandle(e.target.value, id)}
                  required={true} /> : <Input_Component value={actionData ? actionData[id] : ''} type={type} border='border-2 border-gray-300 rounded-md' onChange={(e: string) => modalInputChangeHandle(e, id)} label={label} />
                }
              </div>
            })
          }
        </div>}
      </Custom_Modal>


      {/* <Edit_Modal is_open={modalOpen} close_handle={close_modal_handle} /> */}
    </main>
  )
}

export default Patients