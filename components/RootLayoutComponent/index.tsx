'use client';

import { ReactNode, useContext, useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { AuthContext, TabContext } from '@/context';
import { SidebarSection } from '../Sidebar';
import { Navbar } from '../Navbar';
import { useLocale } from "next-intl";
import { useTranslation } from "react-i18next";
import { translationConstant } from '@/utils/translationConstants';
import i18n from "@/i18n";

const LAYOUT_CONFIG = {
  sidebarWidth: '233px',
  contentPadding: '1rem',
  backgroundColor: 'white',
  backgroundColorDark: '#080E16',
} as const;

interface RootLayoutProps {
  children: ReactNode;
}

const LoadingState = () => (
  <div className="h-screen w-full grid place-items-center">
    <CircularProgress />
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="h-screen w-full grid place-items-center">
    <h1 className="text-red-600 text-xl">{message}</h1>
  </div>
);

const FixedSidebar = () => (
  <section
    className="fixed left-0 top-0 h-full"
    style={{ width: LAYOUT_CONFIG.sidebarWidth }}
  >
    <SidebarSection />
  </section>
);

const MainContent = ({ children }: { children: ReactNode }) => {
  const { activeTitle, parentTitle } = useContext(TabContext);

  const locale = useLocale();
  const { t } = useTranslation(translationConstant.SIDEBAR);

  useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale]);

  const translatedTitle = t(activeTitle);
  const formattedTitle = parentTitle ? `${parentTitle}/${translatedTitle}` : translatedTitle;

  return (
    <section
      className="flex flex-col flex-grow bg-[#F1F4F9] dark:bg-[#080E16] min-h-screen"
      style={{ marginLeft: LAYOUT_CONFIG.sidebarWidth }}
    >
      <Navbar width={LAYOUT_CONFIG.sidebarWidth} />
      <section
        className="flex-grow p-4 mt-20 rounded-3xl bg-white dark:bg-[#0E1725]" // optional slightly lighter than #080E16
        style={{
          minHeight: '110vh',
          overflowY: 'hidden',
        }}
      >
        {children}
      </section>
    </section>
  );
};

const RootLayoutComponent = ({ children }: RootLayoutProps) => {
  const authState = useContext(AuthContext);

  if (authState?.checkingAuth) {
    return <LoadingState />;
  }

  if (authState?.authError) {
    console.log(authState.authError);
    return <ErrorState message={"eRrore"} />;
  }

  return (
    <div className="relative flex bg-[#F1F4F9] dark:bg-[#080E16]">
      <FixedSidebar />
      <MainContent>{children}</MainContent>
    </div>
  );
};

export default RootLayoutComponent;
