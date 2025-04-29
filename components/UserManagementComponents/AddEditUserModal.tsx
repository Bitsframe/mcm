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
    <div className="w-full h-full flex justify-center items-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl px-6 py-6 w-full dark:bg-[#0e1725] max-w-[500px] shadow-lg ">
        <div className="flex justify-between items-center mb-6">
          <h2 id="add-edit-user-modal-title" className="text-lg font-semibold dark:text-white text-gray-900">
            {editData ? t("UM_k15") : t("UM_k2")}
          </h2>
          <button onClick={closeModalHandle} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
            &times;
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input_Component
              value={formData.fullName}
              placeholder={t("UM_k7")}
              border="border border-gray-200 rounded-lg dark:border-none"
              onChange={(value) => handleInputChange("fullName", value)}
            />

            <Select_Dropdown
              hideLabel
              label={t("UM_k8")}
              start_empty
              bg_color="#f1f4f9"
              value={formData.roleId}
              options_arr={roles.map((role) => ({ value: role.id, label: role.name }))}
              on_change_handle={(e) => handleInputChange("roleId", Number(e.target.value))}
              required
              
            />
          </div>

          <Input_Component
            value={formData.email}
            disabled={!!editData}
            placeholder={t("UM_k9")}
            type="email"
            border="border border-gray-200 rounded-lg dark:border-none"
            onChange={(value) => handleInputChange("email", value)}
          />

          <Input_Component
            value={formData.password}
            passwordEye
            disabled={!!editData}
            placeholder={t("UM_k10")}
            type="password"
            border="border border-gray-200 rounded-lg dark:border-none"
            onChange={(value) => handleInputChange("password", value)}
          />

          <LocationModal
            selectionLocationIds={formData.locationIds}
            onChange={(value: number[]) => handleInputChange("locationIds", value)}
          
          />

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleClose}
              className="px-5 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {t("UM_k12")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 rounded-md bg-[#0066ff] text-white hover:opacity-90 disabled:bg-gray-400"
            >
              {editData ? (loading ? "Updating..." : t("UM_k13")) : loading ? "Adding..." : t("UM_k14")}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</div>

    );
}
