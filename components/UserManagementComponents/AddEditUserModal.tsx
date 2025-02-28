import React, { useEffect, useState } from 'react';
import Modal from '@mui/material/Modal';
import { Input_Component } from '../Input_Component';
import { Select_Dropdown } from '../Select_Dropdown';
import LocationModal from './LocationModal';
import { CreateUserModalDataInterface } from '@/types/typesInterfaces';
import { useRolesAndPermissions } from '@/hooks/useRolesAndPermissions';
import { useTranslation } from 'react-i18next';
import { translationConstant } from '@/utils/translationConstants';

interface PropsInterface {
    open: boolean;
    handleClose: () => void;
    submitHandle: (data: CreateUserModalDataInterface) => Promise<void>;
    loading: boolean
    editData: any
}

// const roles = [
//     { id: 2, label: 'Admin' },
//     { id: 3, label: 'Manager' },
//     { id: 4, label: 'sales person' },
// ];

export default function AddEditUserModal({
    open,
    handleClose,
    submitHandle,
    loading,
    editData
}: PropsInterface) {
    const [formData, setFormData] = useState<CreateUserModalDataInterface>(editData ? editData : {
        email: '',
        roleId: 0,
        locationIds: [],
        fullName: '',
        password: '',
    });

    const { roles } = useRolesAndPermissions()


    useEffect(() => {
        if (editData) {
            setFormData(editData)
        }

    }, [editData])


    const handleInputChange = (field: keyof CreateUserModalDataInterface, value: string | number | number[]) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async () => {
        if (!formData.fullName || !formData.email || !formData.roleId) {
            alert('Please fill in all required fields.');
            return;
        }
        await submitHandle(formData);
    };


    const closeModalHandle = () => {
        setFormData({
            email: '',
            roleId: 0,
            locationIds: [],
            fullName: '',
            password: '',
        })
        handleClose()
    }

    const {t} = useTranslation(translationConstant.USERMANAGEMENT)

    return (
        <div>
            <Modal
                open={open}
                onClose={closeModalHandle}
                aria-labelledby="add-edit-user-modal-title"
                aria-describedby="add-edit-user-modal-description"
            >
                <div className="w-full h-full flex justify-center items-center">
                    <div className="bg-white rounded-md px-3 py-3 min-w-[650px]">
                        <h2 id="add-edit-user-modal-title" className="mb-4 font-bold">
                            {editData ?  t("UM_k15") : t("UM_k2")}
                        </h2>

                        <div className="flex flex-col w-full space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div >
                                    <Input_Component
                                        value={formData.fullName}
                                        placeholder={t("UM_k7")}
                                        border="border-[1px] border-gray-300 rounded-md"
                                        onChange={(value) => handleInputChange('fullName', value)}
                                    />
                                </div>

                                <div >
                                    <Select_Dropdown
                                        hideLabel={true}
                                        label={t("UM_k8")}
                                        start_empty={true}
                                        bg_color="#fff"
                                        value={formData.roleId}
                                        options_arr={roles.map((role) => ({ value: role.id, label: role.name }))}
                                        on_change_handle={(e) => handleInputChange('roleId', Number(e.target.value))}
                                        required
                                    />
                                </div>

                                <div className="col-span-full">
                                    <Input_Component
                                        value={formData.email}
                                        disabled={editData ? true : false}
                                        placeholder={t("UM_k9")}
                                        type='email'
                                        border="border-[1px] border-gray-300 rounded-md"
                                        onChange={(value) => handleInputChange('email', value)}
                                    />
                                </div>
                                <div className="col-span-full">
                                    <Input_Component
                                        value={formData.password}
                                        passwordEye
                                        disabled={editData ? true : false}
                                        placeholder={t("UM_k10")}
                                        type='password'
                                        border="border-[1px] border-gray-300 rounded-md"
                                        onChange={(value) => handleInputChange('password', value)}
                                    />
                                </div>

                                <div className="col-span-full">
                                    <LocationModal
                                        selectionLocationIds={formData.locationIds}
                                        onChange={(value: number[]) => handleInputChange('locationIds', value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-x-3 w-full">
                                <button
                                    onClick={handleClose}
                                    className="bg-[#F5F7F9] text-[#44444F] hover:bg-gray-200 px-4 py-2 rounded-md"
                                >
                                    {t("UM_k12")}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="bg-black border-2 border-black text-white px-4 py-2 rounded-md disabled:bg-gray-400 disabled:border-gray-400 col-span-3 w-full"
                                >
                                    {editData ? <span>
                                        {loading ? 'Updating...' : t("UM_k13")}
                                    </span> :
                                        <span>
                                            {loading ? 'Adding...' : t("UM_k14")}
                                        </span>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
