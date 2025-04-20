import { create_content_service, delete_content_service, fetch_content_service, update_content_service } from "@/utils/supabase/data_services/data_services";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";



export function useRolesAndPermissions() {

    const [data, setData] = useState<any[]>([])
    const [loadingDataState, setLoadingDataState] = useState(true)
    const [activeForAddNewRoleInput, setActiveForAddNewRoleInput] = useState(false)
    const [selectedRole, setSelectedRole] = useState<any>(0)
    const [newAddLoading, setNewAddLoading] = useState(false)
    const [editStateId, setEditStateId] = useState(0)
    const [permissionsList, setPermissionsList] = useState<any[]>([]);
    const [userPermissionsListRecord, setUserPermissionsListRecord] = useState<any[]>([])


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


    const handlePermissionToggle = async (id: number, isAllowed: boolean) => {

        if (isAllowed) {
            const { data: res_data, error } = await create_content_service({ table: 'user_permissions', post_data: { roles: selectedRole.id, permissions: id } });
            if (error) {
                toast.error(error.message);
            }
            if (res_data?.length) {
                setPermissionsList((elem) => elem.map((perm) => ({ ...perm, allowed: perm.id === id ? true : perm.allowed })))
                toast.success('Permissions updated!');
                setUserPermissionsListRecord((elem: any) => [...elem, res_data[0]])

            }
        }
        else {
            const findPermission = userPermissionsListRecord.find((elem) => elem.roles === selectedRole.id && elem.permissions === id)
            const { error } = await delete_content_service({ table: 'user_permissions', keyByDelete: 'id', id: findPermission.id })
            if (!error) {
                setPermissionsList((elem) => elem.map((perm) => ({ ...perm, allowed: perm.id === id ? false : perm.allowed })))
                setUserPermissionsListRecord((elem) => elem.filter((perm) => perm.permissions !== id))
                toast.success('Permissions updated!');
            }
            else if (error) {
                console.log(error.message)
                toast.error(error.message);
            }

        }
    };


    const handleAddRole = async (roleData: { name: string; permissions: Record<string, boolean> }) => {
        setNewAddLoading(true);
        
        try {
            // First create the role
            const { data: roleRes, error: roleError } = await create_content_service({ 
                table: 'roles', 
                language: '', 
                post_data: { name: roleData.name } 
            });
    
            if (roleError) {
                console.log(roleError.message);
                toast.error(roleError.message);
                setNewAddLoading(false);
                return;
            }
    
            if (roleRes?.length) {
                const newRole = roleRes[0];
                
                // Then update permissions for the new role
                const permissionUpdates = Object.entries(roleData.permissions).map(([permName, allowed]) => ({
                    permission: permName,
                    allowed
                }));
    
                const { error: permError } = await create_content_service({
                    table: 'role_permissions',
                    language: '',
                    post_data: {
                        role_id: newRole.id,
                        permissions: permissionUpdates
                    }
                });
    
                if (permError) {
                    console.log(permError.message);
                    toast.error("Role created but failed to set permissions");
                    // Still add the role even if permissions failed
                    setData((pre: any) => [...pre, newRole]);
                    setNewAddLoading(false);
                    setActiveForAddNewRoleInput(false);
                    return;
                }
    
                toast.success('New role with permissions successfully added!');
                setData((pre: any) => [...pre, {
                    ...newRole,
                    permissions: roleData.permissions
                }]);
            }
        } catch (error) {
            //@ts-ignore
            console.log(error.message);
            toast.error("An unexpected error occurred");
        } finally {
            setNewAddLoading(false);
            setActiveForAddNewRoleInput(false);
        }
    };


    const toggleAllPermissions = async (allowAllPermissions: boolean) => {
        if (allowAllPermissions) {
            const mapData = permissionsList.filter(({ allowed }) => !allowed)
            const postData = mapData.map((elem: any) => ({
                roles: selectedRole.id,
                permissions: elem.id
            }))

            const { data: resData, error } = await create_content_service({ table: 'user_permissions', language: '', post_data: postData, multiple_rows: true });
            if (error) {
                console.log(error.message);
                toast.error(error.message);
            }
            if (resData?.length) {
                toast.success('Successfully updated');
                setUserPermissionsListRecord((pre: any) => ( [...pre, ...resData ]))
                setPermissionsList((elem) => elem.map((perm) => ({ ...perm, allowed: true })))
            }
        }
        else {
            const { error } = await delete_content_service({ table: 'user_permissions', keyByDelete: 'roles', id: selectedRole.id })
            if (!error) {
                toast.success('Successfully updated');
                setUserPermissionsListRecord((pre: any) => ([]))
                setPermissionsList((elem) => elem.map((perm) => ({ ...perm, allowed: false })))
            }
            else if (error) {
                console.log(error.message)
                toast.error(error.message);
            }

        }

    }


    useEffect(() => {
        (async () => {
            const data = await fetch_content_service({ table: 'permissions' })

            if (data.length) {
                const mapData = data.map(({ id, permission }) => ({ id, name: permission, allowed: false }))
                setPermissionsList(mapData);
            }
        })()

    }, [])



    const toggleActivateAddNewRoleHandle = (state: boolean) => {
        setActiveForAddNewRoleInput(state)
    }

    const selectRoleHandle = async (id: number) => {
        const findElem = data.find((elem) => elem.id === id)
        const resData = await fetch_content_service({ table: 'user_permissions', matchCase: { key: 'roles', value: id } })

        if (Array.isArray(resData)) {
            const mapData = resData.map(({ permissions }) => permissions)
            setPermissionsList((perm: any) => perm.map((elem: any) => {
                return {
                    ...elem,
                    allowed: mapData.includes(elem.id) ? true : false,

                }
            }))

            setUserPermissionsListRecord(resData)
        }
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


    const updateRoleHandle = async (postData: any) => {
        try {
            const res_data = await update_content_service({ table: 'roles', matchKey: 'id', post_data: { ...postData } })
            if (res_data?.length) {
                setData((elem) => elem.map((elem: any) => elem.id === postData.id ? res_data[0] : elem))
                toast.success('Successfully updated');
                setEditStateId(0)
            }
        } catch (error: any) {
            console.log(error.message)
            toast.error(error.message);
        }

    }




    return { roles: data, loadingDataState, handleAddRole, activeForAddNewRoleInput, toggleActivateAddNewRoleHandle, selectRoleHandle, selectedRole, newAddLoading, deleteRoleHandle, updateRoleHandle, setEditStateIndexActivate, editStateId, permissions: permissionsList, handlePermissionToggle, toggleAllPermissions }



}