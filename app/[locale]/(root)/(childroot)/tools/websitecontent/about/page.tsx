"use client"
import React from 'react';
import { useSingleRowDataHandle } from '@/hooks/useSingleRowDataHandle'
import { Select_Dropdown } from '@/components/Select_Dropdown'
import { about_section_options, langage_list_options } from '@/utils/list_options/dropdown_list_options'
import { Form_Component } from '@/components/Form_Component';
import WebsiteContentLayout from '../Layout';
import { useTranslation } from 'react-i18next';
import { translationConstant } from '@/utils/translationConstants';


const only_fields_to_render: any = {
    about: ['text_1', 'title_1', 'text_2', 'title_2', 'text_3', 'title_3', 'text_4', 'title_4', 'text_5', 'title_5']

}


interface FieldProps {
    value: string;
    on_change_handle: (label: string, value: string) => void;
    label: string;
}

interface FieldsType {
    text: (props: FieldProps) => JSX.Element;
    title: (props: FieldProps) => JSX.Element;
    image: (props: FieldProps) => JSX.Element;
}


const fields: FieldsType = {
    text: ({ value, on_change_handle, label }) => {
        return (
            <div className='flex flex-col space-y-2'>
                {/* <Label>{label}</Label> */}
                <textarea
                    // defaultValue={default_data?.content}
                    className='rounded-lg w-full  bg-input_bg resize-none outline-none border-none'
                    rows={8} cols={51}
                    value={value}
                    onChange={(e) => on_change_handle(label, e.target.value)}
                />
            </div>
        )
    },
    title: ({ value, on_change_handle, label }) => {
        return <div className='flex flex-col space-y-2'>
            {/* <Label>{label}</Label> */}
            <input type='text' className='w-full' value={value} onChange={(e) => on_change_handle(label, e.target.value)} />
        </div>

    },
    image: ({ value, on_change_handle, label }) => {
        return <div className='flex flex-col space-y-2'>
            {/* <Label>{label}</Label> */}
            <img className='w-1/2' src="https://vsvueqtgulraaczqnnvh.supabase.co/storage/v1/object/public/Aboutus_images/image%201.svg?t=2024-03-17T13%3A01%3A13.546Z" alt='picture'/>
        </div>

    }
}
const About = () => {

    const {
        default_data,
        data,
        is_edited,
        update_loading,
        selected_language,
        selected_section,
        select_language_handle,
        on_change_handle,
        handle_update,
        reset_fields
    } = useSingleRowDataHandle({
        table: 'about', default_selected_section: about_section_options[0].value,
        required_fields: []
    });




    const select_section_handle = (val: any) => {


    }

    const {t} = useTranslation(translationConstant.WEBCONT)

    return (
        <WebsiteContentLayout>
            <div className='mb-5 px-3' >
                <div className='grid grid-cols-5 lg:flex-row lg:gap-24 my-5'>

                    {/* <Select_Dropdown value={''} label='Section' options_arr={about_section_options} on_change_handle={select_section_handle} required={true} /> */}
                    <Select_Dropdown value={selected_language} label={t('WebCont_k8')} options_arr={langage_list_options} on_change_handle={select_language_handle} required={true} />
                </div>
                <div className="border-t my-3 border-black"></div>



                <div className='px-3 w-1/2 space-y-5'>
                    {data && <Form_Component reset_fields={reset_fields} handle_update={handle_update} is_edited={is_edited} update_loading={update_loading} data={data} render_list_fields={only_fields_to_render[selected_section]} on_change_handle={on_change_handle} />}

                </div>

            </div>
        </WebsiteContentLayout>
    );
}
export default About;
