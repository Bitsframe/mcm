"use client"
import React, {useEffect, useState } from 'react';
import WebsiteContentLayout from '../Layout';
import { Select_Dropdown } from '@/components/Select_Dropdown';
import { useLocationClinica } from '@/hooks/useLocationClinica';
import { useSingleRowDataHandle } from '@/hooks/useSingleRowDataHandle';
import { Form_Component } from '@/components/Form_Component'
import { Custom_Modal } from '@/components/Modal_Components/Custom_Modal';
import { fields_list_components, find_fields } from '@/utils/list_options/fields_list_components';
import { useTranslation } from 'react-i18next';
import { translationConstant } from '@/utils/translationConstants';

const inputLabelandValue = [
    {
        label: "Location",
        key: "location_id"
    },
    {
        label: "Rating",
        key: "rating"
    },
    {
        label: "WebCont_k15",
        key: "name"
    },
    {
        label: 'Review',
        key: "review"
    },

];



const Testimonials = () => {

    const { locations, set_location_handle, selected_location } = useLocationClinica()
    const [filteredData, setfilteredData] = useState<any>([])


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
        list_data: true, table: 'Testinomial', required_fields: inputLabelandValue
    });

    const select_location_handle = (val: React.ChangeEvent<HTMLSelectElement>) => {
        const value = val.target.value
        console.log('first')
        set_location_handle(value)
        const filterByLocation = data_list.filter(data => data.location_id == value)
        setfilteredData(filterByLocation)
        if (filterByLocation.length) {
            change_selected_list_id(filterByLocation[0].id, true)
        }
        else {
            change_selected_list_id('', true)
        }
    }


    useEffect(() => {

        // const filterByLocation
        setfilteredData(data_list)
    }, [data_list])



    const {t} = useTranslation(translationConstant.WEBCONT)
    return (
        <WebsiteContentLayout>
            <div className='mb-5 px-3' >
                <div className='flex items-end'>
                    <div className='grid grid-cols-5 lg:flex-row lg:gap-24 '>

                        <Select_Dropdown
                            value={selected_location} label={t('WebCont_k5')} start_empty={true} options_arr={locations.map(({ id, title }: { id: string, title: string }) => ({ value: id, label: title }))}
                            on_change_handle={select_location_handle}
                            required={true} />
                        <Select_Dropdown
                            value={selected_list_id} label={t('WebCont_k14')} start_empty={true} options_arr={filteredData.map(({ id }: { id: string }) => ({ value: id, label: id }))}
                            on_change_handle={change_selected_list_id}
                            required={true} />
                    </div>
                    <Custom_Modal create_new_handle={create_content_handle} open_handle={open_modal} close_handle={close_modal} is_open={create_modal_open} Title='Create Testimonial' loading={create_data_loading} >
                        <div className='grid grid-cols-1 gap-4'>

                            <Select_Dropdown
                                value={create_data.location_id} label='Locations' start_empty={true} options_arr={locations.map(({ id, title }: { id: string, title: string }) => ({ value: id, label: title }))}
                                on_change_handle={(e: React.ChangeEvent<HTMLSelectElement>) => on_change_handle('location_id', e.target.value)}
                                required={true} />


                            {
                                inputLabelandValue.slice(1).map((item, index) => {
                                    // const { key, label, col_span } = item
                                    // const formattedKey = label.replace(/_/g, " ");
                                    // const is_disabled = update_loading 
                                    // @ts-ignore
                                    const { Component_Render } = fields_list_components[find_fields[item.key]]
                                    return (
                                    // @ts-ignore
                                        <Component_Render key={index} on_change_handle={on_change_handle} label={t(item.label)} key_id={item.key} data={create_data} />

                                    );
                                })
                            }
                        </div>

                    </Custom_Modal>
                </div>
                <div className="border-t my-3 border-black"></div>



                <div className='px-3 w-1/2 space-y-5'>
                    {data && <Form_Component reset_fields={reset_fields} handle_update={handle_update} is_edited={is_edited} update_loading={update_loading} data={data} render_list_fields={['rating', 'name', 'review']} on_change_handle={on_change_handle} />}

                </div>







                {/* <div>
                    {data_list.map(({ name, rating, review },ind) => {

                        return <div key={ind} className="border-t my-3 bg-slate-200 hover:bg-slate-300 rounded-lg px-4 py-4 cursor-pointer">
                            <ul className='space-y-3'>
                                <li className='text-primary_color font-bold text-xl'>{name}</li>
                                <li className='text-primary_color'><Render_Rating rating={rating} /> </li>
                                <li className='text-primary_color'>{review}</li>
                            </ul>
                        </div>
                    })}
                </div> */}

            </div>
        </WebsiteContentLayout>
    );
};

export default Testimonials;
