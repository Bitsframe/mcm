"use client"
import React from 'react';
import WebsiteContentLayout from '../Layout';
import { Select_Dropdown } from '@/components/Select_Dropdown';
import { Custom_Modal } from '@/components/Modal_Components/Custom_Modal';
import { useSingleRowDataHandle } from '@/hooks/useSingleRowDataHandle';
import { fields_list_components, find_fields } from '@/utils/list_options/fields_list_components';
import { Form_Component } from '@/components/Form_Component';
import { useTranslation } from 'react-i18next';
import { translationConstant } from '@/utils/translationConstants';

const Locations = () => {




    const inputLabelandValue = [
        {
            label: "Title",
            key: "title"
        },
        {
            label: 'Phone',
            key: "phone"
        },
        {
            label: "Direction",
            key: "direction",
            col_span: "2"
        },
        {
            label: 'Email',
            key: "email"
        },
        {
            label: "Monday to Friday Timing",
            key: "mon_timing"
        },
        {
            label: "Saturday Timing",
            key: "saturday_timing"
        },
        {
            label: "Sunday Timing",
            key: "sunday_timing"
        },
        {
            label: 'Address',
            key: "address",
            col_span: "2"
        },
    ];



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
        fetch_data_by_parameter
    } = useSingleRowDataHandle({
        list_data: true, table: 'Locations',

        required_fields: inputLabelandValue
    });


    const {t} = useTranslation(translationConstant.WEBCONT)

    return (
        <WebsiteContentLayout>
            <div className='mb-5 px-3 py-2 border-2 border-gray-300 rounded-xl' >

                <div className='flex w-full'>
                    <div className='w-full' >
                        <Select_Dropdown
                            value={selected_list_id} label={t('WebCont_k5')} start_empty={true} options_arr={data_list.map(({ id, title }) => ({ value: id, label: title }))}
                            on_change_handle={change_selected_list_id}
                            required={true}
                            bg_color='dark:bg-[#374151]' />

                    </div>
                    <Custom_Modal create_new_handle={create_content_handle} open_handle={open_modal} close_handle={close_modal} is_open={create_modal_open} Title='Create Location' loading={create_data_loading} >


                        <div className='grid grid-cols-2 gap-4'>
                            {
                                inputLabelandValue.map((item, index) => {
                                    const { key, label, col_span } = item
                                    // const formattedKey = label.replace(/_/g, " ");
                                    // const is_disabled = update_loading 
                                    const splited_str = key.split('_')[0].toLocaleLowerCase()
                                    //@ts-ignore
                                    const { Component_Render } = fields_list_components[find_fields[splited_str] || "input"]
                                    return (

                                        <div key={index} className={col_span ? `col-span-2` : ''}>
                                            <Component_Render on_change_handle={on_change_handle} label={item.label} key_id={item.key} data={create_data} />
                                        </div>
                                    );
                                })
                            }
                        </div>
                    </Custom_Modal>
                </div>

                <div className="border-t my-3 border-black"></div>
                <div className=''>
                    {data && <Form_Component className="grid grid-cols-2 gap-5 my-5" reset_fields={reset_fields} handle_update={handle_update} is_edited={is_edited} update_loading={update_loading} data={data} render_list_fields={inputLabelandValue.map(({ key }) => key)} on_change_handle={on_change_handle} />}

                </div>
            </div>
        </WebsiteContentLayout>
    );
};

export default Locations;
