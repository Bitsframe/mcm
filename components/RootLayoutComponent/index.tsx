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
import { AuthContext, SidebarCollapseContext, TabContext } from "@/context";
import { SidebarSection } from "../Sidebar";
import { Navbar } from "../Navbar";
import { useLocale } from "next-intl";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import i18n from "@/i18n";
import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";

/**
 * Window frame: a source-list sidebar on the left, a toolbar across the top,
 * white content below. Widths follow the macOS defaults (240 / 68).
 */
const LAYOUT = {
  sidebarWidth: "240px",
  sidebarCollapsedWidth: "68px",
  toolbarHeight: "52px",
} as const;

interface RootLayoutProps {
  children: ReactNode;
}

const LoadingState = memo(() => (
  <div className="grid h-screen w-full place-items-center bg-surface">
    <CircularProgress size={28} />
  </div>
));
LoadingState.displayName = "LoadingState";

const ErrorState = memo(({ message }: { message: string }) => (
  <div className="grid h-screen w-full place-items-center bg-surface">
    <h1 className="text-title3 text-destructive">{message}</h1>
  </div>
));
ErrorState.displayName = "ErrorState";

const FixedSidebar = memo(({ collapsed }: { collapsed: boolean }) => (
  <aside
    className="fixed left-0 top-0 hidden h-full overflow-hidden transition-[width] duration-200 ease-out md:block"
    style={{ width: collapsed ? LAYOUT.sidebarCollapsedWidth : LAYOUT.sidebarWidth }}
  >
    <SidebarSection />
  </aside>
));
FixedSidebar.displayName = "FixedSidebar";

/** The toolbar's sidebar toggle, sitting in the toolbar's leading slot. */
const CollapseToggle = memo(
  ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
      title={collapsed ? "Show sidebar" : "Hide sidebar"}
      className="fixed top-[10px] z-[60] hidden h-8 w-8 items-center justify-center rounded-md text-label-2 transition-[left,background-color] duration-200 ease-out hover:bg-black/[0.05] md:flex"
      style={{ left: collapsed ? "18px" : "252px" }}
    >
      <PanelLeft size={17} />
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
    if (i18n && typeof i18n.changeLanguage === "function") {
      i18n.changeLanguage(locale);
    }
  }, [locale]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  const translatedTitle = t(activeTitle);
  const formattedTitle = parentTitle ? `${parentTitle}/${translatedTitle}` : translatedTitle;
  const sidebarW = collapsed ? LAYOUT.sidebarCollapsedWidth : LAYOUT.sidebarWidth;

  return (
    <section
      className="flex min-h-screen flex-grow flex-col bg-surface transition-[margin] duration-200 ease-out md:ml-[var(--sidebar-w)]"
      style={{ ["--sidebar-w" as string]: sidebarW }}
      aria-label={formattedTitle}
    >
      <Navbar width={sidebarW} />
      <section
        className="relative flex-grow overflow-y-auto bg-white p-5 md:h-[calc(100vh-52px)]"
        style={{ marginTop: LAYOUT.toolbarHeight }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70">
            <CircularProgress size={28} />
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

  if (authState?.checkingAuth) return <LoadingState />;

  if (authState?.authError) {
    console.log(authState.authError);
    return <ErrorState message={"eRrore"} />;
  }

  return (
    <SidebarCollapseContext.Provider value={collapsed}>
      <div className="relative flex bg-surface">
        <FixedSidebar collapsed={collapsed} />
        <CollapseToggle collapsed={collapsed} onToggle={toggleSidebar} />
        <MainContent collapsed={collapsed}>{children}</MainContent>
      </div>
    </SidebarCollapseContext.Provider>
  );
});
RootLayoutComponent.displayName = "RootLayoutComponent";

export default RootLayoutComponent;
