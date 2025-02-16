'use client'
import React, { FC, useContext, useEffect, useState } from 'react'
import { Spinner } from 'flowbite-react';
import moment from 'moment';
import { fetch_content_service } from '@/utils/supabase/data_services/data_services';
import { PiCaretUpDownBold } from 'react-icons/pi';
import { formatPhoneNumber } from '@/utils/getCountryName';
import { LocationContext } from '@/context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import EditPatientModel from './edit-patient.modal';


const queries: QueriesInterface = {
  all: null,
  onsite: {
    key: 'onsite',
    value: true
  },
  offsite: {
    key: 'onsite',
    value: false
  },
}

const Patient_Table_Component: FC<Props> = ({ renderType = 'all' }) => {
  const { selectedLocation } = useContext(LocationContext);
  const [dataList, setDataList] = useState<DataListInterface[]>([])
  const [allData, setAllData] = useState<DataListInterface[]>([])
  const [patientDetails, setPatientDetails] = useState<DataListInterface | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState(-1)
  const [sortColumn, setSortColumn] = useState('')

  const onChangeHandle = (e: any) => {
    const val = e.target.value
    if (val === '') {
      setDataList([...allData])
    }
    else {
      const filteredData = allData.filter((elem) => {
        const concatName = `${elem.firstname} ${elem.lastname}`
        return concatName.toLocaleLowerCase().includes(val.toLocaleLowerCase())
      })
      setDataList([...filteredData])
    }
  }

  const detailsViewHandle = (param_data: DataListInterface) => {
    setPatientDetails(param_data)
  }

  const fetch_handle = async (locationid: number) => {
    setLoading(true)
    // @ts-ignore
    const fetched_data: any = await fetch_content_service({ table: 'allpatients', language: '', matchCase: [queries[renderType], { key: 'locationid', value: locationid }] });
    setDataList(fetched_data)
    setAllData(fetched_data)
    setLoading(false)
  }

  useEffect(() => {
    fetch_handle(selectedLocation?.id || 0)
  }, [, selectedLocation])

  const sortHandle = (column: 'name' | 'id' | 'date') => {
    console.log(column)
    let sortedList: any = []
    if (column === 'name') {
      sortedList = dataList.sort((a, b) => {
        const aConcatName = `${a.firstname} ${a.lastname}`
        const bConcatName = `${b.firstname} ${b.lastname}`

        if (sortOrder === 1) {
          return aConcatName.localeCompare(bConcatName)
        }
        else {
          return bConcatName.localeCompare(aConcatName)
        }
      })
    }
    else if (column === 'id') {
      if (sortOrder === 1) {
        sortedList = dataList.sort((a, b) => a.id - b.id)
      } else {
        sortedList = dataList.sort((a, b) => b.id - a.id)
      }
    }
    else {
      if (sortOrder === 1) {
        sortedList = dataList.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      } else {
        sortedList = dataList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }
    }
    setSortOrder((order) => order === -1 ? 1 : -1)
    setDataList([...sortedList])
    setSortColumn(column)
  }

  return (
    <main className="w-full  h-full font-[500] text-[20px]">
      <div className='flex justify-between items-center px-4 py-4 space-x-2'>
        <h1 className='text-xl font-bold'>
          All pateints
        </h1>
      </div>
      <div className='w-full min-h-[81.5dvh] h-[100%] py-2 px-2 grid grid-cols-3 gap-2'>
        <div className='bg-[#B8C8E1] h-[100%]  col-span-2 rounded-md py-2   ' >
          <div className='space-y-6 px-3 pb-4 flex justify-between'>
            <div>
              <h1 className='text-xl font-bold'>
                search
              </h1>
              <input onChange={onChangeHandle} type="text" placeholder="" className=' px-1 py-2 w-72 text-sm rounded-md focus:outline-none bg-white' />
            </div>
          </div>
          <div className='h-[1px] w-full bg-black' />
          <div className='px-3 pt-5'>
            {/* Table goes here */}
            <div className='flex items-center flex-1 font-semibold'>
              <h1 className='flex-1 text-start'>
                Patient ID <button onClick={() => sortHandle('id')} className='active:opacity-50'><PiCaretUpDownBold className={`inline ${sortColumn === 'id' ? 'text-green-600' : 'text-gray-400/50'} hover:text-gray-600 active:text-gray-500 `} /></button>
              </h1>
              <h1 className='flex-1 text-center'>
                Patient Name <button onClick={() => sortHandle('name')} className='active:opacity-50'><PiCaretUpDownBold className={`inline ${sortColumn === 'name' ? 'text-green-600' : 'text-gray-400/50'} hover:text-gray-600 active:text-gray-500 `} /></button>
              </h1>
              <h1 className='flex-1 text-end'>
                Created at <button onClick={() => sortHandle('date')} className='active:opacity-50'><PiCaretUpDownBold className={`inline ${sortColumn === 'date' ? 'text-green-600' : 'text-gray-400/50'} hover:text-gray-600 active:text-gray-500 `} /></button>
              </h1>
            </div>
            <div className='mt-5 h-[60dvh] overflow-y-scroll space-y-5'>
              {loading ? <div className="flex h-full flex-1 flex-col justify-center items-center">
                <Spinner size='xl' />
              </div> :
                dataList.length > 0 ? dataList.map((elem) => {
                  const { id, firstname, lastname, created_at } = elem
                  return <div key={id} onClick={() => detailsViewHandle(elem)} className='cursor-pointer hover:bg-text_primary_color hover:text-white flex items-center flex-1 font-semibold bg-white px-3 py-4 rounded-md '>
                    <h1 className='flex-1 text-start'>
                      {id}
                    </h1>
                    <h1 className='flex-1 text-center'>
                      {firstname} {lastname}
                    </h1>
                    <h1 className='flex-1 text-end'>
                      {moment(created_at, 'YYYY-MM-DD h:mm s').format('MMM DD, YYYY')}
                    </h1>
                  </div>
                }) : <div className="flex h-full flex-1 flex-col justify-center items-center">
                  <h1>
                    No patient found!
                  </h1>
                </div>}
            </div>
          </div>
        </div>
        <div className='bg-[#B8C8E1] h-[100%] rounded-md overflow-hidden flex flex-col'>
  <div className='px-4 py-4 bg-[#11252C80] border-b-[1px] border-b-[#817B7B] flex items-center justify-between'>
    <h1 className='text-xl font-normal text-white text-center flex-1'>
      Patient Detail
    </h1>
    <EditPatientModel />
  </div>
  {patientDetails && (
    <div className='overflow-auto h-[100%] px-4 py-4'>
      <div className='flex items-start justify-between font-semibold mb-4'>
        <dl>
          <dd className='font-bold text-2xl'>{patientDetails?.id}</dd>
          <dt className='text-lg text-[#707070]'>Patient ID</dt>
        </dl>
        {renderType === 'all' && (
          <div>
            <p className='px-2 py-[2px] text-[16px] rounded-md bg-text_primary_color text-white'>
              {patientDetails?.onsite ? 'On-site' : 'Off-site'} Patient
            </p>
          </div>
        )}
      </div>
      <dl>
        <dd className='font-bold text-2xl'>
          {patientDetails?.firstname} {patientDetails?.lastname}
        </dd>
        <dt className='text-lg text-[#707070]'>Patient Name</dt>
      </dl>
      <div className='h-[1px] w-full bg-black my-3' />

      <div className='space-y-7'>
        <dl>
          <dd className='font-semibold text-lg'>
            {formatPhoneNumber(patientDetails?.phone)}
          </dd>
          <dt className='text-sm text-[#707070]'>Patient Phone</dt>
        </dl>
        <dl>
          <dd className='font-semibold text-lg'>{patientDetails?.email}</dd>
          <dt className='text-sm text-[#707070]'>Patient Email</dt>
        </dl>
        <dl>
          <dd className='font-semibold text-lg'>{patientDetails?.treatmenttype}</dd>
          <dt className='text-sm text-[#707070]'>Treatment Type</dt>
        </dl>
        <dl>
          <dd className='font-semibold text-lg'>{patientDetails?.gender}</dd>
          <dt className='text-sm text-[#707070]'>Gender</dt>
        </dl>

        <div className='flex items-center flex-1'>
          <dl className='flex-1'>
            <dd className='font-semibold text-lg'>
              {moment(patientDetails?.created_at, 'YYYY-MM-DD h:mm s').format('MMM DD, YYYY')}
            </dd>
            <dt className='text-sm text-[#707070]'>Created at</dt>
          </dl>
          <dl className='flex-1'>
            <dd className='font-semibold text-lg'>
              {moment(patientDetails?.lastvisit, 'YYYY-MM-DD h:mm s').format('MMM DD, YYYY')}
            </dd>
            <dt className='text-sm text-[#707070]'>Last Visit</dt>
          </dl>
        </div>
      </div>
    </div>
  )}
</div>

      </div>
    </main>
  )
}

export default Patient_Table_Component