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
        <div className="flex items-center bg-white rounded-[100px] w-48 px-3 py-1 border-[1px] border-[#E0E0E0]">
          <Image
            src={Avatar}
            alt="User Avatar"
            width={48}
            height={48}
            className="rounded-full object-contain"
          />
          <div className="ml-2 flex flex-col items-start">
            <span className="text-[#121111] text-[16px] font-semibold">
              {userProfile?.full_name}
            </span>
            <span className="text-[#121111] text-xs">{userRole}</span>
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
          },
        }}
      >
        <MenuItem
          onClick={handleClose}
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
