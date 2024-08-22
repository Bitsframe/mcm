"use client";

// context code
import { createContext, useState } from "react";

export const TabContext = createContext<any>(null);

export const ActiveTabProvider = ({ children }: any) => {
  const [activeTitle, setActiveTitle] = useState("");
  const [pageViewsByPeriod, setPageViewsByPeriod] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<any[]>([]);

  return (
    <TabContext.Provider
      value={{
        activeTitle,
        setActiveTitle,
        pageViewsByPeriod,
        setPageViewsByPeriod,
        selectedEmails,
        setSelectedEmails,
      }}
    >
      {children}
    </TabContext.Provider>
  );
};
