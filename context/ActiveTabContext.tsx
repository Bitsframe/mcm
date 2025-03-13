"use client";

import { createContext, useState } from "react";

export const TabContext = createContext<any>(null);

export const ActiveTabProvider = ({ children }: any) => {
  const [activeTitle, setActiveTitle] = useState("Sidebar_k2"); // ✅ Default key

  return (
    <TabContext.Provider value={{ activeTitle, setActiveTitle }}>
      {children}
    </TabContext.Provider>
  );
};