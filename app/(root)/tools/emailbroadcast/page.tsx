"use client";
import React, { useState, useEffect, useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import Filter from "@/assets/images/icons/Filterwhite.png";
import Filterblack from "@/assets/images/icons/Filterblack.png";
import {
  getUserEmail,
  getLocations,
  getServices,
} from "@/actions/send-email/action";
import { cn } from "@/lib/utils";
import template1 from "@/assets/images/Avatar/temp1.png";
import template2 from "@/assets/images/Avatar/temp2.png";
import template3 from "@/assets/images/Avatar/temp3.png";
import template4 from "@/assets/images/Avatar/temp4.png";
import template5 from "@/assets/images/Avatar/temp5.png";
import { TabContext } from "@/context/ActiveTabContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronLeft, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
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
  const [name, setName] = React.useState<any>();
  const [checkedItems, setCheckedItems] = useState<any>([]);
  const [selectedGender, setSelectedGender] = useState("");
  const [onsite, setOnsite] = useState<boolean | undefined>();
  const [location, setLocation] = useState<any>("");
  const [treatmentType, setTreatmentType] = useState<any>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const handleGenderChange = (gender: any) => {
    setSelectedGender(selectedGender === gender ? "" : gender);
  };
  const handleVisitChange = (type: any) => {
    setOnsite(onsite === type ? "" : type);
  };
  const handleCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    emailObj: any
  ) => {
    const isChecked = event.target.checked;

    setCheckedItems(
      (prevCheckedItems: any[]) =>
        isChecked
          ? [...prevCheckedItems, emailObj] // Add the whole object if checked
          : prevCheckedItems.filter((item) => item.email !== emailObj.email) // Remove the object if unchecked by comparing the email
    );
  };

  const filterByGenderAndTreatment = (
    data: any,
    gender: string,
    treatmentType: string,
    location: string,
    onsite: boolean | undefined
  ) => {
    return data.filter(
      (item: any) =>
        item.gender === gender &&
        item.treatmenttype === treatmentType &&
        item.location === location &&
        item.onsite === onsite
    );
  };

  // Example usage
  const handleFilter = async () => {
    const filteredData = filterByGenderAndTreatment(
      checkedItems,
      selectedGender,
      treatmentType,
      location,
      onsite
    );
    toast.success("Filter Applied.", { position: "top-center" });
    setIsFilterOn(true);
  };

  const handlecancelFilter = async () => {
    toast.success("Filter Removed.", { position: "top-center" });
    setIsFilterOn(false);
    setSelectedGender("");
    setOnsite(undefined);
    setLocation("");
    setTreatmentType("");
  };

  const filterEmails = () => {
    let filteredEmails = emailList;
    if (selectedGender) {
      filteredEmails = filteredEmails.filter(
        (item: any) => item.gender === selectedGender
      );
    }
    if (treatmentType) {
      filteredEmails = filteredEmails.filter(
        (item: any) => item.treatmenttype === treatmentType
      );
    }
    if (location) {
      filteredEmails = filteredEmails.filter(
        (item: any) => item.Locationa.title === location
      );
    }
    if (onsite !== undefined) {
      filteredEmails = filteredEmails.filter(
        (item: any) => item.onsite === onsite
      );
    }
    return filteredEmails.filter((email) =>
      email.email.toLowerCase().includes(searchQuery.toLowerCase())
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
      if (
        !subject ||
        !name ||
        !clinicName ||
        !buttonText ||
        !buttonLink ||
        !startDate ||
        !endDate ||
        !reason
      ) {
        toast.error("All fields are necessary.", { position: "top-center" });
        return;
      }

      console.log(selectedGender, onsite, location, treatmentType);

      const toastId = toast.loading("Loading...");
      const res = await fetch("http://localhost:3000/api/sendEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          template: 1,
          buttonLink,
          buttonText,
          name,
          clinicName,
          reason,
          startDate,
          endDate,
          email: checkedItems,
        }),
      });
      if (res.ok) {
        toast.update(toastId, {
          render: "Success! Email sent.",
          type: "success",
          isLoading: false,
          autoClose: 3000, // Dismiss after 3 seconds
        });
      } else {
        toast.update(toastId, {
          render: "Error",
          type: "error",
          isLoading: false,
          autoClose: 3000, // Dismiss after 3 seconds
        });
        // console.log(res.error);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const templates = [
    // { id: 1, src: template1, name: "Template 1" },
    { id: 2, src: template2, name: "Template 2" },
    // { id: 3, src: template3, name: "Template 3" },
    // { id: 4, src: template4, name: "Template 4" },
    // { id: 5, src: template5, name: "Template 5" },
  ];

  return (
    <main className="w-full h-[150vh] text-[#B6B6B6] text-[20px] flex flex-row justify-start overflow-hidden items-center space-y-4 p-4">
      <div className=" w-[80%] h-full flex items-start justify-start flex-col ">
        <div className="w-full h-full mt-[80px]">
          <div className="w-[70%] flex flex-col">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full p-2 mb-2 border text-left border-gray-300 rounded">
                  Select Option
                </button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  {!filter ? (
                    <>
                      <div className="flex items-center cursor-pointer justify-between">
                        <div className="flex items-center">
                          <AlertDialogTitle>Select Patients</AlertDialogTitle>
                        </div>
                        <AlertDialogCancel>
                          {" "}
                          <X />{" "}
                        </AlertDialogCancel>
                      </div>
                      <div className="flex items-center justify-between ">
                        <div className="flex items-center ">
                          <h1>Search</h1>
                          <input
                            placeholder="Search by email"
                            className="p-2 ml-2 border border-gray-200 rounded-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        {!isFilterOn ? (
                          <Image
                            src={Filter}
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
                        <div className="flex ">
                          <input type="checkbox" id={`checkbox`} />
                          <h2 className="ml-2">Name/Email</h2>
                        </div>
                        <h2>Gender</h2>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center cursor-pointer justify-between">
                      <div className="flex items-center">
                        <ChevronLeft
                          onClick={() => {
                            setFilter(false);
                          }}
                        />
                        <AlertDialogTitle>Filter Patients</AlertDialogTitle>
                      </div>
                      <AlertDialogCancel>
                        {" "}
                        <X />{" "}
                      </AlertDialogCancel>
                    </div>
                  )}
                  <hr />
                  <AlertDialogDescription>
                    {!filter && (
                      <>
                        {loading ? (
                          <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Skeleton
                                key={index}
                                className="h-10 w-full rounded"
                              />
                            ))}
                          </div>
                        ) : (
                          filteredEmails.map((email: any, index: any) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-4 bg-[#F8F8F8] w-[98%] my-2 rounded"
                            >
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`checkbox-${index}`}
                                  value={email.email} // Keep this as the email for rendering
                                  checked={checkedItems.some(
                                    (item: any) => item.email === email.email
                                  )} // Check if the object is in the checkedItems array
                                  onChange={(e) =>
                                    handleCheckboxChange(e, email)
                                  } // Pass the whole object
                                />
                                <div className="flex flex-col">
                                  <Label className="mb-1 text-black font-bold">
                                    {email.firstname}
                                  </Label>
                                  <Label>{email.email}</Label>
                                </div>
                              </div>
                              <div>
                                {" "}
                                <Label>
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
                          <div className="flex ">
                            {" "}
                            <h1 className="mr-2  font-bold text-black">
                              Gender
                            </h1>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedGender === "Male"}
                                onChange={() => handleGenderChange("Male")}
                              />
                              <Label htmlFor="r2">Male</Label>
                            </div>
                            <div className="flex ml-2 items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedGender === "Female"}
                                onChange={() => handleGenderChange("Female")}
                              />
                              <Label htmlFor="r3">Female</Label>
                            </div>
                            <div className="flex ml-2 items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedGender === "Others"}
                                onChange={() => handleGenderChange("Others")}
                              />
                              <Label htmlFor="r3">Other</Label>
                            </div>
                          </div>
                        </RadioGroup>
                        <br />
                        <div className="flex items-center  ">
                          <h1 className="mr-2 font-bold text-black">
                            Treatment Type
                          </h1>
                          <Select
                            onValueChange={(value) => setTreatmentType(value)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {serviceList.map((patient: any, index) => (
                                  <SelectItem value={patient.title} key={index}>
                                    {patient.title}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                        <br />
                        <RadioGroup defaultValue="comfortable">
                          <div className="flex ">
                            {" "}
                            <h1 className="mr-2 font-bold text-black">
                              Visit Type
                            </h1>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={onsite}
                                onChange={() => handleVisitChange(true)}
                              />
                              <Label htmlFor="r2">On-site</Label>
                            </div>
                            <div className="flex ml-2 items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={!onsite}
                                onChange={() => handleVisitChange(false)}
                              />
                              <Label htmlFor="r3">Off-site</Label>
                            </div>
                          </div>
                        </RadioGroup>
                        <br />
                        <div className="flex items-center  ">
                          <h1 className="mr-2  font-bold text-black ">
                            Location
                          </h1>
                          <Select onValueChange={(value) => setLocation(value)}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select a location" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {/* <SelectLabel>Fruits</SelectLabel> */}
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
                                    >
                                      {location.title}
                                    </SelectItem>
                                  ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                        <br />
                        {isFilterOn ? (
                          <Button onClick={() => handlecancelFilter()}>
                            Remove Filter
                          </Button>
                        ) : (
                          <Button onClick={() => handleFilter()}>Apply</Button>
                        )}
                      </div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="border-gray-300 mb-2 border w-full rounded">
              <input
                type="text"
                id="subject"
                name="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Write Subject"
                className="w-full p-2  rounded"
              />
            </div>
            <div className="border-gray-300 mb-2 border w-full rounded">
              <input
                type="text"
                id="buttonLink"
                name="buttonLink"
                placeholder="Button Link"
                value={buttonLink}
                onChange={(e) => setButtonLink(e.target.value)}
                className="w-full p-2  rounded"
              />
            </div>
            <div className="border-gray-300 mb-2 border w-full rounded">
              <input
                type="text"
                id="clinicName"
                name="clinicName"
                placeholder="Clinic Name"
                className="w-full p-2  rounded"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
              />
            </div>
            <div className="border-gray-300 mb-2 border w-full rounded">
              <input
                type="text"
                id="Reason"
                name="Reason"
                placeholder="Reason"
                className="w-full p-2  rounded"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[100%] justify-start py-6 mb-2 text-left text-xl font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "PPP")
                  ) : (
                    <span>Start date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  id="startDate"
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[100%] justify-start py-6 mb-2 text-left text-xl  font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>End date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  id="endDate"
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <div className="border-gray-300 mb-2 border w-full rounded">
              <input
                type="text"
                id="buttonText"
                name="buttonText"
                placeholder="Button Text"
                className="w-full p-2  rounded"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
              />
            </div>
            <div className="border-gray-300 mb-2 border w-full rounded">
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Name"
                className="w-full p-2  rounded"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="mt-4 flex w-full">
              {/* {templates.map((template, index) => (
                <div
                  key={index}
                  className="flex flex-col w-[20%] rounded p-2 justify-center m-3 border border-gray-300 items-center mb-4"
                >
                  <Image
                    src={template.src}
                    alt={template.name}
                    className=" h-[100px]  w-[100px] "
                  />
                  <RadioGroup className="my-5">
                    <div className="flex w-full items-center justify-center ">
                      <RadioGroupItem value="default" id="r1" />
                      <Label htmlFor="r1" className="ml-1">
                        {template.name}
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="flex">
                    <Link href={`/template/${template.id}`} passHref>
                      <Button className="w-[90%]">Preview</Button>
                    </Link>
                  </div>
                </div>
              ))} */}
            </div>
          </div>
          <br />
          <Button onClick={sendEmail}>Submit</Button>
        </div>
      </div>
    </main>
  );
};

export default EmailBroadcast;
