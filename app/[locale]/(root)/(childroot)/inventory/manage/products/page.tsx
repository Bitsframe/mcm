'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Spinner } from 'flowbite-react';
import Image from 'next/image';
import PlusIcon from "@/assets/images/Logos/plus-icon.png"
import { Action_Button } from '@/components/Action_Button';
import { create_content_service, fetch_content_service, update_content_service } from '@/utils/supabase/data_services/data_services';
import { Custom_Modal } from '@/components/Modal_Components/Custom_Modal';
import { Input_Component } from '@/components/Input_Component';
import { toast } from 'react-toastify';
import { useCategoriesClinica } from '@/hooks/useCategoriesClinica'
import { PiCaretUpDownBold } from "react-icons/pi";
import { Searchable_Dropdown } from '@/components/Searchable_Dropdown';
import { useTranslation } from 'react-i18next';
import { translationConstant } from '@/utils/translationConstants';


interface DataListInterface {
  [key: string]: any; // This allows dynamic property access
}

const modalStateEnum = {
  CREATE: "Create",
  UPDATE: "Update",
  DELETE: "delete",
  EMPTY: ""
}

const tableHeader = [
  {
    id: 'product_id',
    label: 'Inventory_k15'
  },
  {
    id: 'category',
    label: 'Inventory_k1',
    can_sort: true
  },
  {
    id: 'product_name',
    label: 'Inventory_k8',
    can_sort: true
  },
  {
    id: 'actions',
    label: 'Inventory_k9',
    align: 'text-right',
    Render_Value: ({ clickHandle, getDataArchiveType }: { clickHandle: (state: string) => void, getDataArchiveType: boolean }) => {

      return <div className='flex items-end justify-end space-x-2'>
        <Action_Button onClick={() => clickHandle(modalStateEnum.UPDATE)} label='Update' bg_color='bg-[#6596FF]' /> <Action_Button label={getDataArchiveType ? 'Unarchive' : 'Archive'} bg_color={getDataArchiveType ? 'bg-green-400' : 'bg-[#FF6363]'} onClick={() => clickHandle(modalStateEnum.DELETE)} />
      </div>

    }

  },
]

const requiredInputFields = [
  {
    id: 'category_id',
    label: 'Category'
  },
  {
    id: 'product_name',
    label: 'Name'
  }
]




