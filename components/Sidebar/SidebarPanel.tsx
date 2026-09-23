"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ComponentType,
  memo,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AuthContext, SidebarCollapseContext } from "@/context";
import { translationConstant } from "@/utils/translationConstants";
import { routeList, Route } from "./constant";

/*
 * macOS-style source list. One flat column of 28px rows; groups disclose
 * their children with a chevron; the active row is a filled, rounded
 * rectangle in the brand tint, as in Finder / System Settings.
 */

const ROW =
  "flex h-7 w-full items-center gap-2.5 rounded-md px-2 text-body transition-colors";
const IDLE = "text-label hover:bg-black/[0.05]";
const ACTIVE = "bg-brand-600/[0.12] font-medium text-brand-800";

const RouteIcon = memo(
  ({
    icon: Icon,
    isActive = false,
  }: {
    icon?: ComponentType<{ className?: string }>;
    isActive?: boolean;
  }) =>
    Icon ? (
      <Icon
        className={`h-4 w-4 shrink-0 ${isActive ? "text-brand-700" : "text-label-2"}`}
      />
    ) : null
);
RouteIcon.displayName = "RouteIcon";

const SingleRoute = memo(
  ({ route, isActive, onNavigate }: { route: Route; isActive: boolean; onNavigate: () => void }) => {
    const { t } = useTranslation(translationConstant.SIDEBAR);
    return (
      <li>
        <Link
          href={route.route || "#"}
          onClick={onNavigate}
          aria-current={isActive ? "page" : undefined}
          className={`${ROW} ${isActive ? ACTIVE : IDLE}`}
        >
          <RouteIcon icon={route.icon} isActive={isActive} />
          <span className="truncate">{t(route.label)}</span>
        </Link>
      </li>
    );
  }
);
SingleRoute.displayName = "SingleRoute";

const CollapsibleRoute = memo(
  ({
    route,
    isActive,
    currentPath,
    onNavigate,
  }: {
    route: Route;
    isActive: boolean;
    currentPath: string;
    onNavigate: () => void;
  }) => {
    const { t } = useTranslation(translationConstant.SIDEBAR);
    const { permissions, userRole } = useContext(AuthContext);
    // Open when a child is the current page; the user can still fold it.
    const [open, setOpen] = useState(isActive);
    useEffect(() => {
      if (isActive) setOpen(true);
    }, [isActive]);

    const filteredChildren = useMemo(() => {
      if (userRole === "super admin") return route.children;
      return route.children?.filter((child) => {
        if (child.name === "settings") return true;
        if (permissions.some((perm) => perm.toLowerCase() === "control")) {
          if (child.name === "bonus-location" || child.name === "bonus-individual") return true;
        }
        return permissions.some((perm) => child.name.toLowerCase() === perm.toLowerCase());
      });
    }, [route.children, permissions, userRole]);

    if (!filteredChildren?.length) return null;

    return (
      <li>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`${ROW} ${isActive && !open ? ACTIVE : IDLE}`}
        >
          <RouteIcon icon={route.icon} isActive={isActive && !open} />
          <span className="flex-1 truncate text-left">{t(route.label)}</span>
          <ChevronRight
            size={13}
            className={`shrink-0 text-label-3 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          />
        </button>
        {open && (
          <ul className="mt-0.5 space-y-0.5">
            {filteredChildren.map((item) => {
              const isCurrent = currentPath === item.route;
              return (
                <li key={item.id}>
                  <Link
                    href={item.route || "#"}
                    onClick={onNavigate}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`${ROW} pl-[34px] ${isCurrent ? ACTIVE : IDLE}`}
                  >
                    <span className="truncate">{t(item.label)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  }
);
CollapsibleRoute.displayName = "CollapsibleRoute";

/**
 * One row of the collapsed rail. A parent route has no page of its own, so its
 * icon goes to the first child the user is allowed — the same place expanding
 * and clicking would land.
 */
const RailItem = memo(
  ({ route, isActive, onNavigate }: { route: Route; isActive: boolean; onNavigate: () => void }) => {
    const { t } = useTranslation(translationConstant.SIDEBAR);
    const href = route.route || route.children?.[0]?.route || "#";
    const label = t(route.label);
    return (
      <li>
        <Link
          href={href}
          onClick={onNavigate}
          title={label}
          aria-label={label}
          aria-current={isActive ? "page" : undefined}
          className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
            isActive ? "bg-brand-600/[0.12]" : "hover:bg-black/[0.05]"
          }`}
        >
          <RouteIcon icon={route.icon} isActive={isActive} />
        </Link>
      </li>
    );
  }
);
RailItem.displayName = "RailItem";

export const SidebarPanel = memo(() => {
  const pathname = usePathname();
  const { userRole, permissions } = useContext(AuthContext);
  const collapsed = useContext(SidebarCollapseContext);
  const [, setIsLoading] = useState(false);

  const handleNavigate = () => setIsLoading(true);
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  const filteredRoutes = useMemo(() => {
    if (userRole === "super admin") return routeList;

    return routeList
      .map((route) => {
        if (!route.children) {
          return permissions.some((perm) => route.name.toLowerCase() === perm.toLowerCase())
            ? route
            : null;
        }
        const allowedChildren = route.children.filter((child) => {
          if (child.name === "settings") return true;
          if (permissions.some((perm) => perm.toLowerCase() === "control")) {
            if (child.name === "bonus-location" || child.name === "bonus-individual") return true;
          }
          return permissions.some((perm) => child.name.toLowerCase() === perm.toLowerCase());
        });
        if (permissions.some((perm) => route.name.toLowerCase() === perm.toLowerCase())) return route;
        if (allowedChildren.length > 0) return { ...route, children: allowedChildren };
        return null;
      })
      .filter((r): r is Route => Boolean(r));
  }, [permissions, userRole]);

  const isRouteActive = (route: Route) =>
    route.children ? route.children.some((item) => pathname === item.route) : route.route === pathname;

  if (collapsed) {
    return (
      <nav aria-label="Sidebar" className="w-full">
        <ul className="flex flex-col items-center gap-1">
          {filteredRoutes.map((route) => (
            <RailItem
              key={route.id}
              route={route}
              isActive={isRouteActive(route)}
              onNavigate={handleNavigate}
            />
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Sidebar" className="w-full px-3">
      <ul className="space-y-0.5">
        {filteredRoutes.map((route) =>
          route.children ? (
            <CollapsibleRoute
              key={route.id}
              route={route}
              isActive={isRouteActive(route)}
              currentPath={pathname}
              onNavigate={handleNavigate}
            />
          ) : (
            <SingleRoute
              key={route.id}
              route={route}
              isActive={isRouteActive(route)}
              onNavigate={handleNavigate}
            />
          )
        )}
      </ul>
    </nav>
  );
});
SidebarPanel.displayName = "SidebarPanel";
