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
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('');

  // Extract unique years, months, and days from the data
  const getUniqueYears = () => {
    // Generate a range of years from 1900 to current year
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year);
    }
    return years;
  };

  const getUniqueMonths = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  const getUniqueDays = () => {
    return Array.from({ length: 31 }, (_, i) => i + 1);
  };

  // Apply all filters
  const applyFilters = (query: string, year: string, month: string, day: string) => {
    let filtered = data;

    // Name search filter
    if (query) {
      filtered = filtered.filter(
        (patient) =>
          patient.first_name.toLowerCase().includes(query.toLowerCase()) ||
          patient.last_name.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Year filter
    if (year) {
      filtered = filtered.filter(patient => {
        if (!patient.dob) return false;
        return new Date(patient.dob).getFullYear() === parseInt(year);
      });
    }

    // Month filter
    if (month) {
      filtered = filtered.filter(patient => {
        if (!patient.dob) return false;
        return new Date(patient.dob).getMonth() + 1 === parseInt(month);
      });
    }

    // Day filter
    if (day) {
      filtered = filtered.filter(patient => {
        if (!patient.dob) return false;
        return new Date(patient.dob).getDate() === parseInt(day);
      });
    }

    setFilteredData(filtered);
  };

  // Filter the data based on search query
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(query, selectedYear, selectedMonth, selectedDay);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    applyFilters(searchQuery, year, selectedMonth, selectedDay);
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    applyFilters(searchQuery, selectedYear, month, selectedDay);
  };

  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    applyFilters(searchQuery, selectedYear, selectedMonth, day);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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
          placeholder="Search by name"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="p-2 border rounded mr-2"
        />
        {/* Filter button removed */}
      </div>

      {/* DOB Filters */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Search by : Date of birth</label>
        <div className="grid grid-cols-3 gap-3">
          {/* Year Filter */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="">All Years</option>
              {getUniqueYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="">All Months</option>
              {getUniqueMonths().map(month => (
                <option key={month} value={month}>{monthNames[month - 1]}</option>
              ))}
            </select>
          </div>

          {/* Day Filter */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Day</label>
            <select
              value={selectedDay}
              onChange={(e) => handleDayChange(e.target.value)}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="">All Days</option>
              {getUniqueDays().map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="min-w-full table-auto">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 text-left">Select</th>
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">First Name</th>
            <th className="px-4 py-2 text-left">Last Name</th>
            <th className="px-4 py-2 text-left">DOB</th>
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
              <td className="px-4 py-2">{patient.dob || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PatientList;
