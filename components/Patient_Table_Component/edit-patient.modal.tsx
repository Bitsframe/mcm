import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";
import { Input } from "../ui/input";

const EditPatientModal: React.FC = () => {
  const [patientData, setPatientData] = useState({
    name: "Alexa Williams",
    phone: "(467) 895-2947",
    email: "ecarroll@ortiz-guerrero.com",
    treatmentType: "Seniors",
    gender: "Other"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPatientData({ ...patientData, [e.target.name]: e.target.value });
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

        {/* Input Fields */}
        <div className="space-y-4 mt-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Patient Name</label>
            <Input
              type="text"
              name="name"
              value={patientData.name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Patient Phone</label>
            <Input
              type="text"
              name="phone"
              value={patientData.phone}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Patient Email</label>
            <Input
              type="email"
              name="email"
              value={patientData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Treatment Type</label>
            <Input
              type="text"
              name="treatmentType"
              value={patientData.treatmentType}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <Input
              type="text"
              name="gender"
              value={patientData.gender}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <AlertDialogFooter className="mt-4 flex justify-end gap-2">
          <AlertDialogCancel className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md transition">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition">
            Save Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EditPatientModal;
