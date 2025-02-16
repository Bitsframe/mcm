import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "../ui/input";


interface EditPatientModalProps {
  patientDetails: {
    id: number; 
    firstname: string;
    lastname: string;
    phone: string;
    email: string;
    treatmenttype: string;
  };
}

const EditPatientModal: React.FC<EditPatientModalProps> = ({ patientDetails }) => {
  const supabase = createClient(); 
  console.log("patientDetails",patientDetails);
  const [patientData, setPatientData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    treatmenttype: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (patientDetails) {
      setPatientData({
        firstname: patientDetails.firstname || "",
        lastname: patientDetails.lastname || "",
        phone: patientDetails.phone || "",
        email: patientDetails.email || "",
        treatmenttype: patientDetails.treatmenttype || "",
      });
    }
  }, [patientDetails]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPatientData({ ...patientData, [e.target.name]: e.target.value });
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    setErrorMessage("");
  
    console.log("Existing patient details:", patientDetails);
    console.log("Updated patient data:", patientData);
  
    try {
      const { error, data, status } = await supabase
        .from("allpatients")
        .update({
          firstname: patientData?.firstname,
          lastname: patientData?.lastname,
          email: patientData?.email,
          phone: patientData?.phone,
          treatmenttype: patientData?.treatmenttype,
        })
        .eq("id", Number(patientDetails.id))
        .select(); 
        
      console.log("Supabase Response:", { status, data, error });
  
    } catch (error: any) {
      console.log("Error updating patient details:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition duration-200">
          Edit
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="p-6 rounded-lg shadow-lg bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-gray-900">
            Edit Patient Details
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-600">
            Make changes to the patient's information and save them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 mt-3">
          {errorMessage && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <Input
              type="text"
              name="firstname"
              value={patientData.firstname}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <Input
              type="text"
              name="lastname"
              value={patientData.lastname}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <Input
              type="text"
              name="phone"
              value={patientData.phone}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              name="email"
              value={patientData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Treatment Type</label>
            <Input
              type="text"
              name="treatmenttype"
              value={patientData.treatmenttype}
              onChange={handleChange}
            />
          </div>
        </div>

        <AlertDialogFooter className="mt-4 flex justify-end gap-2">
          <AlertDialogCancel className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md transition">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSaveChanges}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EditPatientModal;
