"use client";
import { useEffect, useState, FC } from "react";
import LikeIcons from "../../../assets/images/icons/Thumbs Down.png";
import ViewIcons from "../../../assets/images/icons/Sleepy Eyes.png";
import EngagementIcons from "../../../assets/images/icons/Wedding Rings.png";
import ImpressionIcons from "../../../assets/images/icons/Commercial.png";
import Image from "next/image";
import React from "react";
import {
  PageLikes,
  PageViews,
  PageUserEngagment,
  PageImpressions,
} from "../../../utils/facebook";
interface Card1 {
  color: string;
  name: string;
}

// const setIcon = (name: string): string => {
//   if (name === "Likes") {
//     return LikeIcons;
//   }
//   // } else if (name === "Views") {
//   //   return ViewIcons;
//   // } else if (name === "Engagements") {
//   //   return ViewIcons;
//   // } else if (name === "Impressions") {
//   //   return ViewIcons;
//   // }
// };

const PostClickLikes: FC<Card1> = ({ color, name }) => {
  const [likes, setLikes] = useState(undefined);
  const [views, setViews] = useState(undefined);
  const [engagements, setEngagments] = useState(undefined);
  const [impressions, setImpressions] = useState(undefined);
  const [imageSrc, setImageSrc] = useState(undefined);
  // const image = setIcon(name);
  const [likesPeriod, setLikesPeriod] = useState("day");
  const [viewsPeriod, setViewsPeriod] = useState("day");
  const [impressionsPeriod, setImpressionsPeriod] = useState("day");
  const [engagementsPeriod, setEngagementsPeriod] = useState("day");

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const likeofpages = await PageLikes();
        const viewsofpages = await PageViews(viewsPeriod);
        const engagementofpages = await PageUserEngagment(engagementsPeriod);
        const impressionofpages = await PageImpressions(impressionsPeriod);

        {
          name == "Likes" && setLikes(likeofpages);
        }
        {
          name == "Views" && setViews(viewsofpages);
        }
        {
          name == "Engagements" && setEngagments(engagementofpages);
        }
        {
          name == "Impressions" && setImpressions(impressionofpages);
        }
        // console.log(likes);
      } catch (error) {
        console.error("Error fetching likes:", error);
      }
    };

    fetchLikes();
  }, [engagementsPeriod, impressionsPeriod, viewsPeriod, name]);
  return (
    <div
      className={`flex relative  flex-col items-start w-[50%] h-[150px] ${color} justify-center mr-10  rounded-[10px] p-4 cursor-pointer `}
    >
      {name == "Views" && (
        <div className="w-[50%] text-xs  flex items-center justify-center  absolute rounded-[5px] top-3 right-3 bg-[#F6F6F6]">
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
            week
          </div>
          <div
            className={`${
              viewsPeriod === "days_28" &&
              "bg-[#343131] rounded-br-[5px] rounded-tr-[5px] text-white  "
            } w-[37%] text-center cursor-pointer `}
            onClick={() => setViewsPeriod("days_28")}
          >
            month
          </div>
        </div>
      )}
      {name == "Engagements" && (
        <div className="w-[50%] text-xs  flex items-center justify-center  absolute rounded-[5px] top-3 right-3 bg-[#F6F6F6]">
          <div
            className={`${
              engagementsPeriod === "day" &&
              "bg-[#343131]  rounded-bl-[5px] rounded-tl-[5px] text-white"
            } w-[24%] text-center cursor-pointer `}
            onClick={() => setEngagementsPeriod("day")}
          >
            day
          </div>
          <div
            className={`${
              engagementsPeriod === "week" && "bg-[#343131]   text-white"
            } w-[37%] text-center cursor-pointer border-x-[#000] `}
            onClick={() => setEngagementsPeriod("week")}
          >
            week
          </div>
          <div
            className={`${
              engagementsPeriod === "days_28" &&
              "bg-[#343131]  text-white rounded-br-[5px] rounded-tr-[5px] "
            } w-[37%] text-center cursor-pointer `}
            onClick={() => setEngagementsPeriod("days_28")}
          >
            month
          </div>
        </div>
      )}
      {name == "Impressions" && (
        <div className="flex flex-col w-[50%] top-3 right-3  absolute">
          <div className="w-[100%] text-xs  flex items-center justify-center   rounded-[5px]  bg-[#F6F6F6]">
            <div className="w-[25%] text-center">all</div>
            <div className="w-[45%] text-center border border-x-[#000] ">
              organic
            </div>
            <div className="w-[30%] text-center ">paid</div>
          </div>
          <div className="w-[100%] text-xs  flex items-center justify-center  mt-1 rounded-[5px]  bg-[#F6F6F6]">
            <div
              className="w-[25%] text-center cursor-pointer "
              onClick={() => setImpressionsPeriod("day")}
            >
              day
            </div>
            <div
              className="w-[35%] text-center border border-x-[#000] cursor-pointer "
              onClick={() => setImpressionsPeriod("week")}
            >
              week
            </div>
            <div
              className="w-[35%] text-center cursor-pointer "
              onClick={() => setImpressionsPeriod("days_28")}
            >
              month
            </div>
          </div>
        </div>
      )}
      {name == "Likes" && (
        <Image src={LikeIcons} width={20} height={20} alt="" />
      )}
      {name == "Views" && (
        <Image src={ViewIcons} width={20} height={20} alt="" />
      )}
      {name == "Engagements" && (
        <Image src={EngagementIcons} width={50} height={20} alt="" />
      )}
      {name == "Impressions" && (
        <Image src={ImpressionIcons} width={20} height={20} alt="" />
      )}
      {name == "Likes" && <p className=" text-3xl font-bold">{likes}</p>}
      {name == "Views" && <p className=" text-3xl font-bold">{views}</p>}
      {name == "Engagements" && (
        <p className=" text-3xl font-bold">{engagements ? engagements : 0}</p>
      )}
      {name == "Impressions" && (
        <p className=" text-3xl font-bold">{impressions}</p>
      )}
      <p>Page {name}</p>
    </div>
  );
};

export default PostClickLikes;
