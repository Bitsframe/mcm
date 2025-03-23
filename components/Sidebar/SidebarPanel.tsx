"use client"

import { CustomFlowbiteTheme, Sidebar } from "flowbite-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ComponentType, useContext, useEffect, useMemo } from "react";
import { FaChevronRight } from "react-icons/fa";
import { AuthContext, TabContext } from "@/context";
import { routeList, Route } from "./constant";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

const THEME: CustomFlowbiteTheme["sidebar"] = {
  root: {
    base: "bg-white overflow-y-auto",
    inner: "bg-white overflow-y-auto flex flex-col justify-between overflow-x-hidden h-full pr-3",
  },
};

const STYLE = {
  marginBottom: "80px",
};

const ActiveIndicator = () => (
  <div
    style={{ zIndex: 30 }}
    className="w-[6px] h-[40px] bg-[#0F4698] bg-opacity-30 rounded-r-[20px] absolute left-0 -ml-[1.25rem]"
  />
);

const RouteIcon = ({ icon: Icon }: { icon?: ComponentType<{ className?: string }> }) => (
  <div className="flex items-center">
    {Icon && <Icon className="w-6 h-6 text-gray-500" />}
  </div>
);

interface SingleRouteProps {
  route: Route;
  isActive: boolean;
}

const SingleRoute = ({ route, isActive }: SingleRouteProps) => {

  const {t} = useTranslation(translationConstant.SIDEBAR);

  return(
  <div className="relative w-full">
    {isActive && <ActiveIndicator />}
    <Sidebar.Item
      href={route.route}
      icon={() => <RouteIcon icon={route.icon} />}
      label={
        <div className="text-[15px] text-[#79808B] -mr-1">
          <FaChevronRight />
        </div>
      }
      labelColor="transparent"
      className={`text-[#79808B] hover:text-[#0066ff]
        ${isActive ? "bg-white text-[#0066ff]" : ""}`}
    >
      <h3>{t(route.label)}</h3>
    </Sidebar.Item>
  </div>
  )
};

interface CollapsibleRouteProps {
  route: Route;
  isActive: boolean;
  currentPath: string;
}

const CollapsibleRoute = ({ route, isActive, currentPath }: CollapsibleRouteProps) => {
  
  const {t} = useTranslation(translationConstant.SIDEBAR);

  return(
  <div className="relative w-full">
    {isActive && <ActiveIndicator />}
    <Sidebar.Collapse
      icon={() => <RouteIcon icon={route.icon} />}
      label={t(route.label)}
      className={`text-[#79808B] hover:text-[#0066ff] transition-all ease-out delay-75 
        hover:bg-opacity-30 ${isActive ? "bg-white text-[#0066ff]" : ""}`}
      open={isActive}
    >
      {route.children?.map((item) => (
        <Sidebar.Item
          key={item.id}
          href={item.route}
          className={`text-[#79808B] text-left text-sm 
            ${currentPath === item.route ? "text-[#0F4698]" : ""}`}
        >
          {t(item.label)}
        </Sidebar.Item>
      ))}
    </Sidebar.Collapse>
  </div>
  )
};

export const SidebarPanel = () => {
  const pathname = usePathname();
  const { userRole, permissions } = useContext(AuthContext);
  const { setActiveTitle } = useContext(TabContext);

  const filteredRoutes = useMemo(() => {
    if (userRole === 'super admin') return routeList;

    const filterRoutes = (routes: Route[]): Route[] => {
      return routes
        .map((route) => {
          const isParentAllowed = permissions.some((perm: string) =>
            route.name.toLowerCase().includes(perm.toLowerCase())
          );

          if (isParentAllowed) return route;
          
          if (route.children) {
            const filteredChildren = filterRoutes(route.children);
            if (filteredChildren.length > 0) {
              return { ...route, children: filteredChildren };
            }
          }
          return null;
        })
        .filter((route): route is Route => route !== null);
    };

    return filterRoutes(routeList);
  }, [userRole, permissions]);

  useEffect(() => {
    const findActiveRoute = (routes: Route[]): Route | undefined => {
      for (const route of routes) {
        if (route.route === pathname) return route;
        if (route.children) {
          const childRoute = route.children.find(child => child.route === pathname);
          if (childRoute) return childRoute;
        }
      }
    };

    const activeRoute = findActiveRoute(routeList);
    if (activeRoute) {
      setActiveTitle(activeRoute.name);
    }
  }, [pathname, setActiveTitle]);

  return (
    <Sidebar
      aria-label="Sidebar with multi-level dropdown"
      className="w-full relative"
      theme={THEME}
      style={STYLE}
    >
      <Sidebar.Items className="pl-5 w-[210px] bg-[#F1F4F9]">
        <Sidebar.ItemGroup className="flex flex-col gap-5 w-[210px] bg-[#F1F4F9]">
          {filteredRoutes.map((route) => {
            if (!route.children) {
              return (
                <SingleRoute
                  key={route.id}
                  route={route}
                  isActive={route.route === pathname}
                />
              );
            }

            const isRouteActive = route.children.some(
              item => pathname === item.route
            );

            return (
              <CollapsibleRoute
                key={route.id}
                route={route}
                isActive={isRouteActive}
                currentPath={pathname}
              />
            );
          })}
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>
  );
};