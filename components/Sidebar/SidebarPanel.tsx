import { CustomFlowbiteTheme, Sidebar } from "flowbite-react";

import Image from "next/image";
import { usePathname } from "next/navigation";

import { routeList } from "./constant";

import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext, TabContext } from "@/context";
import { FaChevronRight } from "react-icons/fa";


interface Route {
	id: number;
	name: string;
	icon?: {
		src: string;
		height: number;
		width: number;
	};
	route?: string;
	children?: Route[];
}

export const SidebarPanel = () => {
	const pathname = usePathname();

	const { userRole, permissions } = useContext(AuthContext);
	const { setActiveTitle } = useContext(TabContext);
	const [cachedRoutes, setCachedRoutes] = useState<Route[]>(routeList);

	const memoizedRouteList = useMemo((): Route[] => {

		if(userRole === 'super admin'){
			return routeList
		}else{
		const allowedRoutes = permissions || [];

		const filterRoutes = (routes: Route[]): Route[] => {
			return routes
				.map((route) => {
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
				.filter((route): route is Route => route !== null);
		};

		return filterRoutes(routeList);
		}
		
	}, [permissions, userRole]);

	useEffect(() => {
		if (memoizedRouteList.length > 0) {
		  setCachedRoutes(memoizedRouteList);
		}
	  }, [memoizedRouteList]);

	const customTheme: CustomFlowbiteTheme["sidebar"] = {
		root: {
			base: "bg-white overflow-y-auto",
			inner: `bg-white overflow-y-auto flex flex-col justify-between h-full pr-3`,
		},
	};

	const sidebarStyle = {
		marginBottom: `80px`,
	};

	useEffect(() => {
		let activeItem;
		const getActiveTabTitle = () => {
			for (const route of routeList) {
				if (route.route === pathname) {
					return route;
				} else if (route.children) {
					const childRoute = route.children.find(
						(child) => child.route === pathname
					);
					if (childRoute) {
						return childRoute;
					}
				}
			}
		};

		activeItem = getActiveTabTitle();
		if (activeItem) {
			setActiveTitle(activeItem.name);
		}
	}, [pathname, setActiveTitle]);

	return (
		<Sidebar
		  aria-label="Sidebar with multi-level dropdown"
		  className="w-full relative"
		  theme={customTheme}
		  style={sidebarStyle}
		>
		  <Sidebar.Items className="pl-5 w-[210px] bg-white">
			<Sidebar.ItemGroup className="flex flex-col gap-5">
			  {cachedRoutes.map((list) => {
				const isRouteActive =
				  list.route === pathname ||
				  (list.children && list.children.some((item) => pathname === item.route));
	  
				return (
				  <div key={list.id} className="relative w-full">
					{isRouteActive && (
					  <div
						style={{ zIndex: 30 }}
						className="w-[6px] h-[40px] bg-[#0F4698] bg-opacity-30 rounded-r-[20px] absolute left-0 -ml-[1.25rem]"
					  />
					)}
					{!list.children ? (
					  <Sidebar.Item
						key={list.id}
						href={list.route}
						icon={() => (
						  <div className="flex items-center">
							<Image
							  src={list?.icon?.src || ""}
							  alt="Icon"
							  height={list?.icon?.height}
							  width={list?.icon?.width}
							/>
						  </div>
						)}
						label={
						  <div className="text-[15px] -mr-1">
							<FaChevronRight />
						  </div>
						}
						labelColor="transparent"
						className={`text-[#3A3541] hover:bg-[#0F4698] hover:bg-opacity-30 ${
						  isRouteActive ? "bg-[#0F4698] bg-opacity-30" : ""
						}`}
					  >
						<h3>{list.name}</h3>
					  </Sidebar.Item>
					) : (

					  <Sidebar.Collapse
						key={list.id}
						icon={() => (
						  <Image
							src={list?.icon?.src || ""}
							alt="Icon"
							height={list?.icon?.height}
							width={list?.icon?.width}
						  />
						)}
						label={list.name}
						className={`text-[#3A3541] hover:bg-[#0F4698] transition-all ease-out delay-75 hover:bg-opacity-30 ${
						  isRouteActive ? "bg-[#0F4698] bg-opacity-30" : ""
						}`}
						open={isRouteActive}
					  >
						{list.children.map((item) => (
						  <Sidebar.Item
							key={item.id}
							href={item.route}
							className={`text-[#3A3541] text-left text-sm ${
							  pathname === item.route ? "text-[#0F4698]" : ""
							}`}
						  >
							{item.name}
						  </Sidebar.Item>
						))}
					  </Sidebar.Collapse>
					)}
				  </div>
				);
			  })}
			</Sidebar.ItemGroup>
		  </Sidebar.Items>
		</Sidebar>
	  );
	  
};
