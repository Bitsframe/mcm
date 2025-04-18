'use client'

import SettingsComponent from "@/components/SettingsComponent";
import { TabContext } from "@/context";
import { useContext, useEffect } from "react";

const Settings = () => {

  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k22");
  }, []);


  return (
    <div className="min-h-full dark:bg-[#0E1725]">
      <div className=" px-12">
        <SettingsComponent />
      </div>
    </div>
  );
};

export default Settings;
