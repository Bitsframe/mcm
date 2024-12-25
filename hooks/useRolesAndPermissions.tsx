import { create_content_service, delete_content_service, fetch_content_service, update_content_service } from "@/utils/supabase/data_services/data_services";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";



export function useRolesAndPermissions() {

    const [data, setData] = useState<any[]>([])
    const [loadingDataState, setLoadingDataState] = useState(true)
    const [activeForAddNewRoleInput, setActiveForAddNewRoleInput] = useState(false)
    const [selectedRole, setSelectedRole] = useState(0)
    const [newAddLoading, setNewAddLoading] = useState(false)
    const [editStateId, setEditStateId] = useState(0)
    const [selectedRolePermissions, setSelectedRolePermissions] = useState([])


    const setEditStateIndexActivate = (id: number) => {
        setEditStateId(id)
    }



    useEffect(() => {
        !(async function fetch_data() {
            const data = await fetch_content_service({ table: 'roles' })

            if (data.length) {
                setData(data);
                setLoadingDataState(false)
            }
        })()
    }, [])


    const handleAddRole = async (val: string) => {
        setNewAddLoading(true)
        const { data: res_data, error } = await create_content_service({ table: 'roles', language: '', post_data: { name: val } });
        if (error) {
            console.log(error.message);
            toast.error(error.message);
            setNewAddLoading(false)
            // throw new Error(error.message);
        }
        if (res_data?.length) {
            toast.success('New role successfully added!');
            setData((pre: any) => [...pre, res_data[0]])
            setNewAddLoading(false)
            setActiveForAddNewRoleInput(false)
        }
    };


    const toggleActivateAddNewRoleHandle = (state: boolean) => {
        setActiveForAddNewRoleInput(state)
    }

    const selectRoleHandle = (id: number) => {
        const findElem = data.find((elem) => elem.id === id)
        setSelectedRole(findElem)
    }

    const deleteRoleHandle = async (id: number) => {
        const { error } = await delete_content_service({ table: 'roles', keyByDelete: 'id', id: id })
        if (!error) {
            setData((elem) => elem.filter((data: any) => data.id !== id))
            toast.success('Role has been discarded');
        }
        else if (error) {
            console.log(error.message)
            toast.error(error.message);
        }
    }


    const updateRoleHandle = async (postData:any) => {
        try {
            const res_data = await update_content_service({ table: 'roles', matchKey: 'id', post_data: {...postData}})
            if (res_data?.length) {
                setData((elem) => elem.map((elem: any) => elem.id === postData.id ? res_data[0] : elem ))
                toast.success('Successfully updated');
                setEditStateId(0)
            }
        } catch (error: any) {
            console.log(error.message)
            toast.error(error.message);
        }

    }




    return { roles: data, loadingDataState, handleAddRole, activeForAddNewRoleInput, toggleActivateAddNewRoleHandle, selectRoleHandle, selectedRole, newAddLoading, deleteRoleHandle, updateRoleHandle, setEditStateIndexActivate, editStateId }



}