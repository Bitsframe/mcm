import { routeList } from "@/components/Sidebar/constant";
import { AuthContext } from "@/context";
import { CircularProgress } from "@mui/material";
import { usePathname } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";

interface Route {
  name: string;
  path: string;
  children?: Route[];
}

const withAuthorization = (Component: any) => {
  return function AuthenticatedComponent(props: any) {
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    const { userRole, permissions } = useContext(AuthContext);

    useEffect(() => {
      (() => {
        if (userRole === "super admin") {
          setIsAuthorized(true);
          setLoading(false);
          return;
        }

        const findRouteByPath = (path: string, routes: any[]): any => {
          for (const route of routes) {
            if (route.route === path) return route;
            if (route.children) {
              const found = findRouteByPath(path, route.children);
              if (found) return found;
            }
          }
          return null;
        };

        const currentRoute = findRouteByPath(pathname, routeList);

        if (!currentRoute) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        const hasPermission = permissions.some((perm) => {
          if (currentRoute.name.toLowerCase() === perm.toLowerCase()) {
            return true;
          }

          const parentRoute = routeList.find((r) =>
            r.children?.some((child) => child.route === currentRoute.route)
          );
          if (
            parentRoute &&
            parentRoute.name.toLowerCase() === perm.toLowerCase()
          ) {
            return true;
          }

          return false;
        });

        console.log("Current Route:", currentRoute.name);
        console.log("User Permissions:", permissions);
        console.log("Has Permission:", hasPermission);

        setIsAuthorized(hasPermission);
        setLoading(false);
      })();
    }, [pathname, permissions, userRole]);

    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <CircularProgress />
        </div>
      );
    }

    return <Component {...props} isAllowed={isAuthorized} />;
  };
};

export default withAuthorization;
