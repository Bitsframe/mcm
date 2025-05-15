"use client"
import React from 'react';
import WebsiteContentLayout from '../Layout';
import { Select_Dropdown } from '@/components/Select_Dropdown';
import { Custom_Modal } from '@/components/Modal_Components/Custom_Modal';
const Career = () => {


    const customTheme = {
        root: {
            base: "bg-none overflow-y-auto",
            inner: `bg-none flex flex-col justify-between h-full w-full `,
        },
    };
    return (
        <WebsiteContentLayout>
            <div className='mb-5 px-3 py-2 border-2 border-gray-700 rounded-xl' >
                <div className='flex  justify-between items-start p-0 my-5'>
                    <div className='w-1/2' >
                        <Select_Dropdown
                            // value={selected_location}
                            label='Specials' start_empty={true} options_arr={[]}
                            // on_change_handle={(e) => set_location_handle(e.target.value)}
                            required={true} />

                    </div>
                    {/* <button >
                        <Image
                            className="w-12"
                            src={PlusIcon}
                            alt="Logo"
                        />

                    </button> */}


{/* @ts-ignore */}
                    <Custom_Modal Title='Create Specials'

                    // is_open, close_handle, open_handle, create_new_handle

                    >
                        <div className='gap-4'>
                            <div  >
                                <p className='text-primary_color'>Title:</p>
                                <input
                                    // disabled={is_disabled} onChange={(e)=>on_change_handle(key,e.target.value)}
                                    type="text"
                                    //  value={change_data ? change_data[key] : ''}
                                    className={`w-full rounded-lg bg-input_bg p-3 ${false && 'text-gray-500'}`} />
                            </div>
                            <div  >
                                <p className='text-primary_color'>Image:</p>
                                <input
                                    // disabled={is_disabled} onChange={(e)=>on_change_handle(key,e.target.value)}
                                    type="file"
                                    //  value={change_data ? change_data[key] : ''}
                                    className={`w-full rounded-lg bg-input_bg p-3 ${false && 'text-gray-500'}`} />
                            </div>

                            {/* {
                        inputLabelandValue.map((item, index) => {
                            const { key, label, col_span } = item
                            const formattedKey = label.replace(/_/g, " ");
                            const is_disabled = update_loading || !change_data
                            return (
                                <div key={index} className={col_span ? `col-span-2` : ''}>
                                    <p className='text-primary_color'>{formattedKey}:</p>
                                    <input 
                                    // disabled={is_disabled} onChange={(e)=>on_change_handle(key,e.target.value)}
                                     type="text" 
                                    //  value={change_data ? change_data[key] : ''}
                                      className={`w-full rounded-lg bg-input_bg p-3 ${ is_disabled && 'text-gray-500'}`} />
                                </div>
                            );
                        })
                    } */}
                        </div>

                    </Custom_Modal>
                </div>


                <div className="border-t my-3 border-black"></div>



                <div className='px-3 flex flex-col gap-5 w-2/5'>
                    <h6 className='text-primary_color'>Content</h6>


                    <div  >
                        <p className='text-primary_color'>Title:</p>
                        <input
                            // disabled={is_disabled} onChange={(e)=>on_change_handle(key,e.target.value)}
                            type="text"
                            //  value={change_data ? change_data[key] : ''}
                            className={`w-full rounded-lg bg-input_bg p-3 ${false && 'text-gray-500'}`} />
                    </div>
                    <div  >
                        <p className='text-primary_color'>Image:</p>
                        <input
                            // disabled={is_disabled} onChange={(e)=>on_change_handle(key,e.target.value)}
                            type="file"
                            //  value={change_data ? change_data[key] : ''}
                            className={`w-full rounded-lg bg-input_bg p-3 ${false && 'text-gray-500'}`} />
                    </div>
                </div>
            </div>
        </WebsiteContentLayout>
    );
};

export default Career;
