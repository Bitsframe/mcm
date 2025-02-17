'use client'
import React, { FC, useContext, useEffect, useState } from 'react'
import {Spinner } from 'flowbite-react';
import moment from 'moment';
import { fetch_content_service } from '@/utils/supabase/data_services/data_services';
import { PiCaretUpDownBold } from 'react-icons/pi';
import { formatPhoneNumber } from '@/utils/getCountryName';
import { LocationContext } from '@/context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface DataListInterface {
  id: number;
  onsite: boolean;
  firstname: string;
  locationid: number;
  lastname: string;
  phone: string;
  email: string;
  treatmenttype: string;
  gender: string;
  created_at: string;
  lastvisit: string;
}

interface Props {
  renderType: 'all' | 'onsite' | 'offsite'
}


interface QueriesInterface {
  all: null,
  onsite: {
    key: string,
    value: boolean
  },
  offsite: {
    key: string,
    value: boolean
  },

}

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
  }, [,selectedLocation])






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


  // const select_change_handle = (e: any) => {
  //   const selectedId = e.target.value

  //   setDataList(() => {
  //     if (!selectedId) {
  //       return allData
  //     }
  //     else {
  //       return allData.filter(({ locationid }) => locationid === +selectedId)
  //     }
  //   })

  // }


  return (
    <main className="w-full  h-full font-[500] text-[20px]">

      <div className='flex justify-between items-center px-4 py-4 space-x-2'>
        <h1 className='text-xl font-bold'>
          All pateints
        </h1>

      
      </div>


      <div className='w-full min-h-[81.5dvh] h-[100%] py-2 px-2 grid grid-cols-3 gap-2'>
      <div className="bg-[#EFEFEF] h-full col-span-2 rounded-md py-6 px-6">
  <div className="flex items-center justify-between mb-4">
    <input
      onChange={onChangeHandle}
      type="text"
      placeholder="Search by product id"
      className="w-72 px-4 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
    />
  </div>

  {/* <div className="border-b border-gray-200 mb-4" /> */}
  <Table className="w-full">
    <TableHeader>
      <TableRow className="border-b border-gray-200">
        <TableHead className="px-4 py-2 text-lg font-medium text-gray-500 text-left">
          Patient ID
          <button onClick={() => sortHandle("id")} className="ml-1 text-gray-400 hover:text-gray-600 active:opacity-70">
            <PiCaretUpDownBold
              className={`inline ${sortColumn === "id" ? "text-green-600" : ""}`}
            />
          </button>
        </TableHead>
        <TableHead className="px-4 py-2 text-lg font-medium text-gray-500 text-center">
          Patient Name
          <button onClick={() => sortHandle("name")} className="ml-1 text-gray-400 hover:text-gray-600 active:opacity-70">
            <PiCaretUpDownBold
              className={`inline ${sortColumn === "name" ? "text-green-600" : ""}`}
            />
          </button>
        </TableHead>
        <TableHead className="px-4 py-2 text-lg font-medium text-gray-500 text-right">
          Created at
          <button onClick={() => sortHandle("date")} className="ml-1 text-gray-400 hover:text-gray-600 active:opacity-70">
            <PiCaretUpDownBold
              className={`inline ${sortColumn === "date" ? "text-green-600" : ""}`}
            />
          </button>
        </TableHead>
      </TableRow>
    </TableHeader>
  </Table>

  <div className="h-[60vh] overflow-y-auto">
    <Table className="w-full">
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={3} className="p-4">
              <div className="flex justify-center items-center">
                <Spinner size="xl" />
              </div>
            </TableCell>
          </TableRow>
        ) : dataList.length > 0 ? (
          dataList.map((elem) => {
            const { id, firstname, lastname, created_at } = elem;
            return (
              <TableRow
                key={id}
                onClick={() => detailsViewHandle(elem)}
                className="cursor-pointer hover:bg-gray-50 border-b last:border-0 border-gray-200 bg-[#EFEFEF]"
              >
                <TableCell className="w-1/4 px-4 py-2 text-base text-black font-normal text-left">
                  {id}
                </TableCell>
                <TableCell className="w-1/2 px-4 py-2 text-base text-black font-normal text-center">
                  {firstname} {lastname}
                </TableCell>
                <TableCell className="w-1/4 px-4 py-2 text-base text-black font-normal text-right">
                  {moment(created_at, "YYYY-MM-DD h:mm s").format("MMM DD, YYYY")}
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={3} className="p-4">
              <div className="flex justify-center items-center">
                <h1 className="text-black">No patient found!</h1>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
</div>



        <div className='bg-[#B8C8E1] h-[100%] rounded-md overflow-hidden flex flex-col' >

          <div className='px-4 py-4 bg-[#11252C80]  border-b-[1px] border-b-[#817B7B] flex items-center'>
            <h1 className='text-xl font-normal text-white text-center w-full'>
              Patient Detail
            </h1>
          </div>

          {/* Right side content goes here */}


          {patientDetails && <div className='overflow-auto h-[100%] px-4 py-4'>

            <div className='flex items-start justify-between font-semibold mb-4'>
              <dl>
                <dd className='font-bold text-2xl'>
                  {patientDetails?.id}
                </dd>
                <dt className='text-lg text-[#707070]'>
                  Patient ID
                </dt>
              </dl>
              {renderType === 'all' && <div>
                <p className='px-2 py-[2px] text-[16px] rounded-md  bg-text_primary_color text-white'>{patientDetails?.onsite ? 'On-site' : 'Off-site'} Patient</p>
              </div>}
            </div>


            <dl>
              <dd className='font-bold text-2xl'>
                {patientDetails?.firstname} {patientDetails?.lastname}
              </dd>
              <dt className='text-lg text-[#707070]'>
                Patient Name
              </dt>
            </dl>



            <div className='h-[1px] w-full bg-black my-3' />




            <div className='space-y-7 '>
              <dl>
                <dd className='font-semibold text-lg'>
                  {formatPhoneNumber(patientDetails?.phone)}
                </dd>
                <dt className='text-sm text-[#707070]'>
                  Patient Phone
                </dt>
              </dl>
              <dl>
                <dd className='font-semibold text-lg'>
                  {patientDetails?.email}
                </dd>
                <dt className='text-sm text-[#707070]'>
                  Patient Email
                </dt>
              </dl>
              <dl>
                <dd className='font-semibold text-lg'>
                  {patientDetails?.treatmenttype}
                </dd>
                <dt className='text-sm text-[#707070]'>
                  Treatment Type
                </dt>
              </dl>
              <dl>
                <dd className='font-semibold text-lg'>
                  {patientDetails?.gender}
                </dd>
                <dt className='text-sm text-[#707070]'>
                  Gender
                </dt>
              </dl>


              <div className='flex items-center flex-1'>
                <dl className='flex-1'>
                  <dd className='font-semibold text-lg'>
                    {moment(patientDetails?.created_at, 'YYYY-MM-DD h:mm s').format('MMM DD, YYYY')}
                  </dd>
                  <dt className='text-sm text-[#707070]'>
                    Created at
                  </dt>
                </dl>
                <dl className='flex-1'>
                  <dd className='font-semibold text-lg'>
                    {moment(patientDetails?.lastvisit, 'YYYY-MM-DD h:mm s').format('MMM DD, YYYY')}
                  </dd>
                  <dt className='text-sm text-[#707070]'>
                    Last Visit
                  </dt>
                </dl>
              </div>
            </div>









          </div>}





        </div>

      </div>


    </main>
  )
}

export default Patient_Table_Component