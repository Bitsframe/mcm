"use client";
import React from "react";
import { useEffect, useState, FC } from "react";
import {
  PageFansRemoves,
  PostFansLocale,
  PageAgeByGender,
  PageFansCountry,
  FansCountryKeys,
  FansLocaleKeys,
} from "../../../utils/facebook";
interface Card2 {
  color: string;
  name: string;
}
const PagePostEnagagement: FC<Card2> = ({ color, name }) => {
  const [fansRemove, setFansRemove] = useState(undefined);
  const [fansLocale, setFansLocale] = useState(undefined);
  const [fansCountry, setFansCountry] = useState(undefined);
  const [fansRemoveMenu, setFansRemoveMenu] = useState(false);
  const [fansCountryMenu, setFansCountryMenu] = useState(false);
  const [fansLocaleMenu, setFansLocaleMenu] = useState(false);
  const [fansRemovePeriod, setFansRemovePeriod] = useState("day");
  const [fansLocaleOption, setFansLocaleOption] = useState("");
  const [fansCountryOption, setFansCountryOption] = useState("");
  const [localeOptions, setLocaleOptions] = useState<string[]>();
  const [countryOptions, setCountryOptions] = useState<string[]>();
  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const fansremove = await PageFansRemoves(fansRemovePeriod);
        const fanslocale = await PostFansLocale(fansLocaleOption);
        const agebygenders = await PageAgeByGender();
        const fanscountry = await PageFansCountry(fansCountryOption);
        const fanscountrykeys = await FansCountryKeys();
        const fanslocalekeys = await FansLocaleKeys();
        setLocaleOptions(fanslocalekeys);
        setCountryOptions(fanscountrykeys);
        setFansLocale(fanslocale);
        setFansCountry(fanscountry);

        // console.log(fansremove);
        setFansRemove(fansremove);
      } catch (error) {
        console.error("Error fetching likes:", error);
      }
    };

    fetchLikes();
  }, [fansRemovePeriod, fansLocale, fansLocaleOption, countryOptions]);
  const localeDiv = localeOptions?.map((value, index) => (
    <div
      onClick={() => {
        setFansLocaleOption(value);
      }}
      key={index}
    >
      {value}
    </div>
  ));
  const countryDiv = countryOptions?.map((value, index) => (
    <div
      onClick={() => {
        setFansCountryOption(value);
      }}
      key={index}
    >
      {value}
    </div>
  ));
  return (
    <div
      className={`flex  relative flex-col items-start w-[33%] h-[150px] ${color} justify-start  mr-5 rounded-[10px] p-4  `}
    >
      {name == "Page fans removes" && (
        <div className="flex flex-col absolute rounded-[3px] top-5 right-3 ">
          <div className="w-[100px] h-[15px] text-xs   flex items-center justify-between   bg-[#F6F6F6]">
            <div className="w-[25%] text-center">{fansRemovePeriod}</div>
            <img
              onClick={() => setFansRemoveMenu(!fansRemoveMenu)}
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAANUlEQVR4nGNgGAWjYBQMf1DOwMDwnwCup6Ul9dTxBwNWS6hmODZLqG44DDRA8SgYBaNgMAEAWBUYxRZbGDAAAAAASUVORK5CYII="
            ></img>
          </div>
          {fansRemoveMenu && (
            <div className="flex flex-col w-[100px] mt-1 bg-[#F6F6F6] h-[55px] text-xs">
              <div
                className={`${
                  fansRemovePeriod === "day" && "bg-[#343131] text-white"
                } cursor-pointer `}
                onClick={() => setFansRemovePeriod("day")}
              >
                day
              </div>
              <div
                className={`${
                  fansRemovePeriod === "week" && "bg-[#343131] text-white"
                } cursor-pointer `}
                onClick={() => setFansRemovePeriod("week")}
              >
                This week
              </div>
              <div
                className={`${
                  fansRemovePeriod === "days_28" && "bg-[#343131] text-white"
                } cursor-pointer `}
                onClick={() => setFansRemovePeriod("days_28")}
              >
                year
              </div>
            </div>
          )}
        </div>
      )}

      {name == "Page fans locale" && (
        <div className="flex flex-col absolute rounded-[3px] top-5 right-3 ">
          <div className="w-[100px] h-[15px] text-xs   flex items-center justify-between   bg-[#F6F6F6]">
            <div className="w-[25%] text-center">{fansLocaleOption}</div>
            <img
              onClick={() => setFansLocaleMenu(!fansLocaleMenu)}
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAANUlEQVR4nGNgGAWjYBQMf1DOwMDwnwCup6Ul9dTxBwNWS6hmODZLqG44DDRA8SgYBaNgMAEAWBUYxRZbGDAAAAAASUVORK5CYII="
            ></img>
          </div>

          {fansLocaleMenu && (
            <div className="flex flex-col w-[100px] mt-1 bg-[#F6F6F6] h-[55px] text-xs">
              <div
                className="cursor-pointer overflow-auto"
                //  onClick={() => setFansRemovePeriod("day")}
              >
                {localeDiv}
              </div>
            </div>
          )}
        </div>
      )}

      {name == "Page fans country" && (
        <div className="flex flex-col absolute rounded-[3px] top-5 right-3 ">
          <div className="w-[100px] h-[15px] text-xs   flex items-center justify-between   bg-[#F6F6F6]">
            <div className="w-[25%] text-center">{fansCountryOption}</div>
            <img
              onClick={() => setFansCountryMenu(!fansCountryMenu)}
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAANUlEQVR4nGNgGAWjYBQMf1DOwMDwnwCup6Ul9dTxBwNWS6hmODZLqG44DDRA8SgYBaNgMAEAWBUYxRZbGDAAAAAASUVORK5CYII="
            ></img>
          </div>

          {fansCountryMenu && (
            <div className="flex flex-col w-[100px] mt-1 bg-[#F6F6F6] h-[55px] text-xs">
              <div
                className="cursor-pointer overflow-auto"
                //  onClick={() => setFansRemovePeriod("day")}
              >
                {countryDiv}
              </div>
            </div>
          )}
        </div>
      )}
      <p className=" text-xl font-bold mb-2">{name}</p>
      {name == "Page fans removes" && (
        <p className="font-bold mt-5 text-3xl">{fansRemove}</p>
      )}

      {name == "Page fans locale" && (
        <p className="font-bold mt-5 text-3xl">{fansLocale}</p>
      )}
      {name == "Page fans country" && (
        <p className="font-bold mt-5 text-3xl">{fansCountry}</p>
      )}
    </div>
  );
};

export default PagePostEnagagement;