const Products = () => {
  const [dataList, setDataList] = useState<DataListInterface[]>([])
  const [allData, setAllData] = useState<DataListInterface[]>([])
  const [loading, setLoading] = useState(true)

  const [modalEventLoading, setModalEventLoading] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [modalData, setModalData] = useState<DataListInterface>({})
  const [modalState, setModalState] = useState('')
  const { categories } = useCategoriesClinica()
  const [sortOrder, setSortOrder] = useState(-1)
  const [sortColumn, setSortColumn] = useState('')
  const [getDataArchiveType, setGetDataArchiveType] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [activeDeleteId, setActiveDeleteId] = useState(0)








  const openModalHandle = (state: string) => {
    setOpenModal(true)
    setModalState(state)

  }
  const closeModalHandle = () => {
    setOpenModal(false)
    setModalState(modalStateEnum.EMPTY)
    setModalData({})
  }




  const fetch_handle = async (getDataArchiveType: boolean) => {
    try {
      setLoading(true)
      const fetched_data = await fetch_content_service({
        table: 'products', language: '', selectParam: ',categories(category_name)', matchCase: [

          {
            key: 'archived',
            value: getDataArchiveType
          },


        ],
        sortOptions: { column: 'product_id', order: 'desc' }
      });

      setDataList(fetched_data)
      setAllData(fetched_data)
      setLoading(false)
    } catch (error) {

    }
    finally {
      setLoading(false)
    }


  }

  const onChangeHandle = (e: any) => {
    const val = e.target.value
    if (val === '') {
      setDataList([...allData])

    }
    else {

      const filteredData = allData.filter((elem) => elem.product_name.toLocaleLowerCase().includes(val.toLocaleLowerCase()))
      setDataList([...filteredData])
    }
  }


  useEffect(() => {
    fetch_handle(getDataArchiveType);
  }, [getDataArchiveType]);



  const modalInputChangeHandle = (key: string, value: string | number) => {
    setModalData((pre) => {
      return { ...pre, [key]: value }
    })
  }


  const modalSubmitHandle = async () => {
    setModalEventLoading(true)
    console.log({modalData,modalState})
    if (modalState === modalStateEnum.CREATE) {

      const { data: res_data, error } = await create_content_service({ table: 'products', language: '', post_data: {...modalData} });

      if (error) {
        console.log(error.message);
        toast.error(error.message);
        // throw new Error(error.message);
      }
      if (res_data?.length) {
        toast.success('Created successfully');
        closeModalHandle()
        fetch_handle(getDataArchiveType);
      }
    }
    else {
      try {
        const postData = {
          product_id: +modalData.product_id,
          category_id: +modalData.category_id,
          product_name: modalData.product_name,
        }
        const res_data = await update_content_service({ table: 'products', language: '', post_data: postData, matchKey: 'product_id' });
        if (res_data?.length) {
          toast.success('Updated successfully');
          fetch_handle(getDataArchiveType);
          closeModalHandle()
        }



      } catch (error: any) {

        if (error && error?.message) {
          toast.error(error?.message);
          // throw new Error(error.message);
        } else {
          toast.error('Something went wrong!');
        }
      }


    }
    setModalEventLoading(false)
  }






  const buttonClickActionHandle = (action: string, elem: any) => {
    console.log({
      action,
      elem
    })
    if (action === modalStateEnum.DELETE) {
      setActiveDeleteId(elem.product_id)
    }
    else if (action === modalStateEnum.UPDATE) {
      setModalData(elem)
      openModalHandle(modalStateEnum.UPDATE)
    }

  }


  const sortHandle = (column: string) => {
    console.log(column)
    let sortedList: any = []
    if (column === 'category') {
      if (sortOrder === 1) {
        sortedList = dataList.sort((a, b) => a.categories.category_name.localeCompare(b.categories.category_name))
      } else {

        sortedList = dataList.sort((a, b) => b.categories.category_name.localeCompare(a.categories.category_name))
      }
    }
    else if (column === 'product_name') {
      if (sortOrder === 1) {
        sortedList = dataList.sort((a, b) => a.product_name.localeCompare(b.product_name))
      } else {

        sortedList = dataList.sort((a, b) => b.product_name.localeCompare(a.product_name))
      }

    }
    else {
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


  const handleActiveClick = useCallback(() => {
    setGetDataArchiveType(false);
  }, []);

  const handleArchiveClick = useCallback(() => {
    setGetDataArchiveType(true);
  }, []);




  const deleteHandle = async () => {
    setDeleteLoading(true)
    try {
      const res_data = await update_content_service({ table: 'products', matchKey: 'product_id', post_data: { product_id: activeDeleteId, archived: !getDataArchiveType } })
      if (res_data?.length) {
        setDataList((elem) => elem.filter((data: any) => data.product_id !== activeDeleteId))
        setAllData((elem) => elem.filter((data: any) => data.product_id !== activeDeleteId))
        setActiveDeleteId(0)
        toast.success(getDataArchiveType ? "Product no longer archived" : 'Archived successfully');
      }
    } catch (error: any) {
      console.log(error.message)
      toast.error(error.message);
      setDeleteLoading(false)
    } finally {
      setDeleteLoading(false)
    }
  }



  const RightSideComponent = useMemo(
    () => (
      <div className='text-sm text-gray-500 space-x-4 mr-6 flex items-center justify-end w-full'>
        <button
          onClick={handleActiveClick}
          className={`${!getDataArchiveType ? 'bg-primary_color text-white' : 'bg-gray-400 text-white'} px-3 py-2 rounded-md`}
        >
          Active
        </button>
        <button
          onClick={handleArchiveClick}
          className={`${getDataArchiveType ? 'bg-primary_color text-white' : 'bg-gray-400 text-white'} px-3 py-2 rounded-md`}
        >
          Archived
        </button>

      </div>
    ),
    [getDataArchiveType, handleActiveClick, handleArchiveClick]
  );
  const {t} = useTranslation(translationConstant.INVENTORY)
  return (
    <main className="w-full  h-full font-[500] text-[20px]">




      <div className='w-full min-h-[81.5dvh] h-[100%] overflow-auto py-2 px-2'>
        <div className=' h-[100%]  col-span-2 rounded-md py-2   ' >

          <div className='px-3 py-4 flex justify-between items-center '>
            <div className='flex items-center gap-x-3'>

              <input onChange={onChangeHandle} type="text" placeholder={t("Inventory_k20")} className=' px-1 py-3 w-72 text-sm rounded-md focus:outline-none bg-white' />
              <button onClick={() => openModalHandle(modalStateEnum.CREATE)}>
                <Image
                  className="w-9"
                  src={PlusIcon}
                  alt="Logo"
                />
              </button>


            </div>




            {RightSideComponent}









          </div>

          <div className='px-3 pt-5'>
            {/* Table goes here */}

            <div className='pb-3 flex text-base text-[#71717A] items-center flex-1 font-normal border-b-2 border-b-[#E4E4E7]'>
              {tableHeader.map(({ label, align, can_sort, id }, index) => {

                return <h1 key={index} className={`flex-1 ${align || 'text-start'}  `}>
                  {t(label)} {can_sort && <button onClick={() => sortHandle(id)} className='active:opacity-50'><PiCaretUpDownBold className={`inline ${sortColumn === id ? 'text-green-600' : 'text-gray-400/50'} hover:text-gray-600 active:text-gray-500 `} /></button>}
                </h1>
              })}
            </div>


            <div className='mt-5 mb-4 space-y-5 h-[60dvh] overflow-y-auto'>

              <>
                {loading ? <div className="flex h-full flex-1 flex-col justify-center items-center">
                  <Spinner size='xl' />


                </div> : dataList.length === 0 ? <div className="flex h-full flex-1 flex-col justify-center items-center">
                  <h1>No Product is available</h1> </div> : <div className='space-y-5'>

                  {dataList.map((elem: DataListInterface, index) => {
                    const even_row = (index + 1) % 2
                    return <div key={index} className={`hover:bg-[#d0d0d0] flex items-center flex-1 text-base py-5 border-b-2 border-b-[#E4E4E7]`}>
                      {
                        tableHeader.map((element, ind) => {
                          const { id, Render_Value, align } = element
                          const content = Render_Value ? <Render_Value getDataArchiveType={getDataArchiveType} clickHandle={(action: string) => buttonClickActionHandle(action, elem)} /> : elem[id]
                          return <h1 key={ind} className={`flex-1 ${align || 'text-start'}  `}>
                            {id === 'category' ? elem?.categories?.category_name : content}
                          </h1>
                        })
                      }
                    </div>
                  })}
                </div>}
              </>
            </div>
          </div>


        </div>



      </div>


      <Custom_Modal open_handle={() => openModalHandle(modalStateEnum.CREATE)} Title={`${modalState} Product`} loading={modalEventLoading} is_open={openModal} close_handle={closeModalHandle} create_new_handle={modalSubmitHandle} buttonLabel={modalState} Trigger_Button={null}>
        <div className="w-full grid grid-cols-2 gap-4">

          {
            requiredInputFields.map((elem,index) => {
              const { id, label } = elem
              return id === 'category_id' ? <div key={index} className='col-span-2 space-y-2' >

                <Searchable_Dropdown initialValue={0} value={modalData[id]} bg_color='#fff' start_empty={true} options_arr={categories.map(({ category_id, category_name }: any) => ({ value: category_id, label: category_name }))} required={true} on_change_handle={(e: any) => modalInputChangeHandle(id, e.target.value)} label='Category' />
              </div> : <div  key={index}  className={`col-span-2`}>
                <Input_Component value={modalData[id]} onChange={(e: string) => modalInputChangeHandle(id, e)} py='py-3' border='border-[1px] border-gray-300 rounded-md' label={label} />
              </div>
            })
          }



        </div>
      </Custom_Modal>



      {activeDeleteId ? <div className='fixed bg-black/75 h-screen w-screen top-0 left-0 right-0 bottom-0 z-20'>
        <div className='flex justify-center items-center w-full h-full'>

          <div className='bg-white w-full max-w-xl px-4 py-3 rounded-lg'>

            <h1 className='font-bold text-xl text-black mb-5'>Confirmation</h1>
            <p className='text-lg'>Do you really want to {getDataArchiveType ? "Unarchive" : "Archive"} this product</p>
            <p className='text-sm'>Remember All of the locations inventories will also be {getDataArchiveType ? "Unarchive" : "Archive"} with the product</p>


            <div className='mt-4 flex items-center space-x-3 justify-end'>
              <Button disabled={deleteLoading} onClick={() => setActiveDeleteId(0)} color="gray">Cancel</Button>
              <Button isProcessing={deleteLoading} color={"failure"} onClick={deleteHandle}>
                {getDataArchiveType ? "Unarchive" : "Archive"}
              </Button>
            </div>


          </div>
        </div>

      </div> : null}


    </main>
  )
}

export default Products