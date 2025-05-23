'use client';

import { ReactNode, useContext, useEffect, memo, useCallback, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { AuthContext, TabContext } from '@/context';
import { SidebarSection } from '../Sidebar';
import { Navbar } from '../Navbar';
import { useLocale } from "next-intl";
import { useTranslation } from "react-i18next";
import { translationConstant } from '@/utils/translationConstants';
import i18n from "@/i18n";
import { usePathname } from 'next/navigation';

const LAYOUT_CONFIG = {
  sidebarWidth: '233px',
  contentPadding: '1rem',
  backgroundColor: 'white',
  backgroundColorDark: '#080E16',
} as const;

interface RootLayoutProps {
  children: ReactNode;
}

const LoadingState = memo(() => (
  <div className="h-screen w-full grid place-items-center">
    <CircularProgress />
  </div>
));

LoadingState.displayName = 'LoadingState';

const ErrorState = memo(({ message }: { message: string }) => (
  <div className="h-screen w-full grid place-items-center">
    <h1 className="text-red-600 text-xl">{message}</h1>
  </div>
));

ErrorState.displayName = 'ErrorState';

const FixedSidebar = memo(() => (
  <section
    className="hidden md:block fixed left-0 top-0 h-full"
    style={{ width: LAYOUT_CONFIG.sidebarWidth }}
  >
    <SidebarSection />
  </section>
));

FixedSidebar.displayName = 'FixedSidebar';

const MainContent = memo(({ children }: { children: ReactNode }) => {
  const { activeTitle, parentTitle } = useContext(TabContext);
  const locale = useLocale();
  const { t } = useTranslation(translationConstant.SIDEBAR);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  const translatedTitle = t(activeTitle);
  const formattedTitle = parentTitle ? `${parentTitle}/${translatedTitle}` : translatedTitle;

  return (
    <section
      className="flex flex-col flex-grow bg-[#F1F4F9] dark:bg-[#080E16] min-h-screen md:ml-[233px]"
    >
      <Navbar width={LAYOUT_CONFIG.sidebarWidth} />
      <section
        className="flex-grow p-4 mt-20 rounded-3xl bg-white dark:bg-[#0E1725] relative"
        style={{
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-white dark:bg-[#0E1725] flex items-center justify-center z-50">
            <CircularProgress />
          </div>
        )}
        {children}
      </section>
    </section>
  );
});

MainContent.displayName = 'MainContent';

const RootLayoutComponent = memo(({ children }: RootLayoutProps) => {
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
});

RootLayoutComponent.displayName = 'RootLayoutComponent';

export default RootLayoutComponent;
