
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Image from 'next/image';
import React, { useContext } from 'react';
import { Avatar } from "@/assets/images";
import { signOut } from '@/actions/supabase_auth/action';
import { AuthContext } from '@/context';
import { useRouter } from 'next/navigation';


export default function MenuWithAvatar() {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const { userProfile, userRole } = useContext(AuthContext);

    const router = useRouter()

    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };


    const logoutHandle = async () => {

        await signOut()
        handleClose()
    }

    const goToChangePassword = () => {
        router.push('/set-password')
    }



    return (
        <div>

            <Button
                id="basic-button"
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
            >
                <div className="flex items-center justify-center">
                    <Image
                        src={Avatar}
                        alt=""
                        className="w-[48px] h-[48px] rounded-[50%] aspect-auto object-contain"
                    />

                    <div className="flex flex-col items-start justify-center">
                        <div className="text-[#121111] text-[16px] font-semibold">
                            {userProfile?.full_name}
                        </div>
                        <div className="text-[#121111] text-xs">{userRole}</div>
                    </div>
                </div>
            </Button>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                <MenuItem onClick={logoutHandle}>Logout</MenuItem>
                <MenuItem onClick={goToChangePassword}>Change Password</MenuItem>
            </Menu>
        </div>
    );
}
