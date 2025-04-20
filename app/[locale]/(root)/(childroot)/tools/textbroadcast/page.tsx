"use client";

import React, { useState, useEffect, useContext } from "react";
import Image from "next/image";
import Filter from "@/assets/images/icons/Filterwhite.png";
import Filterblack from "@/assets/images/icons/Filterblack.png";
import {
  getUserEmail,
  getLocations,
  getServices,
} from "@/actions/send-email/action";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { ChevronLeft, X } from "lucide-react";
import { RadioGroup } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { Textarea } from "@/components/ui/textarea";
import { TabContext } from "@/context";
import axios from "axios";
import { toast } from "sonner";

const formatPhoneNumber = (phone: string): string | null => {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length === 10 ? `+1${cleaned}` : null;
};

const TextBroadcast = () => {
  const [emailList, setEmailList] = useState<any[]>([]);
  const [locationList, setLocationList] = useState<any[]>([]);
  const [serviceList, setServiceList] = useState<any[]>([]);
  const [getEmailLoading, setGetEmailLoading] = useState<boolean>(true);
  const [isFilterOn, setIsFilterOn] = useState<boolean>(false);
  const [filter, setFilter] = useState<any>(false);
  const [checkedItems, setCheckedItems] = useState<any>([]);
  const [selectedGender, setSelectedGender] = useState<string[]>([]);
  const [onsite, setOnsite] = useState<boolean | undefined>();
  const [location, setLocation] = useState<any>(null);
  const [treatmentType, setTreatmentType] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [darkMode, setDarkMode] = useState(false);

  // Check for saved dark mode preference or system preference
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode !== null) {
      setDarkMode(savedMode === "true");
    } else {
      setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleGenderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setIsFilterOn(true);
    setSelectedGender((prev) =>
      prev.includes(value)
        ? prev.filter((gender) => gender !== value)
        : [...prev, value]
    );
  };

  const handleVisitChange = (type: boolean) => {
    setIsFilterOn(true);
    setOnsite(type);
  };

  const handleCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    emailObj: any
  ) => {
    const isChecked = event.target.checked;
    setIsFilterOn(true);

    setCheckedItems((prevCheckedItems: any[]) =>
      isChecked
        ? [...prevCheckedItems, emailObj]
        : prevCheckedItems.filter((item) => item.email !== emailObj.email)
    );
  };

  const handleReset = async () => {
    setSelectedGender([]);
    setOnsite(undefined);
    setLocation("");
    setTreatmentType("");
    setIsFilterOn(false);
  };

  const handleSelectAndDeselectAll = (isSelected: boolean) => {
    if (isSelected) {
      setCheckedItems(emailList);
    } else {
      setCheckedItems([]);
    }
  };

  const filterEmails = () => {
    let filteredEmails = emailList;

    if (selectedGender.length > 0) {
      filteredEmails = filteredEmails?.filter((item) =>
        selectedGender.includes(item.gender)
      );
    }

    if (treatmentType) {
      filteredEmails = filteredEmails?.filter(
        (item) => item.treatmenttype === treatmentType
      );
    }

    if (location) {
      filteredEmails = filteredEmails?.filter(
        (item) => item.Locations?.title === location
      );
    }

    if (typeof onsite === "boolean") {
      filteredEmails = filteredEmails?.filter((item) => item.onsite === onsite);
    }

    const selectedEmails = filteredEmails.filter((email) =>
      checkedItems.some((checkedItem: any) => checkedItem.email === email.email)
    );
    const unselectedEmails = filteredEmails.filter(
      (email) =>
        !checkedItems.some(
          (checkedItem: any) => checkedItem.email === email.email
        )
    );

    return [...selectedEmails, ...unselectedEmails].filter((email) =>
      email?.phone?.toLowerCase()?.includes(searchQuery.toLowerCase())
    );
  };

  const filteredEmails = filterEmails();

  useEffect(() => {
    const fetchEmailList = async () => {
      try {
        const email = await getUserEmail();
        setEmailList(email);
        const location = await getLocations();
        setLocationList(location);
        const services = await getServices();
        setServiceList(services);
      } catch (error) {
        console.error("Failed to fetch email:", error);
      } finally {
        setGetEmailLoading(false);
      }
    };

    fetchEmailList();
  }, []);

  const { t } = useTranslation(translationConstant.EMAILB);

  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k23");
  }, []);


  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitHandle = async () => {
    setError(null);
    setLoading(true);

    const allNumbers = checkedItems
      .map((elem:any) => formatPhoneNumber(elem.phone))
      .filter((num:any) => num !== null);

    if (allNumbers.length === 0) {
      setError("No valid phone numbers found.");
      setLoading(false);
      return;
    }

    if (!message.trim()) {
      setError("Message cannot be empty.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/send-sms", {
        phoneNumbers: allNumbers,
        message,
      });

      toast.success("BoardCash messages have been sent! 🎉");
      setMessage("");
      setCheckedItems([])
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <main className="dark:bg-gray-900 dark:text-white">
      <div className="text-black dark:text-white mt-5 font-bold text-xl">
        Text Broadcast
      </div>

      <div className="w-full text-black dark:text-white font-[500] text-[20px] mt-3 h-[33rem] p-5 bg-white dark:bg-gray-800 rounded-xl">
        <div className="flex w-full gap-5">
          <div className="w-[50%]">
            <>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4 flex flex-wrap items-center gap-2">
                {checkedItems.length > 0 ? (
                  <>
                    {checkedItems
                      .slice(0, 2)
                      .map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center bg-white dark:bg-gray-600 px-2 py-1 rounded-md"
                        >
                          <span className="text-sm dark:text-white">
                            {item.email}
                          </span>
                          <button
                            className="ml-1 text-gray-500 dark:text-gray-300"
                            onClick={() => {
                              /* Handle remove */
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M18 6L6 18M6 6L18 18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    {checkedItems.length > 2 && (
                      <span className="text-sm text-gray-500 dark:text-gray-300">
                        + {checkedItems.length - 2} more
                      </span>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 dark:text-gray-300 text-sm">
                    Selected Patients will be shown here
                  </p>
                )}
              </div>

              <h2 className="font-medium text-base mb-4 dark:text-white">
                Select Patients
              </h2>

              <div className="flex justify-between items-center mb-4">
                <div className="relative flex-1 mr-4">
                  <input
                    placeholder="Search by number"
                    type="text"
                    className="w-full p-2 pl-8 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                        stroke="#6B7280"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <div className="flex items-center space-x-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                      <Image
                        src={
                          isFilterOn
                            ? Filterblack
                            : darkMode
                            ? Filter
                            : Filterblack
                        }
                        alt="Filter icon"
                        height={20}
                        width={20}
                        className="cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Filter
                      </span>
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex items-center mb-4 justify-between">
                      <div className="flex items-center">
                        <ChevronLeft
                          onClick={() => setFilter(false)}
                          className="cursor-pointer text-gray-500 dark:text-gray-300"
                        />
                        <AlertDialogTitle className="ml-2 dark:text-white">
                          Filter Patients
                        </AlertDialogTitle>
                      </div>
                      <AlertDialogCancel className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600">
                        <X className="dark:text-white" />
                      </AlertDialogCancel>
                    </div>
                    <hr className="my-2 dark:border-gray-700" />
                    <RadioGroup defaultValue="comfortable">
                      <div className="flex mb-4 flex-wrap gap-4">
                        <h1 className="font-bold text-black dark:text-white w-full">
                          Gender
                        </h1>
                        {["Male", "Female", "other"].map((gender) => (
                          <div
                            className="flex items-center space-x-2"
                            key={gender}
                          >
                            <input
                              type="checkbox"
                              value={gender}
                              onChange={handleGenderChange}
                              className="border bg-gray-300 dark:bg-gray-600 rounded p-2"
                              checked={selectedGender.includes(gender)}
                            />
                            <Label className="dark:text-gray-300">
                              {gender}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                    <div className="mb-4">
                      <h1 className="mr-2 font-bold text-black dark:text-white">
                        Treatment Type
                      </h1>
                      <Select
                        onValueChange={(value) => setTreatmentType(value)}
                      >
                        <SelectTrigger className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-gray-500">
                          <SelectValue className="dark:text-white">
                            {treatmentType ? treatmentType : "All Treatments"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectGroup>
                            {serviceList.map((patient: any, index) => (
                              <SelectItem
                                value={patient.title}
                                key={index}
                                className="dark:hover:bg-gray-700 dark:text-white"
                              >
                                {patient.title}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <RadioGroup defaultValue="comfortable">
                      <div className="flex mb-4 flex-wrap gap-4">
                        <h1 className="font-bold text-black dark:text-white w-full">
                          Visit Type
                        </h1>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="border bg-gray-300 dark:bg-gray-600 rounded p-2"
                            checked={onsite === true}
                            onChange={() => handleVisitChange(true)}
                          />
                          <Label className="dark:text-gray-300">On-site</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="border bg-gray-300 dark:bg-gray-600 rounded p-2"
                            checked={onsite === false}
                            onChange={() => handleVisitChange(false)}
                          />
                          <Label className="dark:text-gray-300">Off-site</Label>
                        </div>
                      </div>
                    </RadioGroup>
                    <div className="mb-4">
                      <h1 className="mr-2 font-bold text-black dark:text-white">
                        Location
                      </h1>
                      <Select onValueChange={(value) => setLocation(value)}>
                        <SelectTrigger className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-gray-500">
                          <SelectValue className="dark:text-white">
                            {location ? location : "Select Location"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectGroup>
                            {locationList
                              ?.filter(
                                (loc, index, self) =>
                                  index ===
                                  self.findIndex((l) => l.title === loc.title)
                              )
                              .map((location, index) => (
                                <SelectItem
                                  key={index}
                                  value={location.title}
                                  className="dark:hover:bg-gray-700 dark:text-white"
                                >
                                  {location.title}
                                </SelectItem>
                              ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={() => handleReset()}
                      className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                    >
                      Reset
                    </Button>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    checked={
                      checkedItems.length === emailList.length &&
                      emailList.length > 0
                    }
                    onChange={(e) =>
                      handleSelectAndDeselectAll(e.target.checked)
                    }
                  />
                  <label className="ml-2 text-sm dark:text-gray-300">
                    Select all
                  </label>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-300">
                  {checkedItems.length} of {emailList.length} row(s) selected.
                </span>
              </div>

              <div className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                {loading ? (
                  <div className="space-y-2 p-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton
                        key={index}
                        className="h-10 w-full rounded dark:bg-gray-700"
                      />
                    ))}
                  </div>
                ) : (
                  filteredEmails.map((email: any, index: any) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-4 border-b dark:border-b-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-500 dark:bg-gray-700 dark:border-gray-600"
                          id={`checkbox-${index}`}
                          value={email.email}
                          checked={checkedItems.some(
                            (item: any) => item.email === email.email
                          )}
                          onChange={(e) => handleCheckboxChange(e, email)}
                        />
                        <div>
                          <p className="font-medium text-sm dark:text-white">
                            {email.firstname}
                          </p>
                          <div className="text-gray-500 dark:text-gray-300 text-sm">
                            <span>{email.email}</span>
                            <span className="ml-2 text-gray-400 dark:text-gray-400">
                              {email.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-gray-500 dark:text-gray-300 text-sm">
                        {email.gender === "Male"
                          ? "Male"
                          : email.gender === "Female"
                          ? "Female"
                          : "Other"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          </div>

          <div className="w-[50%]">
            <div className="dark:text-white">Write a Text Message</div>
            <Textarea
            onChange={(e)=>setMessage(e.target.value)}
            value={message}
              rows={10}
              className="w-full mt-3 bg-white dark:bg-gray-700 resize-none dark:text-white dark:border-gray-600"
              placeholder="Text Message..."
            />
            <div className="text-gray-500 dark:text-gray-300 mt-3 text-lg">
              This is the text we will use to send text campaign
            </div>
            <div className="flex w-2/4 mt-4">
              <button className="w-fit text-lg bg-[#0066ff] hover:bg-blue-700 py-2 px-6 rounded-lg text-white dark:bg-blue-700 dark:hover:bg-blue-800">
                Run Text Broadcast
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default TextBroadcast;
