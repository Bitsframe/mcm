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
import { toast } from "react-toastify";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { Textarea } from "@/components/ui/textarea";
import { TabContext } from "@/context";

const TextBroadcast = () => {
  const [emailList, setEmailList] = useState<any[]>([]);
  const [locationList, setLocationList] = useState<any[]>([]);
  const [serviceList, setServiceList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFilterOn, setIsFilterOn] = useState<boolean>(false);
  const [filter, setFilter] = useState<any>(false);
  const [checkedItems, setCheckedItems] = useState<any>([]);
  const [selectedGender, setSelectedGender] = useState<string[]>([]);
  const [onsite, setOnsite] = useState<boolean | undefined>();
  const [location, setLocation] = useState<any>(null);
  const [treatmentType, setTreatmentType] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

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

    // Split filtered emails into selected and unselected
    const selectedEmails = filteredEmails.filter((email) =>
      checkedItems.some((checkedItem: any) => checkedItem.email === email.email)
    );
    const unselectedEmails = filteredEmails.filter(
      (email) =>
        !checkedItems.some(
          (checkedItem: any) => checkedItem.email === email.email
        )
    );

    // Combine selected at the top, followed by unselected
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

  const { t } = useTranslation(translationConstant.EMAILB);

  const { setActiveTitle } = useContext(TabContext); // Context se setActiveTitle nikalo

  // ✅ Page load hone par activeTitle set karo
  useEffect(() => {
    setActiveTitle("Sidebar_k23"); // "All Patients" ke liye key
  }, []);

  return (
    <main>
      <div className="text-black mt-24 font-bold text-xl">Text Broadcast</div>

      <div className="w-full text-black font-[500] text-[20px] mt-3 h-[33rem] p-5 bg-[#D9DFE9] rounded-xl">
        <div>
          <div>Target Patients</div>
          <div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-2/4 p-2 my-1 border text-[16px] text-gray-500 text-left border-black rounded">
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

              <AlertDialogContent className="w-[500px] h-[500px] overflow-auto flex-1 p-4 ">
                <AlertDialogHeader>
                  {!filter ? (
                    <>
                      <div className="flex items-center cursor-pointer justify-between">
                        <div className="flex items-center">
                          <AlertDialogTitle>{t("EmailB_k7")}</AlertDialogTitle>
                        </div>
                        <AlertDialogCancel>
                          {" "}
                          <X color="gray" />{" "}
                        </AlertDialogCancel>
                      </div>
                      <div className="flex items-center justify-between ">
                        <div className="flex items-center ">
                          <h1>{t("EmailB_k8")}</h1>
                          <div className="ml-2 border border-gray-300 rounded-lg">
                            <input
                              placeholder={t("EmailB_k9")}
                              type="text"
                              className="p-2  border border-gray-300 rounded-lg"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
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
                        <div className="flex items-center ">
                          <input
                            type="checkbox"
                            className="border bg-gray-300 rounded p-2 "
                            checked={
                              checkedItems.length === emailList.length &&
                              emailList.length > 0
                            }
                            onChange={(e) =>
                              handleSelectAndDeselectAll(e.target.checked)
                            }
                          />

                          <h2 className="ml-2">{t("EmailB_k10")}</h2>
                        </div>
                        <h2>{t("EmailB_k11")}</h2>
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
                                  className="border-2 border-gray-500  bg-gray-300 rounded p-2"
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
                                value="Male"
                                onChange={handleGenderChange}
                                className="border bg-gray-300 rounded p-2 "
                                checked={selectedGender.includes("Male")}
                              />
                              <Label htmlFor="r2">Male</Label>
                            </div>
                            <div className="flex ml-2 items-center space-x-2">
                              <input
                                type="checkbox"
                                value="Female"
                                className="border bg-gray-300 rounded p-2 "
                                onChange={handleGenderChange}
                                checked={selectedGender.includes("Female")}
                              />
                              <Label htmlFor="r3">Female</Label>
                            </div>
                            <div className="flex ml-2 items-center space-x-2">
                              <input
                                type="checkbox"
                                value="other"
                                className="border bg-gray-300 rounded p-2 "
                                onChange={handleGenderChange}
                                checked={selectedGender.includes("other")}
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
                              <SelectValue>
                                {treatmentType
                                  ? treatmentType
                                  : "All Treatments"}
                              </SelectValue>
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
                                className="border bg-gray-300 rounded p-2 "
                                checked={onsite === true}
                                onChange={() => handleVisitChange(true)}
                              />
                              <Label htmlFor="r2">On-site</Label>
                            </div>
                            <div className="flex ml-2 items-center space-x-2">
                              <input
                                type="checkbox"
                                className="border bg-gray-300 rounded p-2 "
                                checked={onsite === false}
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
                              <SelectValue>
                                {location ? location : "Select Location"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
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
                                    >
                                      {location.title}
                                    </SelectItem>
                                  ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                        <br />
                        <Button onClick={() => handleReset()}>Reset</Button>
                      </div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="mt-5">
            <div>Write a Text Message</div>
            <Textarea  rows={10} className="w-2/4 mt-3 bg-white resize-none h-full" placeholder="Text Message..." />
            <div className="text-gray-500 mt-3 text-lg">This is the text we will use to send text campaign</div>
          </div>
          <div className="flex justify-end w-2/4 mt-4">
          <Button className="w-48">Run Text Broadcast</Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default TextBroadcast;
