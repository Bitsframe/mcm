"use client";

import { CustomFlowbiteTheme, Sidebar } from "flowbite-react";
import { usePathname, useRouter } from "next/navigation";
import {
  ComponentType,
  useContext,
  useEffect,
  useMemo,
  memo,
  useState,
} from "react";
import { FaChevronRight } from "react-icons/fa";
import { AuthContext, TabContext } from "@/context";
import { routeList, Route } from "./constant";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import Link from "next/link";

const THEME: CustomFlowbiteTheme["sidebar"] = {
  root: {
    base: "bg-white dark:bg-[#080E16] overflow-y-auto",
    inner:
      "bg-white dark:bg-[#080E16] overflow-y-auto flex flex-col justify-between overflow-x-hidden h-full pr-3",
  },
};

const STYLE = {
  marginBottom: "80px",
};

const ActiveIndicator = memo(() => (
  <div
    style={{ zIndex: 30 }}
    className="w-[6px] h-[40px] bg-[#0F4698] bg-opacity-30 dark:bg-[#B3D4FF] dark:bg-opacity-20 rounded-r-[20px] absolute left-0 -ml-[1.25rem]"
  />
));

ActiveIndicator.displayName = "ActiveIndicator";

const RouteIcon = memo(
  ({
    icon: Icon,
    isActive = false,
  }: {
    icon?: ComponentType<{ className?: string }>;
    isActive?: boolean;
  }) => (
    <div className="flex items-center">
      {Icon && (
        <Icon
          className={`w-6 h-6 ${
            isActive ? "text-[#0066ff]" : "text-gray-500 dark:text-gray-400"
          }`}
        />
      )}
    </div>
  )
);

RouteIcon.displayName = "RouteIcon";

interface SingleRouteProps {
  route: Route;
  isActive: boolean;
  onNavigate: () => void;
}

const SingleRoute = memo(
  ({ route, isActive, onNavigate }: SingleRouteProps) => {
    const { t } = useTranslation(translationConstant.SIDEBAR);

    return (
      <div className="relative w-full">
        {isActive && <ActiveIndicator />}
        <Link href={route.route || "#"} passHref onClick={onNavigate}>
          <Sidebar.Item
            icon={() => <RouteIcon icon={route.icon} isActive={isActive} />}
            label={
              <FaChevronRight
                className={`text-[15px] ${
                  isActive
                    ? "text-[#0066ff]"
                    : "text-[#79808B] dark:text-gray-400"
                } -mr-1`}
              />
            }
            labelColor="transparent"
            className={`hover:text-[#0066ff] ${
              isActive ? "text-[#0066ff]" : "text-[#79808B] dark:text-gray-400"
            }`}
          >
            <div className="flex items-center gap-2">
              <h3 className={`${isActive ? "text-[#0066ff]" : ""}`}>
                {t(route.label)}
              </h3>
            </div>
          </Sidebar.Item>
        </Link>
      </div>
    );
  }
);

SingleRoute.displayName = "SingleRoute";

interface CollapsibleRouteProps {
  route: Route;
  isActive: boolean;
  currentPath: string;
  onNavigate: () => void;
}

const CollapsibleRoute = memo(
  ({ route, isActive, currentPath, onNavigate }: CollapsibleRouteProps) => {
    const { t } = useTranslation(translationConstant.SIDEBAR);
    const { permissions, userRole } = useContext(AuthContext);

    // Filter children based on permissions
    const filteredChildren = useMemo(() => {
      // Super admin can see all child routes
      if (userRole === 'super admin') {
        return route.children;
      }

      return route.children?.filter(child => {
        // Check if user has permission for this child route
        return permissions.some(perm => 
          child.name.toLowerCase() === perm.toLowerCase()
        );
      });
    }, [route.children, permissions, userRole]);

    // If no children are accessible, don't render the parent
    if (!filteredChildren?.length) {
      return null;
    }

    return (
      <div className="relative w-full">
        {isActive && <ActiveIndicator />}
        <Sidebar.Collapse
          icon={() => <RouteIcon icon={route.icon} isActive={isActive} />}
          label={t(route.label)}
          className={`hover:text-[#0066ff] transition-all ease-out delay-75 ${
            isActive ? "text-[#0066ff]" : "text-[#79808B] dark:text-gray-400"
          }`}
          open={isActive}
        >
          {filteredChildren.map((item) => {
            const isCurrent = currentPath === item.route;

            return (
              <Link
                key={item.id}
                href={item.route || "#"}
                passHref
                onClick={onNavigate}
              >
                <Sidebar.Item
                  className={`text-left text-sm hover:text-[#0066ff] ${
                    isCurrent
                      ? "text-[#0066ff]"
                      : "text-[#79808B] dark:text-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="relative w-4 h-4">
                      {isCurrent && (
                        <span className="absolute inset-0 rounded-full transition-colors bg-[#B3D4FF]" />
                      )}
                      <span
                        className={`absolute top-1/2 left-1/2 w-2 h-2 rounded-full transition-colors transform -translate-x-1/2 -translate-y-1/2 ${
                          isCurrent
                            ? "bg-[#0066ff]"
                            : "bg-[#79808B] dark:bg-gray-400"
                        }`}
                      />
                    </span>
                    <span className={`${isCurrent ? "text-[#0066ff]" : ""}`}>
                      {t(item.label)}
                    </span>
                  </div>
                </Sidebar.Item>
              </Link>
            );
          })}
        </Sidebar.Collapse>
      </div>
    );
  }
);

CollapsibleRoute.displayName = "CollapsibleRoute";

export const SidebarPanel = memo(() => {
  const pathname = usePathname();
  const router = useRouter();
  const { userRole, permissions } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigate = () => {
    setIsLoading(true);
  };

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  const filteredRoutes = useMemo(() => {
    // Super admin can see all routes
    if (userRole === 'super admin') {
      return routeList;
    }

    return routeList.filter(route => {
      // Check if user has permission for this route
      const hasPermission = permissions.some(perm => {
        // Check exact permission match
        if (route.name.toLowerCase() === perm.toLowerCase()) {
          return true;
        }
        
        // Check if any child route has permission
        if (route.children) {
          return route.children.some(child => 
            permissions.some(p => child.name.toLowerCase() === p.toLowerCase())
          );
        }
        
        return false;
      });

      return hasPermission;
    });
  }, [permissions, userRole]);

  return (
    <Sidebar
      aria-label="Sidebar with multi-level dropdown"
      className="w-full relative"
      theme={THEME}
      style={STYLE}
    >
      <Sidebar.Items className="pl-5 w-[210px] bg-[#F1F4F9] dark:bg-[#080E16]">
        <Sidebar.ItemGroup className="flex flex-col gap-5 w-[210px] bg-[#F1F4F9] dark:bg-[#080E16]">
          {filteredRoutes.map((route) => {
            if (!route.children) {
              return (
                <SingleRoute
                  key={route.id}
                  route={route}
                  isActive={route.route === pathname}
                  onNavigate={handleNavigate}
                />
              );
            }

            const isRouteActive = route.children.some(
              (item) => pathname === item.route
            );

            return (
              <CollapsibleRoute
                key={route.id}
                route={route}
                isActive={isRouteActive}
                currentPath={pathname}
                onNavigate={handleNavigate}
              />
            );
          })}
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>
  );
});

SidebarPanel.displayName = "SidebarPanel";
