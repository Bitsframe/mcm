import { Rating } from "@mui/material"
import { Checkbox, TimePicker } from "antd"
import React, { useState } from "react"
import Moment from 'moment';
import { useTranslation } from "react-i18next";
import { translationConstant } from "../translationConstants";

// Interface for the data being passed
interface DataInterface {
    [key: string]: string | number; // Updated to allow numbers for things like rating
}

// Define Props for the components
interface ComponentProps {
    on_change_handle: (key_id: string, value: any) => void;
    label: string;
    key_id: string;
    data: DataInterface;
}

interface fieldsListComponentsInterface {
    [key: string]: {
        Component_Render: React.FC<ComponentProps>;
    };
}
export const fields_list_components: fieldsListComponentsInterface = {
    input: {

        Component_Render: ({ on_change_handle, label, key_id, data }) => {

            const {t} = useTranslation(translationConstant.WEBCONT)
            return <div>
                <p className='font-bold dark:text-white text-primary_color'>{t(label)} :</p>
                <input
                    value={data[key_id] || ''}
                    type="text"
                    className='w-full  p-3 rounded-lg dark:bg-[#374151] dark:text-white bg-[#F1F4F9]'
                    onChange={(e) => on_change_handle(key_id, e.target.value)}
                />
            </div>
        }
    },
    textarea: {
        Component_Render: ({ on_change_handle, label, key_id, data }) => {

            const {t} = useTranslation(translationConstant.WEBCONT)
            return <div>
                <p className='font-bold dark:text-white text-primary_color'>{label} :</p>
                <textarea
                    className='rounded-lg w-full dark:bg-[#374151] dark:text-white bg-[#F1F4F9] resize-none outline-none border-none'
                    rows={6} cols={51}
                    value={data[key_id] || ''}
                    onChange={(e) => on_change_handle(key_id, e.target.value)}
                ></textarea>
            </div>
        }
    },
    rating: {
        Component_Render: ({ on_change_handle, label, key_id, data }) => {
            const val = data[key_id] ? data[key_id] : 0
            return <div>
                <p className='font-bold dark:text-white text-primary_color'>{label} :</p>
                <Rating
                    size='large'
                    name="simple-controlled"
                    // @ts-ignore
                    value={val}
                    onChange={(event, newValue) => {
                        on_change_handle(key_id, newValue)
                    }}

                />
            </div>
        }
    },
    timer: {
        Component_Render: ({ on_change_handle, label, key_id, data }) => {
            const [checked, setChecked] = useState(false);

            const onChange = (e: any) => {
                // console.log('checked = ', e.target.checked);
                const val = e.target.checked
                const save_value = val ? 'Closed' : ''
                setChecked(val)
                on_change_handle(key_id, save_value)
            };

            const render_time = (val: any) => {
                if (val?.toLocaleLowerCase() === 'closed') {
                    return ['', '']
                }
                else if (val === '') {
                    return ['', '']

                }

                else if (val) {
                    const split_time = val.split('-')
                    return [Moment(split_time[0] || '', 'LT'), Moment(split_time[1] || '', 'LT')]
                }
                else {
                    return ['', '']
                }
            }

            const time_change_handle = (e: any) => {

                if (data[key_id]) {
                    on_change_handle(key_id, '')
                }

                let value = ''
                if (e) {

                    const start_time = Moment(e[0]['$d']).format('LT')

                    const end_time = Moment(e[1]['$d']).format('LT')
                    console.log({
                        start_time,
                        end_time
                    })
                    value = `${start_time}-${end_time}`
                }

                on_change_handle(key_id, value)

            }
            return <div className="">

                <div className="flex gap-2 justify-between items-end">
                    <p className='font-bold text-primary_color '>{label} :</p> {key_id !== 'mon_timing' && <Checkbox
                        className="font-bold"
                        checked={checked || data[key_id] && data[key_id] === "Closed" ? true : false}
                        onChange={onChange}

                    >
                        Closed
                    </Checkbox>}
                </div>

                <div className="flex items-center space-x-3 w-full">
                    <TimePicker.RangePicker onChange={time_change_handle} disabled={checked || data[key_id] && data[key_id] === "Closed" ? true : false}
                        use12Hours
                        // @ts-ignore
                        defaultValue={render_time(data[key_id])}
                        format="hh:mm A"
                        className="py-3 border-gray-800 w-full" size="large" />

                </div>
            </div>
        }
    }

}


export const find_fields = {
    text: 'textarea',
    title: 'input',
    content: 'textarea',
    rating: 'rating',
    name: 'input',
    mon: 'timer',
    sunday: 'timer',
    saturday: 'timer',
    review: 'textarea',
    answer: "textarea",
    phone: 'input'
}


