"use client";

import { useState, useContext, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Avatar } from "@/assets/images";
import { signOut } from "@/actions/supabase_auth/action";
import { AuthContext } from "@/context";
import { ChevronDown, LogOut, Settings } from "lucide-react";

export default function MenuWithAvatar() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { userProfile, userRole } = useContext(AuthContext);
  const router = useRouter();

  const open = Boolean(anchorEl);

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
        <div className="flex items-center dark:bg-[#0e1725] dark:border-blue-950 dark:text-white bg-white rounded-[100px] min-w-[230px] px-3 py-1 border-[1px] border-[#E0E0E0]">
          <div className="relative w-12 h-12">
            {userProfile?.profile_pictures ? (
              <Image
                src={userProfile.profile_pictures}
                alt="User Avatar"
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <Image
                src={Avatar}
                alt="Default Avatar"
                fill
                className="rounded-full object-cover"
              />
            )}
          </div>
          <div className="ml-2 flex flex-col items-start">
            <span className="text-[#121111] dark:text-white text-[16px] font-semibold">
              {userProfile?.full_name || 'User'}
            </span>
            <span className="text-[#121111] text-xs dark:text-white">{userRole || 'Role'}</span>
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
            width: "200px",
            borderRadius: "12px",
            zIndex: 9999,
            position: 'relative',
          },
        }}
      >
        <MenuItem
          onClick={handleSettings} // Changed from handleClose to handleSettings
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: 500,
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: '#0066ff'
          }}
        >
          <Settings size={18} color="#0066ff" />
          Settings
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: 'red'
          }}
        >
          <LogOut size={18} color="red" />
          Log Out
        </MenuItem>
      </Menu>
    </div>
  );
}