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
        console.log('withAuthorization HOC: pathname:', pathname);
        console.log('withAuthorization HOC: permissions:', permissions);
        console.log('withAuthorization HOC: userRole:', userRole);
        if (userRole === "super admin") {
          setIsAuthorized(true);
          setLoading(false);
          return;
        }

        const findRouteByPath = (path: string, routes: any[]): any => {
          for (const route of routes) {

            if (route.route === path || 
                (path.startsWith('/inventory/') && route.route === '/inventory/manage') ||
                (path.startsWith('/pos/') && route.route === '/pos/sales') ||
                (path.startsWith('/controls/') && route.route === '/controls/emailtemplates')
                ) { 

//             if (route.route === path ||
//               (path.startsWith('/warehouse/') && route.route === '/warehouse/manage') || (path.startsWith('/inventory/') && route.route === '/inventory/manage') ||
//               (path.startsWith('/pos/') && route.route === '/pos/sales')) { 

              return route;
            }
            if (route.children) {
              const found = findRouteByPath(path, route.children);
              if (found) return found;
            }
          }
          return null;
        };

        let currentRoute = findRouteByPath(pathname, routeList);

        // If not found, try to match parent route (e.g. /controls for /controls/emailtemplates)
        if (!currentRoute) {
          const parentPath = pathname.split('/').slice(0, 2).join('/');
          currentRoute = findRouteByPath(parentPath, routeList);
        }

        if (!currentRoute) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        const hasPermission = permissions.some((perm) => {
          const permLower = perm.toLowerCase();
          const routeNameLower = currentRoute?.name?.toLowerCase();
          console.log('Checking perm:', permLower, '| routeNameLower:', routeNameLower, '| pathname:', pathname);
          if (routeNameLower === permLower) {
            console.log('Matched by routeNameLower === permLower');
            return true;
          }
          const parentRoute = routeList.find((r) =>
            r.children?.some((child) => child.route === currentRoute?.route)
          );
          if (parentRoute && parentRoute.name.toLowerCase() === permLower) {
            console.log('Matched by parentRoute');
            return true;
          }
          if ((pathname.startsWith('/inventory/') && permLower === 'inventory') ||

              (pathname.startsWith('/pos/') && permLower === 'pos') ||
              (pathname.startsWith('/controls/') && permLower === 'controls')) {
            console.log('Matched by pathname special case');

//             (pathname.startsWith('/pos/') && permLower === 'pos')) {

            return true;
          }
          return false;
        });
        console.log('withAuthorization HOC: hasPermission:', hasPermission);

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