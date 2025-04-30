import React, { useState } from 'react';
import LocationModal from './LocationModal';
//@ts-ignore
import { User } from '@/types/user';
//@ts-ignore
// import { Location } from '@/types/location';

const UserManagement: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<number[]>([]);

  const handleLocationChange = (locations: number[]) => {
    setSelectedLocations(locations);
  };

  return (
    <div>
      <LocationModal
        onChange={handleLocationChange}
        selectionLocationIds={selectedLocations}
        userId={selectedUser?.id}
      />
    </div>
  );
};

export default UserManagement; 