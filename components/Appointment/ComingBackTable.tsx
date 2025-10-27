import React, { useState } from 'react';

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email_address: string;
  address?: string;
  phone?: string;
  date_and_time?: string | null;
  dob?: string | null;
  sex?: string;
}

interface PatientListProps {
  data: Patient[];
  onSelect?: (patient: Patient | null) => void;
}

const PatientList: React.FC<PatientListProps> = ({ data, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredData, setFilteredData] = useState<Patient[]>(data);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null); // Track selected patient ID

  // Filter the data based on search query
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = data.filter(
      (patient) =>
        patient.first_name.toLowerCase().includes(query.toLowerCase()) ||
        patient.last_name.toLowerCase().includes(query.toLowerCase()) ||
        patient.email_address.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredData(filtered);
  };

  // Filter button (e.g., you can add more filtering logic here)
  // (Filter button removed per request)

  // Handle selection change - radio behaviour (single select)
  const handleSelectPatient = (id: number) => {
    setSelectedPatient(id);
    const patient = data.find((p) => p.id === id) || null;
    if (onSelect) {
      onSelect(patient);
    }
  };

  return (
    <div className="p-4">
      {/* Search Input */}
      <div className="mb-4 flex items-center">
        <input
          type="text"
          placeholder="Search by name or email"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="p-2 border rounded mr-2"
        />
        {/* Filter button removed */}
      </div>

      {/* Table */}
      <table className="min-w-full table-auto">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 text-left">Select</th>
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">First Name</th>
            <th className="px-4 py-2 text-left">Last Name</th>
            <th className="px-4 py-2 text-left">Email</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((patient) => (
            <tr key={patient.id} className="border-b">
              <td className="px-4 py-2">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="coming-back-select"
                    checked={selectedPatient === patient.id}
                    onChange={() => handleSelectPatient(patient.id)}
                    className="sr-only"
                    aria-label={`Select patient ${patient.first_name} ${patient.last_name}`}
                  />
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #9ca3af',
                      borderRadius: 9999,
                      backgroundColor: selectedPatient === patient.id ? '#0066ff' : '#ffffff',
                    }}
                    className="mr-2"
                  >
                    {selectedPatient === patient.id && (
                      <span style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: '#fff' }} />
                    )}
                  </span>
                </label>
              </td>
              <td className="px-4 py-2">{patient.id}</td>
              <td className="px-4 py-2">{patient.first_name}</td>
              <td className="px-4 py-2">{patient.last_name}</td>
              <td className="px-4 py-2">{patient.email_address}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PatientList;
