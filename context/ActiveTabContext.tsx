"use client";

import { createContext, useState } from "react";

export const TabContext = createContext<any>(null);

export const ActiveTabProvider = ({ children }: any) => {
  const [activeTitle, setActiveTitle] = useState("Sidebar_k2");
  const [parentTitle, setParentTitle] = useState<string | null>(null); 


  return (
    <TabContext.Provider value={{ activeTitle, setActiveTitle, parentTitle, setParentTitle }}>
      {children}
    </TabContext.Provider>
  );
};