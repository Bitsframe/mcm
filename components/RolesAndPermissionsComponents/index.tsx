"use client"

import React, { useContext, useEffect, useState } from 'react';
import PermissionToggle from './PermissionToggle';
import { TbPencil } from "react-icons/tb";
import { Switch } from 'antd';
import { useRolesAndPermissions } from '@/hooks/useRolesAndPermissions';
import { CircularProgress } from '@mui/material';
import { TrashIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { translationConstant } from '@/utils/translationConstants';
import { TabContext } from '@/context';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SingleRoleHandle = ({ data, index, updateRoleHandle, deleteRoleHandle, editStateId, editHandle, selectRoleHandle, selectedRole }: any) => {
    const [editValue, setEditValue] = useState(data.name);

    const handleCancel = () => {
        setEditValue(data.name);
        editHandle(0)
    };

    const handleUpdate = () => {
        if (editValue.trim() !== "") {
            updateRoleHandle({ id: data.id, name: editValue });
        }
    };

    const {t} = useTranslation(translationConstant.ROLESANDPERMISSIONS)

    return (
        <div className={`px-3 py-2 border-2 border-gray-100 rounded focus:outline-none hover:bg-gray-200 ${selectedRole.id === data.id ? 'bg-gray-200' : ''}`}>
            {editStateId === data.id ? (
                <div className="flex items-center gap-3" >
                    <input
                        type="text"
                        className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1 text-white bg-text_primary_color rounded hover:opacity-70"
                            onClick={handleUpdate}
                        >
                           {t("RP_k8")}
                        </button>
                        <button
                            className="px-3 py-1 text-gray-400 border-gray-400 border-[1px] rounded"
                            onClick={handleCancel}
                        >
                           {t("RP_k4")}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-1 items-center gap-3">
                    <div className='flex-1'>
                        <button onClick={()=>selectRoleHandle(data.id)} className='text-start w-full'>
                            {data.name}
                        </button>
                    </div>
                    {index > 0 && (
                        <div>
                            <button
                                className="p-2 text-red-600 hover:text-red-400"
                                onClick={() => deleteRoleHandle(data.id)}
                            >
                                <TrashIcon size={20} />
                            </button>
                            <button
                                className="p-2 text-gray-500 hover:text-gray-700"
                                onClick={() => editHandle(data.id)}
                            >
                                <TbPencil size={20} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const RolesAndPermissionsComponent: React.FC = () => {
    const { roles, loadingDataState, activeForAddNewRoleInput, newAddLoading, handleAddRole, toggleActivateAddNewRoleHandle, deleteRoleHandle, updateRoleHandle, setEditStateIndexActivate, editStateId, selectRoleHandle, selectedRole, permissions, handlePermissionToggle, toggleAllPermissions } = useRolesAndPermissions()
   
    const [newRoleName, setNewRoleName] = useState("");
    const [newRolePermissions, setNewRolePermissions] = useState<Record<string, boolean>>({});

    const handleAllowAll = (allowed: boolean) => {
        toggleAllPermissions(allowed)
    };

    const { setActiveTitle } = useContext(TabContext);

    useEffect(() => {
        setActiveTitle("Sidebar_k17");
    }, []);

    // Initialize permissions for new role
    useEffect(() => {
        if (permissions.length > 0) {
            const initialPermissions: Record<string, boolean> = {};
            permissions.forEach((perm: any) => {
                initialPermissions[perm.name] = false;
            });
            setNewRolePermissions(initialPermissions);
        }
    }, [permissions]);

    const handlePermissionChange = (permissionName: string, allowed: boolean) => {
        setNewRolePermissions(prev => ({
            ...prev,
            [permissionName]: allowed
        }));
    };

    const handleCreateRole = () => {
        if (newRoleName.trim() !== "") {
            handleAddRole({
                name: newRoleName,
                permissions: newRolePermissions
            });
            setNewRoleName("");
            toggleActivateAddNewRoleHandle(false);
        }
    };

    const {t} = useTranslation(translationConstant.ROLESANDPERMISSIONS)

    return (
        <div className="p-6 w-full mx-auto max-h-[87dvh]">
            <div className="w-full gap-4">
                {/* User Roles Section */}
                <div className="w-full h-full flex flex-col flex-1">
                    <div className='flex items-center justify-between px-2 mb-3'>
                        <div>
                            <h2 className="text-lg font-bold">{t("RP_k1")}</h2>
                        </div>
                        <div>
                            <button className='bg-[#0066ff] text-white rounded-lg px-4 py-2' onClick={() => toggleActivateAddNewRoleHandle(true)}>
                                {t("RP_k6")}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-3 overflow-auto max-h-[70dvh] px-2 flex-1">
                        {loadingDataState ? <div className='flex justify-center py-4'><CircularProgress /></div> : roles.map((elem, index) => (
                            <SingleRoleHandle 
                                selectedRole={selectedRole} 
                                selectRoleHandle={selectRoleHandle} 
                                editHandle={setEditStateIndexActivate} 
                                editStateId={editStateId} 
                                updateRoleHandle={updateRoleHandle} 
                                deleteRoleHandle={deleteRoleHandle} 
                                key={elem.id} 
                                data={elem} 
                                index={index} 
                            />
                        ))}
                    </div>
                </div>

                {/* Permissions Section */}
                <div className="w-full">
                    <div className="flex items-center justify-between mb-4 px-2">
                        {selectedRole ? <label className="flex items-center gap-2">
                            <span>{t("RP_k1")}</span>
                            <Switch 
                                className='disabled:opacity-65' 
                                disabled={selectedRole?.id === 1}  
                                onChange={(e) => handleAllowAll(e)} 
                                checked={permissions?.every((perm:any) => perm.allowed) || selectedRole?.id === 1} 
                            />
                        </label> : null}
                    </div>
                    {selectedRole ? <div className="space-y-3 border-2 border-gray-100 rounded-md px-2 py-2">
                        {permissions.map((perm:any, index) => (
                            <PermissionToggle
                                key={index}
                                isAllowed={perm.allowed || selectedRole?.id === 1}
                                disabled={selectedRole?.id === 1}
                                permission={perm}
                                onToggle={handlePermissionToggle}
                            />
                        ))}
                    </div> : null}
                </div>
            </div>

            {/* Add New Role Sheet */}
            <Sheet open={activeForAddNewRoleInput} onOpenChange={toggleActivateAddNewRoleHandle}>
                <SheetContent className="w-full sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>{t("RP_k6")}</SheetTitle>
                    </SheetHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="role-title">{t("RP_k7")}</Label>
                            <Input 
                                id="role-title" 
                                value={newRoleName} 
                                onChange={(e) => setNewRoleName(e.target.value)} 
                                placeholder={t("RP_k7")}
                            />
                        </div>
                        
                        <div className="grid gap-2">
                            <Label>{t("RP_k2")}</Label>
                            <div className="space-y-3 border rounded-md p-4">
                                {permissions.map((perm: any) => (
                                    <div key={perm.name} className="flex items-center justify-between">
                                        <Label htmlFor={`perm-${perm.name}`}>{perm.name}</Label>
                                        <Switch
                                            id={`perm-${perm.name}`}
                                            checked={newRolePermissions[perm.name] || false}
                                            //@ts-ignore
                                            onCheckedChange={(checked) => handlePermissionChange(perm.name, checked)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <SheetFooter>
                        <div className="flex gap-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => toggleActivateAddNewRoleHandle(false)}
                            >
                                {t("RP_k4")}
                            </Button>
                            <Button 
                                type="submit" 
                                onClick={handleCreateRole}
                                disabled={newAddLoading || !newRoleName.trim()}
                            >
                                {newAddLoading ? <CircularProgress size={20} /> : t("RP_k8")}
                            </Button>
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default RolesAndPermissionsComponent;