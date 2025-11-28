"use client";
import React from "react";
import Image from "next/image";
import FansRemoveIcon from "../../../assets/images/icons/Remove.png";
import { useEffect, useState, FC } from "react";
import { PageFansRemoves } from "../../../utils/facebook";

const PageFanRemove = () => {
  const [fansRemove, setFansRemove] = useState(undefined);

  const [fansRemoveMenu, setFansRemoveMenu] = useState(false);

  const [fansRemovePeriod, setFansRemovePeriod] = useState("day");

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const fansremove = await PageFansRemoves(fansRemovePeriod);

        // console.log(fansremove);
        setFansRemove(fansremove);
      } catch (error) {
        console.error("Error fetching likes:", error);
      }
    };

    fetchLikes();
  }, [fansRemovePeriod]);

  return (
    <div
      className={`flex  relative flex-col items-start w-[50%] h-[150px] bg-[#F9CFCF] justify-start  mr-5 rounded-[10px] p-4  `}
    >
      <div className="flex flex-col w-[50%] top-3 right-3  absolute">
        <div className="w-[100%] text-xs  flex items-center justify-between px-2  mt-1 rounded-[5px]  bg-[#F6F6F6]">
          <div
            className={`${
              fansRemovePeriod === "day" && "bg-[#343131]  text-white"
            } cursor-pointer px-1 `}
            onClick={() => setFansRemovePeriod("day")}
          >
            day
          </div>
          <div
            className={`${
              fansRemovePeriod === "week" && "bg-[#343131]  text-white"
            } cursor-pointer px-1 `}
            onClick={() => setFansRemovePeriod("week")}
          >
            This week
          </div>
          <div
            className={`${
              fansRemovePeriod === "days_28" && "bg-[#343131] text-white"
            } cursor-pointer  px-1`}
            onClick={() => setFansRemovePeriod("days_28")}
          >
            This month
          </div>
        </div>
      </div>
      <Image src={FansRemoveIcon} width={50} height={5} alt="" />
      <p className=" text-3xl font-bold">{fansRemove}</p>
      <p className="">Page fans remove</p>
    </div>
  );
};

export default PageFanRemove;
