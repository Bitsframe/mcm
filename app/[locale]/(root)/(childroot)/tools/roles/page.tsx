'use client'

import RolesAndPermissionsComponent from "@/components/RolesAndPermissionsComponents";
import { ConfigProvider } from "antd";


const UserManagement = () => {


    return (
        <div className="min-h-full">

            <div className="">
            <RolesAndPermissionsComponent />
            </div>
        </div>
    )
}


export default UserManagement;