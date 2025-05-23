import { create_content_service, delete_content_service, fetch_content_service, update_content_service } from "@/utils/supabase/data_services/data_services";
import { useEffect, useState } from "react";
import { toast } from "sonner";



export function useRolesAndPermissions() {

    const [data, setData] = useState<any[]>([])
    const [loadingDataState, setLoadingDataState] = useState(true)
    const [activeForAddNewRoleInput, setActiveForAddNewRoleInput] = useState(false)
    const [selectedRole, setSelectedRole] = useState<any>(0)
    const [newAddLoading, setNewAddLoading] = useState(false)
    const [editStateId, setEditStateId] = useState(0)
    const [permissionsList, setPermissionsList] = useState<any[]>([]);
    const [userPermissionsListRecord, setUserPermissionsListRecord] = useState<any[]>([])
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<number | null>(null);


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
                
                // Create permissions for the new role
                const permissionEntries = Object.entries(roleData.permissions);
                const permissionPromises = permissionEntries.map(async ([permName, allowed]) => {
                    if (allowed) {
                        const permission = permissionsList.find(p => p.name === permName);
                        if (permission) {
                            const { data: permData, error: permError } = await create_content_service({
                                table: 'user_permissions',
                                post_data: {
                                    roles: newRole.id,
                                    permissions: permission.id
                                }
                            });
                            if (permError) {
                                console.error(`Error creating permission ${permName}:`, permError);
                                return null;
                            }
                            return permData;
                        }
                    }
                    return null;
                });

                // Wait for all permission creations to complete
                const permissionResults = await Promise.all(permissionPromises);
                
                // Filter out null results and flatten the array
                const successfulPermissions = permissionResults
                    .filter(result => result !== null)
                    .flat();

                if (successfulPermissions.length > 0) {
                    // Update the permissions list state
                    setPermissionsList(prevPermissions => 
                        prevPermissions.map(perm => ({
                            ...perm,
                            allowed: roleData.permissions[perm.name] || false
                        }))
                    );
                    
                    // Update the user permissions record
                    setUserPermissionsListRecord(prev => [...prev, ...successfulPermissions]);
                    
                    toast.success('New role with permissions successfully added!');
                } else {
                    toast.success('New role created, but no permissions were added');
                }

                // Add the new role to the list
                setData(prev => [...prev, newRole]);
            }
        } catch (error) {
            console.error(error);
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
        try {
            // 1. Check if any profiles are using this role
            const profilesWithRole = await fetch_content_service({
                table: 'profiles',
                matchCase: { key: 'role_id', value: id }
            });

            if (profilesWithRole && profilesWithRole.length > 0) {
                toast.error('Cannot delete role: There are profiles assigned to this role. Please reassign or remove these profiles first.');
                return;
            }

            // 2. Delete all permissions associated with this role
            const { error: permError } = await delete_content_service({
                table: 'user_permissions',
                keyByDelete: 'roles',
                id: id
            });

            if (permError) {
                toast.error('Failed to delete role permissions');
                return;
            }

            // 3. Delete the role itself
            const { error: roleError } = await delete_content_service({
                table: 'roles',
                keyByDelete: 'id',
                id: id
            });

            if (!roleError) {
                setData((elem) => elem.filter((data: any) => data.id !== id));
                if (selectedRole?.id === id) {
                    setSelectedRole(0);
                    setPermissionsList((perm: any) => perm.map((elem: any) => ({
                        ...elem,
                        allowed: false
                    })));
                    setUserPermissionsListRecord([]);
                }
                toast.success('Role has been deleted successfully');
            } else {
                toast.error(roleError.message || 'Failed to delete role');
            }
        } catch (error: any) {
            console.error('Error deleting role:', error);
            toast.error(error.message || 'An error occurred while deleting the role');
        }
    };


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

    // Call this to open the confirmation modal
    const confirmDeleteRole = (id: number) => {
        setRoleToDelete(id);
        setDeleteModalOpen(true);
    };

    // Call this after user confirms deletion in the modal
    const handleConfirmedDelete = async () => {
        if (roleToDelete === null) return;
        await deleteRoleHandle(roleToDelete);
        setDeleteModalOpen(false);
        setRoleToDelete(null);
    };


    return { roles: data, loadingDataState, handleAddRole, activeForAddNewRoleInput, toggleActivateAddNewRoleHandle, selectRoleHandle, selectedRole, newAddLoading, deleteRoleHandle, updateRoleHandle, setEditStateIndexActivate, editStateId, permissions: permissionsList, handlePermissionToggle, toggleAllPermissions, deleteModalOpen, setDeleteModalOpen, confirmDeleteRole, handleConfirmedDelete, roleToDelete }



}