"use client"
import React from 'react';
import WebsiteContentLayout from '../Layout';
import { Select_Dropdown } from '@/components/Select_Dropdown';
import { useSingleRowDataHandle } from '@/hooks/useSingleRowDataHandle';
import { langage_list_options } from '@/utils/list_options/dropdown_list_options';
import { Form_Component } from '@/components/Form_Component';
import { Custom_Modal } from '@/components/Modal_Components/Custom_Modal';
import { fields_list_components } from '@/utils/list_options/fields_list_components';
import { useLocationClinica } from '@/hooks/useLocationClinica';
import { useTranslation } from 'react-i18next';
import { translationConstant } from '@/utils/translationConstants';

const inputLabelandValue = [
    // {
    //     label: "Language",
    //     key: "language"
    // },
    // {
    //     label: "Location",
    //     key: "location_id"
    // },
    {
        label: "Text",
        key: "Text"
    },
];



const Career = () => {
    const { locations } = useLocationClinica()


    const {
        default_data,
        data_list,
        data,
        is_edited,
        update_loading,
        selected_language,
        select_language_handle,
        on_change_handle,
        handle_update,
        reset_fields,
        selected_list_id,
        change_selected_list_id,
        create_modal_open,
        open_modal,
        close_modal,
        create_data,
        create_data_loading,
        create_content_handle,

        create_row_language,
        create_new_row_language_handle,
        fetch_data_by_parameter
    } = useSingleRowDataHandle({ table: 'career', list_data: true, required_fields: inputLabelandValue });

    const {t} = useTranslation(translationConstant.WEBCONT)

    return (
        <WebsiteContentLayout>
            <div className='mb-5 px-3 py-2 border-2 border-gray-300 rounded-xl' >
                <div className='flex items-end my-5'>


                    <div className='flex flex-1'>

                        <div className='flex w-full gap-5'>
                            <div className='flex flex-1'>
                                <Select_Dropdown
                                    value={selected_list_id} label={t('WebCont_k14')} start_empty={true} options_arr={data_list.map(({ id, }) => ({ value: id, label: id }))}
                                    on_change_handle={change_selected_list_id}
                                    required={true} 
                                    bg_color='Dark:bg-[#oe1725]'/>
                            </div>

                            <div className='flex flex-1'>
                                <Select_Dropdown bg_color='Dark:bg-[#oe1725]' value={selected_language} label={t('WebCont_k8')} options_arr={langage_list_options} on_change_handle={select_language_handle} required={true} />
                            </div>
                        </div>

                    </div>




                    <Custom_Modal
                        create_new_handle={create_content_handle} open_handle={open_modal} close_handle={close_modal} is_open={create_modal_open} Title='Create Career' loading={create_data_loading} >
                        <div className='grid grid-cols-1 gap-4'>

                            <div className='flex flex-1'>
                                <Select_Dropdown value={create_row_language} label='Language' options_arr={langage_list_options} on_change_handle={create_new_row_language_handle} required={true} />
                            </div>

                            {/* <div className='flex flex-1'>
                                <Select_Dropdown

                                    value={create_data.location_id || ''} 
                                    start_empty={true}
                                    label='Locations' options_arr={locations.map(({id, title})=>({key:id, label:title}))}
                                    on_change_handle={(e) => on_change_handle('location_id', e.target.value)}
                                    // on_change_handle={select_language_handle}

                                    required={true} />



                            </div> */}

                            {
                                inputLabelandValue.map((item, index) => {
                                    const { Component_Render } = fields_list_components['input']
                                    return (

                                        <Component_Render key={index} on_change_handle={on_change_handle} label={item.label} key_id={item.key} data={create_data} />
                                    );
                                })
                            }
                        </div>

                    </Custom_Modal>

                </div>


                <div className="border-t my-3 border-black"></div>



                <div className=' flex flex-col gap-5'>


                    <div className=' w-full space-y-5'>
                        {data && <Form_Component reset_fields={reset_fields} handle_update={handle_update} is_edited={is_edited} update_loading={update_loading} data={data} render_list_fields={['Text']} on_change_handle={on_change_handle} />}

                    </div>




                </div>
            </div>
        </WebsiteContentLayout>
    );
};

export default Career;
