'use client'
import React, { FC, useEffect, useState } from 'react'
import { Spinner } from 'flowbite-react';
import moment from 'moment';
import { fetch_content_service } from '@/utils/supabase/data_services/data_services';
import { PiCaretUpDownBold } from 'react-icons/pi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface DataListInterface {
    feedback_id: number;
    order_id: number;
    pos: {

        firstname: string;
        lastname: string;
    }
    feedback_text: string;
    rating: number;
    created_at: string;
}

const detailsArray = (dataDetails: DataListInterface) => [
    {
        label: 'Order ID',
        value: dataDetails?.order_id
    },
    {
        label: 'Patient Name',
        value: `${dataDetails?.pos.firstname} ${dataDetails?.pos.lastname}`
    },
    {
        label: 'Feedback Date',
        value: moment(dataDetails?.created_at, 'YYYY-MM-DD h:mm s').format('MMM DD, YYYY')
    },
    {
        label: 'Rating',
        value: `${dataDetails?.rating}/5`
    },
    {
        label: 'Feedback',
        value: dataDetails?.feedback_text
    }
];


interface Props {
}




const PrivateFeedbackComponent: FC<Props> = () => {




    const [dataList, setDataList] = useState<DataListInterface[]>([])
    const [allData, setAllData] = useState<DataListInterface[]>([])
    const [dataDetails, setDataDetails] = useState<DataListInterface | null>(null)
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
                const concatName = `${elem.pos.firstname} ${elem.pos.lastname}`
                return concatName.toLocaleLowerCase().includes(val.toLocaleLowerCase())
            })
            setDataList([...filteredData])
        }
    }

    const detailsViewHandle = (param_data: DataListInterface) => {

        setDataDetails(param_data)
    }



    const fetch_handle = async () => {
        setLoading(true)
        // @ts-ignore
        const fetched_data: any = await fetch_content_service({ table: 'feedback', selectParam: ', pos(firstname,lastname)' });
        setDataList(fetched_data)
        setAllData(fetched_data)
        setLoading(false)


    }

    useEffect(() => {
        fetch_handle()
    }, [])






    const sortHandle = (column: 'name' | 'order_id' | 'date' | 'rating') => {
        console.log(column)
        let sortedList: any = []
        if (column === 'name') {
            sortedList = dataList.sort((a, b) => {
                const aConcatName = `${a.pos.firstname} ${a.pos.lastname}`
                const bConcatName = `${b.pos.firstname} ${b.pos.lastname}`

                if (sortOrder === 1) {
                    return aConcatName.localeCompare(bConcatName)

                }
                else {
                    return bConcatName.localeCompare(aConcatName)

                }

            })

        }
        else if (column === 'date') {
            if (sortOrder === 1) {
                sortedList = dataList.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            } else {

                sortedList = dataList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

            }
        }
        else if (['order_id', 'date', 'rating'].includes(column)) {
            if (sortOrder === 1) {
                sortedList = dataList.sort((a, b) => a[column] - b[column])
            } else {

                sortedList = dataList.sort((a, b) => b[column] - a[column])
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
                    Private Feedback
                </h1>

            </div>


            <div className='w-full min-h-[80.5dvh] h-[100%] py-2 px-2 grid grid-cols-3 gap-2'>
                <div className='bg-[#EFEFEF] h-[100%]  col-span-2 rounded-md py-2   ' >

                    <div className='space-y-6 px-3 pb-4 flex justify-between'>
                        <div>
                            <input onChange={onChangeHandle} type="text" placeholder="Patient Name  " className=' px-2 py-3 w-72 text-sm rounded-md focus:outline-none mt-2' />
                        </div>






                    </div>
                    {/* <div className='h-[1px] w-full bg-gray-200' /> */}

                    <div className="px-3 pt-5">
  <Table>
    <TableHeader>
      <TableRow className="font-semibold">
        <TableHead className="text-start text-lg">
          Patient Name
          <button onClick={() => sortHandle("name")} className="active:opacity-50 ml-1">
            <PiCaretUpDownBold
              className={`inline ${
                sortColumn === "name" ? "text-green-600" : "text-gray-400/50"
              } hover:text-gray-600 active:text-gray-500`}
            />
          </button>
        </TableHead>
        <TableHead className="text-center text-lg">
          Order ID
          <button onClick={() => sortHandle("order_id")} className="active:opacity-50 ml-1">
            <PiCaretUpDownBold
              className={`inline ${
                sortColumn === "order_id" ? "text-green-600" : "text-gray-400/50"
              } hover:text-gray-600 active:text-gray-500`}
            />
          </button>
        </TableHead>
        <TableHead className="text-center text-lg">
          Feedback date
          <button onClick={() => sortHandle("date")} className="active:opacity-50 ml-1">
            <PiCaretUpDownBold
              className={`inline ${
                sortColumn === "date" ? "text-green-600" : "text-gray-400/50"
              } hover:text-gray-600 active:text-gray-500`}
            />
          </button>
        </TableHead>
        <TableHead className="text-end text-lg">
          Rating
          <button onClick={() => sortHandle("rating")} className="active:opacity-50 ml-1">
            <PiCaretUpDownBold
              className={`inline ${
                sortColumn === "rating" ? "text-green-600" : "text-gray-400/50"
              } hover:text-gray-600 active:text-gray-500`}
            />
          </button>
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {loading ? (
        <TableRow>
          <TableCell colSpan={4}>
            <div className="flex h-full flex-1 flex-col justify-center items-center">
              <Spinner size="xl" />
            </div>
          </TableCell>
        </TableRow>
      ) : dataList.length > 0 ? (
        dataList.map((elem) => {
          const {
            order_id,
            pos: { firstname, lastname },
            rating,
            created_at,
            feedback_id,
          } = elem;
          return (
            <TableRow
              key={feedback_id}
              onClick={() => detailsViewHandle(elem)}
              className="cursor-pointer rounded-md px-3 py-2 text-base hover:bg-gray-50 hover:text-inherit"
            >
              <TableCell className="text-start">{firstname} {lastname}</TableCell>
              <TableCell className="text-center">{order_id}</TableCell>
              <TableCell className="text-center">
                {moment(created_at, "YYYY-MM-DD h:mm s").format("MMM DD, YYYY")}
              </TableCell>
              <TableCell className="text-end pr-4">{rating}/5</TableCell>
            </TableRow>
          );
        })
      ) : (
        <TableRow>
          <TableCell colSpan={4}>
            <div className="flex h-full flex-1 flex-col py-2 text-base justify-center items-center">
              <h1>No patient found!</h1>
            </div>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
</div>









                </div>

                <div className='bg-[#EFEFEF] h-[100%] rounded-md overflow-hidden flex flex-col' >

                    <div className='px-4 py-4  border-b-[1px]'>
                        <h1 className='text-2xl  font-bold w-full'>
                            Details
                        </h1>
                    </div>

                    {/* Right side content goes here */}


                    {dataDetails && <div className='overflow-auto h-[100%] px-4 py-4 space-y-5'>

                        {detailsArray(dataDetails).map((detail, index) => (
                            <dl key={index}>
                                <dd className='text-[17px]'>{detail.value}</dd>
                                <dt className='text-sm text-[#707070]'>{detail.label}</dt>
                            </dl>
                        ))}












                    </div>}





                </div>

            </div>


        </main>
    )
}

export default PrivateFeedbackComponent