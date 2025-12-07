"use client";
import { useEffect, useState, FC } from "react";
import ViewIcons from "../../../assets/images/icons/Sleepy Eyes.png";
import Image from "next/image";
import React from "react";
import { PageLikes, PageViews } from "../../../utils/facebook";

const PostClickLikes = () => {
  const [views, setViews] = useState(undefined);
  const [viewsPeriod, setViewsPeriod] = useState("day");

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const viewsofpages = await PageViews(viewsPeriod);

        setViews(viewsofpages);

        // console.log(likes);
      } catch (error) {
        console.error("Error fetching likes:", error);
      }
    };

    fetchLikes();
  }, [viewsPeriod]);
  return (
    <div
      className={`flex relative ml-5 mb-5   flex-col items-start   h-[150px] w-[100%] bg-[#C8E0BA] p-4  rounded-[10px]  cursor-pointer `}
    >
      <div className="w-[200px] text-xs  flex items-center justify-center  absolute rounded-[5px] top-3 right-3 bg-[#F6F6F6]">
        <div
          className={`${
            viewsPeriod === "day" &&
            "bg-[#343131]  text-white rounded-bl-[5px] rounded-tl-[5px] "
          } w-[24%] text-center cursor-pointer `}
          onClick={() => setViewsPeriod("day")}
        >
          day
        </div>
        <div
          className={`${
            viewsPeriod === "week" && "bg-[#343131]  text-white  "
          } w-[37%] text-center cursor-pointer `}
          onClick={() => setViewsPeriod("week")}
        >
          This week
        </div>
        <div
          className={`${
            viewsPeriod === "days_28" &&
            "bg-[#343131] rounded-br-[5px] rounded-tr-[5px] text-white  "
          } w-[37%] text-center cursor-pointer `}
          onClick={() => setViewsPeriod("days_28")}
        >
          This month
        </div>
      </div>

      <Image src={ViewIcons} width={50} height={5} alt="" />
      <div className="flex items-center">
        <p className=" text-3xl font-bold">{views}</p>
        <p className="ml-2">Page Views</p>
      </div>
    </div>
  );
};

export default PostClickLikes;
