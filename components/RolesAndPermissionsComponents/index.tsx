"use client"

import React, { useContext, useEffect, useState } from 'react';
import PermissionToggle from './PermissionToggle';
import RoleInput from './RoleInput';
import { TbPencil } from "react-icons/tb";
import { Switch } from 'antd';
import { useRolesAndPermissions } from '@/hooks/useRolesAndPermissions';
import { CircularProgress } from '@mui/material';
import { TrashIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { translationConstant } from '@/utils/translationConstants';
import { TabContext } from '@/context';


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
   

    const handleAllowAll = (allowed: boolean) => {
        // setPermissions((prev) => prev.map((perm) => ({ ...perm, allowed })));
        toggleAllPermissions(allowed)
    };

    const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k17");
  }, []);

    const {t} = useTranslation(translationConstant.ROLESANDPERMISSIONS)

    return (
        <div className="p-6 bg-white rounded shadow-lg w-full mx-auto max-h-[87dvh] ">
            <div className="grid grid-cols-2 gap-4">
                {/* User Roles Section */}
                <div className="w-full h-full flex  flex-col flex-1">
                    <div className='flex items-center justify-between px-2 mb-3'>
                        <div>
                            <h2 className="text-lg font-bold ">{t("RP_k1")}</h2>
                        </div>

                        <div>
                            <button onClick={() => toggleActivateAddNewRoleHandle(true)} className='bg-black text-sm text-white px-5 py-2 rounded-md hover:opacity-70 active:opacity-90'>
                               {t("RP_k6")}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-3 overflow-auto max-h-[70dvh] px-2 flex-1">
                        {loadingDataState ? <div className='flex justify-center py-4'><CircularProgress /></div> : roles.map((elem, index) => (
                            <SingleRoleHandle selectedRole={selectedRole} selectRoleHandle={selectRoleHandle} editHandle={setEditStateIndexActivate} editStateId={editStateId} updateRoleHandle={updateRoleHandle} deleteRoleHandle={deleteRoleHandle} key={elem.id} data={elem} index={index} />
                        ))}
                    </div>

                    <div className='px-2'>
                        {activeForAddNewRoleInput ? <RoleInput key={activeForAddNewRoleInput ? 1 : 0}
                            loading={newAddLoading}
                            cancelHandle={() => toggleActivateAddNewRoleHandle(false)}
                            onSave={handleAddRole}
                        /> : null}
                    </div>
                </div>

                {/* Permissions Section */}
                <div className="w-full ">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-lg font-bold">{t("RP_k2")}</h2>
                        {selectedRole ? <label className="flex items-center gap-2">
                            <span>{t("RP_k1")}</span>
                            <Switch className='disabled:opacity-65' disabled={selectedRole?.id === 1}  onChange={(e) => handleAllowAll(e)} 
                            
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
        </div>
    );
};

export default RolesAndPermissionsComponent;