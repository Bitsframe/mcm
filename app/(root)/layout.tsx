import { Navbar } from "@/components/Navbar/index";
import { SidebarSection } from "@/components/Sidebar/index";

// contexts
import { ActiveTabProvider } from "@/context";

const sidebarWidth = "233px";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ActiveTabProvider>
        <div className={`relative flex h-screen`}>
          <section
            className="fixed left-0 top-0 h-full"
            style={{ width: sidebarWidth }}
          >
            <SidebarSection />
          </section>
          <section
            className="flex flex-col flex-grow"
            style={{ marginLeft: sidebarWidth }}
          >
            <Navbar width={sidebarWidth} />

            <section
              className="flex-grow p-4"
              // style={{ minHeight: "calc(100vh - 70px)" }}
              style={{
                minHeight: "100vh",
                backgroundColor: "#FFFFFF",
              }}
            >
              {children}
            </section>
          </section>
        </div>
      </ActiveTabProvider>
    </div>
  );
}
