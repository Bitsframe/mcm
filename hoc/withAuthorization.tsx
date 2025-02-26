import { routeList } from "@/components/Sidebar/constant";
import { AuthContext } from "@/context";
import { rolePermissions } from "@/utils/permissions";
import { CircularProgress } from "@mui/material";
import { usePathname } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";

interface Route {
  name: string;
  path: string;
  children?: Route[];
}

const withAuthorization = (
  Component: any
) => {
  return function AuthenticatedComponent(props: any) {
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    const {userRole, permissions} = useContext(AuthContext);



    useEffect(() => {
      (() => {
        if (userRole === 'super admin') {
          setIsAuthorized(true);
          setLoading(false);
          return; 
        }
        const allowedRoutes = permissions;
        const filterRoutes = (routes: any): Route[] => {
          return routes
            .map((route: any) => {
              const isParentAllowed = allowedRoutes.some((perm:any) =>
                route.name.toLowerCase().includes(perm.toLowerCase())
              );

              if (isParentAllowed) {
                return route;
              }

              if (route.children) {
                const filteredChildren = filterRoutes(route.children);
                if (filteredChildren.length > 0) {
                  return {
                    ...route,
                    children: filteredChildren,
                  };
                }
              }

              return null;
            })
            .filter((route: any): route is Route => route !== null);
        };

        const memoizedRouteList = filterRoutes(routeList);

        const isAllowed = memoizedRouteList.some((route) => {
          const checkRoute = (route: any): boolean => {
            if (pathname === route.route) return true;
            if (route.children) {
              return route.children.some((childRoute: any) => pathname === childRoute.route);
            }
            return false;
          };

          return checkRoute(route);
        });

        if (isAllowed) {
          setIsAuthorized(true);
        }

        setLoading(false);
      })();
    }, [pathname, rolePermissions, routeList]);

    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <CircularProgress />
        </div>
      );
    }

    return <Component {...props} isAllowed={isAuthorized} />
  };
};

export default withAuthorization;
