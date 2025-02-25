'use client'

import React from 'react'
import { capitalize_word_letter } from '@/helper/common_functions'
import { fields_list_components, find_fields } from '@/utils/list_options/fields_list_components'
import { Button } from 'flowbite-react'
import { useTranslation } from 'react-i18next'
import { translationConstant } from '@/utils/translationConstants'


export const Form_Component = (props:any) => {
    const {  render_list_fields, data, reset_fields, handle_update, update_loading, is_edited, className, } = props
    
    const {t} = useTranslation(translationConstant.WEBCONT)
    return (
        <>
            <h6 className='text-primary_color font-bold'>{t("WebCont_k9")}</h6>


            <div className={ className || `space-y-4`}>
                {
                    Object.keys(data).map((field, index) => {
                        const splited_str = field.split('_')[0].toLocaleLowerCase()
                        // console.log(splited_str)

                        if (render_list_fields.includes(field)) {
                            // @ts-ignore
                            const { Component_Render } = fields_list_components[find_fields[splited_str] === 'timer' ? 'input' : find_fields[splited_str] || 'input']
                            const label = field === 'mon_timing' ? 'Mon - Fri Timing' : capitalize_word_letter(field)

                            return <Component_Render key={index} key_id={field} label={label} {...props} />

                        }
                    })
                }


            </div>


            <div className='flex justify-end' >
                <div className='flex items-end gap-2 ' >
                    <button onClick={reset_fields}>
                        <span className='text-sm underline' >
                            {t("WebCont_k11")}
                        </span>
                    </button>
                    <Button onClick={handle_update} isProcessing={update_loading} disabled={!is_edited || update_loading} className='bg-primary_color px-3'>
                        <span className='text-sm' >
                        {t("WebCont_k12")}
                        </span>
                    </Button>

                </div>
            </div>
        </>
    )
}



