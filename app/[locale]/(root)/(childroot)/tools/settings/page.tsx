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
    <div className="min-h-full bg-gray-50">
      <div className="pt-20 px-12">
        <SettingsComponent />
      </div>
    </div>
  );
};

export default Settings;
