import { Switch } from 'antd';
import React from 'react';

interface Permission {
  name: string;
  id: number;
  allowed: boolean;

}

interface PermissionToggleProps {
  isAllowed: boolean;
  disabled?: boolean;
  permission: Permission;
  onToggle: (id: number, isAllowed: boolean) => void;
}

const PermissionToggle: React.FC<PermissionToggleProps> = ({ permission, onToggle, isAllowed, disabled=false }) => {
  return (
    <div className="flex items-center justify-between px-3 py-2 ">
      <span>{permission.name}</span>
      <Switch className='disabled:opacity-65' disabled={disabled }  checked={isAllowed} onChange={() => onToggle(permission.id, !isAllowed)} />
    
    </div>
  );
};

export default PermissionToggle;
