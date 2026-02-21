"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Modal } from "flowbite-react";
import { Search } from "lucide-react";
import { supabase } from "@/services/supabase";
import { CircularProgress } from "@mui/material";

interface Patient {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  appointment_id: number;
  appointment_location_id: number;
  encounter_id: number;
  service: string;
  products?: Array<{
    product_id: number;
    product_quantity: number;
  }>;
}

interface PreSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient?: (patient: Patient) => void;
  locationId?: number;
}

const PreSalesModal: React.FC<PreSalesModalProps> = ({
  isOpen,
  onClose,
  onSelectPatient,
  locationId,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch patients from database
  useEffect(() => {
    if (isOpen && locationId) {
      fetchPreSalesPatients();
    }
  }, [isOpen, locationId]);

  const fetchPreSalesPatients = async () => {
    if (!locationId) {
      console.warn('⚠️ [PreSalesModal] No location ID provided');
      setPatients([]);
      return;
    }

    setLoading(true);
    console.log('🚀 [PreSalesModal] Starting fetch...');
    console.log('🔑 [PreSalesModal] Supabase client:', supabase ? 'Connected' : 'NOT CONNECTED');
    console.log('📍 [PreSalesModal] Filtering by location_id:', locationId);
    
    try {
      console.log('🔍 [PreSalesModal] Fetching pre-sales patients...');
      console.log('📝 [PreSalesModal] Query: pre_sales where status = initiated AND location_id =', locationId);
      
      // Fetch pre_sales records with status 'initiated' filtered by location
      // Join chain: pre_sales → encounter → Appoinments → allpatients
      const { data, error } = await supabase
        .from('pre_sales' as any)
        .select(`
          id,
          encounter_id,
          product_id,
          product_quantity,
          encounter:encounter_id (
            id,
            appointment_id,
            Appoinments:appointment_id (
              id,
              patient_id,
              service,
              location_id,
              allpatients:patient_id (
                id,
                firstname,
                lastname,
                email,
                phone
              )
            )
          )
        `)
        .eq('status', 'initiated');

      console.log('📊 [PreSalesModal] Raw data from Supabase:', JSON.stringify(data, null, 2));
      console.log('📊 [PreSalesModal] Data length:', data?.length);
      console.log('❌ [PreSalesModal] Error from Supabase:', error);

      if (error) {
        console.error('🔴 [PreSalesModal] Error fetching pre-sales patients:', error);
        console.error('🔴 [PreSalesModal] Error details:', JSON.stringify(error, null, 2));
        setPatients([]);
        return;
      }

      if (!data || data.length === 0) {
        console.log('⚠️ [PreSalesModal] No data returned from query');
        console.log('⚠️ [PreSalesModal] This could mean:');
        console.log('   1. No records with status = "initiated" in pre_sales table');
        console.log('   2. RLS policies are blocking the query');
        console.log('   3. Foreign key relationships are not set up correctly');
        setPatients([]);
        return;
      }

      console.log('🔄 [PreSalesModal] Starting data transformation...');
      
      // Group products by encounter_id
      const patientMap = new Map<number, Patient>();
      
      (data || []).forEach((item: any, index: number) => {
        console.log(`🔎 [PreSalesModal] Processing item ${index}:`, JSON.stringify(item, null, 2));
        
        const hasEncounter = !!item.encounter;
        const hasAppointment = !!item.encounter?.Appoinments;
        const hasPatient = !!item.encounter?.Appoinments?.allpatients;
        const appointmentLocationId = item.encounter?.Appoinments?.location_id;
        
        console.log(`   - Has encounter: ${hasEncounter}`);
        console.log(`   - Has Appoinments: ${hasAppointment}`);
        console.log(`   - Has allpatients: ${hasPatient}`);
        console.log(`   - Appointment location_id: ${appointmentLocationId}`);
        console.log(`   - Current location_id: ${locationId}`);
        
        if (!hasPatient) {
          console.log(`   ⚠️ Skipping item ${index} - missing patient data`);
          return;
        }
        
        // Filter by location_id
        if (appointmentLocationId !== locationId) {
          console.log(`   ⚠️ Skipping item ${index} - location mismatch (${appointmentLocationId} !== ${locationId})`);
          return;
        }
        
        const encounterId = item.encounter_id;
        const patientData = item.encounter.Appoinments.allpatients;
        // appointmentLocationId already declared above
        
        // Get or create patient entry
        if (!patientMap.has(encounterId)) {
          patientMap.set(encounterId, {
            id: patientData.id,
            firstname: patientData.firstname || '',
            lastname: patientData.lastname || '',
            email: patientData.email || '',
            phone: patientData.phone || '',
            appointment_id: item.encounter.Appoinments.id,
            appointment_location_id: appointmentLocationId,
            encounter_id: encounterId,
            service: item.encounter.Appoinments.service || '',
            products: [],
          });
        }
        
        // Add product to patient's products array
        const patient = patientMap.get(encounterId)!;
        if (item.product_id && item.product_quantity) {
          patient.products!.push({
            product_id: item.product_id,
            product_quantity: item.product_quantity,
          });
        }
        
        console.log(`✅ [PreSalesModal] Updated patient for encounter ${encounterId}:`, patient);
      });
      
      const transformedPatients = Array.from(patientMap.values());

      console.log('📋 [PreSalesModal] Final transformed patients count:', transformedPatients.length);
      console.log('📋 [PreSalesModal] Final transformed patients:', transformedPatients);
      setPatients(transformedPatients);
      console.log('✅ [PreSalesModal] Patients state updated successfully');
    } catch (err) {
      console.error('💥 [PreSalesModal] Exception caught:', err);
      console.error('💥 [PreSalesModal] Exception details:', JSON.stringify(err, null, 2));
      setPatients([]);
    } finally {
      console.log('🏁 [PreSalesModal] Fetch completed, setting loading to false');
      setLoading(false);
    }
  };

  // Filter patients based on search query
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;

    const query = searchQuery.toLowerCase();
    return patients.filter(
      (patient) =>
        patient.firstname.toLowerCase().includes(query) ||
        patient.lastname.toLowerCase().includes(query) ||
        patient.email.toLowerCase().includes(query) ||
        patient.phone.includes(query)
    );
  }, [searchQuery, patients]);

  const handleSelectPatient = (patient: Patient) => {
    if (onSelectPatient) {
      onSelectPatient(patient);
    }
    onClose();
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="2xl">
      <Modal.Header className="border-b border-gray-200 dark:bg-[#0e1725] dark:border-gray-700">
        <h2 className="text-xl font-bold text-black dark:text-white">
          Pre Sales - Select Patient
        </h2>
      </Modal.Header>

      <Modal.Body className="bg-white dark:bg-[#0e1725] text-black dark:text-white">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
        </div>

        {/* Patients List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CircularProgress size={32} />
              <p className="mt-2 text-gray-500 dark:text-gray-400">Loading patients...</p>
            </div>
          ) : filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => handleSelectPatient(patient)}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {patient.firstname} {patient.lastname}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {patient.email || 'No email'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {patient.phone || 'No phone'}
                    </p>
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    Select
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {patients.length === 0 
                ? 'No pre-sales patients with "initiated" status found.'
                : 'No patients found matching your search.'}
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0e1725]">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default PreSalesModal;
