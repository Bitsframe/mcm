"use client";
import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  PostFansLocale,
  FansLocaleKeys,
} from "../../../utils/facebook";

const RADIAN = Math.PI / 180;
interface FanData {
  language: string;
  fans: number;
}
const Card4: React.FC = () => {
  const [fansLocaleMenu, setFansLocaleMenu] = useState(false);
  const [es, setES] = useState(0);
  const [en, setEN] = useState(0);
  const [others, setOthers] = useState(0);
  const [localeOptions, setLocaleOptions] = useState<string[] | undefined>();
  const [fanData, setFanData] = useState<FanData[]>([]);

  useEffect(() => {
    let incrementedValue = 0;
    const fetchLikes = async () => {
      try {
        const fanslocaleEN = await PostFansLocale("en_US");
        const fanslocaleES = await PostFansLocale("es_ES");
        const fanslocalekeys = await FansLocaleKeys();
        setEN(fanslocaleEN);
        setES(fanslocaleES);

        const othersPromises = fanslocalekeys.map(async (element: any) => {
          if (!(element === "en_US" || element === "es_ES")) {
            return await PostFansLocale(element);
          }
        });

        const othersValues = await Promise.all(othersPromises);
        console.log("Others Value", othersValues);
        // Calculate the total value for 'others'
        const validOthersValues = othersValues.filter(
          (value) => typeof value === "number"
        );
        const othersTotal = validOthersValues.reduce(
          (total: any, value: any) => total + value,
          0
        );

        // Wait for all promises to resolve
        let results: any = [];
        setOthers(othersTotal);
        results.push({ language: "en_US", fans: fanslocaleEN });
        results.push({ language: "es_ES", fans: fanslocaleES });
        results.push({ language: "others", fans: others });
        setFanData(results);
        console.log("Fan Data", fanData);
      } catch (error) {
        console.error("Error fetching likes:", error);
      }
    };

    fetchLikes();
  }, [others, en, es]);

  // Define colors for each segment
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  return (
    <div
      className={`flex flex-col items-start  relative p-4  rounded-[10px] mx-5 w-[50%] h-[350px] bg-[#F6EBD6] justify-start`}
    >
      <p className=" text-xl font-bold">Page fans language</p>
      <div className="flex w-[100%] h-full items-center justify-center">
        <div className="flex flex-col p-2 items-center   ">
          <div className="flex  items-center">
            <div className=" w-[15px] h-[15px] rounded-[100px] bg-[#0088FE]"></div>{" "}
            <h1 className="ml-3">English</h1>
          </div>
          <div className="flex ml-2 items-center">
            <div className=" w-[15px] h-[15px] rounded-[100px] bg-[#00C49F]"></div>{" "}
            <h1 className="ml-3"> Spanish</h1>
          </div>
          <div className="flex  items-center">
            <div className=" w-[15px] h-[15px] rounded-[100px] bg-[#FFBB28]"></div>{" "}
            <h1 className="ml-3">Others</h1>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart width={400} height={400}>
            <Pie
              dataKey="fans"
              isAnimationActive={false}
              data={fanData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              fill="#8884d8"
              label
            >
              {fanData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default Card4;
