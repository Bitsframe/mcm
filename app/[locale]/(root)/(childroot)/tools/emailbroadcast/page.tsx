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
import emailtemplate1 from "@/components/EmailTemplate/template1";
import emailtemplate2 from "@/components/EmailTemplate/template2";
import emailtemplate3 from "@/components/EmailTemplate/template3";
import emailtemplate4 from "@/components/EmailTemplate/template4";
import emailtemplate5 from "@/components/EmailTemplate/template5";
import emailtemplate6 from "@/components/EmailTemplate/template6";
import emailtemplate7 from "@/components/EmailTemplate/template7";
import emailtemplate8 from "@/components/EmailTemplate/template8";
import emailtemplate9 from "@/components/EmailTemplate/template9";
import emailtemplate10 from "@/components/EmailTemplate/template10";
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
import { toast } from "react-toastify";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { TabContext } from "@/context";

const EmailBroadcast: React.FC = () => {
  const [emailList, setEmailList] = useState<any[]>([]);
  const [locationList, setLocationList] = useState<any[]>([]);
  const [serviceList, setServiceList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFilterOn, setIsFilterOn] = useState<boolean>(false);
  const [filter, setFilter] = useState<any>(false);
  const [startDate, setStartDate] = React.useState<Date>();
  const [endDate, setEndDate] = React.useState<Date>();
  const [subject, setSubject] = React.useState<any>();
  const [reason, setReason] = React.useState<any>();
  const [buttonText, setButtonText] = React.useState<any>();
  const [buttonLink, setButtonLink] = React.useState<any>();
  const [clinicName, setClinicName] = React.useState<any>();
  const [price, setPrice] = React.useState<any>();
  const [name, setName] = React.useState<any>();
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

  const templates = [
    { label: "Template 1", value: "template1", component: emailtemplate1 },
    { label: "Template 2", value: "template2", component: emailtemplate2 },
    { label: "Template 3", value: "template3", component: emailtemplate3 },
    { label: "Template 4", value: "template4", component: emailtemplate4 },
    { label: "Template 5", value: "template5", component: emailtemplate5 },
    { label: "Template 6", value: "template6", component: emailtemplate6 },
    { label: "Template 7", value: "template7", component: emailtemplate7 },
    { label: "Template 8", value: "template8", component: emailtemplate8 },
    { label: "Template 9", value: "template9", component: emailtemplate9 },
    { label: "Template 10", value: "template10", component: emailtemplate10 },
  ];

  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k14");
  }, []);

  const [selectedTemplate, setSelectedTemplate] = useState<string>("template1");

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

  const RenderTemplate = () => {
    const SelectedTemplateComponent = templates.find(
      (template) => template.value === selectedTemplate
    )?.component;

    if (SelectedTemplateComponent) {
      return (
        <SelectedTemplateComponent
          userFirstname={"[Patient]"}
          reason={reason || "[Reason]"}
          clinicName={clinicName || "[ClinicName]"}
          name={name || "[Name]"}
          buttonText={buttonText || "[Button Text]"}
          buttonLink={buttonLink || "[buttonLink]"}
          startDate={moment(startDate).format("MM/DD/YYYY") || "[Start Date]"}
          endDate={moment(endDate).format("MM/DD/YYYY") || "[End Date]"}
          price={price || "0"}
        />
      );
    }
    return null;
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
      email?.email?.toLowerCase()?.includes(searchQuery.toLowerCase())
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
        setLoading(false);
      }
    };

    fetchEmailList();
  }, []);

  const sendEmail = async () => {
    if (!checkedItems && checkedItems.length == 0) {
      toast.error("No email selected .", { position: "top-center" });
      return;
    }
    try {
      if (!subject || !name || !price) {
        toast.error("All fields are necessary.", { position: "top-center" });
        return;
      }

      const toastId = toast.loading("Loading...");
      const res = await fetch("/api/sendEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          template: selectedTemplate,
          buttonLink,
          buttonText,
          name,
          clinicName,
          reason,
          startDate: moment(startDate).format("MM/DD/YYYY"),
          endDate: moment(endDate).format("MM/DD/YYYY"),
          email: checkedItems,
          price,
        }),
      });
      if (res.ok) {
        toast.update(toastId, {
          render: "Success! Email sent.",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.update(toastId, {
          render: "Error",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const { t } = useTranslation(translationConstant.EMAILB);

  return (
    <main className="w-full flex flex-row justify-between overflow-hidden p-6 gap-8 dark:bg-gray-900">
      <div className="w-1/2">
        <div className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="patients"
              className="text-sm font-medium flex items-center dark:text-white"
            >
              Target Patients <span className="text-red-500 ml-1">*</span>
            </label>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full p-2 my-1 border text-[16px] text-gray-500 dark:text-gray-300 text-left border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700">
                  {checkedItems.length > 0
                    ? checkedItems
                        .slice(0, 2)
                        .map((email: { email: string }) => email.email)
                        .join(", ") +
                      (checkedItems.length > 2
                        ? ` +${checkedItems.length - 2} more`
                        : "")
                    : t("EmailB_k1")}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[500px] h-[500px] overflow-auto flex-1 p-4 dark:bg-gray-800 dark:border-gray-700">
                <AlertDialogHeader>
                  {!filter ? (
                    <>
                      <div className="flex items-center cursor-pointer justify-between">
                        <div className="flex items-center">
                          <AlertDialogTitle className="bg-[#F1F4F9] dark:bg-gray-700 dark:text-white">
                            {t("EmailB_k7")}
                          </AlertDialogTitle>
                        </div>
                        <AlertDialogCancel className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600">
                          {" "}
                          <X color="gray" />{" "}
                        </AlertDialogCancel>
                      </div>
                      <div className="flex items-center justify-between ">
                        <div className="flex items-center ">
                          <h1 className="dark:text-white">{t("EmailB_k8")}</h1>
                          <div className="ml-2 border border-gray-300 dark:border-gray-600 rounded-lg">
                            <input
                              placeholder={t("EmailB_k9")}
                              type="text"
                              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
                        </div>
                        {!isFilterOn ? (
                          <Image
                            src={darkMode ? Filter : Filterblack}
                            alt=""
                            height={25}
                            width={25}
                            onClick={() => {
                              setFilter(true);
                            }}
                            className="cursor-pointer"
                          />
                        ) : (
                          <Image
                            src={Filterblack}
                            alt=""
                            height={25}
                            width={25}
                            onClick={() => {
                              setFilter(true);
                            }}
                            className="cursor-pointer"
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between  ">
                        <div className="flex items-center ">
                          <input
                            type="checkbox"
                            className="border bg-gray-300 dark:bg-gray-600 rounded p-2"
                            checked={
                              checkedItems.length === emailList.length &&
                              emailList.length > 0
                            }
                            onChange={(e) =>
                              handleSelectAndDeselectAll(e.target.checked)
                            }
                          />
                          <h2 className="ml-2 dark:text-white">
                            {t("EmailB_k10")}
                          </h2>
                        </div>
                        <h2 className="dark:text-white">{t("EmailB_k11")}</h2>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center cursor-pointer justify-between">
                      <div className="flex items-center">
                        <ChevronLeft
                          onClick={() => {
                            setFilter(false);
                          }}
                          className="dark:text-white"
                        />
                        <AlertDialogTitle className="dark:text-white">
                          Filter Patients
                        </AlertDialogTitle>
                      </div>
                      <AlertDialogCancel className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600">
                        {" "}
                        <X className="dark:text-white" />{" "}
                      </AlertDialogCancel>
                    </div>
                  )}
                  <hr className="dark:border-gray-700" />
                  <AlertDialogDescription>
                    {!filter && (
                      <>
                        {loading ? (
                          <div className="space-y-2">
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
                              className="flex justify-between items-center p-4 bg-[#F8F8F8] dark:bg-gray-700 w-[98%] my-2 rounded"
                            >
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  className="border-2 border-gray-500 bg-gray-300 dark:bg-gray-600 rounded p-2"
                                  id={`checkbox-${index}`}
                                  value={email.email}
                                  checked={checkedItems.some(
                                    (item: any) => item.email === email.email
                                  )}
                                  onChange={(e) =>
                                    handleCheckboxChange(e, email)
                                  }
                                />
                                <div className="flex flex-col">
                                  <Label className="mb-1 text-black dark:text-white font-bold">
                                    {email.firstname}
                                  </Label>
                                  <Label className="dark:text-gray-300">
                                    {email.email}
                                  </Label>
                                </div>
                              </div>
                              <div>
                                {" "}
                                <Label className="dark:text-white">
                                  {email.gender === "Male"
                                    ? "M"
                                    : email.gender === "Female"
                                    ? "F"
                                    : "O"}
                                </Label>
                              </div>
                            </div>
                          ))
                        )}
                      </>
                    )}
                    {filter && (
                      <div>
                        <br />
                        <br />
                        <RadioGroup defaultValue="comfortable">
                          <div className="flex">
                            {" "}
                            <h1 className="mr-2 font-bold text-black dark:text-white">
                              Gender
                            </h1>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                value="Male"
                                onChange={handleGenderChange}
                                className="border bg-gray-300 dark:bg-gray-600 rounded p-2"
                                checked={selectedGender.includes("Male")}
                              />
                              <Label htmlFor="r2" className="dark:text-white">
                                Male
                              </Label>
                            </div>
                            <div className="flex ml-2 items-center space-x-2">
                              <input
                                type="checkbox"
                                value="Female"
                                className="border bg-gray-300 dark:bg-gray-600 rounded p-2"
                                onChange={handleGenderChange}
                                checked={selectedGender.includes("Female")}
                              />
                              <Label htmlFor="r3" className="dark:text-white">
                                Female
                              </Label>
                            </div>
                            <div className="flex ml-2 items-center space-x-2">
                              <input
                                type="checkbox"
                                value="other"
                                className="border bg-gray-300 dark:bg-gray-600 rounded p-2"
                                onChange={handleGenderChange}
                                checked={selectedGender.includes("other")}
                              />
                              <Label htmlFor="r3" className="dark:text-white">
                                Other
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                        <br />
                        <div className="flex items-center">
                          <h1 className="mr-2 font-bold text-black dark:text-white">
                            Treatment Type
                          </h1>
                          <Select
                            onValueChange={(value) => setTreatmentType(value)}
                          >
                            <SelectTrigger className="w-[180px] dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                              <SelectValue className="dark:text-white">
                                {treatmentType
                                  ? treatmentType
                                  : "All Treatments"}
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
                        <br />
                        <RadioGroup defaultValue="comfortable">
                          <div className="flex">
                            {" "}
                            <h1 className="mr-2 font-bold text-black dark:text-white">
                              Visit Type
                            </h1>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                className="border bg-gray-300 dark:bg-gray-600 rounded p-2"
                                checked={onsite === true}
                                onChange={() => handleVisitChange(true)}
                              />
                              <Label htmlFor="r2" className="dark:text-white">
                                On-site
                              </Label>
                            </div>
                            <div className="flex ml-2 items-center space-x-2">
                              <input
                                type="checkbox"
                                className="border bg-gray-300 dark:bg-gray-600 rounded p-2"
                                checked={onsite === false}
                                onChange={() => handleVisitChange(false)}
                              />
                              <Label htmlFor="r3" className="dark:text-white">
                                Off-site
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                        <br />
                        <div className="flex items-center">
                          <h1 className="mr-2 font-bold text-black dark:text-white">
                            Location
                          </h1>
                          <Select onValueChange={(value) => setLocation(value)}>
                            <SelectTrigger className="w-[180px] dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                              <SelectValue className="dark:text-white">
                                {location ? location : "Select Location"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                              <SelectGroup>
                                {locationList
                                  ?.filter(
                                    (location, index, self) =>
                                      index ===
                                      self.findIndex(
                                        (loc) => loc.title === location.title
                                      )
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
                        <br />
                        <Button
                          onClick={() => handleReset()}
                          className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                        >
                          Reset
                        </Button>
                      </div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="template"
              className="text-sm font-medium flex items-center dark:text-white"
            >
              Email Template <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <select
                id="template"
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-white rounded-md border border-gray-200 dark:border-gray-600 appearance-none"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                {templates.map((template) => (
                  <option
                    key={template.value}
                    value={template.value}
                    className="dark:bg-gray-700 dark:text-white"
                  >
                    {template.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="#6B7280"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="subject"
              className="text-sm font-medium flex items-center dark:text-white"
            >
              Subject <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 text-sm rounded-md border border-gray-200 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium dark:text-white"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Name"
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 text-sm rounded-md border border-gray-200 dark:border-gray-600 dark:text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="price"
              className="text-sm font-medium dark:text-white"
            >
              Price
            </label>
            <input
              type="text"
              id="price"
              name="price"
              placeholder="Price"
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 text-sm rounded-md border border-gray-200 dark:border-gray-600 dark:text-white"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div>
            <button
              className="px-4 py-3 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
              onClick={sendEmail}
            >
              Run Email Broadcast
            </button>
          </div>
        </div>
      </div>

      <div className="w-1/2 p-5">
        <h2 className="text-sm font-medium mb-4 dark:text-white">Preview</h2>
        <div className="border border-gray-200 dark:border-gray-600 rounded-md p-6 bg-white dark:bg-gray-800">
          <RenderTemplate />
        </div>
      </div>
    </main>
  );
};

export default EmailBroadcast;
