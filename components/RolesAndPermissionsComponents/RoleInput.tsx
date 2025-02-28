import { translationConstant } from '@/utils/translationConstants';
import {LinearProgress } from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface RoleInputProps {
  onSave: (value:string) => void;
  cancelHandle: () => void;
  loading:boolean
}

const RoleInput: React.FC<RoleInputProps> = ({onSave, cancelHandle, loading }) => {
  const [value, setvalue] = useState('')
  const onChangeHandle = (e:any) => {
      setvalue(e.target.value)
  }

  const {t} = useTranslation(translationConstant.ROLESANDPERMISSIONS)

  return (
    <div className="mt-4 flex items-center border-2 border-gray-100 rounded focus:outline-none" >
      <input
      disabled={loading}
        type="text"
        value={value}
        placeholder={t("RP_K3")}
        onChange={onChangeHandle}
        className="w-full px-3 py-2 border rounded focus:outline-none flex-1 disabled:opacity-60"
      />
      <div className="flex gap-2 py-1 px-1">
        <button disabled={loading}  onClick={cancelHandle} className='px-4 py-2 rounded  disabled:opacity-65'>{t("RP_K4")}</button>
        <button
          disabled={!value || loading}
          onClick={() => onSave(value)}
          className={`px-4 w-24 py-2 ${!value || loading ? 'bg-gray-100 text-gray-600' : 'bg-text_primary_color text-white'} rounded`}
        >
          {loading ? <LinearProgress color='inherit' /> : t('RP_K5')}
        </button>
      </div>
    </div>
  );
};

export default RoleInput;
