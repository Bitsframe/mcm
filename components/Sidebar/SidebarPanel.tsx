import { CustomFlowbiteTheme, Sidebar } from "flowbite-react";
import { ScrollArea } from "@/components/ui/scroll-area";

import Image from "next/image";
import { usePathname } from "next/navigation";

// constants
import { routeList } from "./constant";

// context
import { useContext, useEffect, useMemo } from "react";
import { TabContext } from "@/context";

// icons
import { FaChevronRight } from "react-icons/fa";

export const SidebarPanel = () => {
  const pathname = usePathname();

  const memoizedRouteList = useMemo(() => {
    return routeList;
  }, []);

  const customTheme: CustomFlowbiteTheme["sidebar"] = {
    root: {
      base: "bg-white overflow-y-auto",
      inner: `bg-white overflow-y-auto flex flex-col justify-between h-full pr-3`,
    },
  };

  const sidebarStyle = {
    marginBottom: `80px`,
  };

  const { setActiveTitle } = useContext(TabContext);

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
    <ScrollArea>
      <Sidebar
        aria-label="Sidebar with multi-level dropdown"
        className="w-full relative"
        theme={customTheme}
        style={sidebarStyle}
      >
        <Sidebar.Items className="pl-5 w-[210px] bg-white">
          <Sidebar.ItemGroup className="flex flex-col gap-5 ">
            {memoizedRouteList.map((list, index) => {
              if (!list.children) {
                const isRouteActive = list.route === pathname;

                return (
                  <div key={list.id} className="relative w-full">
                    {isRouteActive && (
                      <div
                        style={{ zIndex: 30 }}
                        className="w-[6px] h-[40px] bg-[#0F4698] bg-opacity-30 rounded-r-[20px] absolute left-0 -ml-[1.25rem]"
                      />
                    )}
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
                      className={`text-[#3A3541] hover:bg-[#0F4698] hover:bg-opacity-30  ${
                        isRouteActive ? "bg-[#0F4698] bg-opacity-30" : ""
                      }`}
                    >
                      <h3>{list.name}</h3>
                    </Sidebar.Item>
                  </div>
                );
              } else {
                const isRouteActive = list.children.some(
                  (item) => pathname === item.route
                );

                return (
                  <div key={list.id} className="relative w-full">
                    {isRouteActive && (
                      <div
                        style={{ zIndex: 30 }}
                        className="w-[6px] h-[40px] bg-[#0F4698] bg-opacity-30 rounded-r-[20px] absolute left-0 -ml-[1.25rem]"
                      />
                    )}
                    <Sidebar.Collapse
                      icon={() => (
                        <Image
                          src={list?.icon?.src || ""}
                          alt="Icon"
                          height={list?.icon?.height}
                          width={list?.icon?.width}
                        />
                      )}
                      label={list.name}
                      className={`text-[#3A3541] hover:bg-[#0F4698] transition-all ease-out delay-75 hover:bg-opacity-30  ${
                        isRouteActive ? "bg-[#0F4698] bg-opacity-30" : ""
                      }`}
                      // onClick={() => handleCollapseClick(list.id)}
                      open={isRouteActive}
                    >
                      {list.children.map((item, index) => (
                        <Sidebar.Item
                          key={item.id}
                          href={item.route}
                          className={`text-[#3A3541] text-left ${
                            pathname === item.route ? "text-[#0F4698]" : ""
                          }`}
                        >
                          {item.name}
                        </Sidebar.Item>
                      ))}
                    </Sidebar.Collapse>
                  </div>
                );
              }
            })}
          </Sidebar.ItemGroup>
        </Sidebar.Items>
      </Sidebar>
    </ScrollArea>
  );
};
