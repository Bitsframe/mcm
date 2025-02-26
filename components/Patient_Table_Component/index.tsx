'use client'
import React, { FC, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { Label, Spinner } from 'flowbite-react'
import moment from 'moment'
import { fetch_content_service } from '@/utils/supabase/data_services/data_services'
import { PiCaretUpDownBold } from 'react-icons/pi'
import { formatPhoneNumber } from '@/utils/getCountryName'
import { LocationContext } from '@/context'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

import { redirect } from 'next/navigation'
import { getServices } from '@/actions/send-email/action'
import { ScrollArea } from '../ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Button } from '../ui/button'
import { useTranslation } from 'react-i18next'
import { translationConstant } from '@/utils/translationConstants'
import { t } from 'i18next'

import axios from 'axios'

import { toast } from 'sonner'
interface EditPatientModalProps {
  patientDetails: Patient
  serviceList: { title: string }[]
  callAfterUpdate: (data: any) => void
}

interface Patient {
  id: number
  onsite: boolean
  firstname: string
  locationid: number
  lastname: string
  phone: string
  email: string
  treatmenttype: string
  gender: string
  created_at: string
  lastvisit: string
}

interface Props {
  renderType: 'all' | 'onsite' | 'offsite'
}

const QUERIES = {
  all: null,
  onsite: { key: 'onsite', value: true },
  offsite: { key: 'onsite', value: false },
} as const

const PatientTableComponent: FC<Props> = ({ renderType = 'all' }) => {
  const { selectedLocation } = useContext(LocationContext)
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [patientData, setPatientData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    treatmenttype: "",
    gender: "",
    onsite: true,
    locationId: 0,
  })

  const [sortConfig, setSortConfig] = useState({
    key: '',
    direction: -1
  })
  const [serviceList, setServiceList] = useState<{ title: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);


  const fetchServiceList = async () => {
    try {
      const services = await getServices();
      setServiceList(services);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const fetchPatients = useCallback(async (locationId: number) => {
    setLoading(true)
    try {
      const fetchedData = await fetch_content_service({
        table: 'allpatients',
        language: '',
        matchCase: [QUERIES[renderType] as any, { key: 'locationid', value: locationId }]
      })
      setPatients(fetchedData)
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }, [renderType])

  useEffect(() => {
    if (selectedLocation?.id) {
      fetchPatients(selectedLocation.id);
      fetchServiceList();
    }
  }, [selectedLocation?.id, fetchPatients])


  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  const handleSort = useCallback((column: string) => {
    setSortConfig(prevConfig => ({
      key: column,
      direction: prevConfig.key === column ? -prevConfig.direction : -1
    }))
  }, [])

  const filteredAndSortedPatients = useMemo(() => {
    let result = [...patients]

    // Filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(patient =>
        `${patient.firstname} ${patient.lastname}`.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (sortConfig.key === 'name') {
          const aName = `${a.firstname} ${a.lastname}`
          const bName = `${b.firstname} ${b.lastname}`
          return sortConfig.direction * aName.localeCompare(bName)
        }
        if (sortConfig.key === 'id') {
          return sortConfig.direction * (a.id - b.id)
        }
        if (sortConfig.key === 'date') {
          return sortConfig.direction * (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        }
        return 0
      })
    }

    return result
  }, [patients, searchTerm, sortConfig])

  const formatDate = useCallback((date: string) => {
    return moment(date, "YYYY-MM-DD h:mm s").format("MMM DD, YYYY")
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("HANDLE SUBMIT VALUE ->", patientData)
    console.log("SELECTED LOCATION ->", selectedLocation)
    if (!isFormValid) {
      toast.error("Please fill in all required fields.");
      return; 
    }
  
    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/user",
        {
          firstname: patientData.firstname,
          lastname: patientData.lastname,
          email: patientData.email,
          phone: patientData.phone,
          gender: patientData.gender,
          treatmenttype: patientData.treatmenttype,
          locationid: selectedLocation?.id || 17,
          lastvisit: new Date(),
          onsite: patientData.onsite,

        });
        fetchPatients(selectedLocation.id)
        setIsModalOpen(false);

        toast.success("Patient added successfully!");

      if(response.ok){
        toast(
          <div className="flex justify-between">
            <p>New patient added successfully.</p>
            <button
              onClick={() => toast.dismiss()} 
              className="absolute top-0 right-0 p-1 rounded hover:bg-gray-100"
            >
              <span className="text-sm">&#x2715;</span>
            </button>
          </div>,
        );
      }

      console.log("Patient added successfully:", response);
    }  catch (error) {
      toast.error("Failed to add patient. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }


  const updateOnEdit = (data: any) => {
    setPatients((pre: any) => {
      return pre.map((elem: any) => {
        if (data.id === elem.id) {
          return { ...data }
        }
        else {
          return elem
        }
      })
    })
    setSelectedPatient((pre: any) => ({ ...pre, ...data }))
  }


  useEffect(() => {
    fetchServiceList();
  }, [])

  const {t} = useTranslation(translationConstant.PATIENTS);
  const isFormValid = useMemo(() => {
    return patientData.firstname &&
           patientData.lastname &&
           patientData.email &&
           patientData.phone &&
           patientData.treatmenttype &&
           patientData.gender &&
           patientData.onsite !== undefined;
  }, [patientData]);

  return (
    <main className="w-full h-full font-[500] text-[20px]">
      <div className='flex justify-between items-center px-4 py-4 space-x-2'>
        <h1 className='text-xl font-bold'>{t("Patients_k1")}</h1>
      </div>
      <AlertDialog open={isModalOpen}>
        <AlertDialogTrigger asChild>
          <Button onClick={()=>setIsModalOpen(true)} variant="outline" className="text-black">
            Add a Patient
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Patient</AlertDialogTitle>
            <AlertDialogDescription className="flex gap-3 flex-wrap" asChild>
              <div>
                <p>Enter the patient's information below. Click save when you're done.</p>
                <p className="">
                  Current Location
                  <br />
                  {selectedLocation?.title}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstname" className="text-right">
                  First Name
                </Label>
                <Input
                  id="firstname"
                  className="col-span-3"
                  placeholder="Enter firstname"
                  onChange={(e) => setPatientData({ ...patientData, firstname: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastname" className="text-right">
                  Last Name
                </Label>
                <Input
                  id="lastname"
                  className="col-span-3"
                  placeholder="Enter lastname"
                  onChange={(e) => setPatientData({ ...patientData, lastname: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="col-span-3"
                  placeholder="Enter Email"
                  onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  className="col-span-3"
                  placeholder="Enter phone"
                  onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="treatmenttype" className="text-right">
                  Treatment Type
                </Label>
                <Select onValueChange={(value) => {
                  console.log("VALUE ->", value)
                  setPatientData({ ...patientData, treatmenttype: value })
                }}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select treatment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceList.map((service: { title: string }) => (
                      <SelectItem key={service.title} value={service.title}>
                        {service.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Gender</Label>
                <RadioGroup
                  defaultValue="female"
                  className="col-span-3 flex"
                  onValueChange={(value) => setPatientData({ ...patientData, gender: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">Other</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Location</Label>
                <RadioGroup
                  defaultValue="true"
                  className="col-span-3 flex"
                  onValueChange={(value) => setPatientData({ ...patientData, onsite: value === "true" })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="onsite" />
                    <Label htmlFor="onsite">On site</Label>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <RadioGroupItem value="false" id="offsite" />
                    <Label htmlFor="offsite">Off site</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button onClick={()=>setIsModalOpen(false)} variant={"destructive"} className="text-black">
                  Cancel
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction type="submit" disabled={isSubmitting}>Save</AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
      <div className='w-full min-h-[73dvh] h-[100%] py-2 px-2 grid grid-cols-3 gap-2'>
        <div className="bg-[#EFEFEF] h-full col-span-2 rounded-md py-6 px-6">
          <div className="flex items-center justify-between mb-4">
            <input
              onChange={handleSearch}
              value={searchTerm}
              type="text"
              placeholder={t("Patients_k3")}
              className="w-72 px-4 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          <div className="relative">
            {/* Fixed header table */}
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="w-1/3 px-4 py-2 text-lg font-medium text-gray-500 text-left">
                  {t("Patients_k4")}
                    <button
                      onClick={() => handleSort('id')}
                      className="ml-1 text-gray-400 hover:text-gray-600 active:opacity-70"
                    >
                      <PiCaretUpDownBold className={`inline ${sortConfig.key === 'id' ? "text-green-600" : ""}`} />
                    </button>
                  </TableHead>
                  <TableHead className="w-1/3 px-4 py-2 text-lg font-medium text-gray-500 text-left">
                  {t("Patients_k5")}
                    <button
                      onClick={() => handleSort('name')}
                      className="ml-1 text-gray-400 hover:text-gray-600 active:opacity-70"
                    >
                      <PiCaretUpDownBold className={`inline ${sortConfig.key === 'name' ? "text-green-600" : ""}`} />
                    </button>
                  </TableHead>
                  <TableHead className="w-1/3 px-4 py-2 text-lg font-medium text-gray-500 text-left">
                  {t("Patients_k6")}
                    <button
                      onClick={() => handleSort('date')}
                      className="ml-1 text-gray-400 hover:text-gray-600 active:opacity-70"
                    >
                      <PiCaretUpDownBold className={`inline ${sortConfig.key === 'date' ? "text-green-600" : ""}`} />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
            </Table>

            <div className="h-[52vh] overflow-y-auto">
              <Table>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="p-4">
                        <div className="flex justify-center items-center">
                          <Spinner size="xl" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredAndSortedPatients.length > 0 ? (
                    filteredAndSortedPatients.map((patient) => (
                      <TableRow
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient)}
                        className="cursor-pointer hover:bg-gray-50 border-b last:border-0 border-gray-200 bg-[#EFEFEF]"
                      >
                        <TableCell className="w-1/3 px-4 py-2 text-base text-black font-normal">
                          {patient.id}
                        </TableCell>
                        <TableCell className="w-1/3 px-4 py-2 text-base text-black font-normal">
                          {patient.firstname} {patient.lastname}
                        </TableCell>
                        <TableCell className="w-1/3 px-4 py-2 text-base text-black font-normal">
                          {formatDate(patient.created_at)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="p-4">
                        <div className="flex justify-center items-center">
                          <h1 className="text-black">No patient found!</h1>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className='bg-[#B8C8E1] h-[72dvh] rounded-md overflow-auto flex flex-col'>
          <div className=' px-4 py-4 bg-[#11252C80] border-b-[1px] border-b-[#817B7B] flex justify-between items-center'>
            <div className='text-xl font-normal text-white text-center'>
            {t("Patients_k7")}
            </div>
            <div>
              {selectedPatient && <EditPatientModal callAfterUpdate={
                updateOnEdit
              } patientDetails={selectedPatient} serviceList={serviceList} />}
            </div>
          </div>

          {selectedPatient && (
            <PatientDetails patient={selectedPatient} renderType={renderType} formatDate={formatDate} serviceList={serviceList} />
          )}
        </div>
      </div>
    </main>
  )
}

const PatientDetails: FC<{
  patient: Patient;
  serviceList: { title: string }[];
  renderType: Props['renderType'];
  formatDate: (date: string) => string;
}> = ({ patient, renderType, formatDate ,serviceList}) => {
  
const {t} = useTranslation(translationConstant.PATIENTS)


  return (
    <div className='overflow-auto h-[100%] px-4 py-4'>


      {/* <EditPatientModal patientDetails={patient} serviceList={serviceList} /> */}

      <div className='flex items-start justify-between font-semibold mb-4'>
        <dl>
          <dd className='font-bold text-2xl'>{patient.id}</dd>
          <dt className='text-lg text-[#707070]'>{t("Patients_k4")}</dt>
        </dl>
        {renderType === 'all' && (
          <div>
            <p className='px-2 py-[2px] text-[16px] rounded-md bg-text_primary_color text-white'>
              {patient.onsite ? 'On-site' : 'Off-site'} Patient
            </p>
          </div>
        )}
      </div>
      <dl>
        <dd className='font-bold text-2xl'>
          {patient.firstname} {patient.lastname}
        </dd>
        <dt className='text-lg text-[#707070]'>{t("Patients_k5")}</dt>
      </dl>
      <div className='h-[1px] w-full bg-black my-3' />
      <div className='space-y-7'>
        <dl>
          <dd className='font-semibold text-lg'>{formatPhoneNumber(patient.phone)}</dd>
          <dt className='text-sm text-[#707070]'>{t("Patients_k9")}</dt>
        </dl>
        <dl>
          <dd className='font-semibold text-lg'>{patient.email}</dd>
          <dt className='text-sm text-[#707070]'>{t("Patients_k10")}</dt>
        </dl>
        <dl>
          <dd className='font-semibold text-lg'>{patient.treatmenttype}</dd>
          <dt className='text-sm text-[#707070]'>{t("Patients_k11")}</dt>
        </dl>
        <dl>
          <dd className='font-semibold text-lg'>{patient.gender}</dd>
          <dt className='text-sm text-[#707070]'>{t("Patients_k12")}</dt>
        </dl>

        <div className='flex items-center flex-1'>
          <dl className='flex-1'>
            <dd className='font-semibold text-lg'>{formatDate(patient.created_at)}</dd>
            <dt className='text-sm text-[#707070]'>{t("Patients_k13")}</dt>
          </dl>
          <dl className='flex-1'>
            <dd className='font-semibold text-lg'>{formatDate(patient.lastvisit)}</dd>
            <dt className='text-sm text-[#707070]'>{t("Patients_k14")}</dt>
          </dl>
        </div>
      </div>
    </div>
  )
}

const EditPatientModal: React.FC<EditPatientModalProps> = ({ patientDetails, serviceList, callAfterUpdate }) => {
  const [patientData, setPatientData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    treatmenttype: "",
  });

  const [loading, setLoading] = useState(false);
  const { selectedLocation } = useContext(LocationContext)
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
    e.preventDefault();
    setPatientData({ ...patientData, [e.target.name]: e.target.value });
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await axios.put("/api/user",
        {
          id: patientDetails?.id,
          firstname: patientData?.firstname,
          lastname: patientData?.lastname,
          email: patientData?.email,
          phone: patientData?.phone,
          treatmenttype: patientData?.treatmenttype,

        })

      if (data?.data?.success === true) {
        callAfterUpdate(data?.data?.data?.[0])

      }


      if(data.ok){
        toast(
          <div className="flex justify-between">
            <p>Patient details updated successfully.</p>
            <button
              onClick={() => toast.dismiss()} 
              className="absolute top-0 right-0 p-1 rounded hover:bg-gray-100"
            >
              <span className="text-sm">&#x2715;</span>
            </button>
          </div>,
        );
      }

      console.log("Patient details updated successfully:", data);
    } catch (error: any) {
      console.log("Error updating patient details:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const {t} = useTranslation(translationConstant.PATIENTS);

  return (

    <AlertDialog key={'edit-patient-modal'} >
      <AlertDialogTrigger asChild>
        {/* <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition duration-200">
          Edit
        </button> */}
        <Button className="bg-[#aec2e4] text-black text-base hover:bg-[#EFEFEF] border-black w-20">
         {t("Patients_k8")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="p-6 rounded-lg shadow-lg bg-white" >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-gray-900">
          {t("Patients_k15")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-600">
          {t("Patients_k16")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 mt-3">
          {errorMessage && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">{t("Patients_k17")}</label>
            <Input
              type="text"
              name="firstname"
              value={patientData.firstname}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{t("Patients_k18")}</label>
            <Input
              type="text"
              name="lastname"
              value={patientData.lastname}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{t("Patients_k19")}</label>
            <Input
              type="text"
              name="phone"
              value={patientData.phone}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{t("Patients_k20")}</label>
            <Input
              type="email"
              name="email"
              value={patientData.email}
              onChange={handleChange}
            />
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700">Treatment Type</label>
            <Input
              type="text"
              name="treatmenttype"
              value={patientData.treatmenttype}
              onChange={handleChange}
            />
          </div> */}

        </div>

        {/* <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <Input type="text" name="lastname" value={patientData.lastname} onChange={handleChange} />
        </div>
  
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <Input type="text" name="phone" value={patientData.phone} onChange={handleChange} />
        </div>
  
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <Input type="email" name="email" value={patientData.email} onChange={handleChange} />
        </div> */}

        {/* Treatment Type Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700">{t("Patients_k11")}</label>
          <DropdownMenu modal={true}>
            <DropdownMenuTrigger>{patientData.treatmenttype || "Select Treatment"}</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{t("Patients_k11")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-72 w-48 overflow-y-auto">
                {serviceList.map((service) => (
                  <DropdownMenuItem
                    key={service.title}
                    onSelect={() => setPatientData(prev => ({ ...prev, treatmenttype: service.title }))}
                  >
                    {service.title}
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      
  
      <AlertDialogFooter className="mt-4 flex justify-end gap-2">
        <AlertDialogCancel className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md transition">
          {t("Patients_k21")}
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

export default PatientTableComponent