import React from "react";
import PostClickLikes from "./Cards/PostClickLikes";
import PagePostEnagagement from "./Cards/PagePostEnagagement";
import AgeByGender from "./Cards/AgeByGender";
import PageLikes from "./Cards/PageLikes";
import PageImpression from "./Cards/PageImpression";
import PageFansRemove from "./Cards/PageFansRemove";
import TotalViews from "./Cards/TotalViews";
import Card3 from "./Cards/Card3";
import Card4 from "./Cards/Card4";
import TotalPageFans from "@/components/Profile/Cards/TotalPageFans";

const ProfileSection = () => {
  return (
    <div className="flex flex-col w-[98%] bg-green-100/50  mt-10 rounded-[10px] p-4 ">
      <div className="flex items-center justify-center  my-4">
        <PageLikes />
        <Card3 color={"bg-[#E5C6ED]"} name={"Likes By Country"} />
        <div className="flex flex-col justify-between w-[49%] items-center">
          <TotalViews />
          <div className="flex w-[98%]">
            <PageFansRemove />
            <PostClickLikes color={"bg-[#BBEDF0]"} name={"Engagements"} />
          </div>
        </div>
      </div>

      <div className="flex my-4 ">
        <AgeByGender />
        <PageImpression />
        {/* <Card4 /> */}
      </div>
    </div>
  );
};

export default ProfileSection;
