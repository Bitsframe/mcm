"use client";

import { useState, useContext, MouseEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Avatar } from "@/assets/images";
import { signOut } from "@/actions/supabase_auth/action";
import { AuthContext } from "@/context";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import LanguageChanger from "@/components/LanguageChanger";
import LanguageChanger2 from "@/components/LanguageChanger2";
import ThemeToggleButton from "@/components/Themetoggle";
import { useTheme } from "next-themes";

export default function MenuWithAvatar() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { userProfile, userRole } = useContext(AuthContext);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const { theme } = useTheme();

  const open = Boolean(anchorEl);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    await signOut();
    handleClose();
  };

  const handleChangePassword = () => {
    router.push("/set-password");
    handleClose();
  };

  const handleSettings = () => {
    router.push("/tools/settings");
    handleClose();
  };

  return (
    <div>
      <Button
        id="avatar-menu-button"
        aria-controls={open ? "avatar-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        className="p-0"
      >
        <div className="flex items-center justify-between dark:bg-[#0e1725] dark:border-blue-950 dark:text-white bg-white rounded-[100px] min-w-[230px] px-3 py-1 border-[1px] border-[#E0E0E0]">
          <div className="relative w-12 h-12 overflow-hidden rounded-full">
            {userProfile?.profile_pictures ? (
              <Image
                src={userProfile.profile_pictures}
                alt={userProfile?.full_name || "User Avatar"}
                fill
                className="object-cover"
                // allow external URLs without requiring next.config change
                unoptimized
              />
            ) : (
              <Image
                src={Avatar}
                alt="Default Avatar"
                fill
                className="object-cover"
              />
            )}
          </div>

          <div className="ml-2 flex flex-col items-start">
            <span className="text-[#121111] dark:text-white text-[16px] font-semibold">
              {userProfile?.full_name || "User"}
            </span>
            <span className="text-[#121111] text-xs dark:text-white">
              {userRole || "Role"}
            </span>
          </div>
          <ChevronDown size={20} color="black" strokeWidth={3} />
        </div>
      </Button>
      <Menu
        id="avatar-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ "aria-labelledby": "avatar-menu-button" }}
        PaperProps={{
          style: {
            width: "220px",
            borderRadius: "12px",
            zIndex: 9999,
            position: "relative",
            background: theme === "dark" ? "#0e1725" : "#fff",
            color: theme === "dark" ? "#fff" : "#222",
            boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)",
            border:
              theme === "dark" ? "1px solid #232a36" : "1px solid #e0e0e0",
          },
        }}
      >
        {isMobile ? (
          <>
            <div className="px-4 py-2 font-semibold text-gray-700 dark:text-white">
              Welcome back,{" "}
              <span className="font-bold">
                {userProfile?.full_name || "User"}
              </span>
            </div>
            <MenuItem
              onClick={handleSettings}
              style={{ color: "#0066ff", gap: "12px" }}
            >
              <Settings size={18} color="#0066ff" /> Settings
            </MenuItem>
            <MenuItem
              onClick={handleLogout}
              style={{ color: "red", gap: "12px" }}
            >
              <LogOut size={18} color="red" /> Log Out
            </MenuItem>
            <div className="px-4 py-2 font-semibold text-gray-700 dark:text-white">
              Language
            </div>
            <div className="px-4 pb-2">
              <LanguageChanger2 locale={userProfile?.locale || "en"} />
            </div>
            <div className="px-4 pt-2 pb-2 flex justify-center">
              <ThemeToggleButton />
            </div>
          </>
        ) : (
          <>
            <MenuItem
              onClick={handleSettings}
              style={{ color: "#0066ff", gap: "12px" }}
            >
              <Settings size={18} color="#0066ff" /> Settings
            </MenuItem>
            <MenuItem
              onClick={handleLogout}
              style={{ color: "red", gap: "12px" }}
            >
              <LogOut size={18} color="red" /> Log Out
            </MenuItem>
          </>
        )}
      </Menu>
    </div>
  );
}
