import { create_content_service, fetch_content_service, update_content_service, updateLocationData } from '@/utils/supabase/data_services/data_services';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface RequiredField {
    key: string;
    label: string;
}

interface DataInterface {
    initial_language?: string;
    default_selected_section?: string;
    list_data?: boolean;
    list_item_section?: string[];
    table: string;
    required_fields: RequiredField[];

}

interface DataRow {
    id: number;
    [key: string]: any; // Additional fields
}

function useSingleRowDataHandle(paramData: DataInterface) {
    const {
        initial_language = '',
        list_data = false,
        default_selected_section = '',
        list_item_section = [],
        table,
        required_fields
    } = paramData
    const [default_data, set_default_data] = useState<DataRow | null>(null);
    const [data_list, setData_list] = useState<DataRow[]>([]);
    const [data, set_data] = useState<DataRow | null>(null);
    const [is_edited, set_is_edited] = useState<boolean>(false);
    const [update_loading, set_update_loading] = useState<boolean>(false);
    const [selected_language, set_selected_language] = useState<string>(initial_language);
    const [selected_section, setSelected_section] = useState<string>(table);
    const [selected_list_id, setselected_list_id] = useState<number | any>(1);
    const [create_row_language, setCreate_row_language] = useState<string>('');
    const [create_data, setCreate_data] = useState<Partial<DataRow>>({});
    const [create_data_loading, setCreate_data_loading] = useState<boolean>(false);
    const [create_modal_open, setCreate_modal_open] = useState<boolean>(false);
    const [can_create_new, setCan_create_new] = useState<boolean>(false);

    const open_modal = () => {
        setCreate_modal_open(true);
    };

    const create_new_row_language_handle = (language: React.ChangeEvent<HTMLInputElement>) => {
        const lan = language.target.value;
        setCreate_row_language(lan);
    };

    const close_modal = () => {
        setCreate_data({});
        setCreate_modal_open(false);
        setCreate_data_loading(false);
        setCan_create_new(false);
        setCreate_row_language('');
    };

    const create_content_handle = () => {
        const missing_fields: string[] = [];

        required_fields.forEach((field) => {
            const { key, label } = field;
            if (!create_data[key]) {
                missing_fields.push(label);
            }
        });

        if (missing_fields.length > 0) {
            const join_missing_fields = missing_fields.join(', ');
            toast.error(`${join_missing_fields} ${missing_fields.length > 1 ? 'are' : 'is'} missing`);
            return;
        }

        if (create_content_service) {
            if (create_data.email) {
                const check_valid_email = String(create_data.email)
                    .toLowerCase()
                    .match(
                        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                    );

                if (!check_valid_email) {
                    toast.error('Invalid email address, please enter a valid email address');
                    return;
                }
            }

            setCreate_data_loading(true);

            ; (async function create_row_handle() {
                const { data: res_data, error } = await create_content_service({
                    table: selected_section,
                    language: create_row_language,
                    post_data: create_data
                });

                if (error) {
                    console.error(error.message);
                    toast.error(error.message);
                    setCreate_data_loading(false);
                } else if (res_data?.length) {
                    toast.success('Created successfully');
                    close_modal();
                    setCreate_data_loading(false);
                }
            })()
        }
    };

    const change_selected_list_id = (e: React.ChangeEvent<HTMLSelectElement> | number | string, directVal?: boolean) => {
        const value = directVal ? e : (e as React.ChangeEvent<HTMLSelectElement>).target.value;
        const selectedValue = typeof value === 'string' ? parseInt(value, 10) : value;

        setselected_list_id(selectedValue);
        const find_data = data_list.find((elem) => elem.id === selectedValue);
        set_data(find_data || null);
        set_is_edited(false);
    };

    const select_language_handle = (language: React.ChangeEvent<HTMLSelectElement>) => {
        const lan = language.target.value;
        set_selected_language(lan);
        set_is_edited(false);
    };

    const on_change_handle = (field: string, val: string) => {
        if (create_modal_open) {
            setCreate_data((prev) => ({
                ...prev,
                [field]: val
            }));
        } else {
            set_is_edited(true);
            set_data((prev) => ({
                ...prev,
                [field]: val
            }) as DataRow);
        }
    };

    const fetch_handle = () => {
        if (fetch_content_service) {
            ; (async function fetch_data() {
                const fetched_data = await fetch_content_service({
                    table: selected_section,
                    language: selected_language
                });
                if (list_data || list_item_section.includes(selected_section)) {
                    setData_list(fetched_data);
                    setselected_list_id(fetched_data[0]?.id || 1);
                }
                set_default_data(fetched_data[0]);
                set_data(fetched_data[0]);
            })()
        }
    };

    const handle_update = async () => {
        console.log('handle_update called with:', { table, data });
        if (table === 'Locations' && data) {
            set_update_loading(true);
            try {
                console.log('Updating location with data:', data);
                const res_data = await updateLocationData(data.id, data);
                console.log('Location update response:', res_data);
                if (res_data?.length) {
                    setData_list(prevList => 
                        prevList.map(item => 
                            item.id === data.id ? res_data[0] : item
                        )
                    );
                    toast.success('Updated successfully');
                    set_default_data(res_data[0]);
                    set_data(res_data[0]);
                }
            } catch (error) {
                console.error('Error in handle_update:', error);
                toast.error('Failed to update location');
            }
            set_update_loading(false);
            set_is_edited(false);
        } else if (update_content_service && data) {
            set_update_loading(true);
            const res_data = await update_content_service({
                table: selected_section,
                language: selected_language,
                post_data: data
            });
            if (res_data?.length) {
                setData_list(prevList => 
                    prevList.map(item => 
                        item.id === data.id ? res_data[0] : item
                    )
                );
                toast.success('Updated successfully');
            }
            set_default_data(res_data[0]);
            set_update_loading(false);
            set_is_edited(false);
        }
    };

    const reset_fields = (all: boolean) => {
        set_is_edited(false);
        set_data(default_data);
        if (all) {
            set_default_data(null);
            set_data(null);
        }
    };

    useEffect(() => {
        reset_fields(true);
        fetch_handle();
    }, [selected_language, selected_section]);

    return {
        default_data,
        data,
        data_list,
        is_edited,
        update_loading,
        selected_language,
        fetch_data_by_parameter: fetch_handle,
        select_language_handle,
        on_change_handle,
        handle_update,
        selected_section,
        selected_list_id,
        change_selected_list_id,
        setSelected_section,
        create_modal_open,
        create_data,
        create_data_loading,
        create_content_handle,
        create_row_language,
        create_new_row_language_handle,
        open_modal,
        close_modal,
        reset_fields
    };
}

export { useSingleRowDataHandle };
