import { routeList } from "@/components/Sidebar/constant";
import { AuthContext } from "@/context";
import { CircularProgress } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";

const withAuthorization = (Component: any) => {
  return function AuthenticatedComponent(props: any) {
    const pathname = usePathname();
    const router = useRouter();
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
            if (route.route === path || 
                (path.startsWith('/inventory/') && route.route === '/inventory/manage') ||
                (path.startsWith('/pos/') && route.route === '/pos/sales')) { // POS ke liye
              return route;
            }
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
          const permLower = perm.toLowerCase();
          const routeNameLower = currentRoute.name.toLowerCase();

          if (routeNameLower === permLower) {
            return true;
          }

          const parentRoute = routeList.find((r) =>
            r.children?.some((child) => child.route === currentRoute.route)
          );
          if (parentRoute && parentRoute.name.toLowerCase() === permLower) {
            return true;
          }

          if ((pathname.startsWith('/inventory/') && permLower === 'inventory') ||
          (pathname.startsWith('/pos/') && permLower === 'pos')) {
            return true;
          }

          return false;
        });

        if (!hasPermission) {
          const findFirstAllowedRoute = (routes: any[]): string | null => {
            for (const route of routes) {
              const hasRoutePermission = permissions.some(perm => 
                route.name.toLowerCase() === perm.toLowerCase()
              );
              
              if (hasRoutePermission) {
                if (route.children && route.children.length > 0) {
                  return route.children[0].route;
                }
                if (route.route) {
                  return route.route;
                }
              }
              
              if (route.children) {
                const childRoute = findFirstAllowedRoute(route.children);
                if (childRoute) return childRoute;
              }
            }
            return null;
          };

          const allowedRoute = findFirstAllowedRoute(routeList);
          if (allowedRoute) {
            router.push(allowedRoute);
          }
        }

        setIsAuthorized(hasPermission);
        setLoading(false);
      })();
    }, [pathname, permissions, userRole, router]);

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