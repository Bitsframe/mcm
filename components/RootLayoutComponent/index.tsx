"use client";

import {
  ReactNode,
  useContext,
  useEffect,
  memo,
  useCallback,
  useState,
} from "react";
import { CircularProgress } from "@mui/material";
import { AuthContext, TabContext } from "@/context";
import { SidebarSection } from "../Sidebar";
import { Navbar } from "../Navbar";
import { useLocale } from "next-intl";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import i18n from "@/i18n";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

const LAYOUT_CONFIG = {
  sidebarWidth: "233px",
  sidebarCollapsedWidth: "0px",
  contentPadding: "1rem",
  backgroundColor: "white",
  backgroundColorDark: "#080E16",
} as const;

interface RootLayoutProps {
  children: ReactNode;
}

const LoadingState = memo(() => (
  <div className="h-screen w-full grid place-items-center">
    <CircularProgress />
  </div>
));

LoadingState.displayName = "LoadingState";

const ErrorState = memo(({ message }: { message: string }) => (
  <div className="h-screen w-full grid place-items-center">
    <h1 className="text-red-600 text-xl">{message}</h1>
  </div>
));

ErrorState.displayName = "ErrorState";

const FixedSidebar = memo(({ collapsed }: { collapsed: boolean }) => (
  <section
    className="hidden md:block fixed left-0 top-0 h-full overflow-hidden transition-[width] duration-200 ease-out"
    style={{ width: collapsed ? LAYOUT_CONFIG.sidebarCollapsedWidth : LAYOUT_CONFIG.sidebarWidth }}
    aria-hidden={collapsed}
  >
    <SidebarSection />
  </section>
));

FixedSidebar.displayName = "FixedSidebar";

/**
 * Collapse handle. Sits against the sidebar's edge and stays put when the panel
 * is hidden, so there is always something to bring it back with.
 */
const CollapseToggle = memo(
  ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="hidden md:flex fixed top-[26px] z-[60] h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 ease-out hover:text-[#0066ff] hover:shadow"
      style={{ left: collapsed ? "12px" : "213px" }}
    >
      {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
    </button>
  )
);

CollapseToggle.displayName = "CollapseToggle";

const MainContent = memo(({ children, collapsed }: { children: ReactNode; collapsed: boolean }) => {
  const { activeTitle, parentTitle } = useContext(TabContext);
  const locale = useLocale();
  const { t } = useTranslation(translationConstant.SIDEBAR);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (i18n && typeof i18n.changeLanguage === 'function') {
      i18n.changeLanguage(locale);
    }
  }, [locale]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  const translatedTitle = t(activeTitle);
  const formattedTitle = parentTitle
    ? `${parentTitle}/${translatedTitle}`
    : translatedTitle;

  return (
    <section
      className="flex flex-col flex-grow bg-[#F1F4F9] dark:bg-[#080E16] min-h-screen transition-[margin] duration-200 ease-out md:ml-[var(--sidebar-w)]"
      style={{ ["--sidebar-w" as string]: collapsed ? LAYOUT_CONFIG.sidebarCollapsedWidth : LAYOUT_CONFIG.sidebarWidth }}
    >
      <Navbar width={collapsed ? LAYOUT_CONFIG.sidebarCollapsedWidth : LAYOUT_CONFIG.sidebarWidth} />
      <section
        className="flex-grow p-4 mt-20 rounded-3xl bg-white dark:bg-[#0E1725] relative 
              md:h-[calc(100vh-5rem)]"
        style={{ overflowY: "auto" }}
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

MainContent.displayName = "MainContent";

const SIDEBAR_COLLAPSED_KEY = "mcm.sidebarCollapsed";

const RootLayoutComponent = memo(({ children }: RootLayoutProps) => {
  const authState = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(false);

  // Read after mount: localStorage is not available while rendering on the server,
  // and seeding state from it directly would mismatch the first paint.
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {
      // Private browsing or blocked storage — the default stands.
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // Not worth failing the click over.
      }
      return next;
    });
  }, []);

  if (authState?.checkingAuth) {
    return <LoadingState />;
  }

  if (authState?.authError) {
    console.log(authState.authError);
    return <ErrorState message={"eRrore"} />;
  }

  return (
    <div className="relative flex bg-[#F1F4F9] dark:bg-[#080E16]">
      <FixedSidebar collapsed={collapsed} />
      <CollapseToggle collapsed={collapsed} onToggle={toggleSidebar} />
      <MainContent collapsed={collapsed}>{children}</MainContent>
    </div>
  );
});

RootLayoutComponent.displayName = "RootLayoutComponent";

export default RootLayoutComponent;
