"use client";

import { useState } from "react";
import { Select, Spinner } from "flowbite-react";
import { useLocationClinica } from "@/hooks/useLocationClinica";
import moment from "moment";

export interface Location {
  id: number;
  title: string;
}

export interface Data_Interface {
  id: number;
  location_id: number;
  name: string;
  question: string;
  answer: string;
  answered_by: string;
  date: string;
}

const data_demo: Data_Interface[] = [
  {
    id: 1,
    location_id: 1,
    name: "John",
    question: "What is charges for consultation?",
    answer: "its 981",
    answered_by: "Clinca san Miguel",
    date: "2024-06-28 21:28:52.532542+00",
  },
  {
    id: 1,
    location_id: 1,
    name: "John",
    question: "What is charges for consultation?",
    answer: "its 981",
    answered_by: "Clinca san Miguel",
    date: "2024-06-28 21:28:52.532542+00",
  },
  {
    id: 1,
    location_id: 1,
    name: "John",
    question: "What is charges for consultation?",
    answer: "its 981",
    answered_by: "Clinca san Miguel",
    date: "2024-06-28 21:28:52.532542+00",
  },
  {
    id: 1,
    location_id: 1,
    name: "John",
    question: "What is charges for consultation?",
    answer: "its 981",
    answered_by: "Clinca san Miguel",
    date: "2024-06-28 21:28:52.532542+00",
  },
  {
    id: 1,
    location_id: 1,
    name: "John",
    question: "What is charges for consultation?",
    answer: "its 981",
    answered_by: "Clinca san Miguel",
    date: "2024-06-28 21:28:52.532542+00",
  },
  {
    id: 1,
    location_id: 1,
    name: "John",
    question: "What is charges for consultation?",
    answer: "its 981",
    answered_by: "Clinca san Miguel",
    date: "2024-06-28 21:28:52.532542+00",
  },
];

const List_Item = ({ data }: { data: Data_Interface }) => {
  const { id, location_id, name, question, answer, answered_by, date } = data;

  return (
    <div
      className={`${"bg-[#D9D9D9]"}   px-3 py-3 rounded-lg  cursor-pointer pointer-events-auto`}
    >
      <div className="flex justify-between">
        <div className="space-y-3">
          <h1 className={`${"text-text_primary_color"}  font-medium text-xl`}>
            {`${name}`}
          </h1>
        </div>
        <div className="text-end">
          <h3 className={`${"text-text_primary_color"} font-normal text-lg`}>
            {moment(date, "YYYY-MM-DD h:mm s").format("YYYY-MM-DD")}
          </h3>
        </div>
      </div>

      <h3 className="text-[#27272B] text-lg">
        <span className="font-bold">Question:</span> {question}
      </h3>
      <h3 className="text-[#27272B] text-lg mt-5">
        <span className="font-bold">Answers:</span>
      </h3>
      <h3 className="text-text_primary_color text-lg font-light">
        {answered_by} -{" "}
        <span className="text-[#A4A4A4]">
          {moment(date, "YYYY-MM-DD h:mm s").fromNow()}
        </span>
      </h3>
      <h3 className="text-[#27272B] text-lg">{answer}</h3>
    </div>
  );
};

const GoogleQA = () => {
  const { locations } = useLocationClinica();

  const [data_list, setData_list] = useState(data_demo);

  const select_change_handle = async (e: any) => {
    const value = e.target.value;
  };

  return (
    <main className="relative mt-20 w-full h-full text-[#B6B6B6] font-[500] text-[20px] space-y-5">
      <div className="flex justify-between items-center ps-3 gap-3 ">
        <h1 className={`${"text-black"} font-bold text-xl`}>
          Question and Answers
        </h1>

        <div className="w-1/4 ">
          <div>
            <Select
              onChange={select_change_handle}
              style={{ backgroundColor: "#D9D9D9" }}
              id="locations"
              required
            >
              <option disabled selected value="">
                All locations
              </option>
              {locations.map((location: any, index: any) => (
                <option key={index} value={location.id}>
                  {location.title}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className=" h-[80vh] space-x-5 ">
        <div className="w-full bg-[#EFEFEF] h-full overflow-scroll px-3 py-3 rounded-lg space-y-5">
          {false ? (
            <div className="flex h-full flex-1 flex-col justify-center items-center">
              <Spinner size="xl" />
            </div>
          ) : data_list.length === 0 ? (
            <div className="flex h-full flex-1 flex-col justify-center items-center">
              <h1>No Q/A added yet!</h1>
            </div>
          ) : (
            data_list.map((data: Data_Interface, index: any) => (
              <List_Item key={index} data={data} />
            ))
          )}
          <h1>Im starting work</h1>
        </div>
      </div>
    </main>
  );
};

export default GoogleQA;
